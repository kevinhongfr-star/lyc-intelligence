/**
 * Design system: NotificationCenter (#33, shared chrome primitive)
 *
 * Bell icon badge button → panel reveals list of notifications.
 * Used by TopBar (portals/TopBar). Marked print-hidden. Zero radius.
 */
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'milestone';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  createdAt: string; // ISO
  read: boolean;
  linkHref?: string;
  linkLabel?: string;
}

export interface NotificationCenterProps {
  notifications: NotificationItem[];
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onDismiss?: (id: string) => void;
  className?: string;
}

const TYPE_ACCENT: Record<NotificationType, string> = {
  info: 'bg-[var(--color-info)]',
  success: 'bg-[var(--color-success)]',
  warning: 'bg-[var(--color-warning)]',
  error: 'bg-[var(--color-error)]',
  milestone: 'bg-[var(--color-accent)]',
};

export function NotificationCenter({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  className,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const p = panelRef.current, b = btnRef.current;
      if (!p || !b) return;
      if (!p.contains(e.target as Node) && !b.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      className={cn('relative no-print', className)}
      data-no-print
    >
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread ? `Notifications (${unread} unread)` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="relative inline-flex h-10 w-10 items-center justify-center border border-[var(--color-border-subtle)] bg-[var(--color-card)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-card-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 min-h-5 min-w-5 px-1 flex items-center justify-center text-[10px] font-[var(--font-mono)] text-[var(--color-on-accent)] bg-[var(--color-accent)]"
            aria-hidden="true"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-[120] mt-2 w-[min(90vw,380px)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-lg)]"
        >
          <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
            <h2 className="font-[var(--font-display)] text-lg text-[var(--color-text)] m-0">
              Notifications
            </h2>
            {unread > 0 && onMarkAllRead && (
              <button
                type="button"
                onClick={() => onMarkAllRead()}
                className="text-xs font-medium text-[var(--color-accent)] hover:underline"
              >
                Mark all read
              </button>
            )}
          </header>

          <ul
            role="list"
            className="max-h-[360px] overflow-y-auto divide-y divide-[var(--color-border-subtle)]"
          >
            {notifications.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-[var(--color-muted)]">
                You're all caught up.
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    'px-4 py-3 transition-colors',
                    !n.read && 'bg-[var(--color-accent-5)]',
                  )}
                >
                  <div className="flex gap-3">
                    <span
                      className={cn('mt-1 h-2 w-2 shrink-0', TYPE_ACCENT[n.type])}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            'text-sm m-0',
                            !n.read
                              ? 'text-[var(--color-text)] font-medium'
                              : 'text-[var(--color-text-secondary)]',
                          )}
                        >
                          {n.title}
                        </p>
                        <time
                          dateTime={n.createdAt}
                          className="shrink-0 text-[10px] font-[var(--font-mono)] text-[var(--color-muted)]"
                        >
                          {formatRelative(n.createdAt)}
                        </time>
                      </div>
                      {n.description && (
                        <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-snug">
                          {n.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3">
                        {n.linkHref && (
                          <a
                            href={n.linkHref}
                            onClick={() => onMarkRead?.(n.id)}
                            className="text-xs text-[var(--color-accent)] hover:underline"
                          >
                            {n.linkLabel ?? 'View'}
                          </a>
                        )}
                        {!n.read && onMarkRead && (
                          <button
                            type="button"
                            onClick={() => onMarkRead(n.id)}
                            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text-secondary)]"
                          >
                            Mark read
                          </button>
                        )}
                        {onDismiss && (
                          <button
                            type="button"
                            onClick={() => onDismiss(n.id)}
                            className="ml-auto text-xs text-[var(--color-muted)] hover:text-[var(--color-error)]"
                            aria-label="Dismiss"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────────────── */

function formatRelative(iso: string): string {
  try {
    const ms = Date.now() - new Date(iso).getTime();
    const min = Math.round(ms / 60000);
    if (min < 1) return 'now';
    if (min < 60) return `${min}m`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}h`;
    const d = Math.round(hr / 24);
    return `${d}d`;
  } catch {
    return '';
  }
}
