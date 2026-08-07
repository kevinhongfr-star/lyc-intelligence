/**
 * ClientShell — Client portal layout (Phase 8)
 *
 * Provides the main shell for the client portal with:
 *   - Brand header with logo and user menu
 *   - Sidebar navigation (Dashboard, Pipeline, Reviews, Workflows, Engagement)
 *   - Content area with outlet for child routes
 *   - Notification bell with unread count
 *   - Zero border-radius, crimson #C108AB branding
 */
import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GitBranch,
  ClipboardCheck,
  Workflow,
  BarChart3,
  Bell,
  LogOut,
  User,
  Building2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { fetchNotifications } from '@/services/clientService';

const NAV_ITEMS = [
  { path: '/client', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/client/pipeline', label: 'Candidate Pipeline', icon: GitBranch },
  { path: '/client/reviews', label: 'Reviews & Feedback', icon: ClipboardCheck },
  { path: '/client/workflows', label: 'Workflows', icon: Workflow },
  { path: '/client/engagement', label: 'Engagement', icon: BarChart3 },
];

export function ClientShell() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchNotifications();
      if (!cancelled) setUnreadCount(result.unread_count);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg-secondary flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-bg-tertiary transform transition-transform lg:translate-x-0 lg:static lg:inset-auto lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center gap-3 px-5 border-b border-bg-tertiary">
          <div className="w-9 h-9 flex items-center justify-center text-white font-bold text-sm" style={{ background: '#C108AB' }}>
            LYC
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary">Client Portal</div>
            <div className="text-xs text-text-muted">Executive Search</div>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                }`
              }
              style={({ isActive }) =>
                isActive ? { background: '#C108AB' } : undefined
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-bg-tertiary">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 flex items-center justify-center bg-bg-tertiary text-text-secondary font-semibold text-xs">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">{user?.email || 'User'}</div>
              <div className="text-xs text-text-muted truncate">Client</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-bg-tertiary flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-text-secondary hover:bg-bg-tertiary"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Building2 className="w-4 h-4" />
              <span>Client Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
              onClick={() => navigate('/client/notifications')}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2"
                  style={{ background: '#C108AB' }}
                />
              )}
            </button>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default ClientShell;