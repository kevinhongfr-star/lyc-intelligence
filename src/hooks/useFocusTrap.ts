import { useRef, useEffect } from 'react';

interface FocusTrapOptions {
  enabled?: boolean;
  focusFirst?: boolean;
  escapeDeactivates?: boolean;
  onDeactivate?: () => void;
}

export function useFocusTrap<T extends HTMLElement>({
  enabled = true,
  focusFirst = true,
  escapeDeactivates = true,
  onDeactivate,
}: FocusTrapOptions = {}) {
  const ref = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const focusableElements = ref.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusFirst && focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && escapeDeactivates) {
        onDeactivate?.();
        return;
      }

      if (e.key !== 'Tab') return;

      const elements = Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) || []
      ).filter(el => !el.hasAttribute('disabled'));

      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [enabled, focusFirst, escapeDeactivates, onDeactivate]);

  return ref;
}
