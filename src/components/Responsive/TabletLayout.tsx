import React from 'react';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export interface TabletLayoutProps {
  children: React.ReactNode;
  tabletOnly?: boolean;
  className?: string;
}

export function TabletLayout({ children, tabletOnly = false, className }: TabletLayoutProps) {
  const { isTablet, isDesktop, isMobile } = useBreakpoint();

  if (tabletOnly && !isTablet) return null;

  return (
    <div
      className={cn(
        'w-full max-w-[1024px] mx-auto px-4 md:px-6 lg:px-8',
        isTablet && 'tablet-layout',
        isDesktop && 'desktop-layout',
        isMobile && 'mobile-layout',
        className,
      )}
      data-layout={isTablet ? 'tablet' : isDesktop ? 'desktop' : 'mobile'}
    >
      {children}
    </div>
  );
}
