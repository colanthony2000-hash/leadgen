import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Building2,
  ExternalLink,
  MapPin,
  Users,
  ShieldCheck,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  PlusCircle,
  FileText,
  Mail,
  Phone,
  Layers,
  Clock,
  AlertTriangle,
  Send,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { Company, Contact, PipelineStage } from '../../types';

interface CompanyDetailDrawerProps {
  company: Company | null;
  onClose: () => void;
  onOpenResearch: (company: Company) => void;
  onDraftOutreach: (contact: Contact) => void;
}

export const CompanyDetailDrawer: React.FC<CompanyDetailDrawerProps> = ({
  company,
  onClose,
  onOpenResearch,
  onDraftOutreach,
}) => {
  const {
    saveCompany,
    unsaveCompany,
    addCompanyToCrm,
    contacts,
    projects,
    procurementNotices,
    researchJobs,
    activities,
    logActivity,
    crmLeads,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'fit' | 'contacts' | 'projects' | 'research' | 'activity' | 'sources'
  >('overview');

  const [newNoteText, setNewNoteText] = useState('');

  if (!company) return null;

  const isSaved = company.is_saved;
  const companyContacts = contacts.filter((c) => c.company_id === company.id);
  const companyProjects = projects.filter(
    (p) => p.operator_company.id === company.id || p.linked_companies.some((lc) => lc.id === company.id)
  );
  const companyTenders = procurementNotices.filter((n) => n.buyer_company_id === company.id);
  const companyResearch = researchJobs.find((j) => j.subject_id === company.id && j.status === 'completed');
  const lead = crmLeads.find((l) => l.company_id === company.id);
  const companyActivities = activities.filter((a) => lead && a.lead_id === lead.id);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !lead) return;
    logActivity(lead.id, 'research_note', 'Internal Intelligence Note', newNoteText.trim());
    setNewNoteText('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/60 shrink-0 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-amber-400 uppercase tracking-wider text-[10px]">
                  {company.industry_id.replace('_', ' ')}
                </span>
                <span>·</span>
                <span>{company.company_type}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  {company.location.city}, {company.location.country}
                </span>
              </div>

              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                {company.canonical_name}
                <a
                  href={`https://${company.website_domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => (isSaved ? unsaveCompany(company.id) : saveCompany(company.id))}
                className={`p-2 rounded-lg border transition-colors ${
                  isSaved
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
                title={isSaved ? 'Saved in Workspace' : 'Save to Workspace'}
              >
                {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Bar & Quick Score */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                <span className="text-base font-bold font-mono tabular-nums">
                  {company.fit_score}%
                </span>
                <span className="text-[10px] font-semibold uppercase">ICP Fit</span>
              </div>
              <span className="text-xs text-slate-400">
                {company.employee_band} employees · {company.annual_revenue_band || 'Privately Held'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenResearch(company)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Deep Research</span>
              </button>

              <button
                onClick={() => addCompanyToCrm(company.id, 'discovered')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>{company.tenant_crm_status ? `CRM: ${company.tenant_crm_status.toUpperCase()}` : 'Add to Pipeline'}</span>
              </button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-1 border-b border-slate-800 -mb-6 overflow-x-auto pt-2">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'fit', label: 'Offer Fit & Gaps' },
              { id: 'contacts', label: `Contacts (${companyContacts.length})` },
              { id: 'projects', label: `Projects (${companyProjects.length + companyTenders.length})` },
              { id: 'research', label: 'AI Dossier' },
              { id: 'activity', label: 'Activity & Notes' },
              { id: 'sources', label: `Sources (${company.evidence_items.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-400 text-amber-300 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Company Summary
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {company.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Primary Headquarters</span>
                  <span className="text-slate-200 font-medium">{company.location.address_text || `${company.location.city}, ${company.location.country}`}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Organization Type</span>
                  <span className="text-slate-200 font-medium">{company.company_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Workforce Band</span>
                  <span className="text-slate-200 font-medium font-mono">{company.employee_band} personnel</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Data Provenance</span>
                  <span className="text-amber-400 font-medium font-mono text-[10px]">{company.source_licence}</span>
                </div>
              </div>

              {/* Verified Evidence Claims */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Key Verified Evidence Claims
                </h4>
                <div className="space-y-2">
                  {company.evidence_items.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-900/30 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-amber-400 font-medium uppercase text-[10px]">
                          {ev.claim_type.replace('_', ' ')}
                        </span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          Verified {new Date(ev.retrieved_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200">{ev.claim_text}</p>
                      <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
                        <span>Source: {ev.source_name}</span>
                        <a
                          href={ev.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-400 hover:underline flex items-center gap-1"
                        >
                          Verify Link <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OFFER FIT & GAP ANALYSIS */}
          {activeTab === 'fit' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Algorithmic Score Breakdown
                </h4>
                <p className="text-xs text-slate-300">
                  {company.fit_breakdown.rationale}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Service Compatibility</span>
                    <span className="text-white font-bold font-mono">{company.fit_breakdown.service_compatibility} / 25 pts</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Project Relevance</span>
                    <span className="text-white font-bold font-mono">{company.fit_breakdown.project_relevance} / 25 pts</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Procurement Timing</span>
                    <span className="text-white font-bold font-mono">{company.fit_breakdown.procurement_timing} / 15 pts</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Geographic Suitability</span>
                    <span className="text-white font-bold font-mono">{company.fit_breakdown.geographic_suitability} / 10 pts</span>
                  </div>
                </div>
              </div>

              {/* Matched Capabilities */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Direct Capability Matches
                </h4>
                <div className="space-y-2">
                  {company.matched_offerings.map((match, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-300"
                    >
                      ✓ <strong>{match}</strong> aligns directly with active procurement notices and verified maintenance requirements.
                    </div>
                  ))}
                </div>
              </div>

              {/* Gap Analysis */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Identified Gaps & Operational Prerequisites
                </h4>
                {company.gap_analysis.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No blocking compliance gaps identified for this prospect.</p>
                ) : (
                  <div className="space-y-2">
                    {company.gap_analysis.map((gap, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-amber-200"
                      >
                        ⚠ {gap}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Verified Decision-Makers ({companyContacts.length})
                </h4>
              </div>

              <div className="space-y-3">
                {companyContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h5 className="text-sm font-semibold text-white">
                          {contact.full_name}
                        </h5>
                        <p className="text-xs text-amber-400/90 font-medium">
                          {contact.job_title}
                        </p>
                        <span className="text-[11px] text-slate-400">
                          {contact.department} · {contact.seniority}
                        </span>
                      </div>

                      <button
                        onClick={() => onDraftOutreach(contact)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>Draft Outreach</span>
                      </button>
                    </div>

                    {/* Channels */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-xs">
                      {contact.channels.map((chan) => (
                        <div
                          key={chan.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-slate-300"
                        >
                          {chan.channel_type === 'work_email' && <Mail className="w-3 h-3 text-slate-400" />}
                          {chan.channel_type === 'work_phone' && <Phone className="w-3 h-3 text-slate-400" />}
                          <span>{chan.value}</span>
                          <span className="text-emerald-400 text-[9px] uppercase font-sans">
                            ✓ {chan.verification_status}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="text-[10px] text-slate-500">
                      Permitted Use: Direct B2B Outreach under verified legitimate commercial interest (NDPA 2023 compliant).
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PROJECTS & SIGNALS */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              {/* Projects */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Associated Capital Projects
                </h4>
                {companyProjects.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No linked mega-projects recorded.</p>
                ) : (
                  companyProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">{proj.canonical_title}</span>
                        <span className="text-emerald-400 font-mono">
                          ${(proj.estimated_value_usd! / 1000000000).toFixed(1)}B USD
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{proj.description}</p>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                        <span>Status: {proj.status.replace('_', ' ')}</span>
                        <span>Target: {proj.expected_completion_at}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Tenders */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Active Procurement Tenders
                </h4>
                {companyTenders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No open tenders currently registered for this buyer.</p>
                ) : (
                  companyTenders.map((notice) => (
                    <div
                      key={notice.id}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-amber-400">{notice.notice_reference}</span>
                        <span className="text-rose-400 flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="w-3 h-3" />
                          Closes {notice.deadline_at.split('T')[0]}
                        </span>
                      </div>
                      <h5 className="text-xs font-semibold text-slate-200">{notice.title}</h5>
                      <p className="text-xs text-slate-400">{notice.scope_summary}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: AI DOSSIER */}
          {activeTab === 'research' && (
            <div className="space-y-4">
              {companyResearch?.result ? (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
                    <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                      Executive Summary
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {companyResearch.result.executive_summary}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Procurement Signals
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {companyResearch.result.procurement_signals.map((sig, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-400">·</span>
                          <span>{sig}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Anti-Hallucination Critical Unknowns */}
                  <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2">
                    <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Critical Unknowns & Data Limitations
                    </span>
                    <ul className="space-y-1 text-xs text-rose-200">
                      {companyResearch.result.critical_unknowns.map((unk, i) => (
                        <li key={i}>• {unk}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
                    <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                      Recommended Strategic Outreach Angle
                    </span>
                    <p className="text-xs text-amber-200">
                      {companyResearch.result.recommended_outreach_angle}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/30 space-y-3">
                  <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
                  <h4 className="text-sm font-semibold text-white">No deep research dossier generated yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Generate an asynchronous evidence-backed research report covering procurement signals and key decision-makers.
                  </p>
                  <button
                    onClick={() => onOpenResearch(company)}
                    className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg"
                  >
                    Run Deep Research (5 credits)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: ACTIVITY & NOTES */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              {lead ? (
                <>
                  {/* Note Creator Form */}
                  <form onSubmit={handleAddNote} className="space-y-3 p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                    <h5 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                      Add Workspace CRM Note
                    </h5>
                    <textarea
                      rows={3}
                      placeholder="Record phone call discussion, procurement lead, or private intelligence note..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!newNoteText.trim()}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        Save Note
                      </button>
                    </div>
                  </form>

                  {/* Activity Timeline */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Activity Timeline
                    </h5>
                    {companyActivities.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No logged activities for this lead yet.</p>
                    ) : (
                      companyActivities.map((act) => (
                        <div
                          key={act.id}
                          className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/30 space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-200">{act.subject}</span>
                            <span className="text-slate-500 font-mono text-[10px]">
                              {new Date(act.occurred_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{act.body}</p>
                          <div className="text-[10px] text-slate-500 pt-1">
                            Logged by {act.created_by_user_name}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center border border-slate-800 rounded-xl bg-slate-900/30">
                  <p className="text-xs text-slate-400 mb-3">
                    Save this company to your CRM Sales Pipeline to log activities, schedule follow-up tasks, and track deals.
                  </p>
                  <button
                    onClick={() => addCompanyToCrm(company.id, 'discovered')}
                    className="px-4 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg"
                  >
                    Add to CRM Pipeline
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: SOURCES & LIMITATIONS */}
          {activeTab === 'sources' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 leading-relaxed">
                Jeneconk BII strictly enforces source provenance and retention metadata. All intelligence is cross-checked against registered regulatory and public filings.
              </div>

              <div className="space-y-3">
                {company.evidence_items.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{ev.source_name}</span>
                      <span className="font-mono text-amber-400 text-[10px] uppercase">{ev.licence_class}</span>
                    </div>
                    <p className="text-slate-300 italic">"{ev.supporting_excerpt}"</p>
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Retrieved: {new Date(ev.retrieved_at).toISOString()}</span>
                      <a
                        href={ev.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 hover:underline flex items-center gap-1"
                      >
                        Source Registry Link <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
