import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useMotionConfig } from '@/hooks/useMotionConfig';

export interface NumberCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  onComplete?: () => void;
}

export function NumberCounter({
  value,
  duration = 1500,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
  onComplete,
}: NumberCounterProps) {
  const [display, setDisplay] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const { reducedMotion } = useMotionConfig();

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(value);
      setHasAnimated(true);
      onComplete?.();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            const startTime = performance.now();
            const startValue = 0;

            const animate = (currentTime: number) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const easeOut = 1 - Math.pow(1 - progress, 3);
              const current = startValue + (value - startValue) * easeOut;

              setDisplay(current);

              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                onComplete?.();
              }
            };

            requestAnimationFrame(animate);
          }
        });
      },
      { threshold: 0.3 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, duration, reducedMotion, hasAnimated, onComplete]);

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display).toLocaleString();

  return (
    <span ref={ref} className={cn('inline-flex items-baseline font-semibold tabular-nums', className)}>
      <span className="text-[var(--echo-text-tertiary)] mr-0.5">{prefix}</span>
      <span>{formatted}</span>
      <span className="text-[var(--echo-text-tertiary)] ml-0.5">{suffix}</span>
    </span>
  );
}
