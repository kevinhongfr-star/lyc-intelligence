import React from 'react';
import { TrendingUp } from 'lucide-react';

interface PerformanceMetric {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down';
}

const MOCK_METRICS: PerformanceMetric[] = [
  { label: 'Total Placements', value: '23', delta: '+12% YoY', trend: 'up' },
  { label: 'Total Revenue', value: '$1.57M', delta: '+8% QoQ', trend: 'up' },
  { label: 'Avg Quality Score', value: '8.4', delta: '-0.2 MoM', trend: 'down' },
  { label: 'Active Mandates', value: '23', delta: '+3 WoW', trend: 'up' },
];

export function PerformanceMetrics() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">PERFORMANCE METRICS</h3>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_METRICS.map((m) => {
          const isUp = m.trend === 'up';
          return (
            <div key={m.label} className="bg-bg-secondary border border-bg-tertiary p-4">
              <div className="text-xs text-text-muted uppercase tracking-wider">{m.label}</div>
              <div className="font-serif text-2xl font-bold text-text-primary mt-1">{m.value}</div>
              <div
                className={`mt-2 flex items-center gap-1.5 text-xs ${
                  isUp ? 'text-teal' : 'text-warning'
                }`}
              >
                <span className={`w-1.5 h-1.5 ${isUp ? 'bg-teal' : 'bg-warning'}`} aria-hidden="true" />
                <span>{m.delta}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
