import React from 'react';
import { useToastStore, type ToastType } from '@/stores/toastStore';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle style={{ width: 18, height: 18, color: '#059669' }} />,
  error: <XCircle style={{ width: 18, height: 18, color: '#DC2626' }} />,
  info: <Info style={{ width: 18, height: 18, color: '#2563EB' }} />,
  warning: <AlertTriangle style={{ width: 18, height: 18, color: '#D97706' }} />,
};

const bgColors: Record<ToastType, string> = {
  success: '#F0FDF4',
  error: '#FEF2F2',
  info: '#EFF6FF',
  warning: '#FFFBEB',
};

const borderColors: Record<ToastType, string> = {
  success: '#BBF7D0',
  error: '#FECACA',
  info: '#BFDBFE',
  warning: '#FDE68A',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
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
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '12px 16px',
            background: bgColors[t.type],
            border: `1px solid ${borderColors[t.type]}`,
            borderRadius: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            fontSize: 14,
            lineHeight: 1.5,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            color: '#1F2937',
            pointerEvents: 'auto',
            animation: 'toast-slide-in 0.25s ease-out',
          }}
        >
          <span style={{ flexShrink: 0, marginTop: 1 }}>{icons[t.type]}</span>
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            style={{
              flexShrink: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 2,
              marginTop: -2,
              marginRight: -4,
              color: '#9CA3AF',
            }}
          >
            <X style={{ width: 14, height: 14 }} />
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
  );
}
