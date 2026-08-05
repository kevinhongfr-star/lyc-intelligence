/**
 * Design system: Progress
 *
 * Strengthened from the Phase 0 version. Adds:
 *   - `variant` (default | success | warning | danger)
 *   - `size` (sm | md | lg)
 *   - `label` + `valueLabel` for accessible labelling
 *   - `indeterminate` state (animated bar without a value)
 *   - Strict typing + forwardRef + proper aria attributes
 *
 * Existing `<Progress value={n} />` call sites keep rendering unchanged.
 */
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type ProgressVariant = 'default' | 'success' | 'warning' | 'danger';
export type ProgressSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ProgressVariant, string> = {
  default: 'bg-accent',
  success: 'bg-tier-1',
  warning: 'bg-tier-2',
  danger: 'bg-red-600',
};

const SIZES: Record<ProgressSize, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–100. Ignored when `indeterminate` is true. */
  value?: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  /** Accessible label (rendered via aria-label). */
  label?: string;
  /** Optional visible value label (e.g. "75%"). */
  valueLabel?: React.ReactNode;
  /** Indeterminate state — animated bar without a value. */
  indeterminate?: boolean;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  {
    value = 0,
    variant = 'default',
    size = 'md',
    label,
    valueLabel,
    indeterminate = false,
    className,
    ...rest
  },
  ref,
) {
  const clamped = Math.min(100, Math.max(0, value));
  const barStyle = indeterminate ? undefined : { width: `${clamped}%` };

  return (
    <div className={cn('w-full', className)} ref={ref} {...rest}>
      {(label || valueLabel) && (
        <div className="flex items-center justify-between mb-1">
          {label && (
            <span className="text-xs font-medium text-text-secondary">{label}</span>
          )}
          {valueLabel && (
            <span className="text-xs text-text-muted">{valueLabel}</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={indeterminate ? undefined : 0}
        aria-valuemax={indeterminate ? undefined : 100}
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-label={label}
        className={cn(
          'w-full bg-bg-tertiary overflow-hidden',
          SIZES[size],
        )}
      >
        <div
          className={cn(
            'h-full transition-all',
            VARIANTS[variant],
            indeterminate && 'animate-pulse w-1/3',
          )}
          style={barStyle}
        />
      </div>
    </div>
  );
});
