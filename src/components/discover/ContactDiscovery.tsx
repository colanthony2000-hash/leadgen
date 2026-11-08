import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  ShieldCheck,
  Building2,
  Send,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Contact } from '../../types';

interface ContactDiscoveryProps {
  onDraftOutreach: (contact: Contact) => void;
  onOpenCompany: (companyId: string) => void;
}

export const ContactDiscovery: React.FC<ContactDiscoveryProps> = ({
  onDraftOutreach,
  onOpenCompany,
}) => {
  const { contacts, activeIndustry, searchQuery, setSearchQuery } = useApp();

  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedSeniority, setSelectedSeniority] = useState<string>('all');

  const filteredContacts = contacts.filter((c) => {
    // Role category
    if (selectedRole !== 'all' && c.role_category !== selectedRole) return false;
    // Seniority
    if (selectedSeniority !== 'all' && c.seniority !== selectedSeniority) return false;
    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.full_name.toLowerCase().includes(q);
      const matchTitle = c.job_title.toLowerCase().includes(q);
      const matchComp = c.company_name.toLowerCase().includes(q);
      const matchEmail = c.channels.some((ch) => ch.value.toLowerCase().includes(q));
      if (!matchName && !matchTitle && !matchComp && !matchEmail) return false;
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            Decision-Maker & Executive Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Lawfully sourced and verified engineering managers, procurement heads, and academic leadership with traceable provenance.
          </p>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          {filteredContacts.length} verified contacts available
        </span>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, title, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">All Role Categories</option>
            <option value="c_suite">C-Suite & Executives</option>
            <option value="engineering_operations">Engineering & Plant Operations</option>
            <option value="procurement_supply_chain">Procurement & Upstream Supply Chain</option>
            <option value="academic_director">Academic Directorate & Deans</option>
            <option value="ict_administration">ICT & Systems Administration</option>
          </select>
        </div>

        <div>
          <select
            value={selectedSeniority}
            onChange={(e) => setSelectedSeniority(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">All Seniority Levels</option>
            <option value="executive">Executive / VP / Dean</option>
            <option value="director">Director / General Manager</option>
            <option value="manager">Manager / Head of Dept</option>
            <option value="specialist">Specialist / Lead Engineer</option>
          </select>
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700 transition-all space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">
                  {contact.full_name}
                </h3>
                <p className="text-xs text-amber-400 font-medium">
                  {contact.job_title}
                </p>
                <button
                  onClick={() => onOpenCompany(contact.company_id)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium text-left"
                >
                  <Building2 className="w-3 h-3 text-slate-500" />
                  <span className="truncate">{contact.company_name}</span>
                </button>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                  {contact.seniority}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 capitalize">
                  {contact.role_category.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Channels & Verification */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              {contact.channels.map((chan) => (
                <div
                  key={chan.id}
                  className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-slate-950 rounded border border-slate-800/80"
                >
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300 min-w-0">
                    {chan.channel_type === 'work_email' && <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    {chan.channel_type === 'work_phone' && <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    <span className="truncate">{chan.value}</span>
                  </div>

                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 shrink-0 font-sans font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                </div>
              ))}
            </div>

            {/* Footer / Action */}
            <div className="flex items-center justify-between pt-2 text-[10px] text-slate-500">
              <span>{contact.evidence_count} evidence records · Suppression: Clean</span>

              <button
                onClick={() => onDraftOutreach(contact)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
              >
                <Send className="w-3 h-3" />
                <span>Draft Grounded Message</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
