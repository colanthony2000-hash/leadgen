import { db, AsyncBackgroundJob } from './db';
import { GoogleGenAI } from '@google/genai';
import { ResearchJob, CreditTransaction, BusinessProfileResearchDraft, BusinessProspectMatch, BusinessProfile, IndustryCode, CompanySearchInput } from '../src/types';

const GEMINI_RESEARCH_MODEL = 'gemini-3.8-flash';

function normalizeResearchText(value: string): string {
  return value
    .replace(/^\s*(?:[-*•]|\d+[.)])\s*/u, '')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLocaleLowerCase();
}

function uniqueBriefingLines(value: string): string {
  const seen = new Set<string>();
  return value.split(/\r?\n/u).map((line) => line.trim()).filter((line) => {
    if (!line) return false;
    const key = normalizeResearchText(line);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).join('\n');
}

export class BackgroundJobWorker {
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      this.aiClient = new GoogleGenAI({ apiKey });
    }
  }

  private async groundedJson(prompt: string): Promise<{ data: any; sources: Array<{ title: string; url: string }> }> {
    if (!this.aiClient) throw new Error('AI research is unavailable because GEMINI_API_KEY is not configured.');
    const response = await this.aiClient.models.generateContent({
      model: GEMINI_RESEARCH_MODEL,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });
    if (!response.text) throw new Error('Google Search returned an empty response.');
    const text = response.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    let data: any;
    try { data = JSON.parse(text); } catch { throw new Error('AI research returned an invalid structured response. Please try again.'); }
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.flatMap((chunk: any) => chunk.web?.uri ? [{ title: chunk.web.title || chunk.web.uri, url: chunk.web.uri }] : []);
    return { data, sources: [...new Map(sources.map((source) => [source.url, source])).values()] };
  }

  public async researchBusinessProfile(input: { website?: string; company_name?: string; context?: string }): Promise<BusinessProfileResearchDraft> {
    const website = String(input.website || '').trim();
    const companyName = String(input.company_name || '').trim();
    if (!website && !companyName) throw new Error('Enter a company website or company name to begin.');
    if (website && !/^https?:\/\//i.test(website)) throw new Error('Enter a valid website beginning with https:// or http://.');
    const { data, sources } = await this.groundedJson(`Research this company using Google Search. Company website: ${website || 'not supplied'}. Company name: ${companyName || 'identify from website'}. Additional context: ${String(input.context || '').slice(0, 1200) || 'none'}.
Use the official website and reliable public sources. Extract the company identity, what it actually sells or provides, certifications only when explicitly evidenced, countries/regions and industries it serves. Do not guess or invent facts. Keep unknown fields empty. Return JSON only with keys: company_name (string), website (string), country_code (ISO 3166-1 alpha-2 string or empty), business_summary (string), target_regions (string[]), target_industries (array using only oil_and_gas, education, digital_products), offerings (array of {name, description, offering_type (product/service/capability), category_code, target_industry}), certifications (array of {name, issuer, valid_from, valid_to, evidence_url}). Keep offerings to concrete services/products/capabilities supported by sources. Do not include source URLs in the JSON.`);
    const allowedIndustries: IndustryCode[] = ['oil_and_gas', 'education', 'digital_products'];
    const offerings = Array.isArray(data.offerings) ? data.offerings.slice(0, 20).map((item: any, index: number) => ({
      id: `off-${Date.now()}-${index}`, name: String(item.name || '').slice(0, 160), description: String(item.description || '').slice(0, 800),
      offering_type: ['product', 'service', 'capability'].includes(item.offering_type) ? item.offering_type : 'service',
      category_code: String(item.category_code || 'general').slice(0, 80), target_industry: allowedIndustries.includes(item.target_industry) ? item.target_industry : 'digital_products',
    })).filter((item: any) => item.name) : [];
    const certifications = Array.isArray(data.certifications) ? data.certifications.slice(0, 20).map((item: any, index: number) => ({
      id: `cert-${Date.now()}-${index}`, name: String(item.name || '').slice(0, 160), issuer: String(item.issuer || 'Not established'),
      valid_from: String(item.valid_from || 'Unknown'), valid_to: String(item.valid_to || 'Unknown'),
      ...(typeof item.evidence_url === 'string' && sources.some((source) => source.url === item.evidence_url) ? { evidence_url: item.evidence_url } : {}),
    })).filter((item: any) => item.name) : [];
    return {
      company_name: String(data.company_name || companyName || '').slice(0, 200), website: String(data.website || website).slice(0, 300),
      country_code: String(data.country_code || '').slice(0, 2).toUpperCase(), business_summary: String(data.business_summary || '').slice(0, 2500),
      target_regions: Array.isArray(data.target_regions) ? data.target_regions.filter((value: unknown) => typeof value === 'string').slice(0, 30) : [],
      target_industries: Array.isArray(data.target_industries) ? data.target_industries.filter((value: unknown): value is IndustryCode => allowedIndustries.includes(value as IndustryCode)) : [],
      offerings, certifications, sources,
    };
  }

  public async findBusinessProspects(profile: BusinessProfile): Promise<BusinessProspectMatch[]> {
    const { data, sources } = await this.groundedJson(`Find up to 10 real organizations that may plausibly need or procure the following company's offerings. Search current public information using Google Search. Supplier: ${profile.company_name}; website: ${profile.website}; summary: ${profile.business_summary}; offerings: ${JSON.stringify(profile.offerings)}; target regions: ${JSON.stringify(profile.target_regions)}; target industries: ${JSON.stringify(profile.target_industries)}.
Recommend potential buyers, operators, institutions, or organizations based on evidence of relevant operations, projects, or procurement. Do not say they currently need or are buying unless a source establishes it; otherwise phrase as potential fit. Exclude the supplier itself. Return JSON only: {"prospects":[{"company_name":"","website":"","industry_id":"oil_and_gas|education|digital_products","company_type":"","location":"","description":"short evidence-based description","match_reason":"why the supplied offering could fit; distinguish inference from sourced fact","matched_offerings":["offering name"],"source_urls":["URL returned by Google Search"]}]}. source_urls must be copied exactly from Google Search results and support the candidate; if none support a candidate, omit it. Do not invent people, contact details, procurement, URLs, or facts. Return an empty list if no credible candidates are found.`);
    if (!Array.isArray(data.prospects)) throw new Error('AI prospect search returned an invalid response.');
    const allowedIndustries: IndustryCode[] = ['oil_and_gas', 'education', 'digital_products'];
    const groundedSources = new Map(sources.map((source) => [source.url, source]));
    return data.prospects.slice(0, 10).filter((item: any) => item.company_name && Array.isArray(item.source_urls) && item.source_urls.some((url: unknown) => typeof url === 'string' && groundedSources.has(url))).map((item: any, index: number) => ({
      id: `prospect-${Date.now()}-${index}`, company_name: String(item.company_name).slice(0, 200), website: String(item.website || '').slice(0, 300),
      industry_id: allowedIndustries.includes(item.industry_id) ? item.industry_id : 'digital_products', company_type: String(item.company_type || 'Organization').slice(0, 100),
      location: String(item.location || 'Not established').slice(0, 160), description: String(item.description || '').slice(0, 1000),
      match_reason: String(item.match_reason || '').slice(0, 1000), matched_offerings: Array.isArray(item.matched_offerings) ? item.matched_offerings.filter((value: unknown) => typeof value === 'string').slice(0, 10) : [],
      sources: item.source_urls.filter((url: unknown) => typeof url === 'string' && groundedSources.has(url)).map((url: string) => groundedSources.get(url)!), discovered_at: new Date().toISOString(),
    }));
  }

  public async searchCompanies(input: CompanySearchInput): Promise<BusinessProspectMatch[]> {
    const name = String(input.company_name || '').trim();
    const category = String(input.category || '').trim();
    const location = String(input.location || '').trim();
    if (!name && !category && !location) throw new Error('Enter a company name, category, or location to search.');
    const { data, sources } = await this.groundedJson(`Find up to 10 real companies matching this public company search. Search criteria: company name or name terms: ${name || 'any'}; category or services: ${category || 'any'}; location: ${location || 'any'}.
Use Google Search for current public sources. Return JSON only: {"prospects":[{"company_name":"","website":"","industry_id":"oil_and_gas|education|digital_products","company_type":"","location":"","description":"short factual description","match_reason":"why it matches the requested name, category, or location","matched_offerings":["publicly described services or products"],"source_urls":["URL returned by Google Search"]}]}. source_urls must be copied exactly from Google Search results and support that company; omit any candidate without a supporting source URL. Do not invent URLs, contacts, or facts. If criteria are narrow, return fewer results rather than weak matches.`);
    if (!Array.isArray(data.prospects)) throw new Error('Company search returned an invalid response.');
    const allowedIndustries: IndustryCode[] = ['oil_and_gas', 'education', 'digital_products'];
    const groundedSources = new Map(sources.map((source) => [source.url, source]));
    return data.prospects.slice(0, 10).filter((item: any) => item.company_name && Array.isArray(item.source_urls) && item.source_urls.some((url: unknown) => typeof url === 'string' && groundedSources.has(url))).map((item: any, index: number) => ({
      id: `company-search-${Date.now()}-${index}`, company_name: String(item.company_name).slice(0, 200), website: String(item.website || '').slice(0, 300),
      industry_id: allowedIndustries.includes(item.industry_id) ? item.industry_id : 'digital_products', company_type: String(item.company_type || 'Company').slice(0, 100),
      location: String(item.location || location || 'Not established').slice(0, 160), description: String(item.description || '').slice(0, 1000),
      match_reason: String(item.match_reason || '').slice(0, 1000), matched_offerings: Array.isArray(item.matched_offerings) ? item.matched_offerings.filter((value: unknown) => typeof value === 'string').slice(0, 10) : [],
      sources: item.source_urls.filter((url: unknown) => typeof url === 'string' && groundedSources.has(url)).map((url: string) => groundedSources.get(url)!), discovered_at: new Date().toISOString(),
    }));
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
      model: GEMINI_RESEARCH_MODEL,
      contents: searchPrompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    if (!searchResponse.text) {
      throw new Error('Google Search research returned an empty response.');
    }

    const grounding = searchResponse.candidates?.[0]?.groundingMetadata;
    const groundingChunks = grounding?.groundingChunks || [];
    const groundedFactMap = new Map<string, {
      claim: string;
      source_name: string;
      source_url: string;
      sources: Array<{ source_name: string; source_url: string }>;
      confidence: 'medium';
    }>();
    for (const support of grounding?.groundingSupports || []) {
      const claim = support.segment?.text?.trim();
      if (!claim) continue;
      const claimKey = normalizeResearchText(claim);
      if (!claimKey) continue;
      for (const chunkIndex of support.groundingChunkIndices || []) {
        const webSource = groundingChunks[chunkIndex]?.web;
        if (!webSource?.uri) continue;
        const source = { source_name: webSource.title || webSource.uri, source_url: webSource.uri };
        const existing = groundedFactMap.get(claimKey);
        if (existing) {
          if (!existing.sources.some((item) => item.source_url === source.source_url)) existing.sources.push(source);
          continue;
        }
        groundedFactMap.set(claimKey, {
          claim: claim.replace(/^\s*(?:[-*•]|\d+[.)])\s*/u, '').trim(),
          ...source,
          sources: [source],
          confidence: 'medium',
        });
      }
    }
    const groundedFacts = [...groundedFactMap.values()];
    const searchBriefing = uniqueBriefingLines(searchResponse.text);

    db.updateBackgroundJob(job.id, { progress_pct: 60 });

    const synthesisPrompt = `You are preparing a preliminary commercial-fit analysis for Jeneconk BII.

Subject: ${subject_name} (${subject_type || 'company'})
Industry Sector: ${industry || 'General Industry'}
Research Focus: ${question || 'Assess possible fit with the supplied offerings'}
Business Offerings: ${JSON.stringify(offerings || [])}
Google Search briefing: ${searchBriefing}
Claims with Google Search grounding citations: ${JSON.stringify(groundedFacts)}

Evidence rules:
- Use only the supplied search briefing for current facts. Do not add claims about tenders, budgets, dates, projects, registrations, certifications, or people unless the claim appears in the cited claims above.
- Do not invent or rewrite source URLs. The application will attach the citation metadata returned by Google Search.
- Use role functions, not real people's names, in key_decision_makers; label these as roles to investigate.
- Keep strategic_fit_analysis conditional on the supplied offerings. A fit assessment is not evidence of a current need.
- If the cited claims are empty, say that no source-supported current facts were returned and keep the summary cautious.
- Do not make claims about Jenecon credentials unless they appear in the supplied offerings.
- State each distinct finding only once. Keep the executive summary to at most three sentences and do not repeat facts in the strategic-fit analysis.
- Return no more than four suggested roles, with no duplicate roles. Remove duplicate critical unknowns.

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
      model: GEMINI_RESEARCH_MODEL,
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

    synthesisResult.executive_summary = uniqueBriefingLines(synthesisResult.executive_summary);
    synthesisResult.strategic_fit_analysis = uniqueBriefingLines(synthesisResult.strategic_fit_analysis);
    synthesisResult.critical_unknowns = synthesisResult.critical_unknowns.filter((item: unknown, index: number, items: unknown[]) =>
      typeof item === 'string' && items.findIndex((candidate) => typeof candidate === 'string' && normalizeResearchText(candidate) === normalizeResearchText(item)) === index
    );
    const seenRoles = new Set<string>();
    synthesisResult.key_decision_makers = synthesisResult.key_decision_makers.filter((item: { name?: string; title?: string }) => {
      const key = normalizeResearchText(`${item.name || ''} ${item.title || ''}`);
      if (!key || seenRoles.has(key)) return false;
      seenRoles.add(key);
      return true;
    }).slice(0, 4);

    const procurementKeywords = /tender|procurement|contract|rfp|bid|supplier|vendor|award|budget/i;
    synthesisResult.known_facts = groundedFacts;
    synthesisResult.procurement_signals = groundedFacts
      .filter((fact) => procurementKeywords.test(fact.claim))
      .map((fact) => fact.claim);
    synthesisResult.search_queries = [...new Set(grounding?.webSearchQueries || [])];
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
