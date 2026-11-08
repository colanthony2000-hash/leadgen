import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Kanban,
  Plus,
  ArrowRight,
  ArrowLeft,
  Building2,
  Clock,
  DollarSign,
  Send,
  MoreVertical,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { CrmLead, PipelineStage } from '../../types';

interface CrmPipelineViewProps {
  onDraftOutreachForLead: (lead: CrmLead) => void;
  onOpenCompany: (companyId: string) => void;
}

export const CrmPipelineView: React.FC<CrmPipelineViewProps> = ({
  onDraftOutreachForLead,
  onOpenCompany,
}) => {
  const { crmLeads, updateLeadStage, companies } = useApp();
  const [selectedLeadForQuickView, setSelectedLeadForQuickView] = useState<CrmLead | null>(null);
  const [activeMobileStage, setActiveMobileStage] = useState<PipelineStage>('discovered');

  const stages: Array<{ id: PipelineStage; label: string; color: string }> = [
    { id: 'discovered', label: 'Discovered', color: 'border-slate-700 bg-slate-900/60' },
    { id: 'qualified', label: 'Qualified', color: 'border-blue-500/40 bg-blue-500/5' },
    { id: 'contacted', label: 'Contacted', color: 'border-amber-500/40 bg-amber-500/5' },
    { id: 'opportunity', label: 'Proposal', color: 'border-purple-500/40 bg-purple-500/5' },
    { id: 'won', label: 'Closed / Won', color: 'border-emerald-500/40 bg-emerald-500/5' },
  ];

  const stageOrder: PipelineStage[] = ['discovered', 'qualified', 'contacted', 'opportunity', 'won'];

  const getLeadsByStage = (stage: PipelineStage) =>
    crmLeads.filter((l) => l.stage === stage);

  const moveStage = (leadId: string, currentStage: PipelineStage, direction: 'forward' | 'backward') => {
    const currentIndex = stageOrder.indexOf(currentStage);
    const newIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < stageOrder.length) {
      updateLeadStage(leadId, stageOrder[newIndex]);
    }
  };

  const totalPipelineValue = crmLeads.reduce(
    (sum, lead) => sum + (lead.estimated_deal_value_usd || 0),
    0
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Kanban className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            CRM Pipeline & Account Qualification
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage prospects through evidence-backed qualification, task execution, and approved outreach touchpoints.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            Total Pipeline:{' '}
            <strong className="text-amber-400 font-bold tabular-nums">
              ${(totalPipelineValue / 1000000).toFixed(2)}M USD
            </strong>
          </div>
        </div>
      </div>

      {/* Mobile Stage Selector Tabs (Phone Screens) */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800">
        {stages.map((st) => {
          const count = getLeadsByStage(st.id).length;
          const isActive = activeMobileStage === st.id;
          return (
            <button
              key={st.id}
              onClick={() => setActiveMobileStage(st.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{st.label}</span>
              <span className={`text-[10px] font-mono px-1 rounded ${isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kanban Board Columns: Horizontal Scroll with Snap on Tablet/Desktop, Filtered on Mobile or Swipeable */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {stages.map((st, idx) => {
          const leadsInStage = getLeadsByStage(st.id);
          const stageValue = leadsInStage.reduce(
            (sum, l) => sum + (l.estimated_deal_value_usd || 0),
            0
          );

          return (
            <div
              key={st.id}
              className={`flex-col rounded-2xl border border-slate-800 bg-slate-950/60 p-3 min-w-[240px] space-y-3 ${
                activeMobileStage === st.id ? 'flex' : 'hidden md:flex'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 px-1">
                <div>
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                    {st.label}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ${(stageValue / 1000).toFixed(0)}k USD
                  </span>
                </div>

                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-bold">
                  {leadsInStage.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {leadsInStage.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all space-y-3 shadow-sm"
                  >
                    {/* Top Row: Company Name & Fit Score */}
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => onOpenCompany(lead.company_id)}
                        className="text-xs font-semibold text-white hover:text-amber-300 text-left line-clamp-1"
                      >
                        {lead.company_name}
                      </button>

                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                        {lead.fit_score}%
                      </span>
                    </div>

                    {/* Contact Info */}
                    {lead.contact_name && (
                      <div className="text-[11px] text-slate-400 space-y-0.5">
                        <span className="text-slate-200 block truncate font-medium">
                          {lead.contact_name}
                        </span>
                        <span className="text-slate-400 block truncate text-[10px]">
                          {lead.contact_title}
                        </span>
                      </div>
                    )}

                    {/* Opportunity Info */}
                    {lead.opportunity_title && (
                      <div className="text-[10px] text-amber-400/90 font-mono line-clamp-1">
                        🎯 {lead.opportunity_title}
                      </div>
                    )}

                    {/* Next Action Due */}
                    {lead.next_action_due && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{lead.next_action_description}</span>
                      </div>
                    )}

                    {/* Action Toolbar */}
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/80">
                      {/* Backward Button */}
                      <button
                        onClick={() => moveStage(lead.id, lead.stage, 'backward')}
                        disabled={idx === 0}
                        title="Move to previous stage"
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>

                      {/* Outreach Trigger */}
                      <button
                        onClick={() => onDraftOutreachForLead(lead)}
                        className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 font-medium px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20"
                      >
                        <Send className="w-2.5 h-2.5" />
                        <span>Outreach</span>
                      </button>

                      {/* Forward Button */}
                      <button
                        onClick={() => moveStage(lead.id, lead.stage, 'forward')}
                        disabled={idx === stages.length - 1}
                        title="Advance to next stage"
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
