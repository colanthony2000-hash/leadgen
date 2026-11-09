import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  ChevronDown,
  Coins,
  Search,
  Bell,
  Sparkles,
  ShieldCheck,
  Plus,
  Check,
  SlidersHorizontal,
  Briefcase,
  Menu,
  LogOut
} from 'lucide-react';
import { IndustryCode } from '../../types';

interface AppHeaderProps {
  onOpenScoring: () => void;
  onOpenResearch: () => void;
  onSubmitSearch: (query: string) => void;
  currentView: string;
  onToggleMobileSidebar?: () => void;
  onSignOut: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenScoring,
  onOpenResearch,
  onSubmitSearch,
  currentView,
  onToggleMobileSidebar,
  onSignOut,
}) => {
  const {
    activeTenant,
    tenants,
    switchWorkspace,
    currentUser,
    activeIndustry,
    setActiveIndustry,
    creditBalance,
    topUpCredits,
    searchQuery,
    setSearchQuery,
    setIsPrivacyModalOpen,
    isDemoMode,
  } = useApp();

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(100);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query) onSubmitSearch(query);
  };

  const industries: Array<{ id: IndustryCode | 'all'; label: string }> = [
    { id: 'all', label: 'All Sectors' },
    { id: 'oil_and_gas', label: 'Oil & Gas / EPC' },
    { id: 'education', label: 'Education & STEM' },
    { id: 'digital_products', label: 'Digital Products' },
    { id: 'faith_based', label: 'Churches & Faith' },
    { id: 'private_sector', label: 'Private Companies' },
  ];

  return (
    <header className="sticky top-0 z-30 flex w-full min-w-0 flex-wrap items-center justify-between gap-2 px-3 sm:px-6 py-2.5 sm:py-3 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md min-[1800px]:flex-nowrap min-[1800px]:gap-6">
      {/* Zone 1: Mobile Menu Toggle & Brand & Workspace Switcher */}
      <div className="flex min-w-0 max-w-full items-center gap-2 sm:gap-4">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <a
          href="https://www.jeneconk.com"
          target="_blank"
          rel="noreferrer"
          title="Visit Jeneconk Official Website (www.jeneconk.com)"
          className="flex items-center gap-2 group"
        >
          <img
            src="/assets/aistudio/logo_bf2c43a3.png"
            alt="Jeneconk Official Logo"
            className="w-8 h-8 rounded-full object-contain bg-slate-900 border border-amber-500/30 p-0.5 shadow-sm group-hover:scale-105 transition-transform"
          />
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-1">
              <span className="text-base font-bold tracking-tight text-white whitespace-nowrap group-hover:text-amber-300 transition-colors">
                Jeneconk BII
              </span>
            </div>
            <span className="hidden sm:block text-[10px] font-medium text-slate-400 tracking-wider uppercase group-hover:text-slate-300 transition-colors">
              www.jeneconk.com
            </span>
          </div>
        </a>

        <div className="h-5 w-px bg-slate-800 hidden md:block" />

        {/* Workspace Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className="flex max-w-[132px] sm:max-w-none items-center gap-2 px-2 sm:px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="max-w-[70px] sm:max-w-[180px] truncate">{activeTenant.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isWorkspaceMenuOpen && (
            <div className="absolute left-0 mt-2 w-72 p-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Active Workspaces
                </span>
              </div>
              {tenants.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    switchWorkspace(t.id);
                    setIsWorkspaceMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                    t.id === activeTenant.id
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="font-medium truncate">{t.name}</span>
                    <span className="text-[10px] text-slate-500 capitalize">
                      {t.tenant_type} Workspace · {t.industry_focus.replace('_', ' ')}
                    </span>
                  </div>
                  {t.id === activeTenant.id && (
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zone 2: Sector Segmented Tabs & Search */}
      <div className="hidden lg:flex order-3 basis-full w-full min-w-0 items-center justify-center gap-3 border-t border-slate-800/70 pt-2 min-[1800px]:order-none min-[1800px]:basis-auto min-[1800px]:w-auto min-[1800px]:flex-1 min-[1800px]:border-0 min-[1800px]:pt-0 min-[1800px]:max-w-2xl">
        {/* Industry Focus Filter */}
        <div className="flex min-w-0 items-center overflow-x-auto p-1 bg-slate-900/90 border border-slate-800 rounded-lg">
          {industries.map((ind) => (
            <button
              key={ind.id}
              onClick={() => setActiveIndustry(ind.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeIndustry === ind.id
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {ind.label}
            </button>
          ))}
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} role="search" className="relative w-full min-w-[260px] max-w-sm flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search this workspace..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search companies, contacts, and opportunities"
            className="w-full pl-8 pr-[4.5rem] py-1.5 text-xs bg-slate-900/80 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
          />
          <button type="submit" disabled={!searchQuery.trim()} className="absolute right-1 top-1 bottom-1 rounded-md bg-amber-400 px-2 text-[11px] font-semibold text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50">
            Search
          </button>
        </form>
      </div>

      <div className="order-3 flex w-full min-w-0 items-center gap-2 border-t border-slate-800/70 pt-2 lg:hidden">
        <select
          aria-label="Filter workspace by sector"
          value={activeIndustry}
          onChange={(event) => setActiveIndustry(event.target.value as IndustryCode | 'all')}
          className="w-[132px] shrink-0 rounded-lg border border-slate-800 bg-slate-900 px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
        >
          {industries.map((industry) => (
            <option key={industry.id} value={industry.id}>{industry.label}</option>
          ))}
        </select>
        <form onSubmit={handleSearchSubmit} role="search" className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            aria-label="Search this workspace"
            placeholder="Search this workspace..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-12 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
          />
          <button type="submit" aria-label="Search" disabled={!searchQuery.trim()} className="absolute right-1 top-1 bottom-1 rounded-md bg-amber-400 px-2 text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50">
            <Search className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

      {/* Zone 3: Credits Meter, Actions & User Profile */}
      <div className="order-2 ml-auto flex shrink-0 items-center gap-2 sm:gap-3 min-[1800px]:order-none min-[1800px]:ml-0">
        {/* Quick Deep Research CTA */}
        <button
          onClick={onOpenResearch}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-lg transition-colors whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Deep Research</span>
        </button>

        {/* Credit Meter Widget */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold text-white font-mono tabular-nums">
              {creditBalance}
            </span>
            <span className="text-[10px] text-slate-400">credits</span>
          </div>
          {isDemoMode && (
            <button
              onClick={() => setIsTopUpOpen(true)}
              title="Top Up Demo Credits"
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-300 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* NDPA Privacy & Suppression Registry */}
        <button
          onClick={() => setIsPrivacyModalOpen(true)}
          title="NDPA 2023 Cryptographic Privacy & Suppression Registry"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors font-medium"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden xl:inline text-[11px]">NDPA Privacy</span>
        </button>

        {/* Scoring Tuning Shortcut */}
        <button
          onClick={onOpenScoring}
          title="Configure ICP Scoring Weights"
          className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <img
            src={currentUser.avatar_url}
            alt={currentUser.display_name}
            className="w-7 h-7 rounded-full object-cover border border-slate-700"
          />
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-medium text-slate-200 leading-tight">
              {currentUser.display_name}
            </span>
            <span className="text-[10px] text-slate-400 capitalize">
              {currentUser.role}
            </span>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            title="Sign out"
            aria-label="Sign out"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Top-Up Credits Modal */}
      {isTopUpOpen && isDemoMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold text-white">Top Up Workspace Credits</h3>
              </div>
              <button
                onClick={() => setIsTopUpOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Credits power metered operations: Deep AI Research (5 credits), Contact Enrichment (2 credits), and Verification (1 credit). All transactions are recorded in the immutable tenant ledger.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[50, 100, 250].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTopUpAmount(amt)}
                  className={`py-3 px-4 rounded-xl border text-center transition-all ${
                    topUpAmount === amt
                      ? 'border-amber-500 bg-amber-500/10 text-white font-bold'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-sm font-mono tabular-nums">{amt}</div>
                  <div className="text-[10px] text-slate-400">${amt * 0.5} USD</div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsTopUpOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  topUpCredits(topUpAmount, `Pilot package top-up (${topUpAmount} credits)`);
                  setIsTopUpOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
              >
                Confirm +{topUpAmount} Credits
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
