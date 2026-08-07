/**
 * Phase 5: ECHO v6.0 Accessible Focus Hooks
 *
 * Three hooks for managing keyboard focus and accessibility:
 *   - useFocusTrap       — trap focus inside a container (modals, drawers)
 *   - useSkipLink        — skip-to-main-content for screen readers
 *   - useFocusRing       — show/hide focus rings based on input method
 */

import { useCallback, useEffect, useRef } from 'react';

// ── useFocusTrap ──────────────────────────────────────────────

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[data-focusable]',
].join(',');

const FOCUSABLE_VISIBLE_SELECTOR = `${FOCUSABLE_SELECTOR}:not([aria-hidden="true"]):not([style*="display: none"]):not([style*="visibility: hidden"])`;

/**
 * Returns all focusable descendants of an element that are visible.
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_VISIBLE_SELECTOR);
  return Array.from(elements).filter(
    (el) => el.offsetWidth > 0 && el.offsetHeight > 0,
  );
}

export interface UseFocusTrapOptions {
  /** Whether the trap is active. Default: true. */
  active?: boolean;
  /** Whether to auto-focus the first focusable element. Default: true. */
  autoFocus?: boolean;
  /** Selector for the element to focus first. */
  initialFocusSelector?: string;
  /** Called when the user presses Escape. */
  onEscape?: () => void;
  /** Whether to restore focus to the previously focused element on deactivation. Default: true. */
  restoreFocus?: boolean;
}

export interface UseFocusTrapReturn {
  /** Ref to attach to the container element. */
  ref: React.RefObject<HTMLElement>;
  /** Manually focus the first focusable element in the trap. */
  focusFirst: () => void;
  /** Manually focus the last focusable element in the trap. */
  focusLast: () => void;
}

/**
 * Traps keyboard focus inside a container element.
 *
 * Call this from a component that renders a modal, dialog, or drawer.
 * The hook manages Tab / Shift+Tab cycling, Escape handling, and
 * initial focus placement.
 *
 * @param options Configuration for the focus trap
 * @returns Ref to attach to the container and imperative focus methods
 *
 * @example
 * ```tsx
 * function Dialog({ open, onClose }) {
 *   const { ref } = useFocusTrap({ active: open, onEscape: onClose });
 *   return open ? <div ref={ref} role="dialog">...</div> : null;
 * }
 * ```
 */
export function useFocusTrap(options: UseFocusTrapOptions = {}): UseFocusTrapReturn {
  const {
    active = true,
    autoFocus = true,
    initialFocusSelector,
    onEscape,
    restoreFocus = true,
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const focusFirst = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (initialFocusSelector) {
      const el = container.querySelector<HTMLElement>(initialFocusSelector);
      if (el) {
        el.focus();
        return;
      }
    }

    const elements = getFocusableElements(container);
    elements[0]?.focus();
  }, [initialFocusSelector]);

  const focusLast = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const elements = getFocusableElements(container);
    elements[elements.length - 1]?.focus();
  }, []);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Store currently focused element for restore
    previouslyFocusedRef.current = document.activeElement as HTMLElement;

    // Auto-focus first element
    if (autoFocus) {
      // Wait a frame for the DOM to settle
      requestAnimationFrame(() => focusFirst());
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      if (e.shiftKey) {
        if (activeElement === first || !container.contains(activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      if (restoreFocus) {
        // Restore focus to the element that had focus before the trap opened
        requestAnimationFrame(() => {
          previouslyFocusedRef.current?.focus();
        });
      }
    };
  }, [active, autoFocus, onEscape, restoreFocus, focusFirst]);

  return { ref: containerRef, focusFirst, focusLast };
}

// ── useSkipLink ───────────────────────────────────────────────

/**
 * Enables a "Skip to main content" link for keyboard and screen reader
 * users.  Renders a visually-hidden anchor that becomes visible on focus.
 *
 * The link targets an element with `id="main-content"`.  If your layout
 * uses a different id, pass it via `targetId`.
 *
 * @param targetId The id of the main content element to skip to
 *
 * @example
 * ```tsx
 * function AppLayout() {
 *   const skipLink = useSkipLink();
 *   return (
 *     <div>
 *       {skipLink}
 *       <header>...</header>
 *       <main id="main-content">...</main>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSkipLink(targetId = 'main-content'): React.ReactNode {
  // This is a simple render function — no state needed.
  // Returns the skip link JSX to be placed as the first child in the layout.
  return (
    <a
      href={`#${targetId}`}
      onClick={(e) => {
        e.preventDefault();
        const el = document.getElementById(targetId);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }}
      style={{
        position: 'absolute',
        top: '-100px',
        left: '16px',
        background: '#C108AB',
        color: '#FFFFFF',
        padding: '8px 16px',
        zIndex: 9999,
        fontWeight: 600,
        fontSize: '14px',
        transition: 'top 150ms ease-out',
        border: 'none',
        cursor: 'pointer',
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLElement).style.top = '16px';
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLElement).style.top = '-100px';
      }}
    >
      Skip to main content
    </a>
  );
}

// ── useFocusRing ──────────────────────────────────────────────

/**
 * Tracks whether the user is navigating with a keyboard.
 * When true, focus rings are visible. When false (mouse/touch),
 * focus rings are hidden to avoid visual noise.
 *
 * Adds/removes `keyboard-focus` class on <html>. Components can
 * use this to conditionally show focus styles.
 *
 * @returns Whether keyboard focus mode is active
 *
 * @example
 * ```tsx
 * const isKeyboardUser = useFocusRing();
 * // Use isKeyboardUser to decide whether to show focus rings
 * ```
 */
export function useFocusRing(): boolean {
  const [isKeyboardUser, setIsKeyboardUser] = [
    // We use a state-less approach via event listeners
    // and a ref to avoid unnecessary re-renders
  ] as const;

  // We implement this as a simple hook without React state
  // by using a custom event dispatching approach.
  useEffect(() => {
    let keyboardFocus = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Shift') {
        if (!keyboardFocus) {
          keyboardFocus = true;
          document.documentElement.classList.add('keyboard-focus');
          document.dispatchEvent(new CustomEvent('echo-keyboard-focus', { detail: true }));
        }
      }
    };

    const handleMouseDown = () => {
      if (keyboardFocus) {
        keyboardFocus = false;
        document.documentElement.classList.remove('keyboard-focus');
        document.dispatchEvent(new CustomEvent('echo-keyboard-focus', { detail: false }));
      }
    };

    const handleTouchStart = () => {
      if (keyboardFocus) {
        keyboardFocus = false;
        document.documentElement.classList.remove('keyboard-focus');
        document.dispatchEvent(new CustomEvent('echo-keyboard-focus', { detail: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  // We return a static flag. Components that need reactive updates
  // should listen for the 'echo-keyboard-focus' custom event.
  // For most use cases, the CSS class on <html> is sufficient.
  return document.documentElement.classList.contains('keyboard-focus');
}
