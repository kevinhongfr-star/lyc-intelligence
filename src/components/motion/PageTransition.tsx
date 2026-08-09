import React from 'react';
import { cn } from '@/lib/utils';

export type PageTransitionDirection = 'up' | 'down' | 'left' | 'right' | 'fade';
export type PageTransitionSpeed = 'fast' | 'normal' | 'slow';

export interface PageTransitionProps {
  children: React.ReactNode;
  direction?: PageTransitionDirection;
  speed?: PageTransitionSpeed;
  className?: string;
}

const SPEED_MAP: Record<PageTransitionSpeed, string> = {
  fast: '200ms',
  normal: '300ms',
  slow: '400ms',
};

const DIRECTION_OFFSET: Record<PageTransitionDirection, string> = {
  up: 'translateY(16px)',
  down: 'translateY(-16px)',
  left: 'translateX(16px)',
  right: 'translateX(-16px)',
  fade: 'translateY(0)',
};

export function PageTransition({
  children,
  direction = 'up',
  speed = 'normal',
  className,
}: PageTransitionProps) {
  const duration = SPEED_MAP[speed];
  const offset = DIRECTION_OFFSET[direction];

  return (
    <div
      className={cn('echo-page-transition', className)}
      style={{
        animation: `echo-page-in ${duration} cubic-bezier(0.16, 1, 0.3, 1) forwards`,
      }}
    >
      <style>{`@keyframes echo-page-in { from { opacity: 0; transform: ${offset}; } to { opacity: 1; transform: translate(0, 0); } }`}</style>
      {children}
    </div>
  );
}
