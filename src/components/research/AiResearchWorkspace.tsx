import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Coins,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Users,
  FileText,
  Search,
  CheckCircle2,
  Send,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Company, ResearchJob } from '../../types';

interface AiResearchWorkspaceProps {
  initialSubject?: {
    type: 'company' | 'contact' | 'opportunity' | 'market_topic';
    id: string;
    name: string;
  };
  onDraftOutreachFromResearch?: (companyName: string) => void;
}

export const AiResearchWorkspace: React.FC<AiResearchWorkspaceProps> = ({
  initialSubject,
  onDraftOutreachFromResearch,
}) => {
  const {
    companies,
    creditBalance,
    runResearchJob,
    addCompanyToCrm,
    activeIndustry,
    researchJobs,
    searchQuery,
  } = useApp();

  const [subjectType, setSubjectType] = useState<'company' | 'contact' | 'opportunity' | 'market_topic'>(
    initialSubject?.type || 'company'
  );
  const [customSubjectName, setCustomSubjectName] = useState<string>(
    initialSubject?.name || ''
  );

  const [researchPrompt, setResearchPrompt] = useState<string>(
    'Analyze upcoming procurement cycles, active asset turnaround schedules, key decision-makers, and compatibility with our services.'
  );

  const [selectedSources, setSelectedSources] = useState<string[]>([
    'Official Regulatory Registries (NUPRC / NCDMB)',
    'NipeX Procurement Tender Portals',
    'Verified Corporate Press & Financial Disclosures',
  ]);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runStage, setRunStage] = useState<string>('');
  const [activeJobResult, setActiveJobResult] = useState<ResearchJob | null>(null);

  const normalizedSubjectName = customSubjectName.trim().toLocaleLowerCase();
  const selectedCompany = subjectType === 'company'
    ? companies.find((company) => company.canonical_name.trim().toLocaleLowerCase() === normalizedSubjectName)
    : undefined;
  const subjectName = customSubjectName.trim();
  const sectorCompanies = companies.filter((company) => activeIndustry === 'all' || company.industry_id === activeIndustry);
  const suggestedCompanies = sectorCompanies.filter((company) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLocaleLowerCase();
    return company.canonical_name.toLocaleLowerCase().includes(query)
      || company.company_type.toLocaleLowerCase().includes(query)
      || company.location.city.toLocaleLowerCase().includes(query)
      || company.location.country.toLocaleLowerCase().includes(query);
  });
  const sectorLabel = {
    all: 'All Sectors',
    oil_and_gas: 'Oil & Gas / EPC',
    education: 'Education & STEM',
    digital_products: 'Digital Products',
  }[activeIndustry];

  const promptTemplates = [
    {
      title: 'Subsea & Turnaround Integrity',
      prompt: 'Evaluate planned asset turnaround windows, subsea pipeline inspection tenders, and key procurement gatekeepers.',
    },
    {
      title: 'Curriculum & STEM Apparatus',
      prompt: 'Analyze school/university STEM laboratory budget allocations, curriculum renewal cycles, and academic directorate decision-makers.',
    },
    {
      title: 'EPC Subcontracting & NCDMB Quotas',
      prompt: 'Identify tier-1 EPC consortium subcontracting requirements, Nigerian content thresholds, and QA/QC inspection partners.',
    },
  ];

  const handleStartResearch = async () => {
    if (!subjectName.trim()) {
      alert('Please select or specify a research subject.');
      return;
    }

    if (creditBalance < 5) {
      alert(`Insufficient credits (${creditBalance} available). Deep research requires 5 credits.`);
      return;
    }

    setIsRunning(true);
    setRunStage('Submitting research job...');

    try {
      const job = await runResearchJob(
        subjectType,
        selectedCompany?.id || `subj-${Date.now()}`,
        subjectName,
        researchPrompt,
        selectedSources,
        (_progress, status) => setRunStage(status)
      );

      setActiveJobResult(job);
    } catch (err: any) {
      alert(err.message || 'Error executing research job');
    } finally {
      setIsRunning(false);
      setRunStage('');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
          AI-Assisted Research Workspace
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Generate a preliminary analysis with AI. This prototype does not retrieve or verify live sources; confirm facts against primary sources before relying on them.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-300">
        <span className="font-semibold text-amber-300">Sector scope: {sectorLabel}</span>
        <span className="text-slate-500">·</span>
        <span>{suggestedCompanies.length} workspace suggestions. You can enter any company name.</span>
      </div>

      {/* Research Configuration Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Parameters */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-5">
          {/* Subject Type Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              1. Research Subject Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'company', label: 'Company / Operator', icon: Building2 },
                { id: 'opportunity', label: 'Tender / Project', icon: FileText },
                { id: 'market_topic', label: 'Sector Analysis', icon: Search },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSubjectType(t.id as any)}
                    className={`flex min-w-0 items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                      subjectType === t.id
                        ? 'border-amber-400 bg-amber-400/10 text-amber-300 font-semibold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              2. Target Subject
            </label>
            {subjectType === 'company' ? (
              <>
              <input
                type="text"
                list="research-company-suggestions"
                value={customSubjectName}
                onChange={(e) => setCustomSubjectName(e.target.value)}
                placeholder="Type any company or operator name..."
                aria-label="Research company or operator"
                className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
              <datalist id="research-company-suggestions">
                {suggestedCompanies.map((company) => (
                  <option key={company.id} value={company.canonical_name}>
                    {company.company_type} — {company.location.city}, {company.location.country}
                  </option>
                ))}
              </datalist>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Suggestions come from workspace records and follow the sector filter. A new name can be researched too; live source search is not connected yet.
              </p>
              </>
            ) : (
              <input
                type="text"
                placeholder="Enter project name, tender reference, or commercial topic..."
                value={customSubjectName}
                onChange={(e) => setCustomSubjectName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
            )}
          </div>

          {/* Research Prompt & Templates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                3. Research Focus & Questions
              </label>
              <span className="text-[11px] text-slate-500">Quick-load template:</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {promptTemplates.map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => setResearchPrompt(tmpl.prompt)}
                  className="text-[11px] px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                >
                  {tmpl.title}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={researchPrompt}
              onChange={(e) => setResearchPrompt(e.target.value)}
              className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50 leading-relaxed"
            />
          </div>

          {/* Requested source categories (retrieval is not implemented) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              4. Source Categories (not queried in this prototype)
            </label>
            <div className="space-y-2 text-xs text-slate-300">
              {[
                'Official Regulatory Registries (NUPRC / NCDMB / Ministry of Education)',
                'NipeX Joint Qualification System (JQS) Notices',
                'Verified Corporate Press & Financial Disclosures',
                'Accreditation & Curriculum Examination Directories',
              ].map((src, i) => (
                <label key={i} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedSources.includes(src)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSources([...selectedSources, src]);
                      } else {
                        setSelectedSources(selectedSources.filter((s) => s !== src));
                      }
                    }}
                    className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                  />
                  <span>{src}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Cost Summary & Action */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              Metered Execution Estimate
            </h3>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Operation:</span>
                <span className="font-semibold text-white">AI Deep Research Dossier</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Credit Cost:</span>
                <span className="font-mono text-amber-400 font-bold">5 Credits</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px] pt-2 border-t border-slate-900">
                <span>Current Balance:</span>
                <span className="font-mono text-white">{creditBalance} Credits</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 space-y-2">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Source retrieval is not connected. AI output is preliminary and must be verified.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Failed jobs release reserved credits. Safe retry/idempotency is not implemented yet.</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {isRunning && (
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-amber-400" />
                <span className="animate-pulse">{runStage}</span>
              </div>
            )}

            <button
              onClick={handleStartResearch}
              disabled={isRunning || creditBalance < 5}
              className="w-full py-3 px-4 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Intelligence...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Deep Research (-5 Credits)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Dossier Result View */}
      {activeJobResult?.result && (
        <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                Research Completed · {activeJobResult.subject_name}
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">
                Executive Opportunity & Procurement Dossier
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {selectedCompany && (
                <button
                  onClick={() => addCompanyToCrm(selectedCompany.id, 'qualified')}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add to CRM</span>
                </button>
              )}

              {onDraftOutreachFromResearch && (
                <button
                  onClick={() => onDraftOutreachFromResearch(activeJobResult.subject_name)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Draft Grounded Outreach</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              1. Executive Summary & Strategic Context
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              {activeJobResult.result.executive_summary}
            </p>
          </div>

          {/* Section 2: Strategic Fit */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              2. Strategic Compatibility with Jeneconk Offerings
            </h4>
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-200 leading-relaxed">
              {activeJobResult.result.strategic_fit_analysis}
            </div>
          </div>

          {/* Section 3: Key Signals & Decision Makers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Procurement & Operational Signals (source retrieval unavailable)
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {activeJobResult.result.procurement_signals.length === 0 && (
                  <li className="text-slate-500">No source-verified signals. Source retrieval is not connected.</li>
                )}
                {activeJobResult.result.procurement_signals.map((sig, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">✓</span>
                    <span>{sig}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Suggested Roles to Investigate
              </h4>
              <div className="space-y-2">
                {activeJobResult.result.key_decision_makers.map((dm, i) => (
                  <div key={i} className="text-xs">
                    <div className="font-semibold text-white">{dm.name}</div>
                    <div className="text-[11px] text-amber-400 font-medium">{dm.title}</div>
                    <div className="text-[11px] text-slate-400">{dm.relevance}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Source-backed facts (empty until source retrieval exists) */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Source-Verified Facts
            </h4>
            <div className="space-y-2">
              {activeJobResult.result.known_facts.length === 0 && (
                <p className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
                  None. This prototype has not retrieved source documents for this analysis.
                </p>
              )}
              {activeJobResult.result.known_facts.map((fact, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <p className="text-slate-200 font-medium">{fact.claim}</p>
                    <span className="text-[11px] text-slate-400">
                      Source: {fact.source_name} ({fact.confidence.toUpperCase()})
                    </span>
                  </div>
                  <a
                    href={fact.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 hover:underline text-[11px] flex items-center gap-1 shrink-0"
                  >
                    View Source <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Anti-Hallucination Critical Unknowns */}
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
            <h4 className="text-xs font-semibold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Critical Unknowns & Required Verification
            </h4>
            <p className="text-xs text-rose-200">
              AI output is not source-verified. Confirm operational facts against primary sources before relying on them:
            </p>
            <ul className="space-y-1 text-xs text-rose-100 list-disc list-inside">
              {activeJobResult.result.critical_unknowns.map((unk, i) => (
                <li key={i}>{unk}</li>
              ))}
            </ul>
          </div>

          {/* Section 6: Recommended Strategic Angle */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
            <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
              Recommended Commercial Angle
            </h4>
            <p className="text-xs text-amber-100 leading-relaxed">
              {activeJobResult.result.recommended_outreach_angle}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
