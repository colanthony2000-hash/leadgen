import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plus,
  Table,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { CreditTransaction } from '../../types';

export const UsageCreditsView: React.FC = () => {
  const { creditBalance, creditTransactions, topUpCredits, activeTenant, isDemoMode } = useApp();

  const [filterType, setFilterType] = useState<string>('all');
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(100);

  const filteredTransactions = creditTransactions.filter((tx) => {
    if (filterType !== 'all' && tx.transaction_type !== filterType) return false;
    return true;
  });

  const pricingTable = [
    { action: 'Company Discovery Search', cost: 'Free (0 Credits)', description: 'Search internal directory, filter by sector, country, and fit score' },
    { action: 'Deep AI Research Dossier', cost: '5 Credits', description: 'Grounded intelligence analysis with evidence citations & unknown flags' },
    { action: 'Company Registry Enrichment', cost: '2 Credits', description: 'Real-time sync of official corporate filings, turnover bands & assets' },
    { action: 'Direct Contact Verification', cost: '1 Credit', description: 'Deliverability and cryptographic hash verification of work channels' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            Workspace Usage, Credits & Metering Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Immutable, audit-ready credit transaction ledger. Every metered action reserves credits upfront, records provider provenance, and logs idempotent settlements.
          </p>
        </div>

        {isDemoMode && (
          <button
            onClick={() => setIsTopUpModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Top Up Demo Credits</span>
          </button>
        )}
      </div>

      {/* Credit Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <span className="text-xs font-medium text-slate-400">Available Balance</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono tabular-nums">
              {creditBalance}
            </span>
            <span className="text-xs text-amber-400 font-mono">Credits</span>
          </div>
          <span className="text-[11px] text-slate-500 block pt-1">
            Current Workspace: {activeTenant.name}
          </span>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <span className="text-xs font-medium text-slate-400">Active Subscription</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-400">
              Professional Pilot
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block pt-1">
            1,000 monthly credits included · Auto-renews Dec 1
          </span>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <span className="text-xs font-medium text-slate-400">Ledger Invariant</span>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm pt-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Immutable & Reconciled</span>
          </div>
          <span className="text-[11px] text-slate-500 block pt-1">
            {creditTransactions.length} verified operations recorded
          </span>
        </div>
      </div>

      {/* Metered Operation Pricing Schedule */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
        <h3 className="text-sm font-semibold text-white">
          Transparent Metering Schedule
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {pricingTable.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 space-y-1">
              <span className="font-semibold text-slate-200 block truncate">{item.action}</span>
              <span className="font-mono text-amber-400 font-bold block">{item.cost}</span>
              <p className="text-[11px] text-slate-400 pt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Immutable Ledger Table */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            Audit-Verified Transaction Ledger
          </h3>

          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300"
            >
              <option value="all">All Transaction Types</option>
              <option value="grant">Initial Grants</option>
              <option value="reservation">Reservations</option>
              <option value="capture">Settled Captures</option>
              <option value="top_up">Top-Ups</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                    {new Date(tx.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                      tx.transaction_type === 'grant' || tx.transaction_type === 'top_up'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : tx.transaction_type === 'reservation'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {tx.transaction_type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-200">
                    {tx.description}
                  </td>
                  <td className={`py-3 px-3 font-mono font-bold ${
                    tx.amount > 0 ? 'text-emerald-400' : tx.amount < 0 ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-white">
                    {tx.balance_after}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Up Modal */}
      {isTopUpModalOpen && isDemoMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              Purchase Additional Credits
            </h3>
            <p className="text-xs text-slate-400">
              Select credit package. Credits never expire and are shared across all active workspace members.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[50, 100, 250].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTopUpAmount(amt)}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    topUpAmount === amt
                      ? 'border-amber-400 bg-amber-400/10 text-white font-bold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-base font-mono tabular-nums">{amt}</div>
                  <div className="text-[10px] text-slate-400">${amt * 0.5} USD</div>
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setIsTopUpModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  topUpCredits(topUpAmount, `Pilot package top-up (${topUpAmount} credits)`);
                  setIsTopUpModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
              >
                Confirm +{topUpAmount} Credits
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
