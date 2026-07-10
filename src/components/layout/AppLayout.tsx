import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { BarChart3, Users, Briefcase, Calendar, Bell, Settings, LogOut, LayoutDashboard, Zap, MessageSquare, Activity, ClipboardList, Eye, FileDown, Sun, Moon, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { CreditDisplay } from '@/components/ui/CreditDisplay';
import { IconBridge, IconTrident, IconDrive, IconLeap, IconImpact, IconSpark, IconQuest, IconForge, IconPrism } from '@/components/icons/LycIcons';
import { getNotifications } from '@/services/supabaseApi';

const NAV_ITEMS = [
  { path: '/platform', icon: IconImpact, label: 'Dashboard', exact: true },
  { path: '/platform/pipeline', icon: IconBridge, label: 'Pipeline' },
  { path: '/platform/mandates', icon: Briefcase, label: 'Mandates' },
  { path: '/platform/candidates', icon: Users, label: 'Candidates' },
  { path: '/platform/companies', icon: Building2, label: 'Companies' },
  { type: 'divider' as const, label: 'Scoring' },
  { path: '/platform/batch-scoring', icon: IconTrident, label: 'Match Analysis' },
  { path: '/platform/mandates', icon: FileDown, label: 'Candidate Report', suffix: '/lens' },
  { path: '/platform/metrix', icon: IconSpark, label: 'Performance Metrics' },
  { path: '/platform/scoring-runs', icon: ClipboardList, label: 'Scoring Runs' },
  { type: 'divider' as const, label: 'Tools' },
  { path: '/platform/chat', icon: IconQuest, label: 'Nexus' },
  { path: '/platform/scheduler', icon: Calendar, label: 'Scheduler' },
  { path: '/platform/documents', icon: IconPrism, label: 'Documents' },
  { path: '/platform/notifications', icon: Bell, label: 'Alerts' },
  { path: '/platform/settings', icon: IconForge, label: 'Settings', roles: ['admin', 'recruiter'] },
];

type NavItem = { path?: string; icon?: any; label: string; exact?: boolean; type?: 'divider'; suffix?: string; roles?: string[] };

export function AppLayout() {
  const { user, logout } = useAuth();
  const userRole = (user as any)?.role || 'user';
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('lyc-theme') as 'dark' | 'light') || 'light'
  );
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    getNotifications().then(items => {
      setPendingCount(items.filter(n => n.status === 'Pending').length);
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('lyc-theme', newTheme);
    window.dispatchEvent(new CustomEvent('theme-change', { detail: newTheme }));
  };

  const isActive = (item: NavItem) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path || '');
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--color-bg, #FAF9F7)' }}>
      {/* ── Sidebar ── */}
      <aside
        className={`
          ${sidebarOpen ? 'w-60' : 'w-[68px]'} 
          flex flex-col transition-all duration-300 ease-out
          border-r
        `}
        style={{
          background: 'var(--color-card, #FFFFFF)',
          borderColor: '#F0EDEA',
          boxShadow: '1px 0 0 rgba(26,23,20,0.03)',
        }}
      >
        {/* Logo */}
        <div className="px-5 h-16 flex items-center border-b" style={{ borderColor: '#F0EDEA' }}>
          <Link to="/" className="flex items-center gap-3 no-underline group">
            <div
              className="w-8 h-8 flex items-center justify-center font-serif font-bold text-white text-sm"
              style={{ background: '#C108AB' }}
            >
              L
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="font-serif font-bold text-sm text-[var(--color-text)] leading-none">
                  LYC
                </span>
                <span className="text-[9px] uppercase tracking-[2px] text-[#8C857D] font-medium mt-0.5">
                  Intelligence
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.filter(item => !item.roles || item.roles.includes(userRole)).map((item, i) => {
            if (item.type === 'divider') {
              return sidebarOpen ? (
                <div key={i} className="px-5 pt-5 pb-1.5">
                  <span className="text-[9px] uppercase tracking-[2.5px] text-[#B8B0A6] font-bold">
                    {item.label}
                  </span>
                </div>
              ) : (
                <div key={i} className="mx-3 my-3 border-t" style={{ borderColor: '#F0EDEA' }} />
              );
            }

            const isAlerts = item.path === '/platform/notifications';
            const active = isActive(item);

            return (
              <Link
                key={item.path}
                to={item.suffix ? `${item.path}${item.suffix}` : item.path!}
                className={`
                  flex items-center gap-3 mx-2 my-0.5 px-3 py-2.5 text-[13px] font-medium
                  transition-all duration-200 relative no-underline
                  ${active
                    ? 'text-[#C108AB]'
                    : 'text-[#4A4541] hover:text-[#1A1714]'
                  }
                `}
                style={{
                  background: active ? 'rgba(193,8,171,0.06)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = '#FAF9F7';
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {/* Active indicator bar */}
                {active && (
                  <div
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px]"
                    style={{ background: '#C108AB' }}
                  />
                )}
                {item.icon && <item.icon size={16} className="flex-shrink-0" />}
                {sidebarOpen && <span className="flex-1 truncate">{item.label}</span>}
                {sidebarOpen && isAlerts && pendingCount > 0 && (
                  <span
                    className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-white text-[10px] font-bold"
                    style={{ background: '#C0392B' }}
                  >
                    {pendingCount}
                  </span>
                )}
                {!sidebarOpen && isAlerts && pendingCount > 0 && (
                  <span
                    className="absolute top-1 right-1 w-4 h-4 rounded-full text-white text-[8px] font-bold flex items-center justify-center"
                    style={{ background: '#C0392B' }}
                  >
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t space-y-1" style={{ borderColor: '#F0EDEA' }}>
          {sidebarOpen && (
            <div className="px-2 pb-2">
              <CreditDisplay showTier />
            </div>
          )}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2 text-[13px] text-[#4A4541] hover:text-[#1A1714] w-full min-h-[40px] transition-colors"
            style={{ background: 'transparent' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#FAF9F7'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {sidebarOpen && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-3 px-3 py-2 text-[13px] text-[#4A4541] hover:text-[#1A1714] w-full min-h-[40px] transition-colors"
            style={{ background: 'transparent' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#FAF9F7'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {sidebarOpen && <span>Collapse</span>}
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 text-[13px] text-[#4A4541] hover:text-[#C0392B] w-full min-h-[40px] transition-colors"
            style={{ background: 'transparent' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(192,57,43,0.04)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
