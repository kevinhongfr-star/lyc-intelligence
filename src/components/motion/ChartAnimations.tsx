import React from 'react';
import { cn } from '@/lib/utils';

export interface BarChartEntryProps {
  data: Array<{ label: string; value: number }>;
  maxValue?: number;
  className?: string;
  delay?: number;
}

export function BarChartEntry({ data, maxValue, className, delay = 0 }: BarChartEntryProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value));

  return (
    <div className={cn('flex items-end gap-2 h-48', className)}>
      {data.map((item, i) => {
        const heightPct = (item.value / max) * 100;
        return (
          <div key={item.label} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-[var(--echo-accent)] echo-anim-bar-grow"
              style={{
                height: `${heightPct}%`,
                animationDelay: `${delay + i * 80}ms`,
              }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="text-xs text-[var(--echo-text-tertiary)] truncate w-full text-center">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export interface LineChartEntryProps {
  points: Array<{ x: number; y: number }>;
  width?: number;
  height?: number;
  className?: string;
  delay?: number;
}

export function LineChartEntry({
  points,
  width = 300,
  height = 100,
  className,
  delay = 0,
}: LineChartEntryProps) {
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join('');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      <path
        d={pathD}
        fill="none"
        stroke="var(--echo-accent)"
        strokeWidth="2"
        className="echo-anim-line-draw"
        style={{ animationDelay: `${delay}ms` }}
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill="var(--echo-accent)"
          className="echo-anim-pie-rotate"
          style={{ animationDelay: `${delay + i * 60}ms` }}
        />
      ))}
    </svg>
  );
}

export interface PieChartEntryProps {
  segments: Array<{ value: number; color?: string }>;
  size?: number;
  className?: string;
  delay?: number;
}

export function PieChartEntry({
  segments,
  size = 120,
  className,
  delay = 0,
}: PieChartEntryProps) {
  const radius = size / 2;
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let cumulativeAngle = -90;

  const colors = [
    '#C108AB', '#2D8A4E', '#B8860B', '#2C5282',
    '#737373', '#D847CD', '#4ADE80', '#FBBF24',
  ];

  return (
    <svg width={size} height={size} className={className} aria-hidden="true">
      {segments.map((seg, i) => {
        const angle = (seg.value / total) * 360;
        const startAngle = (cumulativeAngle * Math.PI) / 180;
        const endAngle = ((cumulativeAngle + angle) * Math.PI) / 180;
        const x1 = radius + radius * Math.cos(startAngle);
        const y1 = radius + radius * Math.sin(startAngle);
        const x2 = radius + radius * Math.cos(endAngle);
        const y2 = radius + radius * Math.sin(endAngle);
        const largeArc = angle > 180 ? 1 : 0;
        const d = `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        cumulativeAngle += angle;

        return (
          <path
            key={i}
            d={d}
            fill={seg.color || colors[i % colors.length]}
            className="echo-anim-pie-rotate"
            style={{ animationDelay: `${delay + i * 100}ms`, transformOrigin: 'center' }}
          />
        );
      })}
    </svg>
  );
}

export const ChartAnimations = {
  BarChartEntry,
  LineChartEntry,
  PieChartEntry,
};
