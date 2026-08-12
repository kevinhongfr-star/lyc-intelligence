/**
 * Design system: LoadingState + ErrorState (#33)
 *
 * Standardised centred states for page-level + card-level content.
 * Uses tokens + no-radius rule. Print-aware.
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';

/* ── LoadingState ─────────────────────────────────────────────────── */

export type LoadingStateSize = 'sm' | 'md' | 'lg';

export interface LoadingStateProps {
  label?: string;
  subLabel?: string;
  size?: LoadingStateSize;
  fullPage?: boolean;
  className?: string;
}

const SIZES: Record<LoadingStateSize, { pad: string; label: string; sub: string }> = {
  sm: { pad: 'py-8', label: 'text-sm', sub: 'text-xs' },
  md: { pad: 'py-16', label: 'text-base', sub: 'text-sm' },
  lg: { pad: 'py-32', label: 'text-lg', sub: 'text-base' },
};

export function LoadingState({
  label = 'Loading...',
  subLabel,
  size = 'md',
  fullPage = false,
  className,
}: LoadingStateProps) {
  const s = SIZES[size];
  return (
    <div
      data-print="hide"
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-4 text-center',
        s.pad,
        fullPage && 'min-h-[60vh]',
        className,
      )}
    >
      <LoadingSpinner />
      <div className="flex flex-col items-center gap-1">
        <p className={cn('m-0 text-[var(--color-text-secondary)]', s.label)}>
          {label}
        </p>
        {subLabel && (
          <p className={cn('m-0 text-[var(--color-muted)]', s.sub)}>
            {subLabel}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── ErrorState ───────────────────────────────────────────────────── */

export interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: Error | string | null;
  retryLabel?: string;
  onRetry?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  fullPage?: boolean;
  compact?: boolean;
  className?: string;
}

export function ErrorState({
  title = "Something didn't load",
  description = "A request failed. Retry — if the problem persists we've already been notified.",
  error,
  retryLabel = 'Retry',
  onRetry,
  secondaryLabel,
  onSecondary,
  fullPage = false,
  compact = false,
  className,
}: ErrorStateProps) {
  const errText =
    typeof error === 'string' ? error : error?.message ?? null;
  return (
    <div
      data-print="hide"
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center mx-auto w-full',
        compact ? 'py-6 max-w-md' : 'py-12 max-w-lg',
        fullPage && 'min-h-[60vh]',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center border border-[var(--color-error)] bg-[var(--color-error)]/5"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[var(--color-error)]"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h3 className="m-0 mt-5 font-[var(--font-display)] font-semibold text-[var(--color-text)] text-xl leading-snug">
        {title}
      </h3>
      <p className="m-0 mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-md">
        {description}
      </p>

      {errText && !compact && (
        <pre className="mt-4 w-full max-w-md overflow-x-auto p-3 text-left text-[11px] font-[var(--font-mono)] text-[var(--color-text-secondary)] bg-[var(--color-bg-alt)] border border-[var(--color-border-subtle)] whitespace-pre-wrap">
          {errText}
        </pre>
      )}

      <div className={cn('mt-6 flex items-center gap-3', compact && 'mt-4')}>
        {onRetry && (
          <Button variant="default" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
        {secondaryLabel && onSecondary && (
          <Button variant="ghost" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
