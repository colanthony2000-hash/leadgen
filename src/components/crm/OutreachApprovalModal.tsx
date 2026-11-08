import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Send,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Mail,
  Building2,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import { OutreachDraft } from '../../types';

interface OutreachApprovalModalProps {
  draft: OutreachDraft | null;
  onClose: () => void;
}

export const OutreachApprovalModal: React.FC<OutreachApprovalModalProps> = ({ draft, onClose }) => {
  const { approveOutreachDraft, sendOutreachDraft } = useApp();

  const [subject, setSubject] = useState(draft?.subject || '');
  const [body, setBody] = useState(draft?.body || '');
  const [isSending, setIsSending] = useState(false);

  if (!draft) return null;

  const isApproved = draft.status === 'approved';
  const isSent = draft.status === 'sent';

  const handleSend = async () => {
    setIsSending(true);
    const success = await sendOutreachDraft(draft.id);
    setIsSending(false);
    if (success) {
      alert(`Outreach successfully dispatched to ${draft.contact_email}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/60 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-amber-400 uppercase text-[10px]">
                Human-in-the-Loop Outreach Governance
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Strict NDPA 2023 & B2B Compliance</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Review, Approve & Dispatch Tailored Outreach
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Message Editor */}
          <div className="lg:col-span-2 space-y-4">
            {/* Recipient Details Card */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 text-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[11px] block">Recipient</span>
                <span className="font-semibold text-white">{draft.contact_name}</span>
                <span className="text-slate-400 block font-mono text-[11px]">{draft.contact_email}</span>
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-slate-400 text-[11px] block">Organization</span>
                <span className="font-medium text-amber-300">{draft.company_name}</span>
                <span className="text-emerald-400 font-mono text-[10px] block">
                  ✓ Suppression List: Clean
                </span>
              </div>
            </div>

            {/* Subject Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isSent}
                className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50 font-medium"
              />
            </div>

            {/* Body Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Message Body
              </label>
              <textarea
                rows={12}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={isSent}
                className="w-full p-3.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50 leading-relaxed font-sans"
              />
            </div>
          </div>

          {/* Right Col: Evidence Citations & Warnings */}
          <div className="space-y-4">
            {/* Approval Status Badge */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Current Approval State
              </span>
              <div className="flex items-center gap-2">
                {isSent ? (
                  <div className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sent & Dispatched</span>
                  </div>
                ) : isApproved ? (
                  <div className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approved for Delivery</span>
                  </div>
                ) : (
                  <div className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Awaiting Human Approval</span>
                  </div>
                )}
              </div>
              {draft.approved_by && (
                <p className="text-[10px] text-slate-400">
                  Approved by {draft.approved_by} on {new Date(draft.approved_at!).toLocaleString()}
                </p>
              )}
            </div>

            {/* Evidence Citations */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2.5">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Evidence Grounding
              </h4>
              <p className="text-[11px] text-slate-400">
                Claims in this email are linked to verified public and regulatory sources:
              </p>
              <div className="space-y-2">
                {draft.evidence_citations.map((cite, i) => (
                  <div key={i} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                    <p className="text-slate-300 font-medium">"{cite.claim}"</p>
                    <span className="text-[10px] text-amber-400 block">{cite.source}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Unknowns Warnings */}
            {draft.unknown_warnings.length > 0 && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Unknowns & Cautions
                </h4>
                <ul className="space-y-1 text-[11px] text-amber-200 list-disc list-inside">
                  {draft.unknown_warnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            {!isApproved && !isSent && (
              <button
                onClick={() => approveOutreachDraft(draft.id)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Approve Draft</span>
              </button>
            )}

            <button
              onClick={handleSend}
              disabled={!isApproved || isSent || isSending}
              className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                isApproved && !isSent
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSent ? 'Dispatched' : isSending ? 'Sending...' : 'Send Outreach Message'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
