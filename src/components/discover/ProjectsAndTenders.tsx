import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Layers,
  FileText,
  Clock,
  ExternalLink,
  Building2,
  MapPin,
  Calendar,
  AlertCircle,
  PlusCircle,
  Sparkles,
  Search,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { Project, ProcurementNotice } from '../../types';

interface ProjectsAndTendersProps {
  initialTab?: 'tenders' | 'projects';
  onOpenResearchForSubject: (type: 'opportunity' | 'company', id: string, name: string) => void;
  onOpenCompany: (companyId: string) => void;
}

export const ProjectsAndTenders: React.FC<ProjectsAndTendersProps> = ({
  initialTab = 'tenders',
  onOpenResearchForSubject,
  onOpenCompany,
}) => {
  const { projects, procurementNotices, activeIndustry, searchQuery, addCompanyToCrm, setIsIntakeModalOpen } = useApp();
  const [activeTab, setActiveTab] = useState<'tenders' | 'projects'>(initialTab);
  const [filterText, setFilterText] = useState('');
  const queries = [filterText, searchQuery].map((query) => query.trim().toLocaleLowerCase()).filter(Boolean);

  const filteredProjects = projects.filter((p) => {
    if (activeIndustry !== 'all' && p.industry_id !== activeIndustry) return false;
    const searchable = [p.canonical_title, p.description, p.location].map((value) => value.toLocaleLowerCase());
    return queries.every((query) => searchable.some((value) => value.includes(query)));
  });

  const filteredTenders = procurementNotices.filter((n) => {
    if (activeIndustry !== 'all' && n.industry_id !== activeIndustry) return false;
    const searchable = [n.title, n.buyer_name, n.notice_reference, n.scope_summary].map((value) => value.toLocaleLowerCase());
    return queries.every((query) => searchable.some((value) => value.includes(query)));
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            {activeTab === 'tenders' ? (
              <FileText className="w-6 h-6 text-amber-400" />
            ) : (
              <Layers className="w-6 h-6 text-amber-400" />
            )}
            Projects, Tenders & Opportunity Signals
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official procurement notices from NipeX, government tender boards, and validated capital project pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsIntakeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-lg text-xs font-semibold transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Ingest Official Tender</span>
          </button>

          {/* Sub-Tabs Selector */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab('tenders')}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'tenders'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Procurement Tenders ({filteredTenders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'projects'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Capital Projects ({filteredProjects.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter by keyword, reference code, or buyer..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      {/* Content: TENDERS */}
      {activeTab === 'tenders' && (
        <div className="space-y-4">
          {filteredTenders.map((notice) => (
            <div
              key={notice.id}
              className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono text-amber-400 font-bold">
                      {notice.notice_reference}
                    </span>
                    <span>·</span>
                    <span className="text-slate-300 font-medium">{notice.source_portal}</span>
                    <span>·</span>
                    <span className="text-slate-400">{notice.procurement_category}</span>
                  </div>

                  <h3 className="text-base font-semibold text-white">
                    {notice.title}
                  </h3>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="px-3 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Deadline: {notice.deadline_at.split('T')[0]}</span>
                  </div>

                  {notice.estimated_budget_usd && (
                    <div className="px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                      ${(notice.estimated_budget_usd / 1000000).toFixed(2)}M USD
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <p>
                  <strong className="text-slate-400 font-normal">Scope:</strong> {notice.scope_summary}
                </p>
                <p>
                  <strong className="text-slate-400 font-normal">Eligibility:</strong> {notice.eligibility_summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <span>Buyer:</span>
                  <button
                    onClick={() => onOpenCompany(notice.buyer_company_id)}
                    className="text-white hover:text-amber-300 font-medium underline flex items-center gap-1"
                  >
                    <Building2 className="w-3 h-3 text-slate-400" />
                    {notice.buyer_name}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={notice.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <button
                    onClick={() =>
                      onOpenResearchForSubject('opportunity', notice.id, `${notice.notice_reference} (${notice.buyer_name})`)
                    }
                    className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Analyze Opportunity</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-amber-400 uppercase text-[10px]">
                      {project.industry_id.replace('_', ' ')}
                    </span>
                    <span>·</span>
                    <span className="text-slate-300 font-medium">{project.project_type}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {project.location}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white">
                    {project.canonical_title}
                  </h3>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs capitalize">
                    {project.status.replace('_', ' ')}
                  </span>

                  {project.estimated_value_usd && (
                    <div className="px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                      ${(project.estimated_value_usd / 1000000000).toFixed(2)}B USD
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {project.description}
              </p>

              {/* Linked Organizations */}
              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 text-xs flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Operator:</span>
                  <button
                    onClick={() => onOpenCompany(project.operator_company.id)}
                    className="text-amber-300 font-medium hover:underline"
                  >
                    {project.operator_company.name}
                  </button>
                </div>

                {project.linked_companies.map((lc) => (
                  <div key={lc.id} className="flex items-center gap-1.5">
                    <span className="text-slate-500 capitalize">{lc.relationship_type.replace('_', ' ')}:</span>
                    <button
                      onClick={() => onOpenCompany(lc.id)}
                      className="text-slate-300 font-medium hover:underline"
                    >
                      {lc.name}
                    </button>
                  </div>
                ))}

                <div className="ml-auto text-[11px] text-slate-500">
                  Target Completion: <span className="font-mono text-slate-400">{project.expected_completion_at}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
