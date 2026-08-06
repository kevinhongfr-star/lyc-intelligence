import { useState, useEffect } from 'react';
import { useMediaQuery } from './useMediaQuery';
import { BREAKPOINTS, type BreakpointKey } from '@/styles/design-tokens';

export interface BreakpointState {
  breakpoint: BreakpointKey;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

export function useBreakpoint(): BreakpointState {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') return window.innerWidth;
    return 1024;
  });

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const matches = {
    sm: useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px)`),
    md: useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`),
    lg: useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`),
    xl: useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`),
    '2xl': useMediaQuery(`(min-width: ${BREAKPOINTS['2xl']}px)`),
  };

  let breakpoint: BreakpointKey = 'sm';
  if (matches['2xl']) breakpoint = '2xl';
  else if (matches.xl) breakpoint = 'xl';
  else if (matches.lg) breakpoint = 'lg';
  else if (matches.md) breakpoint = 'md';

  return {
    breakpoint,
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
    width,
  };
}
