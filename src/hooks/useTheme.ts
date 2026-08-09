/**
 * Phase 5: ECHO v6.0 Theme Management Hook
 *
 * Provides light / dark / system theme control with:
 *   - Persistence via localStorage
 *   - Real-time system preference listening
 *   - Smooth theme transitions
 *   - SSR-safe initialization (no flash of wrong theme)
 *
 * Usage:
 *   const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
 *
 * The `theme` state is the user's preference ('light'|'dark'|'system').
 * The `resolvedTheme` is the actual applied theme ('light' | 'dark').
 */

import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'echo-theme';
const THEME_ATTRIBUTE = 'data-theme';

/**
 * Resolves a user preference ('system') to an actual theme value
 * by checking the prefers-color-scheme media query.
 */
function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme;
}

/**
 * Applies a resolved theme to the <html> element.
 * Adds a temporary transition class for smooth changes.
 */
function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.add('theme-transitioning');
  root.setAttribute(THEME_ATTRIBUTE, resolved);

  // Remove transition class after the animation window
  window.setTimeout(() => {
    root.classList.remove('theme-transitioning');
  }, 200);
}

/**
 * Reads the stored theme preference from localStorage.
 * Falls back to 'system' when nothing is stored.
 */
function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage may be unavailable (private mode, etc.)
  }
  return 'system';
}

/**
 * Persists the user's theme preference to localStorage.
 */
function storeTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Best-effort; silently ignore failures
  }
}

export interface UseThemeReturn {
  /** User's chosen preference:'light','dark', or'system'. */
  theme: Theme;
  /** The actual applied theme after resolving 'system'. */
  resolvedTheme: ResolvedTheme;
  /** Set the theme preference. */
  setTheme: (theme: Theme) => void;
  /** Toggle between light and dark (ignores 'system'). */
  toggleTheme: () => void;
}

/**
 * React hook for managing the ECHO v6.0 theme.
 *
 * @returns Theme state and controls
 *
 * @example
 * ```tsx * function Header() { * const { resolvedTheme, setTheme } = useTheme(); * return ( * <button onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}> * Toggle theme * </button> * ); * } *```
 */
export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(getStoredTheme()),
  );

  // Apply the resolved theme to the DOM whenever it changes
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // Listen for system preference changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    const onChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };

    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    storeTheme(next);
    setResolvedTheme(resolveTheme(next));
  }, []);

  const toggleTheme = useCallback(() => {
    const current = resolveTheme(theme);
    const next = current === 'light' ? 'dark' : 'light';
    setTheme(next);
  }, [theme, setTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
}
