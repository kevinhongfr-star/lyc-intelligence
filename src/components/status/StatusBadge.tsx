import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'filled' | 'outlined' | 'soft';
export type BadgeColor = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

const COLOR_MAP: Record<BadgeColor, { bg: string; text: string; border: string }> = {
  primary: { bg: 'bg-[var(--echo-primary-600)]', text: 'text-white', border: 'border-[var(--echo-primary-600)]' },
  success: { bg: 'bg-[var(--echo-success)]', text: 'text-white', border: 'border-[var(--echo-success)]' },
  warning: { bg: 'bg-[var(--echo-warning)]', text: 'text-white', border: 'border-[var(--echo-warning)]' },
  error: { bg: 'bg-[var(--echo-error)]', text: 'text-white', border: 'border-[var(--echo-error)]' },
  info: { bg: 'bg-[var(--echo-info)]', text: 'text-white', border: 'border-[var(--echo-info)]' },
  neutral: { bg: 'bg-[var(--echo-neutral-500)]', text: 'text-white', border: 'border-[var(--echo-neutral-500)]' },
};

const SOFT_COLOR_MAP: Record<BadgeColor, string> = {
  primary: 'bg-[var(--echo-primary-50)] text-[var(--echo-primary-700)] border-[var(--echo-primary-200)]',
  success: 'bg-[var(--echo-success-soft)] text-[var(--echo-success)] border-[var(--echo-success)]/20',
  warning: 'bg-[var(--echo-warning-soft)] text-[var(--echo-warning)] border-[var(--echo-warning)]/20',
  error: 'bg-[var(--echo-error-soft)] text-[var(--echo-error)] border-[var(--echo-error)]/20',
  info: 'bg-[var(--echo-info-soft)] text-[var(--echo-info)] border-[var(--echo-info)]/20',
  neutral: 'bg-[var(--echo-neutral-100)] text-[var(--echo-neutral-700)] border-[var(--echo-neutral-300)]',
};

const SIZE_MAP: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-0.5 text-sm',
  lg: 'px-3 py-1 text-base',
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  color?: BadgeColor;
  size?: BadgeSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function StatusBadge({
  variant = 'filled',
  color = 'neutral',
  size = 'md',
  icon,
  className,
  children,
  ...rest
}: StatusBadgeProps) {
  const sizeClass = SIZE_MAP[size];

  if (variant === 'outlined') {
    const c = COLOR_MAP[color];
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 font-medium border rounded-none',
          c.text,
          sizeClass,
          className,
        )}
        {...rest}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </span>
    );
  }

  if (variant === 'soft') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 font-medium border rounded-none',
          SOFT_COLOR_MAP[color],
          sizeClass,
          className,
        )}
        {...rest}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </span>
    );
  }

  const c = COLOR_MAP[color];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-none',
        c.bg,
        c.text,
        sizeClass,
        className,
      )}
      {...rest}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
