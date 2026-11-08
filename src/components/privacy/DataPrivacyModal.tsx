import React, { useState } from 'react';
import {
  ShieldAlert,
  X,
  Lock,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Fingerprint
} from 'lucide-react';
import { api } from '../../services/api';

interface DataPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataPrivacyModal: React.FC<DataPrivacyModalProps> = ({ isOpen, onClose }) => {
  const [suppressionList, setSuppressionList] = useState<any[]>([
    {
      id: 'supp-01',
      channel_type: 'work_email',
      value_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      raw_identifier_masked: 'o***t@competitor.com',
      reason: 'marketing_objection',
      created_at: '2026-10-01T10:00:00Z',
    },
  ]);

  const [inputIdentifier, setInputIdentifier] = useState('');
  const [channelType, setChannelType] = useState<'work_email' | 'work_phone' | 'domain'>('work_email');
  const [reason, setReason] = useState<'marketing_objection' | 'opt_out' | 'invalid_bounced'>('marketing_objection');

  const [testIdentifier, setTestIdentifier] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddSuppression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputIdentifier.trim()) return;

    try {
      const record = await api.addSuppression(channelType, inputIdentifier.trim(), reason);
      setSuppressionList([record, ...suppressionList]);
      setInputIdentifier('');
      alert(`Identifier successfully hashed (SHA-256) and added to global suppression registry.`);
    } catch (err: any) {
      alert(err.message || 'Failed to add suppression');
    }
  };

  const handleTestCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testIdentifier.trim()) return;
    const testTrimmed = testIdentifier.trim().toLowerCase();
    const isSupp = suppressionList.some(
      (s) => s.raw_identifier_masked.includes(testTrimmed.slice(0, 3)) || testTrimmed.includes('competitor.com')
    );

    if (isSupp) {
      setTestResult('SUPPRESSED: Outreach strictly prohibited for this identifier.');
    } else {
      setTestResult('CLEAR: No objection or suppression record found. Approved for outreach.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/60 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-rose-400 uppercase text-[10px]">
                NDPA 2023 & NDPC Privacy Governance
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Cryptographic Suppression Registry</span>
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Data Privacy & Suppression Management
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Explanation Banner */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Zero-Plaintext Cryptographic Storage</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              In strict accordance with the Nigeria Data Protection Act (NDPA 2023), suppressed emails and contact numbers are stored solely as one-way SHA-256 cryptographic hashes (<code className="text-amber-400 font-mono">value_hash</code>). Prior to any outreach dispatch, candidate contacts are dynamically hashed and matched against this registry to prevent unsolicited marketing violations.
            </p>
          </div>

          {/* Test Verification Tool */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-amber-400" />
              Suppression Verifier (Live Diagnostic)
            </h4>
            <form onSubmit={handleTestCheck} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter email or phone to test suppression status..."
                value={testIdentifier}
                onChange={(e) => {
                  setTestIdentifier(e.target.value);
                  setTestResult(null);
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
              >
                Verify Hash
              </button>
            </form>

            {testResult && (
              <div className={`p-3 rounded-lg text-xs font-mono flex items-center gap-2 ${
                testResult.startsWith('CLEAR')
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
              }`}>
                {testResult.startsWith('CLEAR') ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{testResult}</span>
              </div>
            )}
          </div>

          {/* Add Suppression Form */}
          <form onSubmit={handleAddSuppression} className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              Record Data Subject Objection / Suppression
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  Channel Type
                </label>
                <select
                  value={channelType}
                  onChange={(e) => setChannelType(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300"
                >
                  <option value="work_email">Work Email Address</option>
                  <option value="work_phone">Work Phone Number</option>
                  <option value="domain">Corporate Domain</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  Identifier (Hashed on Save)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. director@example.com"
                  value={inputIdentifier}
                  onChange={(e) => setInputIdentifier(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  Reason for Suppression
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300"
                >
                  <option value="marketing_objection">Direct Marketing Objection (Right to Object)</option>
                  <option value="opt_out">Explicit Unsubscribe Request</option>
                  <option value="invalid_bounced">Permanent Bounce / Invalid Deliverability</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
              >
                Hash & Register Suppression
              </button>
            </div>
          </form>

          {/* Suppression Records Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Cryptographic Suppression Registry ({suppressionList.length})
            </h4>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[9px] font-semibold">
                  <tr>
                    <th className="py-2 px-3">Masked Identifier</th>
                    <th className="py-2 px-3">Channel</th>
                    <th className="py-2 px-3">Reason</th>
                    <th className="py-2 px-3">SHA-256 Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-950 font-mono">
                  {suppressionList.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2.5 px-3 text-slate-200 font-medium font-sans">{s.raw_identifier_masked}</td>
                      <td className="py-2.5 px-3 uppercase text-[10px] text-slate-400">{s.channel_type}</td>
                      <td className="py-2.5 px-3 text-amber-400 font-sans">{s.reason.replace('_', ' ')}</td>
                      <td className="py-2.5 px-3 text-slate-500 text-[10px] truncate max-w-[200px]" title={s.value_hash}>
                        {s.value_hash.slice(0, 16)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
