/**
 * Phase 5: ECHO v6.0 Loading Spinner
 *
 * Design-aligned spinner with the ECHO #C108AB accent color.
 * Supports multiple sizes and thicknesses.
 *
 * Uses an SVG circle animation for crisp rendering at any size.
 * Automatically respects `prefers-reduced-motion` via the
 * motion.css keyframes.
 *
 * @example
 * ```tsx * <LoadingSpinner size="md" label="Loading content" /> *```
 */
import React from 'react';
import { cn } from '@/lib/utils';

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
  accent: '#C108AB',
  current: 'currentColor',
  white: '#FFFFFF',
};

export interface LoadingSpinnerProps {
  /** Visual size preset. */
  size?: SpinnerSize;
  /** Color variant. 'accent' uses the #C108AB brand color. */
  variant?: SpinnerVariant;
  /** Accessible label. Required for screen readers. */
  label?: string;
  /** Additional class names. */
  className?: string;
}

/**
 * ECHO v6.0 design-aligned loading spinner.
 *
 * Renders a rotating SVG circle with the brand accent color by default.
 * The spinner is accessible: it uses `role="status"` and `aria-busy`,
 * and includes a visually-hidden label for screen readers.
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
      className={cn('inline-flex items-center justify-center', config.label, className)}
    >
      <svg
        className="animate-spin"
        width={config.dimension}
        height={config.dimension}
        viewBox={`0 0 ${config.dimension} ${config.dimension}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          stroke={color}
          strokeWidth={config.stroke}
          opacity={0.2}
          fill="none"
        />
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
