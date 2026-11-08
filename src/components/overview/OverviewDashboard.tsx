import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  Sparkles,
  TrendingUp,
  FileText,
  Coins,
  ArrowRight,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Target
} from 'lucide-react';
import { NavItemKey } from '../layout/AppSidebar';
import { uniqueResearchLines } from '../../utils/researchDisplay';

interface OverviewDashboardProps {
  onNavigate: (view: NavItemKey) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigate }) => {
  const {
    activeTenant,
    activeIndustry,
    searchQuery,
    companies,
    crmLeads,
    procurementNotices,
    researchJobs,
    tasks,
    creditBalance,
    activities,
    setSelectedCompanyForDetail,
    toggleTaskStatus,
  } = useApp();

  const query = searchQuery.trim().toLocaleLowerCase();
  const sectorCompanies = companies.filter((company) => {
    if (activeIndustry !== 'all' && company.industry_id !== activeIndustry) return false;
    if (!query) return true;
    return [company.canonical_name, company.company_type, company.description, company.location.city, company.location.country]
      .some((value) => value.toLocaleLowerCase().includes(query));
  });
  const sectorCompanyIds = new Set(sectorCompanies.map((company) => company.id));
  const sectorLeads = activeIndustry === 'all'
    ? crmLeads
    : crmLeads.filter((lead) => sectorCompanyIds.has(lead.company_id));
  const sectorLeadIds = new Set(sectorLeads.map((lead) => lead.id));
  const sectorTasks = activeIndustry === 'all'
    ? tasks
    : tasks.filter((task) => sectorLeadIds.has(task.lead_id));
  const sectorResearchJobs = activeIndustry === 'all'
    ? researchJobs
    : researchJobs.filter((job) => sectorCompanyIds.has(job.subject_id));
  const sectorSavedCompanies = sectorCompanies.filter((company) => company.is_saved);
  const highFitCompanies = sectorCompanies.filter((company) => company.fit_score >= 90);
  const openTenders = procurementNotices.filter((notice) => {
    if (notice.status !== 'open' || (activeIndustry !== 'all' && notice.industry_id !== activeIndustry)) return false;
    if (!query) return true;
    return [notice.title, notice.buyer_name, notice.notice_reference, notice.scope_summary]
      .some((value) => value.toLocaleLowerCase().includes(query));
  });
  const recentResearch = sectorResearchJobs.slice(0, 3);
  const pendingTasks = sectorTasks.filter((task) => task.status === 'pending');
  const sectorLabel = {
    all: 'All Sectors',
    oil_and_gas: 'Oil & Gas / EPC',
    education: 'Education & STEM',
    digital_products: 'Digital Products',
  }[activeIndustry];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Context */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-5 sm:p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <a
                href="https://www.jeneconk.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-amber-500/30 hover:border-amber-400 transition-colors group"
                title="Visit Jeneconk Official Portal (www.jeneconk.com)"
              >
                <img
                  src="/assets/aistudio/logo_bf2c43a3.png"
                  alt="Jeneconk Official Logo"
                  className="w-5 h-5 rounded-full object-contain"
                />
                <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 font-mono">
                  www.jeneconk.com
                </span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-300" />
              </a>

              <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span className="truncate max-w-[180px] sm:max-w-none">Workspace: {activeTenant.name}</span>
                <span className="text-slate-600 hidden sm:inline">·</span>
                <span className="text-slate-400 hidden sm:inline">Tenant Isolation Active</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Industrial Opportunity & Intelligence Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Monitoring workspace intelligence for {sectorLabel.toLowerCase()}, including companies, verified decision-makers, and tender notices.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={() => onNavigate('research')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Run Deep AI Research</span>
            </button>
            <button
              onClick={() => onNavigate('companies')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Discover Companies</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Discovered Companies */}
        <div
          onClick={() => onNavigate('companies')}
          className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Monitored Companies</span>
            <Building2 className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {sectorCompanies.length}
            </span>
            <span className="text-xs text-emerald-400 font-medium">
              +{sectorSavedCompanies.length} in Workspace
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span>{highFitCompanies.length} rated High Fit (&gt;90%)</span>
          </div>
        </div>

        {/* Card 2: CRM Pipeline Value */}
        <div
          onClick={() => onNavigate('pipeline')}
          className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Pipeline Opportunities</span>
            <TrendingUp className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {sectorLeads.length}
            </span>
            <span className="text-xs text-amber-300 font-medium">
              $3.8M Est. Value
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Across 5 active sales stages
          </div>
        </div>

        {/* Card 3: Active Procurement Signals */}
        <div
          onClick={() => onNavigate('tenders')}
          className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Open Tenders & RFPs</span>
            <FileText className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {openTenders.length}
            </span>
            <span className="text-xs text-amber-400 font-medium">NipeX & Portals</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Next deadline in 12 days
          </div>
        </div>

        {/* Card 4: Available Usage Credits */}
        <div
          onClick={() => onNavigate('credits')}
          className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Usage Credits</span>
            <Coins className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {creditBalance}
            </span>
            <span className="text-xs text-slate-400">/ 1,000 monthly</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Immutable transaction ledger
          </div>
        </div>
      </div>

      {/* Main Grid: High-Fit Company Spotlight & Urgent Tenders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: High-Fit Companies */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-semibold text-white">
                High-Fit Target Organizations (Scored vs. Your Profile)
              </h2>
            </div>
            <button
              onClick={() => onNavigate('companies')}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
            >
              View all ({companies.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {highFitCompanies.slice(0, 3).map((comp) => (
              <div
                key={comp.id}
                onClick={() => setSelectedCompanyForDetail(comp)}
                className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900/90 hover:border-slate-700 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-amber-400/90 uppercase tracking-wider text-[10px]">
                        {comp.industry_id.replace('_', ' ')}
                      </span>
                      <span>·</span>
                      <span>{comp.company_type}</span>
                      <span>·</span>
                      <span>{comp.location.city}, {comp.location.country}</span>
                    </div>

                    <h3 className="text-base font-semibold text-white hover:text-amber-300 transition-colors">
                      {comp.canonical_name}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 max-w-xl">
                      {comp.description}
                    </p>
                  </div>

                  {/* Fit Score Badge */}
                  <div className="flex flex-col items-end shrink-0">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <span className="text-sm font-bold font-mono tabular-nums">
                        {comp.fit_score}%
                      </span>
                      <span className="text-[10px] uppercase font-semibold">Fit</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">
                      {comp.primary_contacts_count} contacts · {comp.evidence_items.length} verified facts
                    </span>
                  </div>
                </div>

                {/* Offerings match tags */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 text-[11px]">Matched Capabilities:</span>
                  {comp.matched_offerings.map((off, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] text-slate-300 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50"
                    >
                      {off}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Urgent Tenders & Action Items */}
        <div className="space-y-6">
          {/* Urgent Tenders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Active Tenders
              </h2>
              <button
                onClick={() => onNavigate('tenders')}
                className="text-xs text-slate-400 hover:text-white"
              >
                View all
              </button>
            </div>

            <div className="space-y-2.5">
              {openTenders.slice(0, 2).map((notice) => (
                <div
                  key={notice.id}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-amber-400">{notice.notice_reference}</span>
                    <span className="text-rose-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Closes Nov 28
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-200 line-clamp-2">
                    {notice.title}
                  </h4>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Buyer: {notice.buyer_name}</span>
                    <span className="text-emerald-400 font-mono">
                      ${(notice.estimated_budget_usd! / 1000000).toFixed(1)}M USD
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Tasks & Activities */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Tasks Due
              </h2>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs text-slate-400 hover:text-white"
              >
                View all
              </button>
            </div>

            <div className="space-y-2">
              {sectorTasks.slice(0, 4).map((task) => {
                const isCompleted = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border transition-all flex items-start gap-3 ${
                      isCompleted
                        ? 'border-emerald-500/20 bg-emerald-500/5 opacity-75'
                        : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/70'
                    }`}
                  >
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
                      className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isCompleted
                          ? 'border-emerald-400 bg-emerald-500/20'
                          : 'border-slate-600 hover:border-emerald-400'
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p
                        className={`text-xs font-medium truncate transition-all ${
                          isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>{task.company_name}</span>
                        <span>·</span>
                        <span className={isCompleted ? 'text-emerald-400 font-mono' : 'text-amber-400 font-mono'}>
                          {isCompleted ? 'Completed' : 'Pending action'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent AI Research Dossiers */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Latest Google Search Grounded Research
            </h3>
            <p className="text-xs text-slate-400">
              Each research run extracts traceable facts, flags unknowns, and analyzes procurement fit against your business profile.
            </p>
          </div>
          <button
            onClick={() => onNavigate('research_history')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium self-start sm:self-auto"
          >
            Full Dossier History →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentResearch.map((job) => (
            <div
              key={job.id}
              onClick={() => onNavigate('research_history')}
              className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-amber-500/30 hover:bg-slate-950 transition-all cursor-pointer group space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">
                  {job.subject_name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(job.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2">
                {job.result?.executive_summary && uniqueResearchLines(job.result.executive_summary)}
              </p>

              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                <span>{job.result?.known_facts.length} source-backed claims</span>
                <span className="text-amber-400 font-medium">
                  {job.result?.critical_unknowns.length} unknowns flagged
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
