import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FolderGit2,
  Sliders,
  Building2,
  Globe,
  Award,
  Layers,
  Save,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';
import { ScoringWeights, BusinessOffering } from '../../types';

export const BusinessProfileView: React.FC = () => {
  const { businessProfile, updateBusinessProfile, updateScoringWeights, companies } = useApp();

  const [companyName, setCompanyName] = useState(businessProfile.company_name);
  const [website, setWebsite] = useState(businessProfile.website);
  const [summary, setSummary] = useState(businessProfile.business_summary);
  const [weights, setWeights] = useState<ScoringWeights>(businessProfile.scoring_weights);
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  const totalWeight =
    weights.service_compatibility +
    weights.project_relevance +
    weights.procurement_timing +
    weights.geographic_suitability +
    weights.decision_maker_availability +
    weights.commercial_activity;

  const handleWeightChange = (key: keyof ScoringWeights, val: number) => {
    const updated = { ...weights, [key]: val };
    setWeights(updated);
    updateScoringWeights(updated);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessProfile({
      company_name: companyName,
      website,
      business_summary: summary,
    });
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FolderGit2 className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            Business Profile & ICP Scoring Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure your commercial offerings, target markets, certifications, and algorithmic lead scoring weights. Scoring changes dynamically recalculate fit scores across all prospects in real time.
          </p>
        </div>

        {isSavedAlert && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile v{businessProfile.version} saved & published</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Business Profile & Offerings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Details Form */}
          <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/aistudio/logo_bf2c43a3.png"
                  alt="Jeneconk Brand Logo"
                  className="w-10 h-10 rounded-full object-contain bg-slate-950 border border-amber-500/30 p-1 shadow-md"
                />
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Company Identity & Corporate Positioning
                  </h3>
                  <a
                    href="https://www.jeneconk.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    www.jeneconk.com <Globe className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="hidden sm:block px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono">
                RC / CAC Verified
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 uppercase text-[10px] font-semibold mb-1">
                  Legal Entity Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase text-[10px] font-semibold mb-1">
                  Primary Website URL
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 uppercase text-[10px] font-semibold mb-1">
                Executive Business & Capability Summary
              </label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50 leading-relaxed"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>

          {/* Offerings & Capabilities */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Configured Commercial Offerings & Services ({businessProfile.offerings.length})
              </h3>
            </div>

            <div className="space-y-3">
              {businessProfile.offerings.map((off) => (
                <div
                  key={off.id}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{off.name}</span>
                    <span className="text-[10px] font-mono text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {off.offering_type} · {off.target_industry.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{off.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications & Evidence */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Verified Industry Accreditations & Licences
            </h3>

            <div className="space-y-3">
              {businessProfile.certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-white block">{cert.name}</span>
                    <span className="text-slate-400 text-[11px]">Issuer: {cert.issuer}</span>
                  </div>
                  <div className="text-right text-[11px] font-mono text-slate-400">
                    <span>Valid: {cert.valid_from} → {cert.valid_to}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Live Scoring Engine Sliders */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-5 sticky top-20">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Lead Scoring Engine
                </h3>
                <span className={`text-xs font-mono font-bold ${totalWeight === 100 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalWeight} / 100%
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Adjust criteria weights to tune algorithmic qualification.
              </p>
            </div>

            {/* Slider 1: Service Compatibility */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Service Compatibility</span>
                <span className="font-mono text-amber-400 font-bold">{weights.service_compatibility}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.service_compatibility}
                onChange={(e) => handleWeightChange('service_compatibility', parseInt(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider 2: Project Relevance */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Project / Tender Relevance</span>
                <span className="font-mono text-amber-400 font-bold">{weights.project_relevance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.project_relevance}
                onChange={(e) => handleWeightChange('project_relevance', parseInt(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider 3: Procurement Timing */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Procurement Timing</span>
                <span className="font-mono text-amber-400 font-bold">{weights.procurement_timing}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={weights.procurement_timing}
                onChange={(e) => handleWeightChange('procurement_timing', parseInt(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider 4: Geographic Suitability */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Geographic Suitability</span>
                <span className="font-mono text-amber-400 font-bold">{weights.geographic_suitability}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={weights.geographic_suitability}
                onChange={(e) => handleWeightChange('geographic_suitability', parseInt(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider 5: Decision-Maker Availability */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Decision-Maker Availability</span>
                <span className="font-mono text-amber-400 font-bold">{weights.decision_maker_availability}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={weights.decision_maker_availability}
                onChange={(e) => handleWeightChange('decision_maker_availability', parseInt(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider 6: Commercial Activity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Commercial Activity Signal</span>
                <span className="font-mono text-amber-400 font-bold">{weights.commercial_activity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={weights.commercial_activity}
                onChange={(e) => handleWeightChange('commercial_activity', parseInt(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Live Recalculated Preview */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                Live Sample Scores Recalculated:
              </span>
              <div className="space-y-1">
                {companies.slice(0, 3).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 truncate max-w-[150px]">{c.canonical_name}</span>
                    <span className="font-mono font-bold text-emerald-400">{c.fit_score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
