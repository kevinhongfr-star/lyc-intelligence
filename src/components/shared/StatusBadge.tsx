/**
 * StatusBadge — Mandate/candidate status indicator
 * Mockup v14 style: small colored badge with text
 */
import React from 'react';

type StatusVariant = 'active' | 'pending' | 'completed' | 'at_risk' | 'critical' | 'paused' | 'rejected';

interface StatusBadgeProps {
  status: StatusVariant | string;
  size?: 'sm' | 'md';
}

const STATUS_COLORS: Record<StatusVariant, { bg: string; text: string }> = {
  active: { bg: 'bg-green-500/10', text: 'text-green-600' },
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
  completed: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
  at_risk: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
  critical: { bg: 'bg-red-500/10', text: 'text-red-600' },
  paused: { bg: 'bg-gray-500/10', text: 'text-gray-600' },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-600' },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const normalizedStatus = status.replace(/-/g, '_') as StatusVariant;
  const variant = normalizedStatus in STATUS_COLORS ? normalizedStatus : 'pending';
  const colors = STATUS_COLORS[variant] || STATUS_COLORS.pending;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xxs' : 'px-3 py-1 text-xs';

  return (
    <span className={`${colors.bg} ${colors.text} rounded-full font-semibold ${sizeClasses}`}>
      {status}
    </span>
  );
}

export default StatusBadge;