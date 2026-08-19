/**
 * V1 Design System — EmptyState
 *
 * V4.5.9b — re-skinned to V1 brand rules:
 *   - Line-art glyph (sharp corners only, teal stroke) — no Lucide icons.
 *   - Zero border radius everywhere. No rounded rects in SVGs.
 *   - Single accent color (teal-600) per illustration, ink-500 for muted.
 *   - Title: serif display (Crimson Pro).
 *   - Body: Inter, muted ink-500.
 *   - Action: V1 primary button (teal-800 bg, white text, 0 radius).
 *   - Secondary action: teal-600 text link.
 *   - Subtle fade-in motion (V1: 200ms ease).
 *
 * Variants (default | no-results | no-data | error | welcome) each ship a
 * branded line-art glyph + sensible default copy. The `icon` slot accepts
 * a ReactNode for full override.
 *
 * @example
 * ```tsx
 * <EmptyState variant="no-data" title="No documents yet" />
 * ```
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { V1 } from '@/styles/v1-tokens';

export type EmptyStateVariant = 'default' | 'no-results' | 'no-data' | 'error' | 'welcome';

/* ── Branded line-art glyphs ─────────────────────────────────────
   Each glyph is a 48×48 minimalist line drawing. Sharp corners only —
   no rounded rects (zero border radius). Single teal accent. */

const ACCENT = V1.teal600;
const MUTED = V1.textMuted;

function DefaultGlyph() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Tray / inbox — sharp corners */}
      <path d="M6 30 L6 42 L42 42 L42 30" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="square" />
      <path d="M6 30 L14 18 L34 18 L42 30" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M6 30 L18 30 L21 34 L27 34 L30 30 L42 30" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="miter" />
      {/* Accent dot — single point of emphasis */}
      <rect x="22" y="8" width="4" height="4" fill={ACCENT} />
    </svg>
  );
}

function NoResultsGlyph() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Magnifier */}
      <circle cx="20" cy="20" r="11" stroke={ACCENT} strokeWidth="1.5" />
      <path d="M28 28 L40 40" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="square" />
      {/* Sharp X inside lens */}
      <path d="M15 15 L25 25 M25 15 L15 25" stroke={MUTED} strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

function NoDataGlyph() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Chart axis */}
      <path d="M8 38 L8 10 M8 38 L40 38" stroke={MUTED} strokeWidth="1.5" strokeLinecap="square" />
      {/* Empty bar slots — accent outlines, no fill (no data) */}
      <rect x="12" y="26" width="6" height="12" stroke={ACCENT} strokeWidth="1.5" fill="none" />
      <rect x="21" y="20" width="6" height="18" stroke={ACCENT} strokeWidth="1.5" fill="none" />
      <rect x="30" y="14" width="6" height="24" stroke={ACCENT} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function ErrorGlyph() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Triangle — sharp corners */}
      <path d="M24 8 L42 40 L6 40 Z" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="miter" />
      {/* Exclamation */}
      <path d="M24 20 L24 32" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="square" />
      <rect x="22" y="35" width="4" height="4" fill={ACCENT} />
    </svg>
  );
}

function WelcomeGlyph() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Speech bubble — sharp corners, zero radius */}
      <path d="M6 9 L42 9 L42 32 L27 32 L21 40 L21 32 L6 32 Z" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="miter" />
      {/* Three dots — as sharp squares (brand rule: zero radius) */}
      <rect x="15" y="18" width="4" height="4" fill={ACCENT} />
      <rect x="22" y="18" width="4" height="4" fill={ACCENT} />
      <rect x="29" y="18" width="4" height="4" fill={ACCENT} />
    </svg>
  );
}

const VARIANT_CONFIG: Record<
  EmptyStateVariant,
  { glyph: React.ReactNode; title: string; defaultDescription: string }
