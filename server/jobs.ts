import { db, AsyncBackgroundJob } from './db';
import { GoogleGenAI } from '@google/genai';
import { ResearchJob, CreditTransaction } from '../src/types';

export class BackgroundJobWorker {
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      this.aiClient = new GoogleGenAI({ apiKey });
    }
  }

  // Trigger execution of a queued job asynchronously
  public processJobAsync(jobId: string): void {
    setImmediate(async () => {
      await this.executeJob(jobId);
    });
  }

  private async executeJob(jobId: string): Promise<void> {
    const job = db.getBackgroundJob(jobId);
    if (!job || job.status !== 'queued') return;

    // Transition to running
    db.updateBackgroundJob(jobId, {
      status: 'running',
      started_at: new Date().toISOString(),
      progress_pct: 15,
    });

    try {
      if (job.job_type === 'ai_research') {
        await this.handleAiResearch(job);
      } else if (job.job_type === 'company_enrichment') {
        await this.handleCompanyEnrichment(job);
      } else if (job.job_type === 'nipex_tender_sync') {
        await this.handleTenderSync(job);
      }
    } catch (err: any) {
      console.error(`Background job ${jobId} failed:`, err);
      // Release credit reservation on failure
      const currentBalance = db.getCreditBalance(job.tenant_id);
      if (job.credit_reserved > 0) {
        const refundTx: CreditTransaction = {
          id: `tx-rel-${Date.now()}`,
          tenant_id: job.tenant_id,
          transaction_type: 'release',
          amount: job.credit_reserved,
          balance_after: currentBalance + job.credit_reserved,
          description: `Credit reservation released due to failed job #${job.id}`,
          reference_type: 'ai_research',
          reference_id: job.id,
          created_at: new Date().toISOString(),
        };
        db.addCreditTransaction(refundTx);
      }

      db.updateBackgroundJob(jobId, {
        status: 'failed',
        error_message: err?.message || 'Unknown processing error',
        completed_at: new Date().toISOString(),
      });
      db.logAudit('System Worker', 'JOB_FAILED', 'BackgroundJob', jobId, `Job ${jobId} failed: ${err?.message}`);
    }
  }

  private async handleAiResearch(job: AsyncBackgroundJob): Promise<void> {
    const { subject_name, subject_type, question, industry, offerings } = job.payload;

    if (!this.aiClient) {
      throw new Error('AI research is unavailable because GEMINI_API_KEY is not configured. No research result was generated.');
    }

    db.updateBackgroundJob(job.id, { progress_pct: 35 });

    const searchPrompt = `Research ${subject_type || 'company'}: ${subject_name}
Industry: ${industry || 'General Industry'}
Research focus: ${question || 'Assess possible commercial fit'}
Requested source categories: ${JSON.stringify(job.payload.sources || [])}

Use Google Search to find current public information. Prioritize the subject's official website, government or regulator pages, official procurement notices, and primary company disclosures. Search for the exact subject name and relevant local context.
Return a concise factual briefing. Separate confirmed information from gaps. Do not guess or create facts, people, tenders, dates, or URLs. The API will provide source citations separately; do not fabricate citations.`;

    const searchResponse = await this.aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: searchPrompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    if (!searchResponse.text) {
      throw new Error('Google Search research returned an empty response.');
    }

    const grounding = searchResponse.candidates?.[0]?.groundingMetadata;
    const groundingChunks = grounding?.groundingChunks || [];
    const groundedFacts = (grounding?.groundingSupports || []).flatMap((support) => {
      const claim = support.segment?.text?.trim();
      if (!claim) return [];
      return (support.groundingChunkIndices || []).flatMap((chunkIndex) => {
        const webSource = groundingChunks[chunkIndex]?.web;
        if (!webSource?.uri) return [];
        return [{
          claim,
          source_name: webSource.title || webSource.uri,
          source_url: webSource.uri,
          confidence: 'medium' as const,
        }];
      });
    }).filter((fact, index, facts) =>
      facts.findIndex((candidate) => candidate.claim === fact.claim && candidate.source_url === fact.source_url) === index
    );

    db.updateBackgroundJob(job.id, { progress_pct: 60 });

    const synthesisPrompt = `You are preparing a preliminary commercial-fit analysis for Jeneconk BII.

Subject: ${subject_name} (${subject_type || 'company'})
Industry Sector: ${industry || 'General Industry'}
Research Focus: ${question || 'Assess possible fit with the supplied offerings'}
Business Offerings: ${JSON.stringify(offerings || [])}
Google Search briefing: ${searchResponse.text}
Claims with Google Search grounding citations: ${JSON.stringify(groundedFacts)}

Evidence rules:
- Use only the supplied search briefing for current facts. Do not add claims about tenders, budgets, dates, projects, registrations, certifications, or people unless the claim appears in the cited claims above.
- Do not invent or rewrite source URLs. The application will attach the citation metadata returned by Google Search.
- Use role functions, not real people's names, in key_decision_makers; label these as roles to investigate.
- Keep strategic_fit_analysis conditional on the supplied offerings. A fit assessment is not evidence of a current need.
- If the cited claims are empty, say that no source-supported current facts were returned and keep the summary cautious.
- Do not make claims about Jenecon credentials unless they appear in the supplied offerings.

Return JSON with this shape:
{
  "executive_summary": "Concise summary constrained to the supplied search briefing and cited claims",
  "strategic_fit_analysis": "Conditional fit assessment based only on the supplied offerings and search evidence",
  "key_decision_makers": [{ "name": "Role to identify", "title": "Suggested role", "relevance": "Why this role may be relevant; verify for the target" }],
  "critical_unknowns": ["Important points that the search did not establish"],
  "recommended_outreach_angle": "A cautious discovery question, not a claim about the target"
}

Return valid JSON only.`;

    const synthesisResponse = await this.aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: synthesisPrompt,
      config: { responseMimeType: 'application/json' },
    });

    if (!synthesisResponse.text) {
      throw new Error('AI research synthesis returned an empty response.');
    }

    const synthesisResult = JSON.parse(synthesisResponse.text);
    if (
      typeof synthesisResult.executive_summary !== 'string' ||
      typeof synthesisResult.strategic_fit_analysis !== 'string' ||
      !Array.isArray(synthesisResult.key_decision_makers) ||
      !Array.isArray(synthesisResult.critical_unknowns) ||
      typeof synthesisResult.recommended_outreach_angle !== 'string'
    ) {
      throw new Error('AI research returned an invalid response structure.');
    }

    const procurementKeywords = /tender|procurement|contract|rfp|bid|supplier|vendor|award|budget/i;
    synthesisResult.known_facts = groundedFacts;
    synthesisResult.procurement_signals = groundedFacts
      .filter((fact) => procurementKeywords.test(fact.claim))
      .map((fact) => fact.claim);
    synthesisResult.search_queries = grounding?.webSearchQueries || [];
    if (groundedFacts.length === 0) {
      synthesisResult.critical_unknowns = [
        'Google Search returned no claim-level grounding citations for this request.',
        ...synthesisResult.critical_unknowns,
      ];
    }

    db.updateBackgroundJob(job.id, { progress_pct: 75 });
    // Step 3: Capture the reserved credit
    const currentBal = db.getCreditBalance(job.tenant_id);
    const captureTx: CreditTransaction = {
      id: `tx-cap-${Date.now()}`,
      tenant_id: job.tenant_id,
      transaction_type: 'capture',
      amount: 0,
      balance_after: currentBal,
      description: `Settled AI Deep Research on ${subject_name}`,
      reference_type: 'ai_research',
      reference_id: job.id,
      created_at: new Date().toISOString(),
    };
    db.addCreditTransaction(captureTx);

    // Save completed research dossier into domain table
    const researchRecord: ResearchJob = {
      id: `res-${job.id}`,
      tenant_id: job.tenant_id,
      subject_type: subject_type || 'company',
      subject_id: job.payload.subject_id || `subj-${Date.now()}`,
      subject_name,
      research_question: question || '',
      scope_sources: job.payload.sources || ['Official Registries', 'NipeX Portals'],
      status: 'completed',
      credit_cost: job.credit_reserved,
      created_at: job.created_at,
      completed_at: new Date().toISOString(),
      result: synthesisResult,
    };
    db.addResearchJob(researchRecord);

    // Mark background job complete
    db.updateBackgroundJob(job.id, {
      status: 'completed',
      progress_pct: 100,
      result: synthesisResult,
      completed_at: new Date().toISOString(),
    });

    db.logAudit(
      'System Worker',
      'AI_RESEARCH_COMPLETED',
      'ResearchJob',
      researchRecord.id,
      `Asynchronous AI Deep Research completed for ${subject_name}`
    );
  }

  private async handleCompanyEnrichment(job: AsyncBackgroundJob): Promise<void> {
    const { company_id } = job.payload;
    db.updateBackgroundJob(job.id, { progress_pct: 50 });
    await new Promise((r) => setTimeout(r, 600));

    db.enrichCompanyRecord(company_id);

    // Capture credit
    const currentBal = db.getCreditBalance(job.tenant_id);
    const captureTx: CreditTransaction = {
      id: `tx-cap-${Date.now()}`,
      tenant_id: job.tenant_id,
      transaction_type: 'capture',
      amount: 0,
      balance_after: currentBal,
      description: `Settled Company Enrichment for #${company_id}`,
      reference_type: 'company_enrichment',
      reference_id: company_id,
      created_at: new Date().toISOString(),
    };
    db.addCreditTransaction(captureTx);

    db.updateBackgroundJob(job.id, {
      status: 'completed',
      progress_pct: 100,
      completed_at: new Date().toISOString(),
    });

    db.logAudit('System Worker', 'COMPANY_ENRICHED', 'Company', company_id, `Asynchronous registry enrichment completed`);
  }

  private async handleTenderSync(job: AsyncBackgroundJob): Promise<void> {
    db.updateBackgroundJob(job.id, { progress_pct: 50 });
    await new Promise((r) => setTimeout(r, 400));
    db.updateBackgroundJob(job.id, {
      status: 'completed',
      progress_pct: 100,
      completed_at: new Date().toISOString(),
    });
  }
}

export const worker = new BackgroundJobWorker();
