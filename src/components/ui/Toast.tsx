/**
 * Design system: Toast
 *
 * Re-implements the toast system on top of the existing zustand toastStore.
 * Provides:
 *   - `ToastProvider` — mount once near the root to render the toast viewport
 *   - `useToast()` — returns the toast helpers ({ success, error, info, warning, dismiss })
 *   - `toast` — convenience static helpers (callable outside React)
 *
 * Existing code that imports `toast` from `@/stores/toastStore` keeps working.
 * New code should import `toast` from `@/components/ui` for consistency.
 */
import React, { createContext, useContext, useMemo } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
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

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-tier-1" aria-hidden="true" />,
  error: <XCircle className="w-4 h-4 text-red-600" aria-hidden="true" />,
  info: <Info className="w-4 h-4 text-accent" aria-hidden="true" />,
  warning: <AlertTriangle className="w-4 h-4 text-tier-2" aria-hidden="true" />,
};

const BORDERS: Record<ToastType, string> = {
  success: 'border-tier-1/40',
  error: 'border-red-600/40',
  info: 'border-accent/40',
  warning: 'border-tier-2/40',
};

/**
 * Provider — mounts the toast viewport. Place near the root once.
 *
 *   <ToastProvider>
 *     <App />
 *   </ToastProvider>
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
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxWidth: 420,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`flex items-start gap-2.5 px-4 py-3 bg-bg-secondary border ${BORDERS[t.type]} shadow-modal text-sm text-text-primary pointer-events-auto`}
            style={{ animation: 'toast-slide-in 0.25s ease-out' }}
          >
            <span className="shrink-0 mt-0.5">{ICONS[t.type]}</span>
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss notification"
              className="shrink-0 -mt-1 -mr-1 p-1 text-text-muted hover:text-text-primary"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
        <style>{`
          @keyframes toast-slide-in {
            from { opacity: 0; transform: translateX(40px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Hook — returns toast helpers from context. Falls back to the zustand
 * store's static helpers when called outside a provider (so it works in
 * non-React code paths too).
 */
export function useToast(): ToastHelpers {
  const ctx = useContext(ToastContext);
  if (ctx) return ctx;
  // Fallback: use the zustand store directly (works outside provider)
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
 * Static helpers — callable outside React component tree (e.g. from
 * service modules). Re-exported from the zustand store for backwards
 * compatibility with existing call sites.
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
