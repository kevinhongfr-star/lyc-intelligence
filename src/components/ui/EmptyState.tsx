/**
 * Design system: EmptyState
 *
 * Strengthened from the Phase 0 version. Adds:
 *   - Variants (default | compact) — compact reduces vertical padding
 *   - `icon` slot accepts ReactNode (kept for backwards compat)
 *   - `actionLabel` + `onAction` now render via the design-system Button
 *     so styling stays consistent across portals
 *   - Optional secondary action link
 *   - Strict typing
 */
import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Custom icon. Defaults to an inbox illustration. */
  icon?: React.ReactNode;
  /** Primary action button label. */
  actionLabel?: React.ReactNode;
  /** Primary action handler. */
  onAction?: () => void;
  /** Optional secondary action label (rendered as a link). */
  secondaryActionLabel?: React.ReactNode;
  /** Optional secondary action handler. */
  onSecondaryAction?: () => void;
  /** Compact mode — less vertical padding. */
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className,
      )}
    >
      {icon ?? <Inbox className="w-12 h-12 text-text-muted" aria-hidden="true" />}
      <h3 className="mt-4 text-lg font-serif text-text-primary">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-text-muted max-w-sm">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6">
          {actionLabel}
        </Button>
      )}
      {secondaryActionLabel && onSecondaryAction && (
        <button
          type="button"
          onClick={onSecondaryAction}
          className="mt-3 text-sm text-accent hover:underline"
        >
          {secondaryActionLabel}
        </button>
      )}
    </div>
  );
}
