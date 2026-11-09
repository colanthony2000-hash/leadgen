import React, { useState } from 'react';
import { Award, Check, ExternalLink, Loader2, Search, Sparkles, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { BusinessProfileResearchDraft, BusinessProspectMatch, CompanyProfile, CompanyResearchRecord, IndustryCode } from '../../types';
import { DIGITAL_PRODUCT_CATEGORIES } from '../../data/digitalProductCategories';
import { NIGERIAN_BUYER_CATEGORIES, NIGERIAN_SEARCH_LOCATIONS } from '../../data/nigerianBuyerCategories';

const emptyDraft = (profile: ReturnType<typeof useApp>['businessProfile']): BusinessProfileResearchDraft => ({
  company_name: profile.company_name, website: profile.website, service_websites: profile.service_websites || [], country_code: profile.country_code,
  business_summary: profile.business_summary, target_regions: profile.target_regions,
  target_industries: profile.target_industries, target_customer_types: profile.target_customer_types || [], offerings: profile.offerings,
  certifications: profile.certifications, sources: profile.profile_sources || [],
});

const fieldClass = 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none';
const industries: Array<{ id: IndustryCode; label: string }> = [
  { id: 'oil_and_gas', label: 'Oil & Gas / EPC' }, { id: 'education', label: 'Schools & Education' }, { id: 'digital_products', label: 'Digital Products' },
  { id: 'faith_based', label: 'Churches & Faith Organizations' }, { id: 'private_sector', label: 'Private Companies & SMEs' },
];
const employeeBands = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10001+'];

export const BusinessProfileView: React.FC = () => {
  const { businessProfile, updateBusinessProfile, isDemoMode } = useApp();
  const [website, setWebsite] = useState(businessProfile.website || '');
  const [companyName, setCompanyName] = useState(businessProfile.company_name || '');
  const [serviceWebsitesText, setServiceWebsitesText] = useState((businessProfile.service_websites || []).join('\n'));
  const [context, setContext] = useState('');
  const [draft, setDraft] = useState<BusinessProfileResearchDraft | null>(null);
  const [matches, setMatches] = useState<BusinessProspectMatch[]>([]);
  const [buyerEmployeeBand, setBuyerEmployeeBand] = useState('');
  const [hasSearchedBuyers, setHasSearchedBuyers] = useState(false);
  const [companySearchName, setCompanySearchName] = useState('');
  const [companySearchCategory, setCompanySearchCategory] = useState('');
  const [companySearchLocation, setCompanySearchLocation] = useState('Nigeria (nationwide)');
  const [companyResults, setCompanyResults] = useState<BusinessProspectMatch[]>([]);
  const [companyEmployeeBand, setCompanyEmployeeBand] = useState('');
  const [hasSearchedCompanies, setHasSearchedCompanies] = useState(false);
  const [externalResearch, setExternalResearch] = useState<(BusinessProfileResearchDraft & { researched_name: string }) | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(businessProfile.id);
  const [busy, setBusy] = useState<'research' | 'save' | 'prospects' | 'companySearch' | 'companyResearch' | ''>('');
  const [message, setMessage] = useState('');

  const updateDraft = (updates: Partial<BusinessProfileResearchDraft>) => setDraft((previous) => previous ? { ...previous, ...updates } : previous);
  const runResearch = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy('research'); setMessage(''); setDraft(null); setMatches([]);
    try {
      const result = isDemoMode
        ? { ...emptyDraft(businessProfile), company_name: companyName || businessProfile.company_name, website: website || businessProfile.website, service_websites: serviceWebsitesText.split(/\r?\n/u).map((item) => item.trim()).filter(Boolean), business_summary: `${businessProfile.business_summary}\n\nDemo preview: add a Gemini API key and sign in to run live web research.`, sources: [] }
        : await api.researchBusinessProfile({ website, service_websites: serviceWebsitesText.split(/\r?\n/u).map((item) => item.trim()).filter(Boolean), company_name: companyName, context });
      setDraft(result); setMessage(result.sources.length ? `Draft researched with ${result.sources.length} web sources. Review every claim before approval.` : 'Draft ready. Review the details and sources before approval.');
    } catch (error: any) { setMessage(error.message || 'Company research failed.'); }
    finally { setBusy(''); }
  };

  const approveProfile = async () => {
    if (!draft) return;
    setBusy('save'); setMessage('');
    try {
      const profiles = businessProfile.company_profiles?.length
        ? [...businessProfile.company_profiles]
        : [{
            id: businessProfile.id, company_name: businessProfile.company_name, website: businessProfile.website, country_code: businessProfile.country_code,
            service_websites: businessProfile.service_websites || [],
            business_summary: businessProfile.business_summary, target_regions: businessProfile.target_regions, target_industries: businessProfile.target_industries,
            target_customer_types: businessProfile.target_customer_types || [],
            offerings: businessProfile.offerings, certifications: businessProfile.certifications, profile_sources: businessProfile.profile_sources || [],
            profile_approved_at: businessProfile.profile_approved_at || '', approved_prospects: businessProfile.approved_prospects || [], updated_at: businessProfile.updated_at,
          }];
      const profileId = editingProfileId || `bp-${Date.now()}`;
      const approvedAt = new Date().toISOString();
      const savedCompany: CompanyProfile = {
        id: profileId, company_name: draft.company_name, website: draft.website, country_code: draft.country_code,
        service_websites: draft.service_websites,
        business_summary: draft.business_summary, target_regions: draft.target_regions, target_industries: draft.target_industries,
        target_customer_types: draft.target_customer_types,
        offerings: draft.offerings, certifications: draft.certifications, profile_sources: draft.sources, profile_approved_at: approvedAt,
        approved_prospects: profiles.find((item) => item.id === profileId)?.approved_prospects || [], updated_at: approvedAt,
      };
      const nextProfiles = [savedCompany, ...profiles.filter((item) => item.id !== profileId)];
      await updateBusinessProfile({
        id: profileId,
        company_name: draft.company_name, website: draft.website, service_websites: draft.service_websites, country_code: draft.country_code,
        business_summary: draft.business_summary, target_regions: draft.target_regions,
        target_industries: draft.target_industries, target_customer_types: draft.target_customer_types, offerings: draft.offerings,
        certifications: draft.certifications, profile_sources: draft.sources,
        profile_approved_at: approvedAt, company_profiles: nextProfiles,
        approved_prospects: savedCompany.approved_prospects,
      });
      setEditingProfileId(profileId); setDraft(null); setMessage(`${draft.company_name} profile reviewed and saved. You can now search for potential customer companies.`);
    } catch (error: any) { setMessage(error.message || 'Could not save the approved profile.'); }
    finally { setBusy(''); }
  };

  const searchProspects = async () => {
    setBusy('prospects'); setMessage(''); setHasSearchedBuyers(true); setMatches([]);
    try {
      if (isDemoMode) throw new Error('Live prospect research is available after signing in with the Gemini key configured on the server.');
      setMatches(await api.findBusinessProspects({ employee_band: buyerEmployeeBand || undefined }));
    } catch (error: any) { setMessage(error.message || 'Prospect search failed.'); }
    finally { setBusy(''); }
  };

  const searchAnyCompany = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy('companySearch'); setMessage(''); setCompanyResults([]); setExternalResearch(null); setHasSearchedCompanies(true);
    try {
      setCompanyResults(await api.searchCompanies({ company_name: companySearchName, category: companySearchCategory, location: companySearchLocation, employee_band: companyEmployeeBand || undefined }));
    } catch (error: any) { setMessage(error.message || 'Company search failed.'); }
    finally { setBusy(''); }
  };

  const researchCompany = async (company: BusinessProspectMatch) => {
    setBusy('companyResearch'); setMessage('');
    try {
      const normalizedWebsite = company.website ? (/^https?:\/\//i.test(company.website) ? company.website : `https://${company.website}`) : undefined;
      const result = await api.researchBusinessProfile({ website: normalizedWebsite, company_name: company.company_name, context: `Research request from company search. Category: ${companySearchCategory || 'not specified'}. Location: ${company.location || companySearchLocation || 'not specified'}. Search result summary: ${company.description}` });
      setExternalResearch({ ...result, researched_name: company.company_name });
      setMessage(`Research draft for ${company.company_name} is ready. Review the source links below.`);
    } catch (error: any) { setMessage(error.message || 'Company research failed.'); }
    finally { setBusy(''); }
  };

  const saveResearchRecord = async () => {
    if (!externalResearch) return;
    const record: CompanyResearchRecord = { ...externalResearch, id: `research-${Date.now()}`, researched_at: new Date().toISOString() };
    try {
      await updateBusinessProfile({ company_research_records: [record, ...(businessProfile.company_research_records || [])] });
      setExternalResearch(null); setMessage(`${record.researched_name} saved to the company research library.`);
    } catch (error: any) { setMessage(error.message || 'Could not save research.'); }
  };

  const savedProfiles: CompanyProfile[] = businessProfile.company_profiles?.length ? businessProfile.company_profiles : [{
    id: businessProfile.id, company_name: businessProfile.company_name, website: businessProfile.website, country_code: businessProfile.country_code,
    service_websites: businessProfile.service_websites || [],
    business_summary: businessProfile.business_summary, target_regions: businessProfile.target_regions, target_industries: businessProfile.target_industries,
    target_customer_types: businessProfile.target_customer_types || [],
    offerings: businessProfile.offerings, certifications: businessProfile.certifications, profile_sources: businessProfile.profile_sources || [],
    profile_approved_at: businessProfile.profile_approved_at || '', approved_prospects: businessProfile.approved_prospects || [], updated_at: businessProfile.updated_at,
  }];

  const activateProfile = async (profile: CompanyProfile) => {
    try {
      await updateBusinessProfile({ id: profile.id, company_name: profile.company_name, website: profile.website, service_websites: profile.service_websites || [], country_code: profile.country_code,
        business_summary: profile.business_summary, target_regions: profile.target_regions, target_industries: profile.target_industries, target_customer_types: profile.target_customer_types || [],
        offerings: profile.offerings, certifications: profile.certifications, profile_sources: profile.profile_sources,
        profile_approved_at: profile.profile_approved_at, approved_prospects: profile.approved_prospects });
      setCompanyName(profile.company_name); setWebsite(profile.website); setServiceWebsitesText((profile.service_websites || []).join('\n')); setEditingProfileId(profile.id); setMatches([]); setDraft(null);
      setMessage(`${profile.company_name} is now the active company profile for matching.`);
    } catch (error: any) { setMessage(error.message || 'Could not switch active profile.'); }
  };

  const approveMatch = async (match: BusinessProspectMatch) => {
    const approved = { ...match, approved_at: new Date().toISOString() };
    try {
      await updateBusinessProfile({ approved_prospects: [...(businessProfile.approved_prospects || []).filter((item) => item.website !== match.website && item.company_name !== match.company_name), approved] });
      setMessage(`${match.company_name} saved to approved prospect matches.`);
    } catch (error: any) { setMessage(error.message || 'Could not save this prospect.'); }
  };

  const removeMatch = async (matchId: string) => {
    await updateBusinessProfile({ approved_prospects: (businessProfile.approved_prospects || []).filter((item) => item.id !== matchId) });
  };

  return <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
    <header>
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">Company discovery</p>
      <h1 className="mt-1 text-2xl font-bold text-white">Build your company profile, then find potential buyers</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-400">Create one profile for your company, including its main website and service subdomains. AI consolidates the business lines into one capability profile for matching. A person reviews and approves it before prospect search is enabled.</p>
    </header>

    <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-white">Your company profiles ({savedProfiles.length})</h2><p className="mt-1 text-xs text-slate-400">Use one profile for your company and its service subdomains. Create another profile only for a separate company. Matching uses the active approved profile.</p></div>
        <button type="button" onClick={() => { setEditingProfileId(null); setCompanyName(''); setWebsite(''); setServiceWebsitesText(''); setContext(''); setDraft(null); setMessage('Enter the company website and any service subdomains to start a new profile.'); }} className="min-h-10 rounded-lg border border-amber-400/40 px-3 py-2 text-sm font-medium text-amber-200">+ Create company profile</button></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{savedProfiles.map((profile) => <button type="button" key={profile.id} onClick={() => activateProfile(profile)} className={`min-w-0 rounded-xl border p-4 text-left ${businessProfile.id === profile.id ? 'border-amber-400/60 bg-amber-400/10' : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'}`}><span className="block truncate font-semibold text-white">{profile.company_name || 'Untitled company'}</span><span className="mt-1 block truncate text-xs text-slate-400">{profile.website || 'No website'} · {(profile.service_websites || []).length} service sites · {profile.offerings.length} offerings</span><span className="mt-2 inline-block rounded-full bg-slate-800 px-2 py-1 text-[10px] text-slate-300">{profile.profile_approved_at ? 'Approved' : 'Needs review'}</span></button>)}</div>
    </section>

    <form onSubmit={runResearch} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <h2 className="font-semibold text-white">1. Add your company websites</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs text-slate-300">Company website
          <input className={fieldClass} type="url" placeholder="https://example.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
        <label className="space-y-1.5 text-xs text-slate-300">Company name (optional if the site identifies you)
          <input className={fieldClass} placeholder="Registered or trading name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </label>
      </div>
      <label className="block space-y-1.5 text-xs text-slate-300">Service subdomains or additional company websites (one URL per line)
        <textarea className={fieldClass} rows={3} placeholder={'https://services.example.com\nhttps://products.example.com'} value={serviceWebsitesText} onChange={(e) => setServiceWebsitesText(e.target.value)} />
      </label>
      <label className="block space-y-1.5 text-xs text-slate-300">Anything the search should know? (optional)
        <textarea className={fieldClass} rows={2} placeholder="For example: we operate across Nigeria and provide subsea inspection services." value={context} onChange={(e) => setContext(e.target.value)} />
      </label>
      <button disabled={!!busy || (!website.trim() && !companyName.trim())} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
        {busy === 'research' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Research company details
      </button>
      {isDemoMode && <p className="text-xs text-slate-500">Demo mode can preview the review form; live Google Search needs a signed-in workspace and server Gemini key.</p>}
    </form>

    {draft && <section className="space-y-5 rounded-2xl border border-amber-500/30 bg-slate-900/60 p-5 sm:p-6">
      <div><h2 className="font-semibold text-white">2. Review your consolidated company profile</h2><p className="mt-1 text-xs text-slate-400">AI findings from your main site and subdomains are suggestions. Edit anything inaccurate; only approve details you can stand behind.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs text-slate-300">Company name<input className={fieldClass} value={draft.company_name} onChange={(e) => updateDraft({ company_name: e.target.value })} /></label>
        <label className="space-y-1.5 text-xs text-slate-300">Website<input className={fieldClass} value={draft.website} onChange={(e) => updateDraft({ website: e.target.value })} /></label>
      </div>
      <label className="block space-y-1.5 text-xs text-slate-300">Included service subdomains or websites<textarea className={fieldClass} rows={3} value={draft.service_websites.join('\n')} onChange={(e) => updateDraft({ service_websites: e.target.value.split(/\r?\n/u).map((item) => item.trim()).filter(Boolean) })} /></label>
      <label className="block space-y-1.5 text-xs text-slate-300">What the company does<textarea className={fieldClass} rows={4} value={draft.business_summary} onChange={(e) => updateDraft({ business_summary: e.target.value })} /></label>
      <div className="space-y-2"><h3 className="text-sm font-medium text-white">Services, products, and capabilities ({draft.offerings.length})</h3>
        {draft.offerings.map((offering, index) => <div key={offering.id} className="grid gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3 sm:grid-cols-[1fr_2fr_1.3fr_auto]">
          <input aria-label="Offering name" className={fieldClass} value={offering.name} onChange={(e) => updateDraft({ offerings: draft.offerings.map((item, i) => i === index ? { ...item, name: e.target.value } : item) })} />
          <input aria-label="Offering description" className={fieldClass} value={offering.description} onChange={(e) => updateDraft({ offerings: draft.offerings.map((item, i) => i === index ? { ...item, description: e.target.value } : item) })} />
          <select aria-label="Digital product category" className={fieldClass} value={offering.category_code || 'general'} onChange={(e) => updateDraft({ offerings: draft.offerings.map((item, i) => i === index ? { ...item, category_code: e.target.value } : item) })}><option value="general">Other / general category</option>{DIGITAL_PRODUCT_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select>
          <button type="button" title="Remove offering" onClick={() => updateDraft({ offerings: draft.offerings.filter((_, i) => i !== index) })} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
        </div>)}
        <button type="button" onClick={() => updateDraft({ offerings: [...draft.offerings, { id: `off-manual-${Date.now()}`, offering_type: 'service', name: '', description: '', category_code: 'general', target_industry: 'digital_products' }] })} className="text-xs font-medium text-amber-300">+ Add an offering</button>
      </div>
      <div><p className="mb-2 text-xs text-slate-300">Industries and markets</p><div className="flex flex-wrap gap-2">{industries.map((industry) => <label key={industry.id} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200"><input type="checkbox" checked={draft.target_industries.includes(industry.id)} onChange={(e) => updateDraft({ target_industries: e.target.checked ? [...draft.target_industries, industry.id] : draft.target_industries.filter((item) => item !== industry.id) })} />{industry.label}</label>)}</div>
        <input className={`${fieldClass} mt-3`} placeholder="Regions served, separated by commas" value={draft.target_regions.join(', ')} onChange={(e) => updateDraft({ target_regions: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })} /></div>
      <label className="block space-y-1.5 text-xs text-slate-300">Who could benefit from these services? (separate with commas)<input className={fieldClass} placeholder="Small secondary schools, churches, SMEs…" value={draft.target_customer_types.join(', ')} onChange={(e) => updateDraft({ target_customer_types: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} /></label>
      {!!draft.certifications.length && <div><h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-white"><Award className="h-4 w-4 text-amber-400" />Certifications found (verify before approval)</h3><ul className="space-y-1 text-xs text-slate-300">{draft.certifications.map((cert) => <li key={cert.id}>{cert.name} · {cert.issuer} · validity: {cert.valid_from} to {cert.valid_to}</li>)}</ul></div>}
      <div><h3 className="mb-2 text-sm font-medium text-white">Sources found</h3>{draft.sources.length ? <ul className="space-y-1.5 text-xs">{draft.sources.map((source) => <li key={source.url}><a className="inline-flex items-center gap-1 text-sky-300 hover:underline" href={source.url} target="_blank" rel="noreferrer">{source.title}<ExternalLink className="h-3 w-3" /></a></li>)}</ul> : <p className="text-xs text-slate-500">No web citations available in this preview.</p>}</div>
      <button type="button" onClick={approveProfile} disabled={!!busy || !draft.company_name.trim() || !draft.offerings.some((item) => item.name.trim())} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"><Check className="h-4 w-4" />{busy === 'save' ? 'Saving…' : 'Approve and save company profile'}</button>
    </section>}

    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div><h2 className="font-semibold text-white">Search and research any company</h2><p className="mt-1 text-xs text-slate-400">Search by company name, service category, or location. Results include web sources; research a result to build a fuller company record.</p></div>
      <form onSubmit={searchAnyCompany} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input className={fieldClass} placeholder="Company name" value={companySearchName} onChange={(e) => setCompanySearchName(e.target.value)} />
        <input list="buyer-and-product-categories" className={fieldClass} placeholder="Schools, churches, SMEs, or service" value={companySearchCategory} onChange={(e) => setCompanySearchCategory(e.target.value)} />
        <datalist id="buyer-and-product-categories">{[...NIGERIAN_BUYER_CATEGORIES, ...DIGITAL_PRODUCT_CATEGORIES.map((category) => category.label)].map((category) => <option key={category} value={category} />)}</datalist>
        <input list="nigerian-search-locations" className={fieldClass} placeholder="State, city, or Nigeria nationwide" value={companySearchLocation} onChange={(e) => setCompanySearchLocation(e.target.value)} />
        <datalist id="nigerian-search-locations">{NIGERIAN_SEARCH_LOCATIONS.map((location) => <option key={location} value={location} />)}</datalist>
        <select aria-label="Filter by employee count" className={fieldClass} value={companyEmployeeBand} onChange={(e) => setCompanyEmployeeBand(e.target.value)}><option value="">Any employee count</option>{employeeBands.map((band) => <option key={band} value={band}>{band} employees</option>)}</select>
        <button disabled={!!busy || (!companySearchName.trim() && !companySearchCategory.trim() && !companySearchLocation.trim())} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{busy === 'companySearch' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Search companies</button>
      </form>
      {companyResults.map((company) => <article key={company.id} className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-semibold text-white">{company.company_name}</h3><p className="text-xs text-slate-400">{company.company_type} · {company.location}{company.website ? ` · ${company.website}` : ''}</p><p className="mt-1 text-xs text-slate-400">Employees: {company.employee_band || 'Unknown'}{company.employee_size_confidence === 'estimated' ? ' (estimated)' : company.employee_size_confidence === 'sourced' ? ' (source-reported)' : ''}</p><p className={`mt-1 text-xs ${company.evidence_status === 'grounded' ? 'text-emerald-300' : 'text-amber-300'}`}>{company.evidence_status === 'grounded' ? 'Source linked' : 'Candidate found; verify details before outreach'}</p></div><button type="button" disabled={!!busy} onClick={() => researchCompany(company)} className="rounded-lg border border-sky-400/30 px-3 py-2 text-xs font-semibold text-sky-200 disabled:opacity-50">{busy === 'companyResearch' ? 'Researching…' : 'Research company'}</button></div><p className="text-sm text-slate-300">{company.description}</p><p className="text-xs text-slate-400">{company.match_reason}</p><div className="flex flex-wrap gap-2">{company.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-sky-300 hover:underline">{source.title}<ExternalLink className="h-3 w-3" /></a>)}</div></article>)}
      {hasSearchedCompanies && companyResults.length === 0 && !busy && <p className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">Google returned no companies for this search. Try another state, category, or company-name spelling; remove the employee-size filter if one is selected.</p>}
      {externalResearch && <article className="space-y-3 rounded-xl border border-sky-400/30 bg-slate-950/70 p-4"><div><h3 className="font-semibold text-white">Research draft: {externalResearch.company_name || externalResearch.researched_name}</h3><p className="mt-1 text-sm text-slate-300">{externalResearch.business_summary || 'No summary found.'}</p></div><div><h4 className="mb-1 text-xs font-semibold uppercase text-slate-400">Services and offerings</h4><ul className="list-inside list-disc space-y-1 text-sm text-slate-300">{externalResearch.offerings.map((item) => <li key={item.id}><strong>{item.name}</strong>{item.description ? ` — ${item.description}` : ''}</li>)}</ul></div><div><h4 className="mb-1 text-xs font-semibold uppercase text-slate-400">Cited sources</h4><div className="flex flex-wrap gap-2">{externalResearch.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-sky-300 hover:underline">{source.title}<ExternalLink className="h-3 w-3" /></a>)}</div></div><button type="button" onClick={saveResearchRecord} className="min-h-10 rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950">Save to research library</button></article>}
      {(businessProfile.company_research_records || []).length > 0 && <div className="space-y-2"><h3 className="text-sm font-semibold text-white">Company research library ({businessProfile.company_research_records?.length})</h3>{businessProfile.company_research_records?.map((record) => <details key={record.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"><summary className="cursor-pointer font-medium text-white">{record.company_name} <span className="text-xs font-normal text-slate-400">· researched {new Date(record.researched_at).toLocaleDateString()}</span></summary><p className="mt-3 text-sm text-slate-300">{record.business_summary}</p><ul className="mt-2 list-inside list-disc text-xs text-slate-400">{record.offerings.map((item) => <li key={item.id}>{item.name}</li>)}</ul><div className="mt-2 flex flex-wrap gap-2">{record.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="text-xs text-sky-300 hover:underline">{source.title}</a>)}</div></details>)}</div>}
      {isDemoMode && <p className="text-xs text-slate-500">Live company search and research need a signed-in workspace with the server Gemini key configured.</p>}
    </section>

    {businessProfile.profile_approved_at && <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-white">3. Find organizations that could use your offerings</h2><p className="mt-1 text-xs text-slate-400">Search results are potential fits. Employee count is shown only when publicly supported or estimated; review the sources before approving.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row"><select aria-label="Filter potential buyers by employee count" className={fieldClass} value={buyerEmployeeBand} onChange={(e) => setBuyerEmployeeBand(e.target.value)}><option value="">Any employee count</option>{employeeBands.map((band) => <option key={band} value={band}>{band} employees</option>)}</select><button type="button" disabled={!!busy} onClick={searchProspects} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 text-sm font-semibold text-amber-200 disabled:opacity-50">{busy === 'prospects' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Find potential buyers</button></div></div>
      {matches.map((match) => { const alreadySaved = (businessProfile.approved_prospects || []).some((item) => item.company_name === match.company_name); return <article key={match.id} className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-semibold text-white">{match.company_name}</h3><p className="text-xs text-slate-400">{match.company_type} · {match.location}</p><p className="mt-1 text-xs text-slate-400">Employees: {match.employee_band || 'Unknown'}{match.employee_size_confidence === 'estimated' ? ' (estimated)' : match.employee_size_confidence === 'sourced' ? ' (source-reported)' : ''}</p><p className={`mt-1 text-xs ${match.evidence_status === 'grounded' ? 'text-emerald-300' : 'text-amber-300'}`}>{match.evidence_status === 'grounded' ? 'Source linked' : 'Candidate found; verify details before outreach'}</p></div><button type="button" disabled={alreadySaved} onClick={() => approveMatch(match)} className="rounded-lg border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-300 disabled:opacity-50">{alreadySaved ? 'Approved' : 'Approve match'}</button></div><p className="text-sm text-slate-300">{match.description}</p><p className="text-xs text-amber-200">Potential fit: {match.match_reason}</p><div className="flex flex-wrap gap-2">{match.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-sky-300 hover:underline">{source.title}<ExternalLink className="h-3 w-3" /></a>)}</div></article>; })}
      {hasSearchedBuyers && matches.length === 0 && !busy && <p className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">Google returned no candidates for this profile. Check that its services and customer types are specific, then try again without an employee-size filter.</p>}
      <div className="space-y-2"><h3 className="text-sm font-semibold text-white">Approved prospect matches ({businessProfile.approved_prospects?.length || 0})</h3>{(businessProfile.approved_prospects || []).map((match) => <article key={match.id} className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-white">{match.company_name}</p><p className="text-xs text-slate-400">{match.location} · Approved {new Date(match.approved_at || '').toLocaleDateString()}</p></div><button type="button" onClick={() => removeMatch(match.id)} className="self-start rounded-lg p-2 text-slate-400 hover:text-rose-400" title="Remove approved match"><Trash2 className="h-4 w-4" /></button></article>)}</div>
    </section>}
    {message && <p role="status" className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">{message}</p>}
  </div>;
};
