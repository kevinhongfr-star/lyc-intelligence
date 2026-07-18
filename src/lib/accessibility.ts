/**
 * Accessibility utilities — Issue #16: Performance & Accessibility Polish
 *
 * WCAG 2.1 AA compliance helpers: focus management, keyboard navigation,
 * ARIA helpers, color contrast utilities, and skip links.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/* Focus management                                                    */
/* ------------------------------------------------------------------ */

/**
 * useFocusLock — Trap focus within a container (for modals, dialogs).
 * WCAG 2.4.3 Focus Order
 */
export function useFocusLock(enabled: boolean = true) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    // Save previously focused element
    previousActiveRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element
    const focusable = getFocusableElements(containerRef.current);
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !containerRef.current) return;

      const focusable = getFocusableElements(containerRef.current);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore previous focus
      if (previousActiveRef.current) {
        previousActiveRef.current.focus();
      }
    };
  }, [enabled]);

  return containerRef;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
}

/* ------------------------------------------------------------------ */
/* useKeyPress — Keyboard shortcut hook                               */
/* ------------------------------------------------------------------ */

export function useKeyPress(
  targetKey: string,
  callback: (e: KeyboardEvent) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === targetKey || e.code === targetKey) {
        callback(e);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [targetKey, callback, enabled]);
}

/* ------------------------------------------------------------------ */
/* useEscapeToClose — Common pattern for modals/dropdowns              */
/* ------------------------------------------------------------------ */

export function useEscapeToClose(onClose: () => void, enabled: boolean = true) {
  useKeyPress('Escape', onClose, enabled);
}

/* ------------------------------------------------------------------ */
/* Visually Hidden component (sr-only)                               */
/* ------------------------------------------------------------------ */

export function VisuallyHidden({
  children,
  as: Component = 'span',
  ...props
}: {
  children: React.ReactNode;
  as?: any;
} & React.HTMLAttributes<any>) {
  return (
    <Component
      {...props}
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </Component>
  );
}

/* ------------------------------------------------------------------ */
/* Announce — Dynamic screen reader announcements                    */
/* Uses ARIA live region                                               */
/* ------------------------------------------------------------------ */

let announcerElement: HTMLDivElement | null = null;

function getAnnouncer(): HTMLDivElement {
  if (announcerElement) return announcerElement;

  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-atomic', 'true');
  el.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  document.body.appendChild(el);
  announcerElement = el;
  return el;
}

export function announce(message: string, politeness: 'polite' | 'assertive' = 'polite') {
  const announcer = getAnnouncer();
  announcer.setAttribute('aria-live', politeness);
  // Clear first to ensure re-announcement of same text
  announcer.textContent = '';
  // Use a small timeout to ensure the clear is registered
  setTimeout(() => {
    announcer.textContent = message;
  }, 50);
}

/* ------------------------------------------------------------------ */
/* Color contrast utilities                                            */
/* ------------------------------------------------------------------ */

/**
 * Calculate relative luminance of a hex color
 * WCAG 1.4.3 Contrast (Minimum)
 */
export function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const toSRGB = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toSRGB(r) + 0.7152 * toSRGB(g) + 0.0722 * toSRGB(b);
}

/**
 * Calculate contrast ratio between two hex colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if text meets WCAG AA contrast (4.5:1 for normal text, 3:1 for large)
 */
export function meetsWCAG(
  foreground: string,
  background: string,
  size: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return size === 'large' ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Choose black or white text for a given background color
 */
export function getContrastText(bgColor: string): string {
  return getLuminance(bgColor) > 0.179 ? '#000000' : '#FFFFFF';
}

/* ------------------------------------------------------------------ */
/* Reduced motion support                                              */
/* ------------------------------------------------------------------ */

/**
 * usePrefersReducedMotion — Detect if user prefers reduced motion
 * WCAG 2.3.3 Animation from Interactions
 */
export function usePrefersReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

/* ------------------------------------------------------------------ */
/* ARIA label helper                                                   */
/* ------------------------------------------------------------------ */

interface AriaLabelProps {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
}

export function getAriaLabelProps(props: AriaLabelProps) {
  const ariaProps: Record<string, string> = {};
  if (props.label) ariaProps['aria-label'] = props.label;
  if (props.labelledBy) ariaProps['aria-labelledby'] = props.labelledBy;
  if (props.describedBy) ariaProps['aria-describedby'] = props.describedBy;
  return ariaProps;
}

/* ------------------------------------------------------------------ */
/* Focus ring visible only on keyboard navigation                      */
/* ------------------------------------------------------------------ */

/**
 * useKeyboardFocus — Track whether focus should show visible rings
 * Returns true when user is navigating with keyboard
 */
export function useKeyboardFocus(): boolean {
  const [isKeyboard, setIsKeyboard] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboard(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboard(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isKeyboard;
}
