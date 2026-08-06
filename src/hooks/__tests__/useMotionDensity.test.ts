import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMotionConfig } from '../useMotionConfig';
import { useDensity } from '../useDensity';

describe('useMotionConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns reduced motion false by default (happy-dom)', () => {
    const { result } = renderHook(() => useMotionConfig());
    expect(result.current.reducedMotion).toBe(false);
  });

  it('exposes duration and easing tokens', () => {
    const { result } = renderHook(() => useMotionConfig());
    expect(result.current.duration).toBeDefined();
    expect(result.current.easing).toBeDefined();
    expect(result.current.easing.standard).toContain('cubic-bezier');
  });
});

describe('useDensity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('defaults to regular density', () => {
    const { result } = renderHook(() => useDensity());
    expect(result.current.density).toBe('regular');
  });

  it('updates density mode', () => {
    const { result } = renderHook(() => useDensity());
    act(() => {
      result.current.setDensity('compact');
    });
    expect(result.current.density).toBe('compact');
  });

  it('persists density to localStorage', () => {
    const { result } = renderHook(() => useDensity());
    act(() => {
      result.current.setDensity('comfortable');
    });
    expect(localStorage.getItem('echo-density')).toBe('comfortable');
  });

  it('initializes from localStorage if set', () => {
    localStorage.setItem('echo-density', 'compact');
    const { result } = renderHook(() => useDensity());
    expect(result.current.density).toBe('compact');
  });

  it('cycles density modes', () => {
    const { result } = renderHook(() => useDensity());
    act(() => {
      result.current.cycleDensity();
    });
    expect(result.current.density).toBe('compact');
    act(() => {
      result.current.cycleDensity();
    });
    expect(result.current.density).toBe('comfortable');
    act(() => {
      result.current.cycleDensity();
    });
    expect(result.current.density).toBe('regular');
  });
});
