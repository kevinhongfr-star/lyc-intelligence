import React from 'react';
import { Clock } from 'lucide-react';

interface TemporalBadgeProps {
  label: string;
}

export function TemporalBadge({ label }: TemporalBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-bg-secondary border border-bg-tertiary text-xs text-text-secondary">
      <Clock className="w-3 h-3 text-text-muted" />
      {label}
    </span>
  );
}
