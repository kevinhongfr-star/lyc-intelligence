import React from 'react';
import { cn } from '@/lib/utils';

export interface ScoreGaugeProps {
  score: number;
  size?: number;
  label?: string;
  className?: string;
}

export function ScoreGaugeChart({ score, size = 120, label, className }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - 16) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return 'var(--echo-success)';
    if (s >= 60) return 'var(--echo-warning)';
    return 'var(--echo-error)';
  };

  const color = getColor(clamped);

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      <svg
        width={size}
        height={size / 2 + 20}
        role="img"
        aria-label={`Score: ${Math.round(clamped)} out of 100`}
      >
        <path
          d={`M 8 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2 + 10}`}
          fill="none"
          stroke="var(--echo-neutral-200)"
          strokeWidth="10"
          strokeLinecap="butt"
        />
        <path
          d={`M 8 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2 + 10}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="butt"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center">
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color }}
          aria-label={`Score value: ${Math.round(clamped)}`}
        >
          {Math.round(clamped)}
        </span>
        {label && (
          <span className="text-xs text-[var(--echo-text-tertiary)] mt-0.5">{label}</span>
        )}
      </div>
    </div>
  );
}

export interface RadialGaugeProps {
  value: number;
  size?: number;
  color?: string;
  trackColor?: string;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function RadialGauge({
  value,
  size = 80,
  color = 'var(--echo-accent)',
  trackColor = 'var(--echo-neutral-200)',
  showLabel = true,
  label,
  className,
}: RadialGaugeProps) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          style={{
            transition: 'stroke-dashoffset 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {showLabel && (
          <span className="text-sm font-semibold tabular-nums">
            {label ?? `${Math.round(clamped)}%`}
          </span>
        )}
      </div>
    </div>
  );
}
