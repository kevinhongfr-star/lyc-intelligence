import React from 'react';
import { cn } from '@/lib/utils';

export interface ComparisonItem {
  label: string;
  valueA: string | number;
  valueB: string | number;
  highlight?: 'A' | 'B' | 'none';
}

export interface ComparisonMatrixProps {
  titleA?: string;
  titleB?: string;
  items: ComparisonItem[];
  title?: string;
  className?: string;
}

export function ComparisonMatrix({
  titleA = 'A',
  titleB = 'B',
  items,
  title,
  className,
}: ComparisonMatrixProps) {
  return (
    <div className={cn('w-full', className)}>
      {title && (
        <h3 className="text-sm font-semibold text-[var(--echo-text-primary)] mb-4">{title}</h3>
      )}
      <div className="border border-[var(--echo-border-default)] overflow-hidden">
        <div className="grid grid-cols-3 bg-[var(--echo-bg-surface)] border-b border-[var(--echo-border-default)]">
          <div className="px-4 py-3 text-xs font-semibold text-[var(--echo-text-tertiary)] uppercase tracking-wide">
            Metric
          </div>
          <div className="px-4 py-3 text-xs font-semibold text-[var(--echo-text-tertiary)] uppercase tracking-wide text-center">
            {titleA}
          </div>
          <div className="px-4 py-3 text-xs font-semibold text-[var(--echo-text-tertiary)] uppercase tracking-wide text-center">
            {titleB}
          </div>
        </div>
        {items.map((item, i) => (
          <div
            key={item.label}
            className={cn(
              'grid grid-cols-3 border-b border-[var(--echo-border-subtle)] last:border-b-0',
              i % 2 === 0 ? 'bg-white' : 'bg-[var(--echo-bg-surface)]',
            )}
          >
            <div className="px-4 py-3 text-sm text-[var(--echo-text-secondary)]">
              {item.label}
            </div>
            <div
              className={cn(
                'px-4 py-3 text-sm text-center tabular-nums',
                item.highlight === 'A'
                  ? 'text-[var(--echo-accent)] font-semibold bg-[var(--echo-accent-soft)]'
                  : 'text-[var(--echo-text-primary)]',
              )}
            >
              {item.valueA}
            </div>
            <div
              className={cn(
                'px-4 py-3 text-sm text-center tabular-nums',
                item.highlight === 'B'
                  ? 'text-[var(--echo-accent)] font-semibold bg-[var(--echo-accent-soft)]'
                  : 'text-[var(--echo-text-primary)]',
              )}
            >
              {item.valueB}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
