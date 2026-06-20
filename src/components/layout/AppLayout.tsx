import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { BarChart3, Users, Briefcase, Calendar, Bell, Settings, LogOut, LayoutDashboard, Zap, MessageSquare, Activity, ClipboardList, Eye, FileDown, Sun, Moon, Building2 } from 'lucide-react';
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
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('lyc-theme') as 'dark' | 'light') || 'light');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    getNotifications().then(items => {
      setPendingCount(items.filter(n => n.status === 'Pending').length);
    });
  }, []);

  // Apply theme to document for CSS variable switching
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
    <div className="flex h-screen bg-bg-primary">
      <aside className={`${sidebarOpen ? 'w-56' : 'w-16'} bg-bg-secondary border-r border-bg-tertiary flex flex-col transition-all`}>
        <div className="p-4 border-b border-bg-tertiary">
          <Link to="/" className="font-serif font-bold text-lg text-text-primary hover:text-accent transition-colors no-underline block">
            {sidebarOpen ? 'LYC Intelligence' : 'LYC'}
          </Link>
        </div>
        
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.filter(item => !item.roles || item.roles.includes(userRole)).map((item, i) => {
            if (item.type === 'divider') {
              return sidebarOpen ? (
                <div key={i} className="px-4 pt-4 pb-1"><span className="text-[9px] uppercase tracking-[2.5px] text-accent font-semibold">{item.label}</span></div>
              ) : (
                <div key={i} className="mx-2 my-2 border-t border-bg-tertiary" />
              );
            }
            const isAlerts = item.path === '/platform/notifications';
            return (
              <Link key={item.path} to={item.suffix ? `${item.path}${item.suffix}` : item.path!} className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors relative ${isActive(item) ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary'}`}>
                {item.icon && <item.icon size={16} className="flex-shrink-0" />}
                {sidebarOpen && <span className="flex-1">{item.label}</span>}
                {sidebarOpen && isAlerts && pendingCount > 0 && (
                  <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {pendingCount}
                  </span>
                )}
                {!sidebarOpen && isAlerts && pendingCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-bg-tertiary space-y-2">
          {sidebarOpen && <CreditDisplay showTier />}
          <button onClick={toggleTheme} className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary w-full min-h-[44px]">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}{sidebarOpen && (theme === 'dark' ? 'Light Mode' : 'Dark Mode')}
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary w-full min-h-[44px]">
            {sidebarOpen ? '← Collapse' : '→'}
          </button>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary w-full min-h-[44px]">
            <LogOut className="w-4 h-4" />{sidebarOpen && 'Sign Out'}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6"><Outlet /></main>
    </div>
  );
}
