/**
 * Portal layout system — TopBar.
 *
 * A slim header that sits above the main content area. The left slot is
 * reserved for breadcrumbs / a mobile menu trigger (passed in via `left`);
 * the right slot shows either the caller-supplied `actions` node or, by
 * default, the signed-in user's email plus a sign-out icon button.
 *
 * Presentational only — no data fetching.
 */
import React from 'react';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui';
import type { V1AuthUser } from '@/hooks/v1/types';

export interface TopBarProps {
  user: V1AuthUser | null;
  loading?: boolean;
  /** Rendered in the right slot when provided (overrides the default user/sign-out). */
  actions?: React.ReactNode;
  /** Left slot — typically <Breadcrumbs /> or a mobile menu trigger. */
  left?: React.ReactNode;
  /** Optional sign-out handler wired to the default sign-out icon button. */
  onLogout?: () => void | Promise<void>;
  className?: string;
}

export function TopBar({
  user,
  loading = false,
  actions,
  left,
  onLogout,
  className,
}: TopBarProps): React.ReactElement {
  return (
    <header
      className={cn(
        'h-16 flex items-center justify-between gap-4 px-6 bg-bg-primary border-b border-bg-tertiary shrink-0',
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">{left}</div>

      <div className="flex items-center gap-3 shrink-0">
        {actions ? (
          actions
        ) : loading && !user ? (
          <Skeleton className="h-6 w-40" />
        ) : user ? (
          <>
            <span
              className="text-sm text-text-secondary truncate max-w-[16rem]"
              title={user.email}
            >
              {user.email}
            </span>
            <button
              type="button"
              onClick={() => {
                if (onLogout) void onLogout();
              }}
              disabled={!onLogout}
              aria-label="Sign out"
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
            >
              <LogOut size={18} />
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}

export default TopBar;
