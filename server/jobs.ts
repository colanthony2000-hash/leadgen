import { db, AsyncBackgroundJob } from './db';
import { GoogleGenAI } from '@google/genai';
import { ResearchJob, CreditTransaction, BusinessProfileResearchDraft, BusinessProspectMatch, BusinessProfile, IndustryCode, CompanySearchInput, NeedSearchInput } from '../src/types';
import { DIGITAL_PRODUCT_CATEGORIES, expandDigitalProductCategory } from '../src/data/digitalProductCategories';

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

function normalizeSourceUrl(value: string): string {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.hostname.toLowerCase().replace(/^www\./u, '')}${url.pathname.replace(/\/$/u, '')}`;
  } catch {
    return value.trim().replace(/\/$/u, '').toLowerCase();
  }
}

function candidateSources(item: any, sources: Array<{ title: string; url: string }>): Array<{ title: string; url: string }> {
  const sourceByUrl = new Map<string, { title: string; url: string }>(sources.map((source) => [normalizeSourceUrl(source.url), source]));
  const urls: string[] = Array.isArray(item.source_urls) ? (item.source_urls as unknown[]).filter((url): url is string => typeof url === 'string') : [];
  const matched: Array<{ title: string; url: string }> = [];
  for (const url of urls) {
    const source = sourceByUrl.get(normalizeSourceUrl(url));
    if (source) matched.push(source);
  }
  if (matched.length) return [...new Map(matched.map((source) => [source.url, source])).values()];

  const companyName = normalizeResearchText(String(item.company_name || '')).replace(/\b(limited|ltd|plc|incorporated|inc)\b/gu, '').trim();
  let companyHost = '';
  try { companyHost = new URL(/^https?:\/\//i.test(item.website || '') ? item.website : `https://${item.website}`).hostname.toLowerCase().replace(/^www\./u, ''); } catch { /* omit unavailable website */ }
  const related = sources.filter((source) => {
    let sourceHost = '';
    try { sourceHost = new URL(source.url).hostname.toLowerCase().replace(/^www\./u, ''); } catch { /* ignore malformed source */ }
    const sourceTitle = normalizeResearchText(source.title).replace(/\b(limited|ltd|plc|incorporated|inc)\b/gu, '').trim();
    return (!!companyHost && sourceHost === companyHost) || (!!companyName && sourceTitle.includes(companyName));
  });
  return [...new Map(related.map((source) => [source.url, source])).values()];
}

