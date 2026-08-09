import React from 'react';
import { cn } from '@/lib/utils';

export type SkeletonVariant = 'block' | 'card' | 'text' | 'table' | 'chart' | 'avatar' | 'shimmer';
export type SkeletonAnimation = 'pulse' | 'shimmer' | 'none';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  animation?: SkeletonAnimation;
  circle?: boolean;
  rows?: number;
  width?: string | number;
  height?: string | number;
}

const SHIMMER_BG =
  'bg-[linear-gradient(90deg,var(--echo-bg-surface-active,var(--color-bg-tertiary))_25%,var(--echo-bg-surface-hover,var(--color-bg-hover))_50%,var(--echo-bg-surface-active,var(--color-bg-tertiary))_75%)] bg-[length:200%_100%]';

const ANIMATION_CLASS: Record<SkeletonAnimation, string> = {
  pulse: 'animate-pulse',
  shimmer: 'animate-[echo-shimmer_1.5s_ease-in-out_infinite]',
  none: '',
};

function resolveDim(value: string | number | undefined, fallback: string): string {
  if (value === undefined) return fallback;
  return typeof value === 'number' ? `${value}px` : value;
}

function ShimmerSkeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn('bg-bg-tertiary', SHIMMER_BG, 'echo-skeleton h-4 w-full', className)}
      style={style}
      aria-hidden="true"
    />
  );
}

function CardSkeleton({ animation, className }: { animation: SkeletonAnimation; className?: string }) {
  return (
    <div className={cn('w-full h-48 space-y-3', className)} aria-hidden="true">
      <div className={cn('h-8 w-2/3 bg-bg-tertiary', ANIMATION_CLASS[animation])} />
      <div className={cn('h-4 w-full bg-bg-tertiary', ANIMATION_CLASS[animation])} />
      <div className={cn('h-4 w-5/6 bg-bg-tertiary', ANIMATION_CLASS[animation])} />
      <div className={cn('h-16 w-full bg-bg-tertiary mt-4', ANIMATION_CLASS[animation])} />
    </div>
  );
}

function TextSkeleton({ animation, className }: { animation: SkeletonAnimation; className?: string }) {
  return (
    <div className={cn('w-full space-y-3', className)} aria-hidden="true">
      <div className={cn('h-4 w-full bg-bg-tertiary', ANIMATION_CLASS[animation])} />
      <div className={cn('h-4 w-3/4 bg-bg-tertiary', ANIMATION_CLASS[animation])} />
      <div className={cn('h-4 w-1/2 bg-bg-tertiary', ANIMATION_CLASS[animation])} />
    </div>
  );
}

function TableSkeleton({ animation, rows = 5, className }: { animation: SkeletonAnimation; rows?: number; className?: string }) {
  return (
    <div className={cn('w-full space-y-2', className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn('h-10 w-full bg-bg-tertiary', ANIMATION_CLASS[animation])} />
      ))}
    </div>
  );
}

function ChartSkeleton({ animation, className }: { animation: SkeletonAnimation; className?: string }) {
  return (
    <div className={cn('w-full flex items-end gap-3 h-48', className)} aria-hidden="true">
      {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
        <div
          key={i}
          className={cn('flex-1 bg-bg-tertiary', ANIMATION_CLASS[animation])}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function AvatarSkeleton({ animation, className }: { animation: SkeletonAnimation; className?: string }) {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <div className={cn('w-10 h-10 bg-bg-tertiary', ANIMATION_CLASS[animation])} />
      <div className="flex-1 space-y-2">
        <div className={cn('h-3 w-24 bg-bg-tertiary', ANIMATION_CLASS[animation])} />
        <div className={cn('h-2 w-16 bg-bg-tertiary', ANIMATION_CLASS[animation])} />
      </div>
    </div>
  );
}

export function Skeleton({
  variant = 'block',
  animation = 'pulse',
  circle = false,
  rows,
  width,
  height,
  className,
  style,
  ...rest
}: SkeletonProps) {
  if (variant === 'shimmer') {
    return <ShimmerSkeleton className={className} style={style} />;
  }

  if (variant === 'card') return <CardSkeleton animation={animation} className={className} />;
  if (variant === 'text') return <TextSkeleton animation={animation} className={className} />;
  if (variant === 'table') return <TableSkeleton animation={animation} rows={rows} className={className} />;
  if (variant === 'chart') return <ChartSkeleton animation={animation} className={className} />;
  if (variant === 'avatar') return <AvatarSkeleton animation={animation} className={className} />;

  if (variant === 'block') {
    if (circle) {
      return (
        <div
          className={cn('bg-bg-tertiary', ANIMATION_CLASS[animation], className)}
          style={{ width: width ?? '2.5rem', height: height ?? '2.5rem', ...style }}
          aria-hidden="true"
          {...rest}
        />
      );
    }
    return (
      <div
        className={cn('bg-bg-tertiary', ANIMATION_CLASS[animation], className)}
        style={{ width: resolveDim(width, '100%'), height: resolveDim(height, '1rem'), ...style }}
        aria-hidden="true"
        {...rest}
      />
    );
  }

  return null;
}
