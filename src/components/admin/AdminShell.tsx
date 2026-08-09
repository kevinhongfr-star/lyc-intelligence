/**
 * AdminShell — admin layout with sidebar navigation and topbar.
 * Zero border-radius, crimson #C108AB brand accent.
 */
import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  BarChart3,
  FileText,
  Settings,
  CreditCard,
  Flag,
  ChevronRight,
  Menu,
  X,
  Search,
  Bell,
  UserCircle2,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/organizations', label: 'Organizations', icon: Building2 },
  { to: '/admin/moderation', label: 'Moderation', icon: Flag },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/billing', label: 'Billing', icon: CreditCard },
  { to: '/admin/audit', label: 'Audit Log', icon: FileText },
  { to: '/admin/config', label: 'System Config', icon: Settings },
  { to: '/admin/rbac', label: 'Roles & Permissions', icon: Shield },
];

const AdminShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-bg text-text-primary flex">
      <aside
        className={`fixed lg:relative lg:translate-x-0 top-0 left-0 h-screen w-64 bg-white border-r border-border z-50 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center h-16 px-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-fuchsia flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-serif text-lg font-semibold">Admin Portal</span>
          </div>
          <button
            className="lg:hidden ml-auto p-1 hover:bg-bg-warm"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                  ? 'bg-fuchsia text-white'
                  : 'text-text-secondary hover:bg-bg-warm hover:text-text-primary'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              <ChevronRight className="w-3 h-3 ml-auto opacity-60" />
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-text-primary flex items-center justify-center">
              <UserCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Admin User</p>
              <p className="text-xs text-text-muted truncate">admin@lyc.com</p>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-border flex items-center px-4 lg:px-6 gap-4">
          <button
            className="lg:hidden p-2 hover:bg-bg-warm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search users, organizations, configs..."
                className="w-full pl-10 pr-4 py-2 bg-bg border border-border text-sm
                  placeholder:text-text-muted focus:outline-none focus:border-fuchsia"
              />
            </div>
          </div>

          <button className="p-2 hover:bg-bg-warm relative">
            <Bell className="w-5 h-5 text-text-secondary" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-fuchsia"></span>
          </button>

          <div className="w-px h-6 bg-border" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-fuchsia flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
