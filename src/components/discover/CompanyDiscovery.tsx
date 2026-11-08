import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  Search,
  Filter,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  PlusCircle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Users,
  Briefcase,
  Layers,
  ArrowUpDown,
  LayoutGrid,
  List
} from 'lucide-react';
import { Company, IndustryCode, PipelineStage } from '../../types';

interface CompanyDiscoveryProps {
  onOpenResearchForCompany: (company: Company) => void;
}

export const CompanyDiscovery: React.FC<CompanyDiscoveryProps> = ({ onOpenResearchForCompany }) => {
  const {
    companies,
    activeIndustry,
    saveCompany,
    unsaveCompany,
    addCompanyToCrm,
    enrichCompany,
    setSelectedCompanyForDetail,
    searchQuery,
    setSearchQuery,
  } = useApp();

  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [minFitScore, setMinFitScore] = useState<number>(60);
  const [onlySaved, setOnlySaved] = useState<boolean>(false);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Available unique types & countries
  const companyTypes = Array.from(new Set(companies.map((c) => c.company_type)));
  const countries = Array.from(new Set(companies.map((c) => c.location.country)));

  // Filtered companies
  const filteredCompanies = companies.filter((c) => {
    // Sector filter
    if (activeIndustry !== 'all' && c.industry_id !== activeIndustry) return false;
    // Type filter
    if (selectedType !== 'all' && c.company_type !== selectedType) return false;
    // Country filter
    if (selectedCountry !== 'all' && c.location.country !== selectedCountry) return false;
    // Fit score slider
    if (c.fit_score < minFitScore) return false;
    // Saved toggle
    if (onlySaved && !c.is_saved) return false;
    // Text search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.canonical_name.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      const matchCity = c.location.city.toLowerCase().includes(q);
      const matchOffer = c.matched_offerings.some((o) => o.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchCity && !matchOffer) return false;
    }
    return true;
  });

  const handleEnrich = async (e: React.MouseEvent, companyId: string) => {
    e.stopPropagation();
    setEnrichingId(companyId);
    await enrichCompany(companyId);
    setEnrichingId(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            Company Discovery & Intelligence Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search verified energy infrastructure operators, EPC contractors, and educational institutions with algorithmic fit scoring and traceable evidence.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            {filteredCompanies.length} of {companies.length}
          </span>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode('cards')}
              title="Card Grid View"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'cards'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Dense Data Table View"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by company name, technology, or capability..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Company Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-amber-500/50"
            >
              <option value="all">All Organization Types</option>
              {companyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Country Filter */}
          <div>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-amber-500/50"
            >
              <option value="all">All Geographies</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Min Fit Score Slider */}
          <div className="flex flex-col justify-center px-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Min Fit Score:</span>
              <span className="font-mono text-amber-400 font-bold">{minFitScore}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={minFitScore}
              onChange={(e) => setMinFitScore(parseInt(e.target.value))}
              className="w-full accent-amber-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Quick Segment Toggles */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlySaved}
                onChange={(e) => setOnlySaved(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
              />
              <span>Only show companies saved in this workspace</span>
            </label>
          </div>

          {(selectedType !== 'all' || selectedCountry !== 'all' || minFitScore > 60 || onlySaved || searchQuery) && (
            <button
              onClick={() => {
                setSelectedType('all');
                setSelectedCountry('all');
                setMinFitScore(60);
                setOnlySaved(false);
                setSearchQuery('');
              }}
              className="text-amber-400 hover:text-amber-300 underline text-[11px]"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results View: Table or Cards */}
      {filteredCompanies.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/30">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No matching companies found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Try adjusting your sector filter, reducing the minimum fit score slider, or clearing the search query.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40 shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-[10px] text-slate-400 uppercase font-semibold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-3">Sector & Type</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">ICP Fit</th>
                <th className="py-3 px-3">Contacts</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredCompanies.map((company) => (
                <tr
                  key={company.id}
                  onClick={() => setSelectedCompanyForDetail(company)}
                  className="hover:bg-slate-900/80 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white hover:text-amber-300">
                      {company.canonical_name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">{company.website_domain}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    <div>{company.company_type}</div>
                    <div className="text-[10px] text-slate-500 capitalize">{company.industry_id.replace('_', ' ')}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {company.location.city}, {company.location.country}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-400 tabular-nums">
                    {company.fit_score}%
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300 tabular-nums">
                    {company.primary_contacts_count} verified
                  </td>
                  <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenResearchForCompany(company)}
                        title="AI Research"
                        className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-md transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => addCompanyToCrm(company.id, 'discovered')}
                        title="Add to CRM"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-md transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => (company.is_saved ? unsaveCompany(company.id) : saveCompany(company.id))}
                        title={company.is_saved ? 'Remove' : 'Save'}
                        className={`p-1.5 rounded-md transition-colors ${
                          company.is_saved
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {company.is_saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCompanies.map((company) => {
            const isSaved = company.is_saved;

            return (
              <div
                key={company.id}
                onClick={() => setSelectedCompanyForDetail(company)}
                className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Main Details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-amber-400 uppercase tracking-wider text-[10px]">
                        {company.industry_id.replace('_', ' ')}
                      </span>
                      <span>·</span>
                      <span className="text-slate-300">{company.company_type}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {company.location.city}, {company.location.country}
                      </span>
                      <span>·</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        Verified {new Date(company.last_checked_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-white group-hover:text-amber-300 transition-colors flex items-center gap-2">
                      {company.canonical_name}
                      <span className="text-xs font-normal text-slate-500">
                        ({company.website_domain})
                      </span>
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 max-w-3xl">
                      {company.description}
                    </p>

                    {/* Matched Capabilities */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-500">Offer Fit:</span>
                      {company.matched_offerings.map((off, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60"
                        >
                          {off}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Middle: Metrics & Evidence */}
                  <div className="flex items-center gap-6 shrink-0 lg:px-4 lg:border-x border-slate-800">
                    {/* Fit Score */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-baseline gap-1 text-emerald-400 font-mono font-bold text-lg">
                        <span>{company.fit_score}</span>
                        <span className="text-xs font-sans text-slate-400">%</span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                        ICP Match
                      </span>
                    </div>

                    {/* Contacts & Evidence */}
                    <div className="flex flex-col text-xs text-slate-400 space-y-1">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <strong className="font-mono text-white">{company.primary_contacts_count}</strong> decision-makers
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400/80" />
                        <strong className="font-mono text-white">{company.evidence_items.length}</strong> verified facts
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Deep AI Research Button */}
                    <button
                      onClick={() => onOpenResearchForCompany(company)}
                      title="Run Deep AI Research on this Company (5 credits)"
                      className="p-2 text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Research</span>
                    </button>

                    {/* Add to CRM */}
                    <button
                      onClick={() => addCompanyToCrm(company.id, 'discovered')}
                      title="Add to CRM Sales Pipeline"
                      className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Add to CRM</span>
                    </button>

                    {/* Save Bookmark */}
                    <button
                      onClick={() => (isSaved ? unsaveCompany(company.id) : saveCompany(company.id))}
                      title={isSaved ? 'Remove from Workspace' : 'Save to Workspace'}
                      className={`p-2 rounded-lg border transition-colors ${
                        isSaved
                          ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>

                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors ml-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
