import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ListFilter,
  Plus,
  Building2,
  Users,
  ChevronRight,
  ExternalLink,
  Layers
} from 'lucide-react';
import { LeadList, Company } from '../../types';

interface LeadListsViewProps {
  onOpenCompany: (companyId: string) => void;
}

export const LeadListsView: React.FC<LeadListsViewProps> = ({ onOpenCompany }) => {
  const { leadLists, companies } = useApp();
  const [lists, setLists] = useState<LeadList[]>(leadLists);
  const [selectedList, setSelectedList] = useState<LeadList>(leadLists[0]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const companiesInActiveList = companies.filter((c) => {
    if (selectedList.industry === 'oil_and_gas') return c.industry_id === 'oil_and_gas';
    if (selectedList.industry === 'education') return c.industry_id === 'education';
    return true;
  });

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const newList: LeadList = {
      id: `list-${Date.now()}`,
      name: name.trim(),
      description: desc.trim() || 'Custom curated list',
      industry: 'oil_and_gas',
      company_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLists([newList, ...lists]);
    setSelectedList(newList);
    setName('');
    setDesc('');
    setIsCreateOpen(false);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ListFilter className="w-6 h-6 text-amber-400" />
            Curated Lead Lists & Target Cohorts
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Segment discovered organizations into campaign cohorts, export subsets, or bulk-assign to sales development teams.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create New List</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Lists */}
        <div className="space-y-3">
          {lists.map((l) => {
            const isSelected = selectedList.id === l.id;
            return (
              <div
                key={l.id}
                onClick={() => setSelectedList(l)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-slate-900 shadow-md'
                    : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-amber-400 uppercase text-[10px]">
                    {l.industry.replace('_', ' ')}
                  </span>
                  <span className="font-mono text-slate-400 font-bold">
                    {l.company_count} accounts
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white">
                  {l.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {l.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right 2 Cols: Companies in List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-semibold text-amber-400 tracking-wider">
                Active Cohort
              </span>
              <h2 className="text-base font-bold text-white mt-0.5">
                {selectedList.name}
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {companiesInActiveList.length} Accounts in Cohort
            </span>
          </div>

          <div className="space-y-3">
            {companiesInActiveList.map((comp) => (
              <div
                key={comp.id}
                onClick={() => onOpenCompany(comp.id)}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-amber-400 uppercase text-[10px]">
                      {comp.company_type}
                    </span>
                    <span>·</span>
                    <span>{comp.location.city}, {comp.location.country}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white hover:text-amber-300 transition-colors">
                    {comp.canonical_name}
                  </h4>
                  <div className="text-[11px] text-slate-400">
                    {comp.primary_contacts_count} verified contacts · {comp.matched_offerings.length} matched capabilities
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      {comp.fit_score}%
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase">Fit</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleCreateList} className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-white">Create Target Cohort List</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  List Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q1 Turnaround EPC Contractors"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                  Cohort Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Purpose of this cohort list..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
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
                Create List
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
