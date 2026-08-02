import React from 'react';

type EnrichmentStatus = 'pending' | 'enriching' | 'completed' | 'failed' | 'not_started';

interface EnrichmentStatusBadgeProps {
  status?: EnrichmentStatus;
  progress?: number;
  className?: string;
}

const STATUS_CONFIG: Record<EnrichmentStatus, { label: string; className: string }> = {
  not_started: { label: 'Not Started', className: 'bg-gray-100 text-gray-600' },
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
  enriching: { label: 'Enriching', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Complete', className: 'bg-green-100 text-green-700' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-700' },
};

export function EnrichmentStatusBadge({ status = 'not_started', progress, className = '' }: EnrichmentStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  const displayLabel = status === 'enriching' && progress !== undefined
    ? `${config.label} ${progress}%`
    : config.label;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${config.className} ${className}`}>
      {status === 'enriching' && (
        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5 animate-pulse" />
      )}
      {displayLabel}
    </span>
  );
}

export default EnrichmentStatusBadge;
