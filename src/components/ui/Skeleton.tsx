/**
 * Design system: Skeleton
 *
 * Consolidates LoadingSkeleton into a single primitive. Supports:
 *   - `<Skeleton />` — bare block skeleton (full control via className)
 *   - `<Skeleton variant="card" />` — pre-composed card skeleton
 *   - `<Skeleton variant="text" />` — three-line text skeleton
 *   - `<Skeleton variant="table" />` — N-row table skeleton
 *   - `<Skeleton variant="chart" />` — bar chart skeleton
 *   - `circle` prop — renders a circular avatar skeleton
 *   - `count` prop — repeats the skeleton N times (only for bare block)
 *
 * Existing `<LoadingSkeleton variant="..." />` call sites keep working —
 * re-exported from LoadingSkeleton.tsx via this component.
 */
import React from 'react';
import { cn } from '@/lib/utils';

export type SkeletonVariant = 'block' | 'card' | 'text' | 'table' | 'chart';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  /** Render a circular skeleton (avatar). */
  circle?: boolean;
  /** Number of rows for the table variant. Default 5. */
  rows?: number;
  /** Width — accepts any CSS value (e.g. "100%", 200, "12rem"). */
  width?: string | number;
  /** Height — accepts any CSS value. */
  height?: string | number;
}

const BASE = 'bg-bg-tertiary animate-pulse';

function resolveDim(value: string | number | undefined, fallback: string): string {
  if (value === undefined) return fallback;
  return typeof value === 'number' ? `${value}px` : value;
}

function CardSkeleton({ className }: { className?: string }) {
  return <div className={cn(BASE, 'w-full h-48', className)} />;
}

function TextSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('w-full space-y-3', className)}>
      <div className={cn(BASE, 'h-4 w-full')} />
      <div className={cn(BASE, 'h-4 w-3/4')} />
      <div className={cn(BASE, 'h-4 w-1/2')} />
    </div>
  );
}

function TableSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('w-full space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn(BASE, 'h-10 w-full')} />
      ))}
    </div>
  );
}

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('w-full flex items-end gap-3 h-48', className)}>
      {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
        <div key={i} className={cn(BASE, 'flex-1')} style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

export function Skeleton({
  variant = 'block',
  circle = false,
  rows,
  width,
  height,
  className,
  style,
  ...rest
}: SkeletonProps) {
  // Bare block skeleton (most common usage in custom layouts).
  if (variant === 'block') {
    if (circle) {
      return (
        <div
          className={cn(BASE, 'rounded-full', className)}
          style={{ width: width ?? '2.5rem', height: height ?? '2.5rem', ...style }}
          aria-hidden="true"
          {...rest}
        />
      );
    }
    return (
      <div
        className={cn(BASE, className)}
        style={{ width: resolveDim(width, '100%'), height: resolveDim(height, '1rem'), ...style }}
        aria-hidden="true"
        {...rest}
      />
    );
  }

  if (variant === 'card') return <CardSkeleton className={className} />;
  if (variant === 'text') return <TextSkeleton className={className} />;
  if (variant === 'table') return <TableSkeleton rows={rows} className={className} />;
  if (variant === 'chart') return <ChartSkeleton className={className} />;
  return <CardSkeleton className={className} />;
}
