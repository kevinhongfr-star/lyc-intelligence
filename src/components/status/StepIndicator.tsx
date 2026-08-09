import React from 'react';
import { cn } from '@/lib/utils';

export interface Step {
  label: string;
  description?: string;
  status: 'completed' | 'active' | 'upcoming';
}

export interface StepIndicatorProps {
  steps: Step[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function StepIndicator({ steps, orientation = 'horizontal', className }: StepIndicatorProps) {
  const getStepColor = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-[var(--echo-accent)] text-white';
      case 'active':
        return 'bg-[var(--echo-accent)] text-white ring-4 ring-[var(--echo-accent)]/20';
      default:
        return 'bg-[var(--echo-neutral-200)] text-[var(--echo-text-tertiary)]';
    }
  };

  const getConnectorColor = (status: Step['status']) => {
    if (status === 'completed') return 'bg-[var(--echo-accent)]';
    return 'bg-[var(--echo-neutral-200)]';
  };

  if (orientation === 'vertical') {
    return (
      <ol className={cn('flex flex-col gap-0', className)}>
        {steps.map((step, i) => (
          <li key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 flex items-center justify-center text-sm font-semibold',
                  getStepColor(step.status),
                )}
              >
                {step.status === 'completed' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={cn('w-0.5 flex-1 min-h-[2rem] my-1', getConnectorColor(step.status))} />
              )}
            </div>
            <div className="pb-6">
              <p className="text-sm font-medium text-[var(--echo-text-primary)]">{step.label}</p>
              {step.description && (
                <p className="text-xs text-[var(--echo-text-tertiary)] mt-1">{step.description}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className={cn('flex items-start w-full', className)}>
      {steps.map((step, i) => (
        <li key={i} className="flex flex-col items-center flex-1 relative">
          <div className="flex items-center w-full">
            {i > 0 && (
              <div
                className={cn(
                  'h-0.5 flex-1 -ml-0.5',
                  step.status === 'completed' ? 'bg-[var(--echo-accent)]' : 'bg-[var(--echo-neutral-200)]',
                )}
              />
            )}
            <div
              className={cn(
                'w-8 h-8 flex items-center justify-center text-sm font-semibold shrink-0',
                getStepColor(step.status),
              )}
            >
              {step.status === 'completed' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 -mr-0.5',
                  steps[i + 1].status === 'completed' || step.status === 'completed'
                    ? 'bg-[var(--echo-accent)]'
                    : 'bg-[var(--echo-neutral-200)]',
                )}
              />
            )}
          </div>
          <div className="mt-2 text-center">
            <p className="text-xs font-medium text-[var(--echo-text-primary)]">{step.label}</p>
            {step.description && (
              <p className="text-xs text-[var(--echo-text-tertiary)] mt-0.5 line-clamp-1">{step.description}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
