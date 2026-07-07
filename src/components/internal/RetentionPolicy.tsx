import React from 'react';
import { Archive } from 'lucide-react';

interface RetentionStat {
  label: string;
  value: string;
}

const MOCK_STATS: RetentionStat[] = [
  { label: 'Active records', value: '2,847' },
  { label: 'Archived >2yr', value: '412' },
  { label: 'Pending deletion', value: '28' },
  { label: 'Next auto-cleanup', value: 'Jul 15' },
];

export function RetentionPolicy() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-5">
        <Archive className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">RETENTION POLICY</h3>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_STATS.map((s) => (
          <div key={s.label} className="bg-bg-secondary border border-bg-tertiary p-4">
            <div className="text-xs text-text-muted uppercase tracking-wider">{s.label}</div>
            <div className="font-serif text-2xl font-bold text-text-primary mt-1">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
