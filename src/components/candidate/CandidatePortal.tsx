import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard,
  User,
  Briefcase,
  BarChart3,
  TrendingUp,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const CANDIDATE_NAV = [
  { path: '/candidate', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/candidate/profile', icon: User, label: 'My Profile' },
  { path: '/candidate/applications', icon: Briefcase, label: 'Applications' },
  { path: '/candidate/assessments', icon: BarChart3, label: 'My Assessments' },
  { path: '/candidate/insights', icon: TrendingUp, label: 'Career Insights' },
  { path: '/candidate/settings', icon: Settings, label: 'Settings' },
];

export function CandidatePortal() {
  const { user, profile, signOut } = useAuthStore();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-bg-secondary">
      <aside
        className={cn(
          'flex flex-col bg-bg-primary border-r border-border transition-all duration-200',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="h-16 flex items-center justify-center border-b border-border">
          <span className={cn('font-serif font-bold text-xl text-accent', sidebarCollapsed && 'text-xs')}>
            {sidebarCollapsed ? 'LYC' : 'LYC Intelligence'}
          </span>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {CANDIDATE_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  active
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                {!sidebarCollapsed && active && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-border space-y-2">
          {!sidebarCollapsed && (
            <div className="px-3 py-2">
              <p className="text-xs text-text-muted">
                Logged in as
              </p>
              <p className="text-sm font-medium text-text-primary">
                {user?.email || profile?.email}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {!sidebarCollapsed && 'Sign Out'}
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
