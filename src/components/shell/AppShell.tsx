/**
 * AppShell — Sidebar layout (Notion/Vercel-style)
 * Left sidebar navigation + main content area
 */
import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { NexusCommandBar } from '@/components/nexus/NexusCommandBar';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { Bell, LogOut, Settings, Search } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export function AppShell() {
  const { user, profile, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [nexusOpen, setNexusOpen] = useState(false);
  const [cmdKOpen, setCmdKOpen] = useState(false);

  // Cmd+K global listener
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdKOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const initials = (profile?.full_name || user?.email || 'U')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Get page title from current path
  const getPageTitle = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    if (segments.length <= 1) return '';
    return segments.slice(1).join(' / ')
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main content area — offset by sidebar width */}
      <div className="ml-60">
        {/* Top bar — minimal, just breadcrumb + user actions */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-[#E5E5E5] h-12 flex items-center px-6 gap-3">
          {/* Breadcrumb / page title */}
          <div className="text-sm text-[#737373] font-medium">
            {getPageTitle()}
          </div>

          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <button onClick={() => setCmdKOpen(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#737373] bg-[#F5F5F5] border border-[#E5E5E5] hover:bg-[#EBEBEB] transition-colors" title="Search (Cmd+K)">
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="text-[9px] text-[#A3A3A3] border border-[#D4D4D4] px-1 py-0.5 bg-white">⌘K</kbd>
            </button>
            <button
              onClick={() => navigate('/app/notifications')}
              className="relative flex items-center justify-center w-8 h-8 text-[#737373] hover:text-[#171717] transition-colors"
            >
              <Bell className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                onBlur={() => setTimeout(() => setUserMenuOpen(false), 150)}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#F5F5F5] transition-colors"
              >
                <div className="w-6 h-6 flex items-center justify-center text-[10px] font-semibold text-[#404040] bg-[#F0F0F0] border border-[#E5E5E5]">
                  {initials}
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-9 w-48 bg-white border border-[#E5E5E5] overflow-hidden z-50 shadow-lg">
                  <div className="px-3 py-2.5 border-b border-[#E5E5E5]">
                    <div className="text-sm font-medium text-[#171717]">{profile?.full_name || 'User'}</div>
                    <div className="text-xs text-[#737373] mt-0.5">{user?.email}</div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { navigate('/app/platform-settings'); setUserMenuOpen(false); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-[#404040] hover:bg-[#F5F5F5]"
                    >
                      <Settings className="w-3.5 h-3.5" /> Settings
                    </button>
                    <button
                      onClick={() => logout()}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-[#404040] hover:bg-[#F5F5F5]"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="px-6 md:px-8 pb-24 pt-6 max-w-[1280px] animate-fadeIn">
          <Outlet />
        </main>
      </div>

      <NexusCommandBar isOpen={nexusOpen} onToggle={() => setNexusOpen(!nexusOpen)} />
      <GlobalSearch isOpen={cmdKOpen} onClose={() => setCmdKOpen(false)} />
    </div>
  );
}

export default AppShell;