/**
 * Portal layout system — PortalShell.
 *
 * The composite layout that stitches together Sidebar + TopBar + a
 * scrollable main content region. Active nav state is derived implicitly
 * via NavLink (PortalShell subscribes to the router location so the shell
 * re-renders on navigation), so callers never pass active state down.
 *
 * Must live inside a <Router> (uses useLocation + NavLink via Sidebar).
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Breadcrumbs } from './Breadcrumbs';
import type { PortalShellProps } from './types';

/** Stacked skeleton bars shown while the user profile is still loading. */
function LoadingContent(): React.ReactElement {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

export function PortalShell({
  kind,
  brand,
  nav,
  user,
  onLogout,
  loading = false,
  breadcrumbs = [],
  headerActions,
  children,
}: PortalShellProps): React.ReactElement {
  // Subscribe to route changes so NavLink active state stays in sync.
  useLocation();

  const isLoading = loading && !user;

  return (
    <div
      className="flex h-screen bg-bg-primary"
      data-portal-kind={kind}
    >
      <Sidebar
        nav={nav}
        user={user}
        brand={brand}
        onLogout={onLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          user={user}
          loading={loading}
          actions={headerActions}
          onLogout={onLogout}
          left={<Breadcrumbs items={breadcrumbs} />}
        />

        <main
          id="main-content"
          aria-label="Main content"
          className="flex-1 overflow-auto p-6"
        >
          {isLoading ? <LoadingContent /> : children}
        </main>
      </div>
    </div>
  );
}

export default PortalShell;
