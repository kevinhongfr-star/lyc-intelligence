import React from 'react';
import { cn } from '@/lib/utils';

export interface SkipToContentProps {
  targetId?: string;
  children?: React.ReactNode;
  className?: string;
}

export function SkipToContent({
  targetId = 'main-content',
  children = 'Skip to main content',
  className,
}: SkipToContentProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
      onFocus={(e) => {
        const el = e.currentTarget;
        el.style.position = 'fixed';
        el.style.left = '50%';
        el.style.top = '8px';
        el.style.width = 'auto';
        el.style.height = 'auto';
        el.style.overflow = 'visible';
        el.style.transform = 'translateX(-50%)';
        el.style.zIndex = '10000';
      }}
      onBlur={(e) => {
        const el = e.currentTarget;
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        el.style.top = 'auto';
        el.style.width = '1px';
        el.style.height = '1px';
        el.style.overflow = 'hidden';
        el.style.transform = 'none';
      }}
      className={cn(
        'echo-skip-link',
        'sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-1/2',
        'focus:z-[10000] focus:bg-[var(--echo-accent)] focus:text-white',
        'focus:px-4 focus:py-2 focus:font-semibold',
        'focus:shadow-lg focus:no-underline',
        className,
      )}
      aria-label="Skip to main content"
    >
      {children}
    </a>
  );
}
