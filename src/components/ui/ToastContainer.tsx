/**
 * V1 Design System — ToastContainer (mounted in App.tsx)
 *
 * V4.5.9c — re-skinned to V1 brand rules:
 *   - Slide-in from top-right (250ms ease).
 *   - Bordered (1px ink-200), cream bg, no shadow, 0px radius.
 *   - Text labels for status (mono uppercase): SUCCESS / ERROR / INFO / WARNING.
 *     NOT color-coded backgrounds.
 *   - Vertical 1px rule between label and message.
 *   - Message body: Inter.
 *   - Close: text "×" (not Lucide icon).
 *   - Teal-600 focus ring (keyboard-only).
 *
 * Renders toasts directly from useToastStore (no provider needed).
 */
import React from 'react';
import { useToastStore, type ToastType } from '@/stores/toastStore';
import { V1 } from '@/styles/v1-tokens';

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

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  const viewportStyle: React.CSSProperties = {
    position: 'fixed',
    top: 16,
    right: 16,
    zIndex: 1080,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    width: '100%',
    maxWidth: '24rem',
    pointerEvents: 'none',
  };

  return (
    <div className="v1-scope" style={viewportStyle} role="region" aria-label="Notifications">
      <style>{`
        @keyframes v1-tc-in {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .v1-tc-close:focus-visible {
          outline: 2px solid ${V1.teal600};
          outline-offset: 2px;
        }
        .v1-tc-close:hover { color: ${V1.text}; }
      `}</style>
      {toasts.map((t) => (
        <div
          key={t.id}
          role={TYPE_ROLE[t.type]}
          aria-live={TYPE_LIVE[t.type]}
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            width: '100%',
            alignItems: 'flex-start',
            gap: 12,
            background: V1.cream,
            border: `1px solid ${V1.border}`,
            borderRadius: V1.radius,
            boxShadow: 'none',
            padding: '12px 14px',
            color: V1.text,
            fontFamily: V1.bodyFont,
            animation: 'v1-tc-in 250ms cubic-bezier(0.16,1,0.3,1) forwards',
          }}
        >
          <span
            style={{
              flexShrink: 0,
              fontFamily: V1.monoFont,
              fontSize: V1.textMonoPx,
              fontWeight: V1.fwSemibold,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: V1.text,
              paddingTop: 1,
              minWidth: '4.5em',
            }}
          >
            {TYPE_LABEL[t.type]}
          </span>
          <span
            aria-hidden="true"
            style={{ flexShrink: 0, width: 1, alignSelf: 'stretch', background: V1.border }}
          />
          <p
            style={{
              flex: 1,
              fontSize: V1.textBodySm,
              lineHeight: V1.leadingBody,
              color: V1.text,
              wordBreak: 'break-word',
              margin: 0,
            }}
          >
            {t.message}
          </p>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            aria-label="Dismiss notification"
            className="v1-tc-close"
            style={{
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
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
