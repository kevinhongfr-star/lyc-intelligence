/**
 * Design system: EmptyState
 *
 * #1328 — Premium empty-state illustrations.
 *
 * Strengthened from the Phase 0 version. Adds:
 *   - Variants (default | no-results | no-data | error | welcome)
 *   - Branded SVG illustrations per variant — minimalist line-art in the
 *     LYC accent color, zero border radius, premium magazine aesthetic.
 *     Replaces the generic lucide inbox icon.
 *   - `icon` slot still accepts ReactNode for full override.
 *   - `actionLabel` + `onAction` render via the design-system Button.
 *   - Optional secondary action link.
 *   - Strict typing.
 *
 * Brand rules honored:
 *   - Zero border radius (no rounded rects in SVGs).
 *   - One accent color per illustration (var(--accent)).
 *   - Premium, not SaaS: thin 1.5px strokes, generous negative space.
 *   - Animations 120-350ms (entry fade only, respects reduced motion).
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export type EmptyStateVariant = 'default' | 'no-results' | 'no-data' | 'error' | 'welcome';

/* ── Branded SVG illustrations ────────────────────────────────────
   Each illustration is a 64×64 minimalist line drawing in the accent
   color. Sharp corners only — no rounded rects (zero border radius). */

const ACCENT = 'var(--accent, #C108AB)';
const MUTED = 'var(--text-muted, #888)';

function DefaultIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {/* Tray / inbox — sharp corners */}
      <path d="M8 40 L8 54 L56 54 L56 40" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="square" />
      <path d="M8 40 L18 24 L46 24 L56 40" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M8 40 L24 40 L28 46 L36 46 L40 40 L56 40" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="miter" />
      {/* Accent dot — single point of emphasis */}
      <rect x="30" y="10" width="4" height="4" fill={ACCENT} />
    </svg>
  );
}

function NoResultsIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {/* Magnifier — sharp circle approximated via path with miter joins */}
      <circle cx="27" cy="27" r="14" stroke={ACCENT} strokeWidth="1.5" />
      <path d="M37 37 L50 50" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="square" />
      {/* Sharp X inside lens */}
      <path d="M21 21 L33 33 M33 21 L21 33" stroke={MUTED} strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

function NoDataIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {/* Chart axis — sharp */}
      <path d="M10 50 L10 14 M10 50 L54 50" stroke={MUTED} strokeWidth="1.5" strokeLinecap="square" />
      {/* Empty bar slots — accent outlines, no fill (no data) */}
      <rect x="16" y="34" width="8" height="16" stroke={ACCENT} strokeWidth="1.5" fill="none" />
      <rect x="28" y="26" width="8" height="24" stroke={ACCENT} strokeWidth="1.5" fill="none" />
      <rect x="40" y="20" width="8" height="30" stroke={ACCENT} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function ErrorIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {/* Triangle — sharp corners */}
      <path d="M32 10 L56 52 L8 52 Z" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="miter" />
      {/* Exclamation — sharp */}
      <path d="M32 26 L32 42" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="square" />
      <rect x="30" y="46" width="4" height="4" fill={ACCENT} />
    </svg>
  );
}

function WelcomeIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {/* Speech bubble — sharp corners, zero radius */}
      <path d="M8 12 L56 12 L56 42 L36 42 L28 52 L28 42 L8 42 Z" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="miter" />
      {/* Three dots — as sharp squares (brand rule: zero radius) */}
      <rect x="20" y="24" width="4" height="4" fill={ACCENT} />
      <rect x="30" y="24" width="4" height="4" fill={ACCENT} />
      <rect x="40" y="24" width="4" height="4" fill={ACCENT} />
    </svg>
  );
}

const VARIANT_CONFIG: Record<EmptyStateVariant, { illustration: React.ReactNode; title: string; defaultDescription: string }> = {
  default: {
    illustration: <DefaultIllustration />,
    title: 'Nothing here yet',
    defaultDescription: 'Get started by creating your first item.',
  },
  'no-results': {
    illustration: <NoResultsIllustration />,
    title: 'No results found',
    defaultDescription: 'Try adjusting your search or filters to find what you need.',
  },
  'no-data': {
    illustration: <NoDataIllustration />,
    title: 'No data available',
    defaultDescription: 'Data will appear here once it has been generated.',
  },
  error: {
    illustration: <ErrorIllustration />,
    title: 'Something went wrong',
    defaultDescription: 'An unexpected error occurred. Please try again.',
  },
  welcome: {
    illustration: <WelcomeIllustration />,
    title: 'Welcome',
    defaultDescription: 'This is your dashboard. Let us know if you need help getting started.',
  },
};

export interface EmptyStateProps {
  /** Visual variant. Each maps to a branded SVG illustration + default copy. */
  variant?: EmptyStateVariant;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Override the branded illustration with a custom node. */
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
  variant = 'default',
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
  const config = VARIANT_CONFIG[variant];
  const resolvedIllustration = icon ?? config.illustration;
  const resolvedTitle = title ?? config.title;
  const resolvedDescription = description ?? config.defaultDescription;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'echo-empty-animate',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className,
      )}
      role="status"
    >
      <div className="text-text-muted mb-4" aria-hidden="true">
        {resolvedIllustration}
      </div>
      <h3 className="text-lg font-serif text-text-primary">{resolvedTitle}</h3>
      {resolvedDescription && (
        <p className="mt-2 text-sm text-text-muted max-w-sm">{resolvedDescription}</p>
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
          className="mt-3 text-sm text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {secondaryActionLabel}
        </button>
      )}
    </div>
  );
}
