import React from 'react';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export interface MobileLayoutProps {
  children: React.ReactNode;
  mobileOnly?: boolean;
  className?: string;
  showAppShell?: boolean;
}

export function MobileLayout({
  children,
  mobileOnly = false,
  className,
  showAppShell = true,
}: MobileLayoutProps) {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  if (mobileOnly && !isMobile) return null;

  return (
    <div
      className={cn(
        'w-full',
        isMobile && 'mobile-layout mobile-container',
        isTablet && 'tablet-layout tablet-container',
        isDesktop && 'desktop-layout desktop-container',
        showAppShell && isMobile && 'pb-[env(safe-area-inset-bottom)]',
        className,
      )}
      data-layout={isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}
    >
      {children}
    </div>
  );
}
