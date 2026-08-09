/**
 * Portal layout system — Sidebar.
 *
 * Renders the brand link, role/user-type filtered navigation, and a footer
 * with a collapse toggle + sign-out button. Navigation uses `NavLink` so
 * active state is derived from the router; this component must live inside
 * a <Router>.
 */
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { V1AuthUser } from '@/hooks/v1/types';
import type { NavItem } from './types';

export interface SidebarProps {
  nav: NavItem[];
  user: V1AuthUser | null;
  brand: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onLogout: () => void | Promise<void>;
}

/** Keep only nav items the user is allowed to see. Null user → none. */
function filterNav(nav: NavItem[], user: V1AuthUser | null): NavItem[] {
  if (!user) return [];
  return nav.filter((item) => {
    if (item.roles && !item.roles.includes(user.role)) return false;
    if (item.userTypes && !item.userTypes.includes(user.user_type)) return false;
    return true;
  });
}

export function Sidebar({
  nav,
  user,
  brand,
  collapsed = false,
  onToggleCollapse,
  onLogout,
}: SidebarProps): React.ReactElement {
  const visibleNav = filterNav(nav, user);
  const brandLabel = collapsed ? brand.slice(0, 3) : brand;

  return (
    <aside
      aria-label="Primary"
      className={cn(
        'flex flex-col bg-bg-secondary border-r border-bg-tertiary shrink-0',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Brand */}
      <div className="h-16 flex items-center px-4 border-b border-bg-tertiary shrink-0">
        <Link
          to="/"
          className="text-text-primary font-serif font-semibold truncate"
          aria-label={brand}
        >
          {brandLabel}
        </Link>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        className="flex-1 overflow-y-auto py-2"
      >
        <ul className="flex flex-col gap-1 px-2">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  aria-label={item.label}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 min-h-[44px] text-sm transition-colors',
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary',
                    )
                  }
                >
                  {Icon && <Icon size={16} className="shrink-0" />}
                  {!collapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {!collapsed && typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-medium px-1.5 py-0.5 leading-none">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-bg-tertiary p-2 shrink-0">
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'flex items-center gap-3 px-3 min-h-[44px] w-full text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors',
              collapsed && 'justify-center px-0',
            )}
          >
            {collapsed ? (
              <ChevronRight size={16} className="shrink-0" />
            ) : (
              <ChevronLeft size={16} className="shrink-0" />
            )}
            {!collapsed && <span>Collapse</span>}
          </button>
        )}
        <button
          type="button"
          onClick={() => void onLogout()}
          aria-label="Sign out"
          className={cn(
            'flex items-center gap-3 px-3 min-h-[44px] w-full text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors',
            collapsed && 'justify-center px-0',
          )}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
