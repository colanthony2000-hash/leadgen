import React from 'react';
import {
  LayoutDashboard,
  Building2,
  FileText,
  Kanban,
  Sparkles,
  Menu
} from 'lucide-react';
import { NavItemKey } from './AppSidebar';
import { useApp } from '../../context/AppContext';

interface MobileBottomNavProps {
  currentView: NavItemKey;
  onNavigate: (view: NavItemKey) => void;
  onOpenMobileMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenMobileMenu,
}) => {
  const { procurementNotices, crmLeads } = useApp();
  const openTendersCount = procurementNotices.filter((n) => n.status === 'open').length;

  const tabs: Array<{
    key: NavItemKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'companies', label: 'Directory', icon: Building2 },
    { key: 'tenders', label: 'Tenders', icon: FileText, badge: openTendersCount },
    { key: 'pipeline', label: 'Pipeline', icon: Kanban, badge: crmLeads.length },
    { key: 'research', label: 'AI Intel', icon: Sparkles },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentView === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onNavigate(tab.key)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors relative min-h-[44px] ${
              isActive
                ? 'text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400 scale-105 transition-transform' : 'text-slate-400'}`} />
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 text-[9px] font-mono font-bold px-1 bg-amber-400 text-slate-950 rounded-full leading-none py-0.5">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight truncate max-w-[56px]">
              {tab.label}
            </span>
            {isActive && (
              <span className="w-1 h-1 bg-amber-400 rounded-full mt-0.5" />
            )}
          </button>
        );
      })}

      {/* More / Menu Drawer Toggle */}
      <button
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors text-slate-400 hover:text-slate-200 min-h-[44px]"
      >
        <Menu className="w-5 h-5 text-slate-400" />
        <span className="text-[10px] mt-1 tracking-tight">More</span>
      </button>
    </nav>
  );
};
