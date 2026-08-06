import React from 'react';
import { cn } from '@/lib/utils';

export interface GanttTask {
  id: string;
  label: string;
  start: number;
  duration: number;
  progress?: number;
  color?: string;
  milestones?: number[];
}

export interface GanttChartProps {
  tasks: GanttTask[];
  totalDuration: number;
  title?: string;
  showProgress?: boolean;
  className?: string;
}

export function GanttChart({
  tasks,
  totalDuration,
  title,
  showProgress = true,
  className,
}: GanttChartProps) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      {title && (
        <h3 className="text-sm font-semibold text-[var(--echo-text-primary)] mb-4">{title}</h3>
      )}
      <div className="min-w-[600px]">
        <div className="flex border-b border-[var(--echo-border-default)] pb-2 mb-2">
          <div className="w-40 shrink-0 text-xs font-medium text-[var(--echo-text-tertiary)]">
            Task
          </div>
          <div className="flex-1 flex">
            {Array.from({ length: totalDuration }, (_, i) => (
              <div
                key={i}
                className="flex-1 text-center text-xs text-[var(--echo-text-tertiary)]"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {tasks.map((task) => {
            const leftPercent = (task.start / totalDuration) * 100;
            const widthPercent = (task.duration / totalDuration) * 100;
            const progressPercent = task.progress
              ? (task.progress / 100) * widthPercent
              : 0;

            return (
              <div key={task.id} className="flex items-center gap-2">
                <div className="w-40 shrink-0 text-sm text-[var(--echo-text-primary)] truncate">
                  {task.label}
                </div>
                <div className="flex-1 relative h-7 bg-[var(--echo-neutral-100)]">
                  <div
                    className="absolute top-0 bottom-0 echo-anim-gantt-slide"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      backgroundColor: task.color || 'var(--echo-accent)',
                    }}
                    role="progressbar"
                    aria-label={`${task.label}: ${task.progress || 0}% complete`}
                    aria-valuenow={task.progress || 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    {showProgress && task.progress != null && (
                      <div
                        className="h-full bg-[var(--echo-accent-hover)] transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    )}
                  </div>
                  {task.milestones?.map((m, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-white border-2 border-[var(--echo-accent)]"
                      style={{
                        left: `${(m / totalDuration) * 100}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                      }}
                      aria-label={`Milestone ${i + 1} for ${task.label}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
