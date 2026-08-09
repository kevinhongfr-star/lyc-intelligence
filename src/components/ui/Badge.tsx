/**
 * Design system: Badge
 *
 * Strengthened from the Phase 0 version. Adds:
 *   - `size` prop (sm | md)
 *   - `dot` prop (renders a status dot before the label)
 *   - `forwardRef` for ref forwarding
 *   - Strict typing — no `any`
 *
 * Variant keys (`default | success | warning | danger | info`) are kept
 * identical to the Phase 0 Badge so existing call sites keep rendering
 * unchanged. `info` is new and only opts in for new call sites.
 */
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type BadgeSize = 'sm' | 'md';

const VARIANTS: Record<BadgeVariant, string> = {
  default: 'bg-bg-tertiary text-text-secondary',
  success: 'bg-tier-1Bg text-tier-1',
  warning: 'bg-tier-2Bg text-tier-2',
  danger: 'bg-red-500/15 text-red-600',
  info: 'bg-accent/10 text-accent',
};

const SIZES: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
};

const DOT_COLORS: Record<BadgeVariant, string> = {
  default: 'bg-text-muted',
  success: 'bg-tier-1',
  warning: 'bg-tier-2',
  danger: 'bg-red-600',
  info: 'bg-accent',
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Render a leading status dot. */
  dot?: boolean;
  children?: React.ReactNode;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = 'default', size = 'md', dot = false, children, className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn('inline-block w-1.5 h-1.5', DOT_COLORS[variant])}
        />
      )}
      {children}
    </span>
  );
});
