import React from 'react';
import { cn } from '@/lib/utils';

export type StatusType = 'active' | 'inactive' | 'pending' | 'error' | 'success' | 'warning' | 'info';

const STATUS_COLORS: Record<StatusType, string> = {
  active: 'bg-green-500',
  inactive: 'bg-gray-400',
  pending: 'bg-yellow-500',
  error: 'bg-red-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

const STATUS_SOFT: Record<StatusType, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  info: 'bg-blue-100 text-blue-700',
};

export interface StatusDotProps {
  status: StatusType;
  label?: string;
  showPulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusDot({ status, label, showPulse = false, size = 'md', className }: StatusDotProps) {
  const sizeMap = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' };

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative flex items-center justify-center">
        <span
          className={cn(
            sizeMap[size],
            STATUS_COLORS[status],
            '',
            showPulse && 'animate-ping absolute opacity-75',
          )}
          aria-hidden="true"
        />
        <span
          className={cn(sizeMap[size], STATUS_COLORS[status], 'relative')}
          aria-hidden="true"
        />
      </span>
      {label && <span className="text-sm text-[var(--echo-text-secondary)]">{label}</span>}
    </span>
  );
}

export interface StatusPillProps {
  status: StatusType;
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusPill({ status, label, size = 'md', className }: StatusPillProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        STATUS_SOFT[status],
        sizeClasses[size],
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5', STATUS_COLORS[status])} aria-hidden="true" />
      {label}
    </span>
  );
}
