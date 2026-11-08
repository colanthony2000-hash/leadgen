import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  Layers,
  FileText,
  Sparkles,
  History,
  Kanban,
  ListFilter,
  CheckSquare,
  MailCheck,
  BellRing,
  Sliders,
  Shield,
  Coins,
  Settings,
  HelpCircle,
  FolderGit2,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type NavItemKey =
  | 'overview'
  | 'companies'
  | 'contacts'
  | 'projects'
  | 'tenders'
  | 'research'
  | 'research_history'
  | 'pipeline'
  | 'lead_lists'
  | 'tasks'
  | 'outreach'
  | 'monitoring'
  | 'profile'
  | 'scoring'
  | 'members'
  | 'integrations'
  | 'credits'
  | 'admin';

interface AppSidebarProps {
  currentView: NavItemKey;
  onNavigate: (view: NavItemKey) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentView,
  onNavigate,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { procurementNotices, tasks, outreachDrafts, crmLeads, companies } = useApp();

  const openTendersCount = procurementNotices.filter((n) => n.status === 'open').length;
  const pendingTasksCount = tasks.filter((t) => t.status === 'pending').length;
  const pendingOutreachCount = outreachDrafts.filter((d) => d.status === 'draft').length;

  const navGroups: Array<{
    title: string;
    items: Array<{
      key: NavItemKey;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      badge?: number | string;
    }>;
  }> = [
    {
      title: 'Intelligence',
      items: [
        { key: 'overview', label: 'Overview', icon: LayoutDashboard },
        { key: 'companies', label: 'Companies', icon: Building2, badge: companies.length },
        { key: 'contacts', label: 'Contacts', icon: Users },
        { key: 'projects', label: 'Projects & Signals', icon: Layers },
        { key: 'tenders', label: 'Procurement Tenders', icon: FileText, badge: openTendersCount },
      ],
    },
    {
      title: 'AI Research',
      items: [
        { key: 'research', label: 'AI Research Engine', icon: Sparkles },
        { key: 'research_history', label: 'Research Dossiers', icon: History },
      ],
    },
    {
      title: 'CRM & Pipeline',
      items: [
        { key: 'pipeline', label: 'Sales Pipeline', icon: Kanban, badge: crmLeads.length },
        { key: 'lead_lists', label: 'Curated Lists', icon: ListFilter },
        { key: 'tasks', label: 'Tasks & Activities', icon: CheckSquare, badge: pendingTasksCount },
        { key: 'outreach', label: 'Outreach & Approvals', icon: MailCheck, badge: pendingOutreachCount },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { key: 'monitoring', label: 'Saved Searches', icon: BellRing },
        { key: 'profile', label: 'Business Profile & ICP', icon: FolderGit2 },
        { key: 'scoring', label: 'Scoring Engine', icon: Sliders },
      ],
    },
    {
      title: 'Workspace & Security',
      items: [
        { key: 'members', label: 'Members & Roles', icon: Users },
        { key: 'integrations', label: 'Data Providers', icon: Settings },
        { key: 'credits', label: 'Usage & Credits', icon: Coins },
        { key: 'admin', label: 'Platform Console', icon: Shield },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Element: static on lg screens, fixed slideover on mobile */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header with Close Button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-900 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <img
              src="/assets/aistudio/logo_bf2c43a3.png"
              alt="Jeneconk Logo"
              className="w-6 h-6 rounded-full object-contain"
            />
            <span className="text-xs font-bold text-white tracking-tight">Navigation</span>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-3 space-y-6 flex-1">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h4 className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                {group.title}
              </h4>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        onNavigate(item.key);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/25'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                    {item.badge !== undefined && item.badge !== 0 && (
                      <span className="text-[10px] font-mono tabular-nums text-slate-400 px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info with Jeneconk Branding */}
      <div className="mt-auto p-3.5 border-t border-slate-900 bg-slate-950/90 text-slate-400 text-[11px] space-y-2">
        <a
          href="https://www.jeneconk.com"
          target="_blank"
          rel="noreferrer"
          title="Visit www.jeneconk.com"
          className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 transition-colors group"
        >
          <img
            src="/assets/aistudio/logo_bf2c43a3.png"
            alt="Jeneconk Logo"
            className="w-6 h-6 rounded-full object-contain shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-slate-200 group-hover:text-amber-300 transition-colors truncate text-xs">
              Jeneconk Integrated
            </span>
            <span className="text-[10px] text-slate-500 group-hover:text-amber-400 transition-colors">
              www.jeneconk.com
            </span>
          </div>
        </a>

        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
          <span>Enterprise Intelligence v1.1</span>
          <span className="text-amber-500 font-mono">ISO 9001</span>
        </div>
      </div>
    </aside>
  </>
);
};
