/**
 * V1 Design System — Toast / Notification
 *
 * V4.5.9c — re-skinned to V1 brand rules:
 *   - Slide-in from top-right (V1 motion: 250ms ease).
 *   - Bordered (1px ink-200), cream bg, no shadow, 0px radius.
 *   - Text labels for status (NOT color-coded backgrounds). Mono label,
 *     uppercase: SUCCESS / ERROR / INFO / WARNING.
 *   - Message body: Inter.
 *   - Optional action link (teal-600).
 *   - Close: text "×" (not Lucide icon).
 *   - Teal-600 focus ring (keyboard-only).
 *
 * Accessibility preserved:
 *   - role="status" / "alert" + aria-live per type
 *   - Auto-dismiss with pause-on-hover
 *   - Keyboard dismissible
 *
 * Builds on the existing zustand toastStore for data.
 *
 * @example
 * ```tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 *
 * const toast = useToast();
 * toast.success('Saved successfully');
 * ```
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';
import { useToastStore, type ToastType } from '@/stores/toastStore';
import { V1 } from '@/styles/v1-tokens';

export type { ToastType } from '@/stores/toastStore';

export interface ToastHelpers {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastHelpers | null>(null);

// V1 status labels — text, not color-coded. Mono uppercase.
const TYPE_LABEL: Record<ToastType, string> = {
  success: 'SUCCESS',
  error: 'ERROR',
  info: 'INFO',
  warning: 'WARNING',
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

/**
 * Individual toast item with exit animation.
 * V1: bordered cream card, mono status label, no shadow.
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

  // V1 toast card: bordered cream, 0 radius, no shadow
  const cardStyle: React.CSSProperties = {
    pointerEvents: 'auto',
    display: 'flex',
    width: '100%',
    maxWidth: '24rem',
    alignItems: 'flex-start',
    gap: 12,
    background: V1.cream,
    border: `1px solid ${V1.border}`,
    borderRadius: V1.radius,
    boxShadow: 'none',
    padding: '12px 14px',
    color: V1.text,
    fontFamily: V1.bodyFont,
    animation: isExiting
      ? `v1-toast-out ${V1.durNormal}ms cubic-bezier(0.4,0,1,1) forwards`
      : `v1-toast-in 250ms ${V1.ease} forwards`,
  };

  // Mono status label — text, not color-coded
  const labelStyle: React.CSSProperties = {
    flexShrink: 0,
    fontFamily: V1.monoFont,
    fontSize: V1.textMonoPx,
    fontWeight: V1.fwSemibold,
    letterSpacing: V1.trackingMono,
    textTransform: 'uppercase',
    color: V1.text,
    paddingTop: 1,
    minWidth: '4.5em',
  };

  // Vertical rule between label and message — V1 1px divider
  const dividerStyle: React.CSSProperties = {
    flexShrink: 0,
    width: 1,
    alignSelf: 'stretch',
    background: V1.border,
  };

  const messageStyle: React.CSSProperties = {
    flex: 1,
    fontSize: V1.textBodySm,
    lineHeight: V1.leadingBody,
    color: V1.text,
    wordBreak: 'break-word',
  };

  const closeButtonStyle: React.CSSProperties = {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    padding: 0,
    background: 'transparent',
    border: 'none',
    color: V1.textMuted,
    fontFamily: V1.bodyFont,
    fontSize: 18,
    lineHeight: 1,
    cursor: 'pointer',
    borderRadius: V1.radius,
    transition: `color ${V1.durFast}ms ease`,
  };

  return (
    <>
      <style>{`
        @keyframes v1-toast-in {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes v1-toast-out {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(16px); }
        }
        .v1-toast-close:focus-visible {
          outline: 2px solid ${V1.teal600};
          outline-offset: 2px;
        }
        .v1-toast-close:hover { color: ${V1.text}; }
      `}</style>
      <div
        role={TYPE_ROLE[type]}
        aria-live={TYPE_LIVE[type]}
        style={cardStyle}
        onMouseEnter={pauseTimer}
        onMouseLeave={resumeTimer}
        onFocus={pauseTimer}
        onBlur={resumeTimer}
      >
        <span style={labelStyle}>{TYPE_LABEL[type]}</span>
        <span style={dividerStyle} aria-hidden="true" />
        <p style={messageStyle}>{message}</p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          className="v1-toast-close"
          style={closeButtonStyle}
        >
          ×
        </button>
      </div>
    </>
  );
}

/**
 * Provider — mounts the toast viewport. Place near the root once.
 *
 * V1 viewport: top-right, fixed, pointer-events none on container.
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

  const viewportStyle: React.CSSProperties = {
    pointerEvents: 'none',
    position: 'fixed',
    top: 16,
    right: 16,
    zIndex: 1080,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    width: '100%',
    maxWidth: '24rem',
  };

  return (
    <ToastContext.Provider value={helpers}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        className={cn('v1-scope')}
        style={viewportStyle}
      >
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
