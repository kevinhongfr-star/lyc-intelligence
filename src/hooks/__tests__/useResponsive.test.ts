import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from '../useMediaQuery';
import { useBreakpoint } from '../useBreakpoint';

describe('useMediaQuery', () => {
  beforeEach(() => {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });
  });

  it('returns false by default', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('returns true when query matches', () => {
    window.matchMedia = (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
  });
});

describe('useBreakpoint', () => {
  it('returns breakpoint state', () => {
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.breakpoint).toBeDefined();
    expect(result.current.isMobile).toBeDefined();
    expect(result.current.isTablet).toBeDefined();
    expect(result.current.isDesktop).toBeDefined();
    expect(typeof result.current.width).toBe('number');
  });

  it('has a valid breakpoint value', () => {
    const { result } = renderHook(() => useBreakpoint());
    const validBreakpoints = ['sm', 'md', 'lg', 'xl', '2xl'];
    expect(validBreakpoints).toContain(result.current.breakpoint);
  });
});
