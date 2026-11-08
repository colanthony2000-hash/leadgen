import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  Clock,
  MoreVertical,
  Mail
} from 'lucide-react';
import { RoleCode } from '../../types';

export const WorkspaceMembersView: React.FC = () => {
  const { activeTenant, memberships, inviteMember, currentUser } = useApp();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<RoleCode>('member');

  const tenantMembers = memberships.filter((m) => m.tenant_id === activeTenant.id);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMember(inviteEmail.trim(), inviteRole);
    setInviteEmail('');
    setIsInviteOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            Workspace Members & Role Permissions
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Control member access and operations for <strong className="text-white">{activeTenant.name}</strong>. Role-based permission codes are strictly enforced on the server.
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Role Descriptions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
          <span className="font-semibold text-amber-400">Owner</span>
          <p className="text-[11px] text-slate-400">Complete authority over billing, workspace deletion, and member governance.</p>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
          <span className="font-semibold text-white">Admin</span>
          <p className="text-[11px] text-slate-400">Manage scoring weights, invitations, data provider credentials, and integrations.</p>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
          <span className="font-semibold text-white">Manager</span>
          <p className="text-[11px] text-slate-400">Manage pipeline deals, assign tasks, initiate AI research, and approve outreach.</p>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
          <span className="font-semibold text-white">Member</span>
          <p className="text-[11px] text-slate-400">Search directory, view evidence, log notes, and draft outreach messages.</p>
        </div>
      </div>

      {/* Members Table */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
        <h3 className="text-sm font-semibold text-white">
          Active Workspace Roster ({tenantMembers.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                <th className="py-2.5 px-3">Member</th>
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {tenantMembers.map((m) => (
                <tr key={m.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 px-3 font-medium text-white flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold uppercase text-[10px]">
                      {m.user_name.slice(0, 2)}
                    </div>
                    <span>{m.user_name}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">
                    {m.user_email}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                      m.role === 'owner'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {m.role}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500 text-[11px]">
                    {new Date(m.joined_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleSendInvite} className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-400" />
              Invite Teammate to Workspace
            </h3>
            <p className="text-xs text-slate-400">
              An invitation token hash will be generated. The invitee will be provisioned access to this workspace upon confirmation.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 uppercase text-[10px] font-semibold mb-1">
                  Work Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase text-[10px] font-semibold mb-1">
                  Assigned Permission Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as RoleCode)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="admin">Admin (Configuration & Members)</option>
                  <option value="manager">Manager (Leads & Research)</option>
                  <option value="member">Member (Standard Discovery)</option>
                  <option value="read_only">Read-Only (Viewer)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
              >
                Send Workspace Invite
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
