import React from 'react';
import { cn } from '@/lib/utils';

export interface RadarAxis {
  label: string;
  value: number;
}

export interface RadarChartProps {
  axes: RadarAxis[];
  maxValue?: number;
  title?: string;
  size?: number;
  color?: string;
  showLabels?: boolean;
  showGrid?: boolean;
  className?: string;
}

export function RadarChart({
  axes,
  maxValue = 100,
  title,
  size = 280,
  color = 'var(--echo-accent)',
  showLabels = true,
  showGrid = true,
  className,
}: RadarChartProps) {
  const center = size / 2;
  const radius = size / 2 - 40;
  const count = axes.length;
  const angleStep = (2 * Math.PI) / count;

  const getPoint = (index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / maxValue) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const dataPath = axes
    .map((axis, i) => {
      const point = getPoint(i, axis.value);
      return `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
    })
    .join(' ') + ' Z';

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {title && (
        <h3 className="text-sm font-semibold text-[var(--echo-text-primary)] mb-4">{title}</h3>
      )}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={title || 'Radar chart'}
      >
        {showGrid &&
          gridLevels.map((level, i) => {
            const points = axes
              .map((_, j) => {
                const angle = j * angleStep - Math.PI / 2;
                const r = level * radius;
                return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
              })
              .join(' ');
            return (
              <polygon
                key={i}
                points={points}
                fill="none"
                stroke="var(--echo-border-default)"
                strokeWidth={1}
                opacity={0.5}
              />
            );
          })}
        {axes.map((_, i) => {
          const point = getPoint(i, maxValue);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="var(--echo-border-default)"
              strokeWidth={1}
              opacity={0.5}
            />
          );
        })}
        <path
          d={dataPath}
          fill={color}
          fillOpacity={0.2}
          stroke={color}
          strokeWidth={2}
          className="echo-anim-pie-rotate"
          style={{ transformOrigin: `${center}px ${center}px` }}
        />
        {axes.map((axis, i) => {
          const point = getPoint(i, axis.value);
          return (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r={3}
              fill={color}
            />
          );
        })}
        {showLabels &&
          axes.map((axis, i) => {
            const point = getPoint(i, maxValue + 15);
            return (
              <text
                key={i}
                x={point.x}
                y={point.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] fill-[var(--echo-text-secondary)]"
              >
                {axis.label}
              </text>
            );
          })}
      </svg>
    </div>
  );
}
