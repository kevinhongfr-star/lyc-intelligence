import React from 'react';

export interface LoadingSkeletonProps {
  variant?: 'card' | 'text' | 'table' | 'chart' | 'list' | 'profile' | 'form' | 'detail';
  count?: number;
  className?: string;
}

function CardSkeleton() {
  return (
    <div
      className="w-full bg-bg-tertiary animate-pulse rounded-none"
      style={{ height: 200 }}
    />
  );
}

function TextSkeleton({ lines = 3 }: { lines?: number }) {
  const widths = ['100%', '75%', '50%', '85%', '60%'];
  return (
    <div className="w-full space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="bg-bg-tertiary animate-pulse rounded-none"
          style={{ height: 16, width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-3">
      <div className="bg-bg-tertiary/60 animate-pulse rounded-none h-10" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="bg-bg-tertiary animate-pulse rounded-none"
          style={{ height: 48, width: '100%' }}
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
          className="flex-1 bg-bg-tertiary animate-pulse rounded-none"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="w-full space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-10 h-10 bg-bg-tertiary animate-pulse rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="bg-bg-tertiary animate-pulse rounded-none h-4 w-3/4" />
            <div className="bg-bg-tertiary animate-pulse rounded-none h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-bg-tertiary animate-pulse rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="bg-bg-tertiary animate-pulse rounded-none h-5 w-48" />
          <div className="bg-bg-tertiary animate-pulse rounded-none h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="space-y-2">
            <div className="bg-bg-tertiary animate-pulse rounded-none h-8 w-full" />
            <div className="bg-bg-tertiary animate-pulse rounded-none h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
      <TextSkeleton lines={4} />
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="w-full space-y-5">
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className="space-y-2">
          <div className="bg-bg-tertiary animate-pulse rounded-none h-3 w-24" />
          <div className="bg-bg-tertiary animate-pulse rounded-none h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <div className="bg-bg-tertiary animate-pulse rounded-none h-10 w-28" />
        <div className="bg-bg-tertiary animate-pulse rounded-none h-10 w-20" />
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="bg-bg-tertiary animate-pulse rounded-none h-7 w-64" />
          <div className="bg-bg-tertiary animate-pulse rounded-none h-4 w-40" />
        </div>
        <div className="bg-bg-tertiary animate-pulse rounded-none h-9 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-bg-tertiary animate-pulse rounded-none h-4 w-20" />
          <div className="bg-bg-tertiary/60 animate-pulse rounded-none h-32" />
          <TextSkeleton lines={3} />
        </div>
        <div className="space-y-4">
          <div className="bg-bg-tertiary animate-pulse rounded-none h-4 w-24" />
          <ChartSkeleton />
        </div>
      </div>
    </div>
  );
}

export function LoadingSkeleton({
  variant = 'card',
  count,
  className = '',
}: LoadingSkeletonProps) {
  const content = (() => {
    switch (variant) {
      case 'text':
        return <TextSkeleton lines={count} />;
      case 'table':
        return <TableSkeleton rows={count} />;
      case 'chart':
        return <ChartSkeleton />;
      case 'list':
        return <ListSkeleton count={count} />;
      case 'profile':
        return <ProfileSkeleton />;
      case 'form':
        return <FormSkeleton />;
      case 'detail':
        return <DetailSkeleton />;
      case 'card':
      default:
        return <CardSkeleton />;
    }
  })();

  return <div className={className}>{content}</div>;
}

export default LoadingSkeleton;
