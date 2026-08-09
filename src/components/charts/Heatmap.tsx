import React from 'react';
import { cn } from '@/lib/utils';

export interface HeatmapCell {
  date?: string;
  value: number;
  label?: string;
}

export interface HeatmapProps {
  cells: HeatmapCell[];
  columns?: number;
  title?: string;
  cellSize?: number;
  colorScale?: string[];
  showLegend?: boolean;
  className?: string;
  variant?: 'calendar' | 'matrix';
}

const DEFAULT_COLORS = [
  '#FDF4FC',
  '#F5CEF2',
  '#EFB3EC',
  '#E586DF',
  '#D847CD',
  '#C108AB',
  '#9A0688',
];

export function Heatmap({
  cells,
  columns,
  title,
  cellSize = 24,
  colorScale = DEFAULT_COLORS,
  showLegend = true,
  className,
  variant = 'matrix',
}: HeatmapProps) {
  const maxValue = Math.max(...cells.map((c) => c.value), 1);
  const cols = columns || Math.ceil(Math.sqrt(cells.length));

  const getColor = (value: number) => {
    const ratio = value / maxValue;
    const idx = Math.min(
      colorScale.length - 1,
      Math.floor(ratio * colorScale.length),
    );
    return value === 0 ? 'var(--echo-neutral-100)' : colorScale[idx];
  };

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <h3 className="text-sm font-semibold text-[var(--echo-text-primary)] mb-4">{title}</h3>
      )}
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${cols}, ${cellSize}px)` }}
        role="grid"
        aria-label={title || 'Heatmap'}
      >
        {cells.map((cell, i) => (
          <div
            key={i}
            role="gridcell"
            title={cell.label || `${cell.value}`}
            className={cn(
              'transition-transform duration-150 hover:scale-110 cursor-pointer',
              variant === 'calendar' ? '' : '',
            )}
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: getColor(cell.value),
            }}
            aria-label={`${cell.label ||`Cell ${i + 1}`}: ${cell.value}`}
          />
        ))}
      </div>
      {showLegend && (
        <div className="flex items-center gap-1 mt-3 text-xs text-[var(--echo-text-tertiary)]">
          <span>Less</span>
          {colorScale.map((color, i) => (
            <span
              key={i}
              className="inline-block"
              style={{ width: 12, height: 12, backgroundColor: color }}
              aria-hidden="true"
            />
          ))}
          <span>More</span>
        </div>
      )}
    </div>
  );
}