> = {
  default: {
    glyph: <DefaultGlyph />,
    title: 'Nothing here yet',
    defaultDescription: 'Create your first item to see it here.',
  },
  'no-results': {
    glyph: <NoResultsGlyph />,
    title: 'No results found',
    defaultDescription: 'Try adjusting your search or filters to find what you need.',
  },
  'no-data': {
    glyph: <NoDataGlyph />,
    title: 'No data available',
    defaultDescription: 'Data will appear here once it has been generated.',
  },
  error: {
    glyph: <ErrorGlyph />,
    title: 'Something went wrong',
    defaultDescription: 'An unexpected error occurred. Please try again.',
  },
  welcome: {
    glyph: <WelcomeGlyph />,
    title: 'Welcome',
    defaultDescription: 'This is your dashboard. Let us know if you need help getting started.',
  },
};

export interface EmptyStateProps {
  /** Visual variant. Each maps to a branded line-art glyph + default copy. */
  variant?: EmptyStateVariant;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Override the branded glyph with a custom node. */
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
  const resolvedGlyph = icon ?? config.glyph;
  const resolvedTitle = title ?? config.title;
  const resolvedDescription = description ?? config.defaultDescription;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: compact ? '32px 16px' : '64px 24px',
    fontFamily: V1.bodyFont,
    color: V1.text,
    animation: `v1-empty-in ${V1.durNormal}ms ${V1.ease} forwards`,
  };

  const glyphWrapStyle: React.CSSProperties = {
    marginBottom: 16,
    color: V1.textMuted,
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: V1.displayFont,
    fontSize: 22,
    fontWeight: V1.fwSemibold,
    color: V1.text,
    letterSpacing: V1.trackingTight,
    lineHeight: V1.leadingHeading,
    margin: 0,
  };

  const descStyle: React.CSSProperties = {
    marginTop: 8,
    fontFamily: V1.bodyFont,
    fontSize: V1.textBodySm,
    color: V1.textMuted,
    lineHeight: V1.leadingBody,
    maxWidth: '24rem',
  };

  // V1 primary action button — teal-800 bg, white text, 0 radius, mono label
  const primaryButtonStyle: React.CSSProperties = {
    marginTop: 24,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    background: V1.teal800,
    color: V1.onDark,
    border: 'none',
    borderRadius: V1.radius,
    fontFamily: V1.monoFont,
    fontSize: V1.textMonoPx,
    fontWeight: V1.fwMedium,
    letterSpacing: V1.trackingMono,
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: `background-color ${V1.durFast}ms ease`,
  };

  // V1 secondary action — teal text link with underline
  const secondaryButtonStyle: React.CSSProperties = {
    marginTop: 12,
    padding: 0,
    background: 'transparent',
    border: 'none',
    color: V1.teal600,
    fontFamily: V1.bodyFont,
    fontSize: V1.textBodySm,
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: 3,
  };

  return (
    <div
      className={cn('v1-scope v1-empty-state', className)}
      style={containerStyle}
      role="status"
    >
      <style>{`
        @keyframes v1-empty-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .v1-empty-primary:focus-visible {
          outline: 2px solid ${V1.teal600};
          outline-offset: 2px;
        }
        .v1-empty-primary:hover { background: ${V1.teal700}; }
        .v1-empty-secondary:focus-visible {
          outline: 2px solid ${V1.teal600};
          outline-offset: 2px;
        }
      `}</style>
      <div style={glyphWrapStyle} aria-hidden="true">
        {resolvedGlyph}
      </div>
      <h3 style={titleStyle}>{resolvedTitle}</h3>
      {resolvedDescription && <p style={descStyle}>{resolvedDescription}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="v1-empty-primary"
          style={primaryButtonStyle}
        >
          {actionLabel}
        </button>
      )}
      {secondaryActionLabel && onSecondaryAction && (
        <button
          type="button"
          onClick={onSecondaryAction}
          className="v1-empty-secondary"
          style={secondaryButtonStyle}
        >
          {secondaryActionLabel}
        </button>
      )}
    </div>
  );
}
