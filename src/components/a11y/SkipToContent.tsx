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
