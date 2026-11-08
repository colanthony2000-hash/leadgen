import React, { useState } from 'react';
import { Award, Check, ExternalLink, Loader2, Search, Sparkles, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { BusinessProfileResearchDraft, BusinessProspectMatch, IndustryCode } from '../../types';

const emptyDraft = (profile: ReturnType<typeof useApp>['businessProfile']): BusinessProfileResearchDraft => ({
  company_name: profile.company_name, website: profile.website, country_code: profile.country_code,
  business_summary: profile.business_summary, target_regions: profile.target_regions,
  target_industries: profile.target_industries, offerings: profile.offerings,
  certifications: profile.certifications, sources: profile.profile_sources || [],
});

const fieldClass = 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none';
const industries: Array<{ id: IndustryCode; label: string }> = [
  { id: 'oil_and_gas', label: 'Oil & Gas / EPC' }, { id: 'education', label: 'Education & STEM' }, { id: 'digital_products', label: 'Digital Products' },
];

export const BusinessProfileView: React.FC = () => {
  const { businessProfile, updateBusinessProfile, isDemoMode } = useApp();
  const [website, setWebsite] = useState(businessProfile.website || '');
  const [companyName, setCompanyName] = useState(businessProfile.company_name || '');
  const [context, setContext] = useState('');
  const [draft, setDraft] = useState<BusinessProfileResearchDraft | null>(null);
  const [matches, setMatches] = useState<BusinessProspectMatch[]>([]);
  const [busy, setBusy] = useState<'research' | 'save' | 'prospects' | ''>('');
  const [message, setMessage] = useState('');

  const updateDraft = (updates: Partial<BusinessProfileResearchDraft>) => setDraft((previous) => previous ? { ...previous, ...updates } : previous);
  const runResearch = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy('research'); setMessage(''); setDraft(null); setMatches([]);
    try {
      const result = isDemoMode
        ? { ...emptyDraft(businessProfile), company_name: companyName || businessProfile.company_name, website: website || businessProfile.website, business_summary: `${businessProfile.business_summary}\n\nDemo preview: add a Gemini API key and sign in to run live web research.`, sources: [] }
        : await api.researchBusinessProfile({ website, company_name: companyName, context });
      setDraft(result); setMessage(result.sources.length ? `Draft researched with ${result.sources.length} web sources. Review every claim before approval.` : 'Draft ready. Review the details and sources before approval.');
    } catch (error: any) { setMessage(error.message || 'Company research failed.'); }
    finally { setBusy(''); }
  };

  const approveProfile = async () => {
    if (!draft) return;
    setBusy('save'); setMessage('');
    try {
      await updateBusinessProfile({
        company_name: draft.company_name, website: draft.website, country_code: draft.country_code,
        business_summary: draft.business_summary, target_regions: draft.target_regions,
        target_industries: draft.target_industries, offerings: draft.offerings,
        certifications: draft.certifications, profile_sources: draft.sources,
        profile_approved_at: new Date().toISOString(),
      });
      setDraft(null); setMessage('Profile reviewed and saved. You can now search for potential customer companies.');
    } catch (error: any) { setMessage(error.message || 'Could not save the approved profile.'); }
    finally { setBusy(''); }
  };

  const searchProspects = async () => {
    setBusy('prospects'); setMessage('');
    try {
      if (isDemoMode) throw new Error('Live prospect research is available after signing in with the Gemini key configured on the server.');
      setMatches(await api.findBusinessProspects());
    } catch (error: any) { setMessage(error.message || 'Prospect search failed.'); }
    finally { setBusy(''); }
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
      <p className="mt-2 max-w-3xl text-sm text-slate-400">Start with a website or company name. AI uses Google Search to draft your services, markets, and public details. A person reviews and approves the profile before prospect search is enabled.</p>
    </header>

    <form onSubmit={runResearch} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <h2 className="font-semibold text-white">1. Find your public company details</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs text-slate-300">Company website
          <input className={fieldClass} type="url" placeholder="https://example.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
        <label className="space-y-1.5 text-xs text-slate-300">Company name (optional if the site identifies you)
          <input className={fieldClass} placeholder="Registered or trading name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </label>
      </div>
      <label className="block space-y-1.5 text-xs text-slate-300">Anything the search should know? (optional)
        <textarea className={fieldClass} rows={2} placeholder="For example: we operate across Nigeria and provide subsea inspection services." value={context} onChange={(e) => setContext(e.target.value)} />
      </label>
      <button disabled={!!busy || (!website.trim() && !companyName.trim())} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
        {busy === 'research' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Research company details
      </button>
      {isDemoMode && <p className="text-xs text-slate-500">Demo mode can preview the review form; live Google Search needs a signed-in workspace and server Gemini key.</p>}
    </form>

    {draft && <section className="space-y-5 rounded-2xl border border-amber-500/30 bg-slate-900/60 p-5 sm:p-6">
      <div><h2 className="font-semibold text-white">2. Review and correct the profile draft</h2><p className="mt-1 text-xs text-slate-400">AI findings are suggestions. Edit anything inaccurate; only approve details you can stand behind.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs text-slate-300">Company name<input className={fieldClass} value={draft.company_name} onChange={(e) => updateDraft({ company_name: e.target.value })} /></label>
        <label className="space-y-1.5 text-xs text-slate-300">Website<input className={fieldClass} value={draft.website} onChange={(e) => updateDraft({ website: e.target.value })} /></label>
      </div>
      <label className="block space-y-1.5 text-xs text-slate-300">What the company does<textarea className={fieldClass} rows={4} value={draft.business_summary} onChange={(e) => updateDraft({ business_summary: e.target.value })} /></label>
      <div className="space-y-2"><h3 className="text-sm font-medium text-white">Services, products, and capabilities ({draft.offerings.length})</h3>
        {draft.offerings.map((offering, index) => <div key={offering.id} className="grid gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3 sm:grid-cols-[1fr_2fr_auto]">
          <input aria-label="Offering name" className={fieldClass} value={offering.name} onChange={(e) => updateDraft({ offerings: draft.offerings.map((item, i) => i === index ? { ...item, name: e.target.value } : item) })} />
          <input aria-label="Offering description" className={fieldClass} value={offering.description} onChange={(e) => updateDraft({ offerings: draft.offerings.map((item, i) => i === index ? { ...item, description: e.target.value } : item) })} />
          <button type="button" title="Remove offering" onClick={() => updateDraft({ offerings: draft.offerings.filter((_, i) => i !== index) })} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
        </div>)}
        <button type="button" onClick={() => updateDraft({ offerings: [...draft.offerings, { id: `off-manual-${Date.now()}`, offering_type: 'service', name: '', description: '', category_code: 'general', target_industry: 'digital_products' }] })} className="text-xs font-medium text-amber-300">+ Add an offering</button>
      </div>
      <div><p className="mb-2 text-xs text-slate-300">Industries and markets</p><div className="flex flex-wrap gap-2">{industries.map((industry) => <label key={industry.id} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200"><input type="checkbox" checked={draft.target_industries.includes(industry.id)} onChange={(e) => updateDraft({ target_industries: e.target.checked ? [...draft.target_industries, industry.id] : draft.target_industries.filter((item) => item !== industry.id) })} />{industry.label}</label>)}</div>
        <input className={`${fieldClass} mt-3`} placeholder="Regions served, separated by commas" value={draft.target_regions.join(', ')} onChange={(e) => updateDraft({ target_regions: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })} /></div>
      {!!draft.certifications.length && <div><h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-white"><Award className="h-4 w-4 text-amber-400" />Certifications found (verify before approval)</h3><ul className="space-y-1 text-xs text-slate-300">{draft.certifications.map((cert) => <li key={cert.id}>{cert.name} · {cert.issuer} · validity: {cert.valid_from} to {cert.valid_to}</li>)}</ul></div>}
      <div><h3 className="mb-2 text-sm font-medium text-white">Sources found</h3>{draft.sources.length ? <ul className="space-y-1.5 text-xs">{draft.sources.map((source) => <li key={source.url}><a className="inline-flex items-center gap-1 text-sky-300 hover:underline" href={source.url} target="_blank" rel="noreferrer">{source.title}<ExternalLink className="h-3 w-3" /></a></li>)}</ul> : <p className="text-xs text-slate-500">No web citations available in this preview.</p>}</div>
      <button type="button" onClick={approveProfile} disabled={!!busy || !draft.company_name.trim() || !draft.offerings.some((item) => item.name.trim())} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"><Check className="h-4 w-4" />{busy === 'save' ? 'Saving…' : 'Approve and save company profile'}</button>
    </section>}

    {businessProfile.profile_approved_at && <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-white">3. Find organizations that could use your offerings</h2><p className="mt-1 text-xs text-slate-400">Search results are potential fits. Review evidence and approve the prospects worth keeping.</p></div>
        <button type="button" disabled={!!busy} onClick={searchProspects} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 text-sm font-semibold text-amber-200 disabled:opacity-50">{busy === 'prospects' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Find potential buyers</button></div>
      {matches.map((match) => { const alreadySaved = (businessProfile.approved_prospects || []).some((item) => item.company_name === match.company_name); return <article key={match.id} className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-semibold text-white">{match.company_name}</h3><p className="text-xs text-slate-400">{match.company_type} · {match.location}</p></div><button type="button" disabled={alreadySaved} onClick={() => approveMatch(match)} className="rounded-lg border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-300 disabled:opacity-50">{alreadySaved ? 'Approved' : 'Approve match'}</button></div><p className="text-sm text-slate-300">{match.description}</p><p className="text-xs text-amber-200">Potential fit: {match.match_reason}</p><div className="flex flex-wrap gap-2">{match.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-sky-300 hover:underline">{source.title}<ExternalLink className="h-3 w-3" /></a>)}</div></article>; })}
      <div className="space-y-2"><h3 className="text-sm font-semibold text-white">Approved prospect matches ({businessProfile.approved_prospects?.length || 0})</h3>{(businessProfile.approved_prospects || []).map((match) => <article key={match.id} className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-white">{match.company_name}</p><p className="text-xs text-slate-400">{match.location} · Approved {new Date(match.approved_at || '').toLocaleDateString()}</p></div><button type="button" onClick={() => removeMatch(match.id)} className="self-start rounded-lg p-2 text-slate-400 hover:text-rose-400" title="Remove approved match"><Trash2 className="h-4 w-4" /></button></article>)}</div>
    </section>}
    {message && <p role="status" className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">{message}</p>}
  </div>;
};
