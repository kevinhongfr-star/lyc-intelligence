import React from 'react';

/**
 * Reusable skeleton loading components.
 * Replaces blank screens during lazy-loaded route transitions.
 */

interface SkeletonProps {
  width?: string;
  height?: string;
  radius?: string;
  margin?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '20px', radius = '4px', margin = '0', className = '' }: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius: radius,
        margin,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s infinite',
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #e5e5e5' }}>
      <Skeleton width="60%" height="18px" margin="0 0 12px 0" />
      <Skeleton width="100%" height="14px" margin="0 0 8px 0" />
      <Skeleton width="80%" height="14px" margin="0 0 8px 0" />
      <Skeleton width="40%" height="14px" />
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Skeleton width="40px" height="40px" radius="50%" />
          <div style={{ flex: 1 }}>
            <Skeleton width="50%" height="14px" margin="0 0 6px 0" />
            <Skeleton width="70%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width={`${100/cols}%`} height="12px" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} width={`${100/cols}%`} height="14px" />
          ))}
        </div>
      ))}
    </div>
  );
}
