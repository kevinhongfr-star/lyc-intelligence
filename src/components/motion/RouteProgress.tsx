import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface RouteProgressProps {
  isLoading: boolean;
  /** Progress value (0-100). If undefined, shows indeterminate. */
  progress?: number;
  className?: string;
}

export function RouteProgress({ isLoading, progress, className }: RouteProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      if (progress !== undefined) {
        setDisplayProgress(progress);
      } else {
        let p = 0;
        const interval = setInterval(() => {
          p += Math.random() * 15;
          if (p >= 90) {
            p = 90;
            clearInterval(interval);
          }
          setDisplayProgress(p);
        }, 200);
        return () => clearInterval(interval);
      }
    } else {
      setDisplayProgress(100);
      const timer = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isLoading, progress]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[1090] h-[3px] bg-transparent pointer-events-none',
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(displayProgress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-[var(--echo-accent)] transition-all duration-200 ease-out"
        style={{
          width: `${displayProgress}%`,
          boxShadow: '0 0 8px rgba(193, 8, 171, 0.5)',
        }}
      />
    </div>
  );
}
