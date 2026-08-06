import React from 'react';
import { cn } from '@/lib/utils';

export interface FocusRingProps {
  children: React.ReactElement;
  ringOffset?: number;
  ringWidth?: number;
  color?: string;
  className?: string;
}

export const FocusRing = React.forwardRef<HTMLDivElement, FocusRingProps>(
  ({ children, ringOffset = 2, ringWidth = 2, color, className }, ref) => {
    const child = React.Children.only(children);

    return (
      <div ref={ref} className={cn('inline-flex', className)}>
        {React.cloneElement(child, {
          className: cn(
            child.props.className,
            'focus:outline-none',
            'focus-visible:ring-2',
            'focus-visible:ring-offset-0',
          ),
          style: {
            ...child.props.style,
            '--tw-ring-color': color || 'var(--echo-accent)',
            '--tw-ring-offset-width': `${ringOffset}px`,
            '--tw-ring-width': `${ringWidth}px`,
          },
        })}
      </div>
    );
  },
);

FocusRing.displayName = 'FocusRing';

export function focusRingClass(color?: string) {
  return cn(
    'focus:outline-none focus-visible:ring-2',
    color ? 'focus-visible:ring-[var(--echo-accent)]' : 'focus-visible:ring-[var(--echo-accent)]',
    'focus-visible:ring-offset-0',
  );
}
