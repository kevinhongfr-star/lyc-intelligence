import React from 'react';
import { UserCheck } from 'lucide-react';

interface ConsentStat {
  label: string;
  percent?: number;
  count?: number;
}

const MOCK_STATS: ConsentStat[] = [
  { label: 'Users with full consent', percent: 89 },
  { label: 'Marketing opt-in', percent: 67 },
  { label: 'Data sharing opt-in', percent: 72 },
  { label: 'Pending consent', count: 23 },
];

export function ConsentManagement() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-5">
        <UserCheck className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">CONSENT MANAGEMENT</h3>
      </div>

      <div className="space-y-4">
        {MOCK_STATS.map((s) => {
          const value =
            s.percent !== undefined ? `${s.percent}%` : `${s.count ?? 0} users`;
          return (
            <div key={s.label}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-text-secondary">{s.label}</span>
                <span className="text-text-primary font-semibold">{value}</span>
              </div>
              {s.percent !== undefined && (
                <div className="h-2.5 bg-bg-tertiary">
                  <div className="h-2.5 bg-accent" style={{ width: `${s.percent}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
