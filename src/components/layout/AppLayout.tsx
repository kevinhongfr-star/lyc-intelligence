/**
 * AppLayout — Linear-inspired sidebar navigation
 * Key principles: sidebar recedes, content dominates, minimal chrome
 */
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts';
import {
  Briefcase, Users, Calendar, Bell, Settings, LogOut,
  LayoutDashboard, ChevronLeft, ChevronRight, Building2,
} from 'lucide-react';
import { CreditDisplay } from '@/components/ui/CreditDisplay';
import { IconBridge, IconTrident, IconSpark, IconQuest, IconPrism } from '@/components/icons/LycIcons';
import { getNotifications } from '@/services/supabaseApi';

const NAV_ITEMS = [
  { path: '/platform', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/platform/pipeline', icon: IconBridge, label: 'Pipeline' },
  { path: '/platform/mandates', icon: Briefcase, label: 'Mandates' },
  { path: '/platform/candidates', icon: Users, label: 'Candidates' },
  { path: '/platform/companies', icon: Building2, label: 'Companies' },
  { type: 'divider' as const, label: 'Tools' },
  { path: '/platform/batch-scoring', icon: IconTrident, label: 'Match Analysis' },
  { path: '/platform/metrix', icon: IconSpark, label: 'Metrics' },
  { path: '/platform/chat', icon: IconQuest, label: 'Nexus' },
  { path: '/platform/scheduler', icon: Calendar, label: 'Scheduler' },
  { path: '/platform/notifications', icon: Bell, label: 'Alerts' },
  { path: '/platform/documents', icon: IconPrism, label: 'Documents' },
  { path: '/platform/settings', icon: Settings, label: 'Settings', roles: ['admin', 'recruiter'] },
];

type NavItem = { path?: string; icon?: any; label: string; exact?: boolean; type?: 'divider'; roles?: string[] };

export function AppLayout() {
  const { user, logout } = useAuth();
  const userRole = (user as any)?.role || 'user';
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    getNotifications().then(items => setPendingCount(items.filter(n => n.status === 'Pending').length));
  }, []);

  const isActive = (item: NavItem) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path || '');
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'w-56' : 'w-[52px]'}
        flex flex-col transition-all duration-200 ease-out
        bg-[#FAFAFA] border-r border-[#EBEBEB]
      `}>
        {/* Logo */}
        <div className="px-4 h-14 flex items-center border-b border-[#EBEBEB]">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-7 h-7 flex items-center justify-center font-serif font-bold text-white text-xs bg-[#C108AB]">
              L
            </div>
            {sidebarOpen && (
              <span className="font-semibold text-[13px] text-[#171717] tracking-tight">
                LYC Intelligence
              </span>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.filter(item => !item.roles || item.roles.includes(userRole)).map((item, i) => {
            if (item.type === 'divider') {
              return sidebarOpen ? (
                <div key={i} className="px-4 pt-5 pb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[2px] text-[#D4D4D4]">
                    {item.label}
                  </span>
                </div>
              ) : (
                <div key={i} className="mx-3 my-3 border-t border-[#EBEBEB]" />
              );
            }

            const active = isActive(item);
            const isAlerts = item.path === '/platform/notifications';

            return (
              <Link
                key={item.path}
                to={item.path!}
                className={`
                  flex items-center gap-2.5 mx-2 my-px px-2.5 py-[7px] text-[13px] font-medium
                  transition-colors duration-150 relative no-underline
                  ${active
                    ? 'text-[#171717] bg-[#EBEBEB]/60'
                    : 'text-[#A3A3A3] hover:text-[#525252] hover:bg-[#F7F7F7]'
                  }
                `}
              >
                {active && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-[2.5px] bg-[#C108AB]" />
                )}
                <item.icon size={15} className="flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
                {sidebarOpen && isAlerts && pendingCount > 0 && (
                  <span className="ml-auto w-[18px] h-[18px] flex items-center justify-center text-white text-[9px] font-bold bg-[#DC2626]">
                    {pendingCount}
                  </span>
                )}
                {!sidebarOpen && isAlerts && pendingCount > 0 && (
                  <span className="absolute top-1 right-1 w-3 h-3 text-white text-[7px] font-bold flex items-center justify-center bg-[#DC2626]">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 py-2 border-t border-[#EBEBEB] space-y-0.5">
          {sidebarOpen && (
            <div className="px-2 pb-1">
              <CreditDisplay showTier />
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-2.5 py-[7px] mx-2 text-[13px] text-[#A3A3A3] hover:text-[#DC2626] w-full transition-colors"
          >
            <LogOut className="w-[15px] h-[15px]" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2.5 px-2.5 py-[7px] mx-2 text-[13px] text-[#A3A3A3] hover:text-[#525252] w-full transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="w-[15px] h-[15px]" /> : <ChevronRight className="w-[15px] h-[15px]" />}
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 lg:p-10 max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
