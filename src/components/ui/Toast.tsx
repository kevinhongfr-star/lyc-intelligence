/**
 * Phase 5: ECHO v6.0 Toast System
 *
 * Accessible toast notification system with:
 *   - ToastProvider — mount once near the root
 *   - useToast() — returns toast helpers
 *   - toast — static helpers callable outside React
 *
 * Builds on the existing zustand toastStore for data.
 * Uses ECHO v6.0 design: zero border-radius, #C108AB accent,
 * motion.css animations, and full ARIA compliance.
 *
 * @example
 * ```tsx * // Root setup * <ToastProvider> * <App /> * </ToastProvider> * * // In any component * const toast = useToast(); * toast.success('Saved successfully'); *```
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore, type ToastType } from '@/stores/toastStore';

export type { ToastType } from '@/stores/toastStore';

export interface ToastHelpers {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastHelpers | null>(null);

const TYPE_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4" aria-hidden="true" />,
  error: <XCircle className="w-4 h-4" aria-hidden="true" />,
  info: <Info className="w-4 h-4" aria-hidden="true" />,
  warning: <AlertTriangle className="w-4 h-4" aria-hidden="true" />,
};

const TYPE_ROLE: Record<ToastType, 'status' | 'alert'> = {
  success: 'status',
  info: 'status',
  warning: 'alert',
  error: 'alert',
};

const TYPE_LIVE: Record<ToastType, 'polite' | 'assertive'> = {
  success: 'polite',
  info: 'polite',
  warning: 'assertive',
  error: 'assertive',
};

const TYPE_BORDER: Record<ToastType, string> = {
  success: 'border-[var(--echo-success)]',
  error: 'border-[var(--echo-error)]',
  info: 'border-[var(--echo-info)]',
  warning: 'border-[var(--echo-warning)]',
};

const TYPE_BG: Record<ToastType, string> = {
  success: 'bg-[var(--echo-success-soft)]',
  error: 'bg-[var(--echo-error-soft)]',
  info: 'bg-[var(--echo-info-soft)]',
  warning: 'bg-[var(--echo-warning-soft)]',
};

const TYPE_ICON_COLOR: Record<ToastType, string> = {
  success: 'text-[var(--echo-success)]',
  error: 'text-[var(--echo-error)]',
  info: 'text-[var(--echo-info)]',
  warning: 'text-[var(--echo-warning)]',
};

const TYPE_PROGRESS: Record<ToastType, string> = {
  success: 'bg-[var(--echo-success)]',
  error: 'bg-[var(--echo-error)]',
  info: 'bg-[var(--echo-info)]',
  warning: 'bg-[var(--echo-warning)]',
};

/**
 * Individual toast item with exit animation and progress bar.
 */
interface ToastItemProps {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  onDismiss: (id: string) => void;
}

function ToastItem({ id, type, message, duration, onDismiss }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDismiss = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    // Wait for exit animation before removing
    exitTimerRef.current = setTimeout(() => {
      onDismiss(id);
    }, 200);
  }, [id, onDismiss, isExiting]);

  useEffect(() => {
    if (duration > 0) {
      timerRef.current = setTimeout(handleDismiss, duration);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [duration, handleDismiss]);

  // Pause timer on hover
  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resumeTimer = useCallback(() => {
    if (!timerRef.current && duration > 0 && !isExiting) {
      timerRef.current = setTimeout(handleDismiss, duration);
    }
  }, [duration, handleDismiss, isExiting]);

  return (
    <div
      role={TYPE_ROLE[type]}
      aria-live={TYPE_LIVE[type]}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 border-l-4 px-4 py-3 shadow-md',
        'bg-[var(--echo-surface)] text-[var(--echo-text-primary)]',
        TYPE_BORDER[type],
        TYPE_BG[type],
        isExiting
          ? 'animate-[echo-toast-out_200ms_cubic-bezier(0.4,0,1,1)_forwards]'
          : 'animate-[echo-toast-in_250ms_cubic-bezier(0.16,1,0.3,1)_forwards]',
      )}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      onFocus={pauseTimer}
      onBlur={resumeTimer}
    >
      <span className={cn('mt-0.5 shrink-0', TYPE_ICON_COLOR[type])}>
        {TYPE_ICONS[type]}
      </span>

      <p className="flex-1 text-sm leading-relaxed break-words">{message}</p>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        className={cn(
          'shrink-0 -mr-1 -mt-1 p-1 text-[var(--echo-text-muted)]',
          'hover:text-[var(--echo-text-primary)] transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--echo-accent)]',
        )}
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Provider — mounts the toast viewport. Place near the root once.
 *
 * @example
 * ```tsx * function App() { * return ( * <ToastProvider> * <YourApp /> * </ToastProvider> * ); * } *```
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, addToast, removeToast } = useToastStore();

  const helpers = useMemo<ToastHelpers>(
    () => ({
      success: (msg, dur) => addToast('success', msg, dur),
      error: (msg, dur) => addToast('error', msg, dur ?? 6000),
      info: (msg, dur) => addToast('info', msg, dur),
      warning: (msg, dur) => addToast('warning', msg, dur),
      dismiss: (id) => removeToast(id),
    }),
    [addToast, removeToast],
  );

  return (
    <ToastContext.Provider value={helpers}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 top-4 z-[1080] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto sm:inset-x-auto"
      >
        <div className="flex w-full max-w-sm flex-col gap-2">
          {toasts.map((t) => (
            <ToastItem
              key={t.id}
              id={t.id}
              type={t.type}
              message={t.message}
              duration={t.duration ?? 4000}
              onDismiss={removeToast}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Hook — returns toast helpers from context.
 * Falls back to the zustand store's static helpers when called
 * outside a provider (works in non-React code paths).
 */
export function useToast(): ToastHelpers {
  const ctx = useContext(ToastContext);
  if (ctx) return ctx;
  const store = useToastStore.getState();
  return {
    success: (msg, dur) => store.addToast('success', msg, dur),
    error: (msg, dur) => store.addToast('error', msg, dur ?? 6000),
    info: (msg, dur) => store.addToast('info', msg, dur),
    warning: (msg, dur) => store.addToast('warning', msg, dur),
    dismiss: (id) => store.removeToast(id),
  };
}

/**
 * Static helpers — callable outside React component tree
 * (e.g. from service modules, error handlers).
 */
export const toast = {
  success: (msg: string, dur?: number) =>
    useToastStore.getState().addToast('success', msg, dur),
  error: (msg: string, dur?: number) =>
    useToastStore.getState().addToast('error', msg, dur ?? 6000),
  info: (msg: string, dur?: number) =>
    useToastStore.getState().addToast('info', msg, dur),
  warning: (msg: string, dur?: number) =>
    useToastStore.getState().addToast('warning', msg, dur),
};
