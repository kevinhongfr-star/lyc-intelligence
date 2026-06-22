import React, { useState } from 'react';
import { 
  LayoutDashboard, Briefcase, Kanban, BarChart3, Users, Settings, 
  Bell, Search, ChevronLeft, ChevronRight, User
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';
import { NotificationBell } from './NotificationBell';
import type { ReactNode } from 'react';

interface ClientPortalProps {
  children: ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  requiredRole?: UserRole;
}

export function ClientPortal({ children }: ClientPortalProps) {
  const { profile } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');

  const userRole = profile?.role as UserRole;
  const isAdmin = userRole === 'client_admin';

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'mandates', label: 'Mandates', icon: <Briefcase className="w-5 h-5" /> },
    { id: 'pipeline', label: 'Pipeline', icon: <Kanban className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'team', label: 'Team', icon: <Users className="w-5 h-5" />, requiredRole: 'client_admin' },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, requiredRole: 'client_admin' },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.requiredRole && item.requiredRole !== userRole) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex h-screen bg-bg-primary">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } bg-bg-secondary border-r border-bg-tertiary flex flex-col transition-all duration-300`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-bg-tertiary">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="ml-3 font-bold text-text-primary">DEX AI</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-2">
            {filteredNavItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    activeNav === item.id
                      ? 'bg-accent text-white'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                  }`}
                >
                  {item.icon}
                  {!sidebarCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                  {!sidebarCollapsed && activeNav === item.id && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Toggle */}
        <div className="p-2 border-t border-bg-tertiary">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center py-2 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-bg-secondary border-b border-bg-tertiary flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-10 pr-4 py-2 bg-bg-tertiary border border-transparent rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <NotificationBell />

            {/* User */}
            <div className="flex items-center gap-3 pl-4 border-l border-bg-tertiary">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <User className="w-4 h-4 text-accent" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-text-primary">{profile?.name}</p>
                <p className="text-xs text-text-muted">{userRole === 'client_admin' ? 'Admin' : 'Viewer'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default ClientPortal;
