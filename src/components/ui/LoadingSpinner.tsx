/**
 * V1 Design System — Loading Spinner (LEGACY)
 *
 * V4.5.9d note: V1 prefers Skeleton (shimmer) over spinners. New V1 surfaces
 * should use `<Skeleton />` from `@/components/ui` for loading states.
 * This spinner is retained for backwards compatibility — color tokens
 * updated to V1 palette (teal-600 accent, ink-500 track) so any existing
 * call site at least renders V1-consistent colors.
 *
 * Supports multiple sizes and thicknesses, respects prefers-reduced-motion.
 *
 * @example
 * ```tsx
 * <LoadingSpinner size="md" label="Loading content" />
 * ```
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { V1 } from '@/styles/v1-tokens';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'accent' | 'current' | 'white';

const SIZE_CONFIG: Record<SpinnerSize, { dimension: number; stroke: number; label: string }> = {
  xs: { dimension: 16, stroke: 2, label: 'w-4 h-4' },
  sm: { dimension: 20, stroke: 2, label: 'w-5 h-5' },
  md: { dimension: 28, stroke: 2.5, label: 'w-7 h-7' },
  lg: { dimension: 40, stroke: 3, label: 'w-10 h-10' },
  xl: { dimension: 56, stroke: 4, label: 'w-14 h-14' },
};

const VARIANT_COLORS: Record<SpinnerVariant, string> = {
  accent: V1.teal600, // V1 primary teal (was fuchsia #C108AB)
  current: 'currentColor',
  white: V1.white,
};

export interface LoadingSpinnerProps {
  /** Visual size preset. */
  size?: SpinnerSize;
  /** Color variant. 'accent' uses the V1 teal-600 brand color. */
  variant?: SpinnerVariant;
  /** Accessible label. Required for screen readers. */
  label?: string;
  /** Additional class names. */
  className?: string;
}

/**
 * Legacy spinner (V1 prefers `<Skeleton />`). Renders a rotating SVG circle.
 * Accessible: role="status", aria-busy, visually-hidden label.
 */
export function LoadingSpinner({
  size = 'md',
  variant = 'accent',
  label = 'Loading',
  className,
}: LoadingSpinnerProps) {
  const config = SIZE_CONFIG[size];
  const color = VARIANT_COLORS[variant];
  const radius = (config.dimension - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <span
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className={cn('v1-scope inline-flex items-center justify-center', config.label, className)}
    >
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .v1-spinner-rotate { animation: none !important; }
        }
      `}</style>
      <svg
        className="v1-spinner-rotate animate-spin"
        width={config.dimension}
        height={config.dimension}
        viewBox={`0 0 ${config.dimension} ${config.dimension}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Track — V1 ink-200 (was echo-text-primary/20) */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          stroke={V1.border}
          strokeWidth={config.stroke}
          opacity={1}
          fill="none"
        />
        {/* Spinner arc — V1 teal-600 accent */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          stroke={color}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.75}
          fill="none"
          style={{ transformOrigin: 'center' }}
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
