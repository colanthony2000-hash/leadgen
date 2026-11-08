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

    const prompt = `You are preparing a preliminary commercial-fit analysis for Jeneconk BII.

Subject: ${subject_name} (${subject_type || 'company'})
Industry Sector: ${industry || 'General Industry'}
Research Focus: ${question || 'Assess possible fit with the supplied offerings'}
Business Offerings: ${JSON.stringify(offerings || [])}
Requested source types (not retrieved or supplied as documents): ${JSON.stringify(job.payload.sources || [])}

Important evidence limits:
- You have not been given retrieved webpages, source excerpts, registry records, or live web search results.
- Do not claim current company facts, active tenders, budgets, project dates, named decision-makers, registrations, certifications, or operational events.
- Return an empty array for procurement_signals and known_facts. Do not invent citations or label anything verified.
- Use role functions rather than real people in key_decision_makers, and label them as suggested roles to investigate.
- Keep strategic_fit_analysis explicitly conditional on the supplied offerings and state that fit is not evidence of a current need.
- Include the lack of source retrieval in critical_unknowns.
- Do not make claims about Jeneconk credentials unless they appear in the supplied offerings.

Return JSON with this shape:
{
  "executive_summary": "Brief preliminary analysis, explicitly stating this is not source-verified",
  "strategic_fit_analysis": "Conditional fit assessment based only on the supplied offerings",
  "procurement_signals": [],
  "key_decision_makers": [{ "name": "Role to identify", "title": "Suggested role", "relevance": "Why this role may be relevant; verify for the target" }],
  "known_facts": [],
  "critical_unknowns": ["Current operations and procurement activity have not been verified from source documents."],
  "recommended_outreach_angle": "A cautious discovery question, not a claim about the target"
}

Return valid JSON only.`;

    const response = await this.aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    if (!response.text) {
      throw new Error('AI research returned an empty response.');
    }

    const synthesisResult = JSON.parse(response.text);
    if (
      typeof synthesisResult.executive_summary !== 'string' ||
      typeof synthesisResult.strategic_fit_analysis !== 'string' ||
      !Array.isArray(synthesisResult.procurement_signals) ||
      !Array.isArray(synthesisResult.key_decision_makers) ||
      !Array.isArray(synthesisResult.known_facts) ||
      !Array.isArray(synthesisResult.critical_unknowns) ||
      typeof synthesisResult.recommended_outreach_angle !== 'string'
    ) {
      throw new Error('AI research returned an invalid response structure.');
    }

    // No source retrieval is implemented yet, so never expose model-written source claims.
    synthesisResult.known_facts = [];
    synthesisResult.procurement_signals = [];

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
