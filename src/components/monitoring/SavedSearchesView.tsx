import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BellRing,
  Play,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Trash2
} from 'lucide-react';
import { SavedSearch } from '../../types';

export const SavedSearchesView: React.FC = () => {
  const { savedSearches } = useApp();
  const [searches, setSearches] = useState<SavedSearch[]>(savedSearches);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSummary, setNewSummary] = useState('');

  const handleRunNow = (name: string) => {
    alert(`Monitored query executed for "${name}". 2 new matches flagged.`);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const item: SavedSearch = {
      id: `ss-${Date.now()}`,
      name: newName.trim(),
      query_summary: newSummary.trim() || 'Custom filter criteria',
      filters: {},
      frequency: 'daily',
      is_active: true,
      last_run_at: new Date().toISOString(),
      new_matches_count: 1,
    };
    setSearches([item, ...searches]);
    setNewName('');
    setNewSummary('');
    setIsCreateOpen(false);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BellRing className="w-6 h-6 text-amber-400" />
            Saved Searches & Automated Signal Monitoring
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure automated daily and weekly scans for new NipeX tender notices, leadership appointments, and high-fit prospect discoveries.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Monitored Search</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {searches.map((s) => (
          <div
            key={s.id}
            className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 font-semibold">
                  Frequency: {s.frequency}
                </span>
                <h3 className="text-sm font-semibold text-white mt-0.5">
                  {s.name}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[11px] font-mono">
                <span>{s.new_matches_count} new signals</span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              {s.query_summary}
            </p>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px]">
                Last Run: {new Date(s.last_run_at).toLocaleDateString()}
              </span>

              <button
                onClick={() => handleRunNow(s.name)}
                className="px-3 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3 h-3 text-amber-400" />
                <span>Run Scan Now</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleCreate} className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-white">Create Monitored Search</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  Alert Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Niger Delta Marine Pipeline Tenders"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  Query Criteria Summary
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Companies with >85% fit in Rivers & Delta states with active JQS 3.01.05 status"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg"
              >
                Save Alert
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
