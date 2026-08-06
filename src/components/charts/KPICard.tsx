import React from 'react';
import { cn } from '@/lib/utils';

export interface KPICardProps {
  label: string;
  value: string | number;
  delta?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode;
  sparkline?: number[];
  color?: string;
  className?: string;
}

export function KPICard({
  label,
  value,
  delta,
  icon,
  sparkline,
  color = 'var(--echo-accent)',
  className,
}: KPICardProps) {
  const trendColor =
    delta?.trend === 'up'
      ? 'var(--echo-success)'
      : delta?.trend === 'down'
        ? 'var(--echo-error)'
        : 'var(--echo-text-tertiary)';

  return (
    <div
      className={cn(
        'bg-[var(--echo-bg-surface)] border border-[var(--echo-border-default)] p-4',
        'hover:border-[var(--echo-accent)] transition-colors duration-200',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--echo-text-tertiary)] uppercase tracking-wide truncate">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--echo-text-primary)] tabular-nums">
            {value}
          </p>
        </div>
        {icon && (
          <div
            className="ml-2 p-2 shrink-0"
            style={{ backgroundColor: 'var(--echo-accent-soft)' }}
            aria-hidden="true"
          >
            <span style={{ color }}>{icon}</span>
          </div>
        )}
      </div>
      {delta && (
        <div className="mt-2 flex items-center gap-2">
          <span
            className="text-sm font-medium tabular-nums"
            style={{ color: trendColor }}
            aria-label={`${delta.trend} trend`}
          >
            {delta.trend === 'up' ? '↑' : delta.trend === 'down' ? '↓' : '→'}{' '}
            {delta.value > 0 ? '+' : ''}
            {delta.value}%
          </span>
          {delta.label && (
            <span className="text-xs text-[var(--echo-text-tertiary)]">{delta.label}</span>
          )}
        </div>
      )}
      {sparkline && sparkline.length > 1 && (
        <Sparkline data={sparkline} color={color} />
      )}
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const width = 120;
  const height = 32;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      className="mt-3"
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        className="echo-anim-line-draw"
      />
    </svg>
  );
}
