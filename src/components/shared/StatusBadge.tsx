/**
 * StatusBadge — Mandate/candidate status indicator
 * Mockup v14 style: small colored badge with text
 */
import React from 'react';

type StatusVariant = 'active' | 'pending' | 'completed' | 'at-risk' | 'critical' | 'paused' | 'rejected';

interface StatusBadgeProps {
  status: StatusVariant | string;
  size?: 'sm' | 'md';
}

const STATUS_COLORS: Record<StatusVariant, { bg: string; text: string }> = {
  active: { bg: 'bg-green/10', text: 'text-green' },
  pending: { bg: 'bg-amber/10', text: 'text-amber' },
  completed: { bg: 'bg-blue/10', text: 'text-blue' },
  at-risk: { bg: 'bg-amber/10', text: 'text-amber' },
  critical: { bg: 'bg-red/10', text: 'text-red' },
  paused: { bg: 'bg-text-muted/10', text: 'text-text-muted' },
  rejected: { bg: 'bg-red/10', text: 'text-red' },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const variant = (status as StatusVariant) in STATUS_COLORS ? (status as StatusVariant) : 'pending';
  const colors = STATUS_COLORS[variant] || STATUS_COLORS.pending;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xxs' : 'px-3 py-1 text-xs';

  return (
    <span className={`${colors.bg} ${colors.text} rounded-full font-semibold ${sizeClasses}`}>
      {status}
    </span>
  );
}

export default StatusBadge;