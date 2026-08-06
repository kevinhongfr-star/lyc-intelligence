import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  showLabel?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  value,
  size = 48,
  strokeWidth = 4,
  color = 'var(--echo-accent)',
  trackColor = 'var(--echo-neutral-200)',
  showLabel = false,
  className,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
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
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showLabel && (
          <span className="text-sm font-semibold tabular-nums">{Math.round(clamped)}%</span>
        ))}
      </div>
    </div>
  );
}

export interface ScoreGaugeProps {
  score: number;
  size?: number;
  label?: string;
  className?: string;
}

export function ScoreGauge({ score, size = 120, label, className }: ScoreGaugeProps) {
  const radius = (size - 12) / 2;
  const circumference = Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return 'var(--echo-success)';
    if (s >= 60) return 'var(--echo-warning)';
    return 'var(--echo-error)';
  };

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      <svg width={size} height={size / 2 + 20} aria-hidden="true">
        <path
          d={`M 6 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 6} ${size / 2 + 10}`}
          fill="none"
          stroke="var(--echo-neutral-200)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d={`M 6 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 6} ${size / 2 + 10}`}
          fill="none"
          stroke={getColor(clamped)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 500ms cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center">
        <span className="text-2xl font-bold tabular-nums" style={{ color: getColor(clamped) }}>
          {Math.round(clamped)}
        </span>
        {label && <span className="text-xs text-[var(--echo-text-tertiary)] mt-0.5">{label}</span>}
      </div>
    </div>
  );
}
