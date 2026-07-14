import { useEffect, useCallback } from 'react';

interface KeyboardShortcutOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export function useKeyboardShortcut(
  key: string,
  callback: (event: KeyboardEvent) => void,
  { enabled = true, preventDefault = true, stopPropagation = false }: KeyboardShortcutOptions = {}
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isMatch = event.key.toLowerCase() === key.toLowerCase();

      if (isMatch && enabled) {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        callback(event);
      }
    },
    [key, callback, enabled, preventDefault, stopPropagation]
  );

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

export function useEscapeKey(
  callback: () => void,
  { enabled = true }: { enabled?: boolean } = {}
) {
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && enabled) {
        callback();
      }
    },
    [callback, enabled]
  );

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape, enabled]);
}
