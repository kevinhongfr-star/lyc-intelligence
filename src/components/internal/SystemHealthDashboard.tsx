import React, { useState } from 'react';
import { Activity } from 'lucide-react';

interface HealthStat {
  label: string;
  value: string;
  barPercent: number;
  barClass: string;
}

const HEALTH_STATS: HealthStat[] = [
  { label: 'Uptime', value: '99.7%', barPercent: 99.7, barClass: 'bg-teal' },
  { label: 'Error Rate', value: '0.3%', barPercent: 0.3, barClass: 'bg-warning' },
  { label: 'Latency', value: '142ms', barPercent: 28, barClass: 'bg-accent' },
];

const TIME_RANGES = ['24h', '7d', '30d'] as const;
type TimeRange = (typeof TIME_RANGES)[number];

export function SystemHealthDashboard() {
  const [range, setRange] = useState<TimeRange>('24h');

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" />
          <h3 className="font-serif text-lg font-bold text-text-primary">SYSTEM HEALTH</h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-muted">Last:</span>
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={
                range === r
                  ? 'text-accent font-semibold'
                  : 'text-text-muted hover:text-text-primary transition-colors'
              }
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {HEALTH_STATS.map((s) => (
          <div key={s.label} className="bg-bg-secondary border border-bg-tertiary p-4">
            <div className="text-xs text-text-muted uppercase tracking-wider">{s.label}</div>
            <div className="font-serif text-2xl font-bold text-text-primary mt-1">{s.value}</div>
            <div className="mt-3 h-1.5 bg-bg-tertiary">
              <div className={`h-full ${s.barClass}`} style={{ width: `${s.barPercent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
