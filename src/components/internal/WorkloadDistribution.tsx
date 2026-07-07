import React from 'react';
import { BarChart3 } from 'lucide-react';

interface WorkloadEntry {
  name: string;
  mandates: number;
}

const MAX_MANDATES = 8;

const MOCK_WORKLOAD: WorkloadEntry[] = [
  { name: 'Kevin Hong', mandates: 5 },
  { name: 'Claire Jin', mandates: 4 },
  { name: 'Marcus/AI', mandates: 8 },
  { name: 'Alessio/AI', mandates: 6 },
];

export function WorkloadDistribution() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">WORKLOAD DISTRIBUTION</h3>
      </div>

      <div className="space-y-4">
        {MOCK_WORKLOAD.map((w) => {
          const pct = (w.mandates / MAX_MANDATES) * 100;
          return (
            <div key={w.name}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-text-primary font-medium">{w.name}</span>
                <span className="text-text-muted">
                  {w.mandates} mandate{w.mandates === 1 ? '' : 's'}
                </span>
              </div>
              <div className="h-6 bg-bg-tertiary">
                <div className="h-6 bg-accent" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
