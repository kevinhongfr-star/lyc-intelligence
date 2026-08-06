import React from 'react';
import { cn } from '@/lib/utils';

export interface FunnelStage {
  label: string;
  value: number;
  color?: string;
}

export interface FunnelChartProps {
  stages: FunnelStage[];
  title?: string;
  showPercentage?: boolean;
  showCount?: boolean;
  className?: string;
}

export function FunnelChart({
  stages,
  title,
  showPercentage = true,
  showCount = true,
  className,
}: FunnelChartProps) {
  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <h3 className="text-sm font-semibold text-[var(--echo-text-primary)] mb-4">{title}</h3>
      )}
      <div className="flex flex-col items-center gap-0">
        {stages.map((stage, i) => {
          const widthPercent = (stage.value / maxValue) * 100;
          const percentage = showPercentage
            ? ((stage.value / maxValue) * 100).toFixed(1)
            : null;
          return (
            <React.Fragment key={stage.label}>
              <div
                className={cn(
                  'echo-anim-funnel-fade flex items-center justify-between px-4 py-3',
                  'text-white text-sm font-medium transition-all duration-300',
                )}
                style={{
                  width: `${Math.max(widthPercent, 8)}%`,
                  backgroundColor: stage.color || 'var(--echo-accent)',
                  animationDelay: `${i * 80}ms`,
                }}
                role="listitem"
                aria-label={`${stage.label}: ${stage.value}`}
              >
                <span className="truncate">{stage.label}</span>
                <span className="flex items-center gap-2 ml-4 shrink-0">
                  {showCount && <span className="tabular-nums">{stage.value}</span>}
                  {showPercentage && percentage && (
                    <span className="opacity-75 text-xs tabular-nums">{percentage}%</span>
                  )}
                </span>
              </div>
              {i < stages.length - 1 && (
                <div
                  className="w-px h-3 bg-[var(--echo-border-default)]"
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
