import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  History,
  Sparkles,
  Building2,
  Calendar,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Download
} from 'lucide-react';
import { ResearchJob } from '../../types';
import { uniqueResearchLines, uniqueResearchText } from '../../utils/researchDisplay';

export const ResearchHistory: React.FC = () => {
  const { researchJobs } = useApp();
  const [selectedJob, setSelectedJob] = useState<ResearchJob | null>(researchJobs[0] || null);

  const handleExportJson = (job: ResearchJob) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(job, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `jeneconk-bii-research-${job.subject_name.toLowerCase().replace(/\s+/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <History className="w-6 h-6 text-amber-400" />
            AI Research Dossier Archives
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical audit repository of all evidence-grounded research investigations, prompt versions, and credit expenditures.
          </p>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          {researchJobs.length} completed dossiers
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Job List */}
        <div className="space-y-3">
          {researchJobs.map((job) => {
            const isSelected = selectedJob?.id === job.id;
            return (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-slate-900 shadow-md'
                    : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="font-semibold text-amber-400 uppercase text-[10px]">
                    {job.subject_type.replace('_', ' ')}
                  </span>
                  <span className="font-mono text-slate-500">
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white truncate">
                  {job.subject_name}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                  {job.result?.executive_summary && uniqueResearchLines(job.result.executive_summary)}
                </p>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Cost: {job.credit_cost} credits</span>
                  <span className="text-emerald-400 font-medium">Completed</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 2 Cols: Selected Job View */}
        <div className="lg:col-span-2">
          {selectedJob?.result ? (
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-6">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase">
                    Job ID: {selectedJob.id} · Executed {new Date(selectedJob.created_at).toLocaleString()}
                  </span>
                  <h2 className="text-lg font-bold text-white mt-1">
                    {selectedJob.subject_name}
                  </h2>
                </div>

                <button
                  onClick={() => handleExportJson(selectedJob)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Executive Summary
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  {uniqueResearchLines(selectedJob.result.executive_summary)}
                </p>
              </div>

              {selectedJob.subject_type === 'market_topic' && (
                <section className="space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Potential Organizations to Contact</h4>
                    <p className="mt-1 text-[11px] text-slate-500">Prospecting leads, not confirmed buyers. Check each source and qualify current need before outreach.</p>
                  </div>
                  {(selectedJob.result.potential_leads || []).length === 0 ? (
                    <p className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">No source-backed organization was verified in this search.</p>
                  ) : (selectedJob.result.potential_leads || []).map((lead, index) => (
                    <article key={`${lead.organization_name}-${index}`} className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-white">{lead.organization_name}</strong>
                        <span className="text-[10px] text-amber-300">{lead.signal_type === 'active_request' ? 'Active public request' : lead.signal_type === 'past_engagement' ? 'Past training / digital activity' : 'Potential fit to qualify'}</span>
                      </div>
                      <p className="text-slate-300">{lead.evidence_claim}</p>
                      <p className="text-slate-400">Fit: {lead.fit_reason} · Role to identify: {lead.contact_role_to_verify}</p>
                      <p className="text-slate-400">First step: {lead.recommended_first_step}</p>
                      <a href={lead.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-amber-400 hover:underline">
                        {lead.source_name}{lead.evidence_date ? ` · ${lead.evidence_date}` : ''}<ExternalLink className="h-3 w-3" />
                      </a>
                    </article>
                  ))}
                </section>
              )}

              {/* Strategic Fit */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Strategic Fit & Compatibility
                </h4>
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-200 leading-relaxed">
                  {selectedJob.result.strategic_fit_analysis}
                </div>
              </div>

              {/* Signals & Decision-Makers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h5 className="font-semibold text-slate-300">Procurement Signals</h5>
                  <ul className="space-y-1 text-slate-400">
                    {uniqueResearchText(selectedJob.result.procurement_signals).map((sig, i) => (
                      <li key={i}>• {sig}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h5 className="font-semibold text-slate-300">Decision-Makers</h5>
                  <div className="space-y-1.5">
                    {selectedJob.result.key_decision_makers.map((dm, i) => (
                      <div key={i} className="text-slate-400">
                        <strong className="text-white">{dm.name}</strong> — {dm.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Critical Unknowns */}
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-xs">
                <h5 className="font-semibold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Critical Unknowns & Data Limitations
                </h5>
                <ul className="space-y-1 text-rose-100 list-disc list-inside">
                  {selectedJob.result.critical_unknowns.map((unk, i) => (
                    <li key={i}>{unk}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/30 text-xs text-slate-400">
              Select a research job from the list to inspect its full findings and evidence audit trail.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
