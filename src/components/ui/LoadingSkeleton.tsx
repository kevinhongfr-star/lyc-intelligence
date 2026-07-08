import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'card' | 'text' | 'table' | 'chart';
}

function CardSkeleton() {
  return (
    <div
      className="w-full bg-bg-tertiary animate-pulse"
      style={{ borderRadius: 0, height: 200 }}
    />
  );
}

function TextSkeleton() {
  return (
    <div className="w-full space-y-3">
      <div
        className="bg-bg-tertiary animate-pulse"
        style={{ borderRadius: 0, height: 16, width: '100%' }}
      />
      <div
        className="bg-bg-tertiary animate-pulse"
        style={{ borderRadius: 0, height: 16, width: '75%' }}
      />
      <div
        className="bg-bg-tertiary animate-pulse"
        style={{ borderRadius: 0, height: 16, width: '50%' }}
      />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="w-full space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="bg-bg-tertiary animate-pulse"
          style={{ borderRadius: 0, height: 40, width: '100%' }}
        />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="w-full flex items-end gap-3" style={{ height: 200 }}>
      {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-bg-tertiary animate-pulse"
          style={{ borderRadius: 0, height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export function LoadingSkeleton({ variant = 'card' }: LoadingSkeletonProps) {
  switch (variant) {
    case 'text':
      return <TextSkeleton />;
    case 'table':
      return <TableSkeleton />;
    case 'chart':
      return <ChartSkeleton />;
    case 'card':
    default:
      return <CardSkeleton />;
  }
}