const EMPLOYEE_BANDS = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10001+'] as const;

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
      config: { tools: [{ googleSearch: {} }], responseMimeType: 'application/json' },
    });
    if (!response.text) throw new Error('Google Search returned an empty response.');
    const text = response.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    let data: any;
    try { data = JSON.parse(text); } catch { throw new Error('AI research returned an invalid structured response. Please try again.'); }
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.flatMap((chunk: any) => chunk.web?.uri ? [{ title: chunk.web.title || chunk.web.uri, url: chunk.web.uri }] : []);
    return { data, sources: [...new Map(sources.map((source) => [source.url, source])).values()] };
  }

  private async searchJson(prompt: string, query: string): Promise<{ data: any; sources: Array<{ title: string; url: string }> }> {
    const apiKey = process.env.BRAVE_SEARCH_API_KEY?.trim();
    if (!apiKey) return this.groundedJson(prompt);
    if (!this.aiClient) throw new Error('AI research is unavailable because GEMINI_API_KEY is not configured.');
    const boundedQuery = query.trim().split(/\s+/u).slice(0, 50).join(' ').slice(0, 450);
    const params = new URLSearchParams({ q: boundedQuery });
    let response: Response;
    try {
      response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
        headers: { 'X-Subscription-Token': apiKey, Accept: 'application/json', 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(15000),
      });
    } catch (error: any) {
      throw new Error(`Could not connect to Brave Search: ${error?.message || 'network request failed'}`);
    }
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let providerMessage = '';
      try {
        const errorPayload = JSON.parse(errorText);
        const validationErrors = errorPayload?.error?.meta?.errors;
        const validationDetail = Array.isArray(validationErrors) ? validationErrors.map((item: any) => `${item?.loc?.slice?.(-1)?.[0] || 'parameter'}: ${item?.msg || ''}`).join('; ') : '';
        providerMessage = String(validationDetail || errorPayload?.error?.detail || errorPayload?.error?.message || errorPayload?.message || '').slice(0, 300);
      } catch { providerMessage = errorText.slice(0, 300); }
      throw new Error(`Brave Search returned HTTP ${response.status}${providerMessage ? `: ${providerMessage}` : '.'}`);
    }
    const payload = await response.json() as { web?: { results?: Array<{ title?: string; url?: string; description?: string }> } };
    const searchResults = (payload.web?.results || []).filter((item) => item.url).map((item) => ({ title: String(item.title || item.url), url: String(item.url), snippet: String(item.description || '').slice(0, 700) }));
    const sources = searchResults.map(({ title, url }) => ({ title, url }));
    if (!sources.length) throw new Error('Brave Search returned no web results. Try a broader category or location.');
    const searchContext = searchResults.map((source, index) => `${index + 1}. ${source.title}\nURL: ${source.url}\nSnippet: ${source.snippet}`).join('\n\n');
    const responseFromModel = await this.aiClient.models.generateContent({
      model: GEMINI_RESEARCH_MODEL,
      contents: `${prompt}\n\nBrave Search results (use only organizations evidenced in these result titles or snippets; cite only the listed URLs):\n${searchContext}`,
      config: { responseMimeType: 'application/json' },
    });
    if (!responseFromModel.text) throw new Error('Gemini returned an empty response after Brave Search.');
    let data: any;
    try { data = JSON.parse(responseFromModel.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()); }
    catch { throw new Error('Gemini returned an invalid structured response after Brave Search.'); }
    return { data, sources };
  }

  public async researchBusinessProfile(input: { website?: string; service_websites?: string[]; company_name?: string; context?: string }): Promise<BusinessProfileResearchDraft> {
    const submittedSites = [input.website, ...(input.service_websites || [])].map((value) => String(value || '').trim()).filter(Boolean);
    const serviceWebsites = [...new Set(submittedSites)];
    const website = serviceWebsites[0] || '';
    const companyName = String(input.company_name || '').trim();
    if (!website && !companyName) throw new Error('Enter a company website or company name to begin.');
    if (serviceWebsites.length > 25) throw new Error('Add up to 25 websites per company profile.');
    if (serviceWebsites.some((site) => !/^https?:\/\//i.test(site))) throw new Error('Each service website must begin with https:// or http://.');
    const { data, sources } = await this.groundedJson(`Research one company and combine the supplied corporate site and service subdomains into a single company profile. Company website and service subdomains: ${JSON.stringify(serviceWebsites)}. Company name: ${companyName || 'identify from the supplied company websites'}. Additional context: ${String(input.context || '').slice(0, 1200) || 'none'}.
Visit/search across each supplied site and its pages. Extract the company identity and consolidate its different business lines, services, and products into one capability profile. Preserve which supplied site supports each offering when possible. For technology or digital offerings, classify category_code using the closest identifier from this taxonomy: ${DIGITAL_PRODUCT_CATEGORIES.map((item) => `${item.id} (${item.label})`).join('; ')}. Use category_code "general" only when no taxonomy item fits. Suggest target_customer_types from real audiences supported by the source sites, including small/private schools, churches, faith-based organizations, private companies, SMEs, NGOs, or training centres when evidenced. Do not classify this company as oil and gas unless the supplied sites clearly establish that. Certifications only when explicitly evidenced. Do not guess or invent facts; keep unknowns empty. Return JSON only with keys: company_name (string), website (primary company website string), country_code (ISO 3166-1 alpha-2 string or empty), business_summary (string), target_regions (string[]), target_industries (array using only oil_and_gas, education, digital_products, faith_based, private_sector), target_customer_types (string[]), offerings (array of {name, description, offering_type (product/service/capability), category_code, target_industry, source_url}), certifications (array of {name, issuer, valid_from, valid_to, evidence_url}). For source_url/evidence_url, use only URLs available in search results. Do not include a separate company profile for each subdomain.`);
    const allowedIndustries: IndustryCode[] = ['oil_and_gas', 'education', 'digital_products', 'faith_based', 'private_sector'];
    const allowedDigitalCategories = new Set(DIGITAL_PRODUCT_CATEGORIES.map((category) => category.id));
    const offerings = Array.isArray(data.offerings) ? data.offerings.slice(0, 20).map((item: any, index: number) => ({
      id: `off-${Date.now()}-${index}`, name: String(item.name || '').slice(0, 160), description: String(item.description || '').slice(0, 800),
      offering_type: ['product', 'service', 'capability'].includes(item.offering_type) ? item.offering_type : 'service',
      category_code: allowedDigitalCategories.has(item.category_code) ? item.category_code : 'general', target_industry: allowedIndustries.includes(item.target_industry) ? item.target_industry : 'digital_products',
      ...(typeof item.source_url === 'string' && sources.some((source) => source.url === item.source_url) ? { source_url: item.source_url } : {}),
    })).filter((item: any) => item.name) : [];
    const certifications = Array.isArray(data.certifications) ? data.certifications.slice(0, 20).map((item: any, index: number) => ({
      id: `cert-${Date.now()}-${index}`, name: String(item.name || '').slice(0, 160), issuer: String(item.issuer || 'Not established'),
      valid_from: String(item.valid_from || 'Unknown'), valid_to: String(item.valid_to || 'Unknown'),
      ...(typeof item.evidence_url === 'string' && sources.some((source) => source.url === item.evidence_url) ? { evidence_url: item.evidence_url } : {}),
    })).filter((item: any) => item.name) : [];
    return {
      company_name: String(data.company_name || companyName || '').slice(0, 200), website: website.slice(0, 300), service_websites: serviceWebsites.filter((site) => site !== website),
      country_code: String(data.country_code || '').slice(0, 2).toUpperCase(), business_summary: String(data.business_summary || '').slice(0, 2500),
      target_regions: Array.isArray(data.target_regions) ? data.target_regions.filter((value: unknown) => typeof value === 'string').slice(0, 30) : [],
      target_industries: Array.isArray(data.target_industries) ? data.target_industries.filter((value: unknown): value is IndustryCode => allowedIndustries.includes(value as IndustryCode)) : [],
      target_customer_types: Array.isArray(data.target_customer_types) ? data.target_customer_types.filter((value: unknown) => typeof value === 'string').slice(0, 30) : [],
      offerings, certifications, sources,
    };
  }

  public async findBusinessProspects(profile: BusinessProfile, filters: { employee_band?: string; customer_type?: string; location?: string; offering_name?: string; size_focus?: 'small_local' | 'all_sizes' } = {}): Promise<BusinessProspectMatch[]> {
    const selectedOfferings = filters.offering_name
      ? (profile.offerings || []).filter((offering) => offering.name === filters.offering_name)
      : (profile.offerings || []).slice(0, 4);
    const offerings = selectedOfferings.length ? selectedOfferings : (profile.offerings || []).slice(0, 4);
    const customerTypes = filters.customer_type?.trim() || (profile.target_customer_types || []).join(', ') || 'organizations that could benefit from the supplied offerings';
    const locations = filters.location?.trim() || (profile.target_regions || []).join(', ') || 'Nigeria, all states and the FCT';
    const sizeFocus = filters.size_focus === 'all_sizes' ? 'all sizes' : 'prioritize small and local organizations';
    profile = {
      ...profile,
      target_customer_types: filters.customer_type?.trim() ? [filters.customer_type.trim()] : profile.target_customer_types,
      target_regions: filters.location?.trim() ? [filters.location.trim()] : profile.target_regions,
      business_summary: `${profile.business_summary}\nProspect size preference: ${sizeFocus}.`,
      offerings,
    };
    const sizeSearchTerms = filters.size_focus === 'all_sizes' ? 'organizations' : 'small independent low-fee local organizations SMEs';
    const prospectQuery = `${customerTypes} ${offerings.map((offering) => `${offering.name} ${offering.description}`).join(' ')} ${locations} ${sizeSearchTerms} Nigeria`;
    const { data, sources } = await this.searchJson(`Find up to 20 real organizations across Nigeria that could plausibly benefit from or procure the following company's offerings. Search current public information. Supplier: ${profile.company_name}; primary website: ${profile.website}; service websites: ${JSON.stringify(profile.service_websites || [])}; summary: ${profile.business_summary}; offerings: ${JSON.stringify(profile.offerings)}; target regions: ${JSON.stringify(profile.target_regions)}; target industries: ${JSON.stringify(profile.target_industries)}; intended customer types: ${JSON.stringify(profile.target_customer_types || [])}; requested employee band: ${filters.employee_band || 'any size'}.
Actively search beyond prominent listed corporations. Build a balanced shortlist from the actual customer types relevant to the supplied offerings: include small/independent secondary schools, churches/faith-based organizations, private companies/SMEs, NGOs, and training centres when relevant. Across a nationwide search, include candidates from multiple Nigerian states; do not let Lagos or Nigerian Exchange-listed companies dominate. Return at most 3 publicly listed companies and at most 5 Lagos-based organizations, unless the supplied profile explicitly targets listed enterprises or Lagos. Do not fill these groups with weak fits: every candidate must match at least one named offering and intended customer type. Prefer official candidate sites, school/organization directories, credible associations, and public announcements; general search popularity is not evidence of buyer fit. Do not say a prospect currently needs or is buying unless a source establishes it; otherwise label it as a potential fit. Do not force an oil and gas fit unless the offering supports it. For each candidate return employee_band using one of 1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5001-10000, 10001+, Unknown. Employee bands from this AI search are unverified estimates; use Unknown when no credible public estimate is available. If an employee band filter was requested, include only candidates in that band. Exclude the supplier itself. Return JSON only: {"prospects":[{"company_name":"","website":"","industry_id":"oil_and_gas|education|digital_products|faith_based|private_sector","company_type":"","location":"","description":"short evidence-based description","match_reason":"why the supplied offering could fit; distinguish inference from sourced fact","matched_offerings":["offering name"],"employee_band":"Unknown","employee_size_confidence":"estimated|unknown","source_urls":["URL from a supplied search result"]}]}. source_urls should list only matching URLs from the supplied search results; use an empty array when no supporting URL is available. Do not invent people, contact details, procurement, URLs, or facts. Keep genuine candidates and label missing evidence through empty source_urls rather than omitting the candidate.`, prospectQuery);
    if (!Array.isArray(data.prospects)) throw new Error('AI prospect search returned an invalid response.');
    const allowedIndustries: IndustryCode[] = ['oil_and_gas', 'education', 'digital_products', 'faith_based', 'private_sector'];
    const mapped = data.prospects.slice(0, 20).filter((item: any) => item.company_name).filter((item: any) => !filters.employee_band || item.employee_band === filters.employee_band).map((item: any, index: number) => {
      const matchedSources = candidateSources(item, sources);
      return ({
      id: `prospect-${Date.now()}-${index}`, company_name: String(item.company_name).slice(0, 200), website: String(item.website || '').slice(0, 300),
      industry_id: allowedIndustries.includes(item.industry_id) ? item.industry_id : 'digital_products', company_type: String(item.company_type || 'Organization').slice(0, 100),
      location: String(item.location || 'Not established').slice(0, 160), description: String(item.description || '').slice(0, 1000),
      match_reason: String(item.match_reason || '').slice(0, 1000), matched_offerings: Array.isArray(item.matched_offerings) ? item.matched_offerings.filter((value: unknown) => typeof value === 'string').slice(0, 10) : [],
      employee_band: EMPLOYEE_BANDS.includes(item.employee_band) ? item.employee_band : 'Unknown',
      employee_size_confidence: EMPLOYEE_BANDS.includes(item.employee_band) ? 'estimated' : 'unknown',
      evidence_status: matchedSources.length ? 'grounded' as const : 'needs_verification' as const,
      sources: matchedSources, discovered_at: new Date().toISOString(),
    });
    });
    const profileTargetsListedCompanies = JSON.stringify([profile.target_customer_types, profile.business_summary, profile.offerings]).toLowerCase().includes('listed company');
    const profileTargetsLagos = (profile.target_regions || []).some((region) => region.toLowerCase().includes('lagos'));
    let listedCount = 0;
    let lagosCount = 0;
    const seen = new Set<string>();
    return mapped.filter((match: BusinessProspectMatch) => {
      const nameKey = match.company_name.trim().toLowerCase();
      if (seen.has(nameKey)) return false;
      seen.add(nameKey);
      const listed = /\b(plc|public limited|listed on|nigerian exchange|ngx:)\b/i.test(`${match.company_type} ${match.description}`);
      const lagos = /\blagos\b/i.test(match.location);
      if (listed && !profileTargetsListedCompanies && listedCount >= 3) return false;
      if (lagos && !profileTargetsLagos && lagosCount >= 5) return false;
      if (listed) listedCount += 1;
      if (lagos) lagosCount += 1;
      return true;
    });
  }

  public async searchCompanies(input: CompanySearchInput): Promise<BusinessProspectMatch[]> {
    const name = String(input.company_name || '').trim();
    const category = String(input.category || '').trim();
    const locationInput = String(input.location || '').trim();
    if (!name && !category && !locationInput) throw new Error('Enter a company name, category, or location to search.');
    const location = locationInput || 'Nigeria (nationwide, all states and the FCT)';
    const employeeBand = input.employee_band;
    const digitalCategoryTerms = expandDigitalProductCategory(category);
    const categoryQuery = digitalCategoryTerms.length ? `${category}; related search terms: ${digitalCategoryTerms.join(', ')}` : category || 'any';
    const companyQuery = [name, categoryQuery, location].filter(Boolean).join(' ');
    const { data, sources } = await this.searchJson(`Find up to 20 real organizations matching this public company search. Search criteria: name: ${name || 'any'}; category or service: ${categoryQuery}; location: ${location}; employee band: ${employeeBand || 'any size'}.
For Nigeria-wide education searches, include small independent and low-fee secondary schools as well as large public institutions. For faith-based searches include churches, dioceses, denominations, ministries, and church-operated organizations. For private company searches include SMEs and local businesses, not only major corporations. Search for candidates across multiple Nigerian states/regions, and use school or organization directories and official candidate sites when available. For digital product and technology categories, search across related terms and close synonyms. Return a supported employee_band (1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5001-10000, 10001+, or Unknown) and employee_size_confidence (sourced, estimated, unknown) for each result. Do not guess; use Unknown when public evidence is unavailable. Apply the employee band filter if one was selected. Do not present a possible training or product fit as a confirmed purchasing need. Return JSON only: {"prospects":[{"company_name":"","website":"","industry_id":"oil_and_gas|education|digital_products|faith_based|private_sector","company_type":"","location":"","description":"short factual description","match_reason":"why it matches the requested name, category, or location","matched_offerings":["publicly described services or products"],"employee_band":"Unknown","employee_size_confidence":"sourced|estimated|unknown","source_urls":["URL returned by Google Search"]}]}. source_urls must only use the exact URLs from the supplied search results; use an empty array if none can be confidently attached. Do not invent URLs, contacts, or facts, and do not discard a relevant company solely because a citation is unavailable.`, companyQuery);
    if (!Array.isArray(data.prospects)) throw new Error('Company search returned an invalid response.');
    const allowedIndustries: IndustryCode[] = ['oil_and_gas', 'education', 'digital_products', 'faith_based', 'private_sector'];
    return data.prospects.slice(0, 20).filter((item: any) => item.company_name).filter((item: any) => !employeeBand || item.employee_band === employeeBand).map((item: any, index: number) => {
      const matchedSources = candidateSources(item, sources);
      return ({
      id: `company-search-${Date.now()}-${index}`, company_name: String(item.company_name).slice(0, 200), website: String(item.website || '').slice(0, 300),
      industry_id: allowedIndustries.includes(item.industry_id) ? item.industry_id : 'digital_products', company_type: String(item.company_type || 'Company').slice(0, 100),
      location: String(item.location || location || 'Not established').slice(0, 160), description: String(item.description || '').slice(0, 1000),
      match_reason: String(item.match_reason || '').slice(0, 1000), matched_offerings: Array.isArray(item.matched_offerings) ? item.matched_offerings.filter((value: unknown) => typeof value === 'string').slice(0, 10) : [],
      employee_band: EMPLOYEE_BANDS.includes(item.employee_band) ? item.employee_band : 'Unknown',
      employee_size_confidence: EMPLOYEE_BANDS.includes(item.employee_band) ? (item.employee_size_confidence === 'sourced' ? 'sourced' : 'estimated') : 'unknown',
      evidence_status: matchedSources.length ? 'grounded' as const : 'needs_verification' as const,
      sources: matchedSources, discovered_at: new Date().toISOString(),
    });
    });
  }

  public async searchByNeed(input: NeedSearchInput): Promise<BusinessProspectMatch[]> {
    const need = String(input.need || '').trim().slice(0, 160);
    const location = String(input.location || 'Nigeria (nationwide)').trim().slice(0, 100);
    if (need.length < 2) throw new Error('Enter a job title, skill, product, or service need to search.');
    const types: Array<'buying_need' | 'job_opening'> = input.mode === 'buying' ? ['buying_need'] : input.mode === 'jobs' ? ['job_opening'] : ['buying_need', 'job_opening'];
    const resultsByType = await Promise.all(types.map(async (resultKind) => {
      const buyingSearch = resultKind === 'buying_need';
      const query = buyingSearch
        ? `${need} seeking provider service request RFP procurement ${location} Nigeria`
        : `${need} current job vacancy hiring careers ${location} Nigeria`;
      const prompt = buyingSearch
        ? `Find up to 10 public requests from Nigerian organizations or individuals who are seeking this product/service: "${need}". Search for published requests, requests for proposals, procurement/tender notices, public posts asking for a provider, or other explicit buying-intent signals. Do not return businesses merely selling the service. Only include a buyer when the search result page gives evidence that it is seeking the service or product. Exclude private personal contact details; use the public organization name or "Individual buyer" if the public page does not establish a business identity. Location focus: ${location}. Use only facts supported by the supplied search results. Return JSON only: {"results":[{"company_name":"organization name or Individual buyer","website":"official website if present in result URLs, otherwise empty","industry_id":"oil_and_gas|education|digital_products|faith_based|private_sector","company_type":"organization, individual buyer, or public institution","location":"","description":"what the public page says the buyer is seeking","match_reason":"why this is a relevant public buying signal; do not imply a signed contract","matched_offerings":["requested service/product phrase"],"source_urls":["exact supplied search URL"]}]}. Include only URLs from the supplied search results; do not invent names, contact details, dates, or URLs.`
        : `Find up to 10 currently open job vacancies matching the role or job type: "${need}" in ${location}. Search employer career pages, reputable job boards, and public recruitment announcements. Only include listings that appear open for applications; do not return old or closed listings. These are job opportunities for job seekers, not claims that the employer wants to buy a service. Use only facts supported by the supplied search results. Return JSON only: {"results":[{"company_name":"employer name","website":"employer website if present in result URLs, otherwise empty","industry_id":"oil_and_gas|education|digital_products|faith_based|private_sector","company_type":"Employer · Job opening","location":"","job_title":"exact advertised role","employment_type":"full-time, part-time, contract, internship, or Unknown","posted_date":"date only if stated, otherwise Unknown","description":"brief duties or requirements from the listing","match_reason":"why the role matches the requested job type","matched_offerings":[],"source_urls":["exact supplied search URL"]}]}. Include only URLs from the supplied search results; do not invent names, contact details, dates, or URLs.`;
      const { data, sources } = await this.searchJson(prompt, query);
      if (!Array.isArray(data.results)) throw new Error(`${buyingSearch ? 'Buying-needs' : 'Job-opening'} search returned an invalid response.`);
      return data.results.slice(0, 10).filter((item: any) => item.company_name).map((item: any, index: number): BusinessProspectMatch => {
        const matchedSources = candidateSources(item, sources);
        return {
          id: `need-search-${resultKind}-${Date.now()}-${index}`,
          company_name: String(item.company_name).slice(0, 200), website: String(item.website || '').slice(0, 300),
          industry_id: ['oil_and_gas', 'education', 'digital_products', 'faith_based', 'private_sector'].includes(item.industry_id) ? item.industry_id : 'private_sector',
          company_type: String(item.company_type || (buyingSearch ? 'Buying need' : 'Job opening')).slice(0, 100),
          location: String(item.location || location).slice(0, 160), description: String(item.description || '').slice(0, 1000),
          match_reason: String(item.match_reason || '').slice(0, 1000),
          matched_offerings: Array.isArray(item.matched_offerings) ? item.matched_offerings.filter((value: unknown) => typeof value === 'string').slice(0, 10) : [],
          employee_band: 'Unknown', employee_size_confidence: 'unknown',
          evidence_status: matchedSources.length ? 'grounded' : 'needs_verification', sources: matchedSources,
          discovered_at: new Date().toISOString(), result_kind: resultKind,
          ...(typeof item.job_title === 'string' ? { job_title: item.job_title.slice(0, 160) } : {}),
          ...(typeof item.employment_type === 'string' ? { employment_type: item.employment_type.slice(0, 80) } : {}),
          ...(typeof item.posted_date === 'string' ? { posted_date: item.posted_date.slice(0, 80) } : {}),
        };
      });
    }));
    const unique = new Map<string, BusinessProspectMatch>();
    for (const result of resultsByType.flat()) {
      const key = `${result.result_kind}:${result.company_name.toLowerCase()}:${result.job_title?.toLowerCase() || ''}`;
      if (!unique.has(key)) unique.set(key, result);
    }
    return [...unique.values()].slice(0, 20);
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

    const isMarketTopic = subject_type === 'market_topic';
    const searchPrompt = isMarketTopic ? `Research this buyer need or job type in Nigeria: ${subject_name}
Industry: ${industry || 'General Industry'}
Research focus: ${question || 'Find organizations publicly seeking this service or people publicly hiring for this work'}
Requested source categories: ${JSON.stringify(job.payload.sources || [])}

Search for churches, schools, nonprofits, companies, public bodies, and other organizations that may be seeking this service, as well as relevant public tenders, requests for proposals, training announcements, event notices, and job openings. Prioritize active requests and upcoming programs, then recent completed programs that could support a relevant follow-up. Prioritize official organization pages, public procurement notices, and other primary sources. Search for the need phrase and close variants with Nigerian locations.
This is a service need or job type, not an organization. Do not search for its corporate registration, officers, physical assets, or tenders under the phrase itself. Do not treat absence of search results as proof that demand does not exist. Clearly distinguish open requests from past activity and audience-fit hypotheses. Do not guess or create facts, people, tenders, dates, or URLs. The API will provide source citations separately; do not fabricate citations.` : `Research ${subject_type || 'company'}: ${subject_name}
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

    const synthesisPrompt = `You are preparing a preliminary commercial-fit and outreach lead analysis for Jeneconk BII.

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
${isMarketTopic ? `- The subject is a buyer need or job type, not a named organization. Never discuss registration, corporate officers, assets, or organizational facts about the phrase itself.
- Optimize for organizations Jeneconk could responsibly approach, not a news recap. Return up to six potential_leads, prioritizing organizations with source-backed training, digital adoption, service requests, hiring, or similar activity relevant to the supplied offerings.
- A lead is a prospect to qualify, not automatically a buyer. Use signal_type "active_request" only when the cited claim explicitly shows a current open request, tender, or active invitation for providers. Use "past_engagement" for a documented completed or historical program. Use "potential_fit" when the source supports organizational relevance but not an expressed purchase or training need.
- Every lead must name an organization present in the cited evidence and include evidence_claim copied exactly from one supplied grounded claim, source_url copied exactly from that claim's sources, and source_name copied from the same source. If no evidence-backed organization can be named, return an empty list.
- Do not turn a past conference, course listing, article, or general interest into an active opportunity. Keep evidence_date empty unless the cited claim itself contains a date.
- Keep fit_reason explicitly conditional. contact_role_to_verify is a role hypothesis, not a confirmed named contact. recommended_first_step must tell the user how to qualify the lead without asserting current demand.
- List only buyer or hiring roles explicitly supported by cited claims in key_decision_makers; do not fill that field with generic guesses.
- Distinguish public buying signals from possible audience fit. Do not claim an organization wants the service without a cited source.` : ''}

Return JSON with this shape:
{
  "executive_summary": "Concise summary constrained to the supplied search briefing and cited claims",
  "strategic_fit_analysis": "Conditional fit assessment based only on the supplied offerings and search evidence",
  "key_decision_makers": [{ "name": "Role to identify", "title": "Suggested role", "relevance": "Why this role may be relevant; verify for the target" }],
  "potential_leads": [{ "organization_name": "Organization explicitly supported by evidence", "signal_type": "active_request|past_engagement|potential_fit", "evidence_claim": "Exact supplied grounded claim", "evidence_date": "Date stated in the claim, otherwise empty", "source_name": "Exact source title", "source_url": "Exact URL attached to that claim", "fit_reason": "Conditional fit with supplied offerings", "contact_role_to_verify": "Likely role to identify; not a confirmed contact", "recommended_first_step": "A concrete qualification step" }],
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
    if (isMarketTopic && !Array.isArray(synthesisResult.potential_leads)) synthesisResult.potential_leads = [];
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

    if (isMarketTopic) {
      const knownLeadSignalTypes = new Set(['active_request', 'past_engagement', 'potential_fit']);
      const allowedLeads = (Array.isArray(synthesisResult.potential_leads) ? synthesisResult.potential_leads : [])
        .filter((item: any) => {
          if (!item || typeof item.organization_name !== 'string' || !item.organization_name.trim()) return false;
          if (!knownLeadSignalTypes.has(item.signal_type) || typeof item.evidence_claim !== 'string') return false;
          const matchingFact = groundedFacts.find((fact) => normalizeResearchText(fact.claim) === normalizeResearchText(item.evidence_claim));
          if (!matchingFact) return false;
          if (!matchingFact.sources.some((source) => source.source_url === item.source_url && source.source_name === item.source_name)) return false;
          const organization = normalizeResearchText(item.organization_name);
          if (!normalizeResearchText(matchingFact.claim + ' ' + matchingFact.source_name).includes(organization)) return false;
          return true;
        })
        .slice(0, 6)
        .map((item: any) => {
          const matchingFact = groundedFacts.find((fact) => normalizeResearchText(fact.claim) === normalizeResearchText(item.evidence_claim))!;
          const explicitOpenRequest = /\b(?:currently (?:seeking|accepting)|open (?:tender|call for proposals?|applications?)|applications? (?:are )?currently open|invitation to submit (?:a )?(?:proposal|bid|tender))\b/i.test(matchingFact.claim);
          const signalType = item.signal_type === 'active_request' && !explicitOpenRequest
            ? 'past_engagement'
            : item.signal_type;
          return {
            organization_name: item.organization_name.trim().slice(0, 180),
            signal_type: signalType,
            evidence_claim: matchingFact.claim,
            ...(typeof item.evidence_date === 'string' && item.evidence_date.trim() && matchingFact.claim.includes(item.evidence_date.trim()) ? { evidence_date: item.evidence_date.trim().slice(0, 80) } : {}),
            source_name: matchingFact.sources.find((source) => source.source_url === item.source_url)!.source_name,
            source_url: matchingFact.sources.find((source) => source.source_url === item.source_url)!.source_url,
            fit_reason: String(item.fit_reason || '').slice(0, 500),
            contact_role_to_verify: String(item.contact_role_to_verify || '').slice(0, 160),
            recommended_first_step: String(item.recommended_first_step || '').slice(0, 500),
          };
        });
      synthesisResult.potential_leads = allowedLeads;
    } else {
      synthesisResult.potential_leads = [];
    }

    if (isMarketTopic && groundedFacts.length === 0) {
      synthesisResult.executive_summary = `Google Search returned no claim-level citations for the buyer need or job type “${subject_name}”. This search result does not establish whether demand exists.`;
      synthesisResult.strategic_fit_analysis = 'The supplied offerings may be relevant to this need, but no source-backed organization or hiring signal was found in this search. Treat potential audience fit as a hypothesis to validate.';
      synthesisResult.key_decision_makers = [];
      synthesisResult.potential_leads = [];
      synthesisResult.recommended_outreach_angle = `Ask prospective organizations whether they currently need support with ${subject_name}.`;
    }

    const procurementKeywords = /tender|procurement|contract|rfp|bid|supplier|vendor|award|budget/i;
    const buyerSignalKeywords = /tender|procurement|contract|rfp|bid|supplier|vendor|training|workshop|service|hiring|job|vacan|career|request|seeking|looking for|invitation|registration|apply/i;
    synthesisResult.known_facts = groundedFacts;
    synthesisResult.procurement_signals = groundedFacts
      .filter((fact) => (isMarketTopic ? buyerSignalKeywords : procurementKeywords).test(fact.claim))
      .map((fact) => fact.claim);
    synthesisResult.search_queries = [...new Set(grounding?.webSearchQueries || [])];
    if (groundedFacts.length === 0) {
      synthesisResult.critical_unknowns = isMarketTopic
        ? ['No claim-level citations were returned for this need query; that does not show that organizations have no demand.']
        : [
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
