import React from 'react';

type PipelineStage =
  | 'sourcing' | 'screening' | 'shortlisted' | 'interview'
  | 'offer' | 'placed' | 'rejected' | 'withdrawn';

interface PipelineStageBadgeProps {
  stage?: PipelineStage | string;
  className?: string;
}

const STYLES: Record<string, string> = {
  sourcing: 'bg-blue-50 text-blue-700 border-blue-200',
  screening: 'bg-sky-50 text-sky-700 border-sky-200',
  shortlisted: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  interview: 'bg-amber-50 text-amber-700 border-amber-200',
  offer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  placed: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  withdrawn: 'bg-gray-50 text-gray-600 border-gray-200',
};

const LABELS: Record<string, string> = {
  sourcing: 'Sourcing',
  screening: 'Screening',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  offer: 'Offer',
  placed: 'Placed',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export function PipelineStageBadge({ stage = 'sourcing', className = '' }: PipelineStageBadgeProps) {
  const style = STYLES[stage] || STYLES.sourcing;
  const label = LABELS[stage] || String(stage || 'Unknown');
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-none border text-[11px] font-semibold uppercase tracking-wide ${style} ${className}`}>
      {label}
    </span>
  );
}

export default PipelineStageBadge;
