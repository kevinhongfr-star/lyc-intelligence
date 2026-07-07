import React from 'react';

interface BenchmarkRowProps {
  dimension: string;
  yourScore: number;
  p50: number;
  p75: number;
}

const BAR_MAX = 10;

interface BarConfig {
  label: string;
  value: number;
  color: string;
}

export function BenchmarkRow({ dimension, yourScore, p50, p75 }: BenchmarkRowProps) {
  const bars: BarConfig[] = [
    { label: 'You', value: yourScore, color: 'bg-accent' },
    { label: 'P50', value: p50, color: 'bg-slate' },
    { label: 'P75', value: p75, color: 'bg-ocean' },
  ];

  return (
    <div className="py-4 border-b border-bg-tertiary last:border-b-0">
      <div className="text-sm font-medium text-text-primary mb-3">{dimension}</div>
      <div className="space-y-2">
        {bars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-3">
            <span className="w-10 text-xs text-text-muted shrink-0">{bar.label}</span>
            <div className="flex-1 h-2 bg-bg-tertiary">
              <div
                className={`h-full ${bar.color}`}
                style={{ width: `${(bar.value / BAR_MAX) * 100}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs font-medium text-text-secondary tabular-nums">
              {bar.value.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
