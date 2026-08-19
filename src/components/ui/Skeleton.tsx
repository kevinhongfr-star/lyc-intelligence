/**
 * V1 Design System — Skeleton / Loading
 *
 * V4.5.9d — re-skinned to V1 brand rules:
 *   - Subtle shimmer: light-gray gradient (ink-50 → ink-100 → ink-50).
 *   - Same shape as loaded content (card / text / table / chart / avatar).
 *   - Zero border radius everywhere.
 *   - No spinners — shimmer only.
 *   - V1 motion: 1.5s ease-in-out infinite shimmer sweep.
 *   - Respects prefers-reduced-motion (CSS handles fallback).
 *
 * Variants: block | card | text | table | chart | avatar | shimmer
 * Animations: pulse | shimmer | none (default: shimmer)
 *
 * @example
 * ```tsx
 * <Skeleton variant="card" />
 * <Skeleton variant="text" />
 * ```
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { V1 } from '@/styles/v1-tokens';

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

// V1 subtle shimmer gradient — light gray sweep across ink-50 → ink-100 → ink-50.
// Defined once here so all skeleton blocks share the same keyframe + gradient.
const SHIMMER_KEYFRAMES = `
  @keyframes v1-skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes v1-skeleton-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
  }
  @media (prefers-reduced-motion: reduce) {
    .v1-skeleton-shimmer,
    .v1-skeleton-pulse {
      animation: none !important;
    }
  }
`;

// V1 shimmer background — linear gradient on ink-50/ink-100.
const SHIMMER_BG = `linear-gradient(90deg, ${V1.ink50} 25%, ${V1.ink100} 50%, ${V1.ink50} 75%)`;

const ANIMATION_STYLE: Record<SkeletonAnimation, React.CSSProperties> = {
  pulse: { animation: `v1-skeleton-pulse 1.5s ease-in-out infinite` },
  shimmer: {
    background: SHIMMER_BG,
    backgroundSize: '200% 100%',
    animation: `v1-skeleton-shimmer 1.5s ease-in-out infinite`,
  },
  none: {},
};

const BLOCK_BASE: React.CSSProperties = {
  background: V1.ink50,
  borderRadius: V1.radius,
};

function resolveDim(value: string | number | undefined, fallback: string): string {
  if (value === undefined) return fallback;
  return typeof value === 'number' ? `${value}px` : value;
}

function ShimmerSkeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn('v1-skeleton v1-skeleton-shimmer', className)}
      style={{
        ...BLOCK_BASE,
        ...ANIMATION_STYLE.shimmer,
        height: 16,
        width: '100%',
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

function CardSkeleton({
  animation,
  className,
}: {
  animation: SkeletonAnimation;
  className?: string;
}) {
  return (
    <div
      className={cn('v1-scope w-full', className)}
      style={{ height: 192, display: 'flex', flexDirection: 'column', gap: 12 }}
      aria-hidden="true"
    >
      <style>{SHIMMER_KEYFRAMES}</style>
      <div style={{ ...BLOCK_BASE, ...ANIMATION_STYLE[animation], height: 32, width: '66%' }} />
      <div style={{ ...BLOCK_BASE, ...ANIMATION_STYLE[animation], height: 16, width: '100%' }} />
      <div style={{ ...BLOCK_BASE, ...ANIMATION_STYLE[animation], height: 16, width: '83%' }} />
      <div style={{ ...BLOCK_BASE, ...ANIMATION_STYLE[animation], height: 64, width: '100%', marginTop: 16 }} />
    </div>
  );
}

function TextSkeleton({
  animation,
  className,
}: {
  animation: SkeletonAnimation;
  className?: string;
}) {
  return (
    <div
      className={cn('v1-scope w-full', className)}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      aria-hidden="true"
    >
      <style>{SHIMMER_KEYFRAMES}</style>
      <div style={{ ...BLOCK_BASE, ...ANIMATION_STYLE[animation], height: 16, width: '100%' }} />
      <div style={{ ...BLOCK_BASE, ...ANIMATION_STYLE[animation], height: 16, width: '75%' }} />
      <div style={{ ...BLOCK_BASE, ...ANIMATION_STYLE[animation], height: 16, width: '50%' }} />
    </div>
  );
}

function TableSkeleton({
  animation,
  rows = 5,
  className,
}: {
  animation: SkeletonAnimation;
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('v1-scope w-full', className)}
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      aria-hidden="true"
    >
      <style>{SHIMMER_KEYFRAMES}</style>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{ ...BLOCK_BASE, ...ANIMATION_STYLE[animation], height: 40, width: '100%' }}
        />
      ))}
    </div>
  );
}

function ChartSkeleton({
  animation,
  className,
}: {
  animation: SkeletonAnimation;
  className?: string;
}) {
  const heights = [60, 80, 45, 90, 70, 55, 85];
  return (
    <div
      className={cn('v1-scope w-full', className)}
      style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 192 }}
      aria-hidden="true"
    >
      <style>{SHIMMER_KEYFRAMES}</style>
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            ...BLOCK_BASE,
            ...ANIMATION_STYLE[animation],
            flex: 1,
            height: `${h}%`,
          }}
        />
      ))}
    </div>
  );
}

function AvatarSkeleton({
  animation,
  className,
}: {
  animation: SkeletonAnimation;
  className?: string;
}) {
  return (
    <div
      className={cn('v1-scope', className)}
      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
      aria-hidden="true"
    >
      <style>{SHIMMER_KEYFRAMES}</style>
      <div
        style={{
          ...BLOCK_BASE,
          ...ANIMATION_STYLE[animation],
          width: 40,
          height: 40,
          borderRadius: V1.radiusFull, // avatars may be circular (V1 exception)
        }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ ...BLOCK_BASE, ...ANIMATION_STYLE[animation], height: 12, width: 96 }} />
        <div style={{ ...BLOCK_BASE, ...ANIMATION_STYLE[animation], height: 8, width: 64 }} />
      </div>
    </div>
  );
}

export function Skeleton({
  variant = 'block',
  animation = 'shimmer',
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
  if (variant === 'table')
    return <TableSkeleton animation={animation} rows={rows} className={className} />;
  if (variant === 'chart') return <ChartSkeleton animation={animation} className={className} />;
  if (variant === 'avatar')
    return <AvatarSkeleton animation={animation} className={className} />;

  if (variant === 'block') {
    if (circle) {
      return (
        <div className={cn('v1-scope', className)}>
          <style>{SHIMMER_KEYFRAMES}</style>
          <div
            style={{
              ...BLOCK_BASE,
              ...ANIMATION_STYLE[animation],
              width: width ?? 40,
              height: height ?? 40,
              borderRadius: V1.radiusFull, // circular-only (avatars/rings)
              ...style,
            }}
            aria-hidden="true"
            {...rest}
          />
        </div>
      );
    }
    return (
      <div className={cn('v1-scope', className)}>
        <style>{SHIMMER_KEYFRAMES}</style>
        <div
          style={{
            ...BLOCK_BASE,
            ...ANIMATION_STYLE[animation],
            width: resolveDim(width, '100%'),
            height: resolveDim(height, '16px'),
            ...style,
          }}
          aria-hidden="true"
          {...rest}
        />
      </div>
    );
  }

  return null;
}
