import React, { useState } from 'react';
import {
  FilePlus,
  X,
  ShieldCheck,
  Building2,
  Calendar,
  DollarSign,
  Layers,
  Globe,
  AlertCircle
} from 'lucide-react';
import { ProcurementNotice, IndustryCode } from '../../types';

interface TenderIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tender: Partial<ProcurementNotice>) => Promise<void>;
}

export const TenderIntakeModal: React.FC<TenderIntakeModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [reference, setReference] = useState('');
  const [title, setTitle] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [category, setCategory] = useState('Subsea & Pipeline Inspection (JQS 3.01.05)');
  const [deadline, setDeadline] = useState('2026-12-15');
  const [budget, setBudget] = useState('1500000');
  const [scope, setScope] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [portal, setPortal] = useState<'NipeX Portal' | 'Federal Tenders Journal' | 'Public Procurement Bureau' | 'Corporate Supplier Portal'>('NipeX Portal');
  const [sourceUrl, setSourceUrl] = useState('https://nipex-ng.com/tenders');
  const [industry, setIndustry] = useState<IndustryCode>('oil_and_gas');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim() || !title.trim() || !buyerName.trim()) {
      alert('Please fill all mandatory fields (Reference, Title, Buyer).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        notice_reference: reference.trim(),
        title: title.trim(),
        buyer_name: buyerName.trim(),
        procurement_category: category,
        deadline_at: `${deadline}T17:00:00Z`,
        estimated_budget_usd: Number(budget) || undefined,
        scope_summary: scope.trim(),
        eligibility_summary: eligibility.trim(),
        source_portal: portal,
        source_url: sourceUrl.trim(),
        industry_id: industry,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error submitting tender');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/60 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-amber-400 uppercase text-[10px]">
                Analyst Curation & Intake Pipeline
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Verified Tender Verification</span>
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FilePlus className="w-5 h-5 text-amber-400" />
              Ingest & Publish Official Procurement Notice
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-[11px] leading-relaxed">
            Directly publishes official notices from gazettes, regulatory portals, or NipeX JQS bulletins to the active workspace. Every entry is audited with provenance metadata.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                Notice Reference *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. NIPEX-2026-EPC-1044"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                Target Industry Sector
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value as IndustryCode)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-amber-500/50"
              >
                <option value="oil_and_gas">Oil & Gas / EPC Industrial</option>
                <option value="education">Education & Academic Institutions</option>
                <option value="digital_products">Digital Products & Technology</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
              Official Tender Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Provision of Offshore Riser Ultrasonic Wall-Thickness Testing"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                Buyer Organization *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Shell Nigeria (SPDC)"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                Deadline Date *
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                Budget Est. (USD)
              </label>
              <input
                type="number"
                placeholder="1500000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                Source Portal
              </label>
              <select
                value={portal}
                onChange={(e) => setPortal(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-amber-500/50"
              >
                <option value="NipeX Portal">NipeX Portal</option>
                <option value="Federal Tenders Journal">Federal Tenders Journal</option>
                <option value="Public Procurement Bureau">Public Procurement Bureau</option>
                <option value="Corporate Supplier Portal">Corporate Supplier Portal</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                Official Verification URL
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
              Detailed Scope Summary
            </label>
            <textarea
              rows={2}
              placeholder="Summary of engineering specifications, equipment required, or deliverables..."
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
              Mandatory Eligibility & Compliance Criteria
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Mandatory Category 3.01.05 registration, NCDMB NCEC certificate, and ISO 9001:2015..."
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Publishing...' : 'Publish Verified Notice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
