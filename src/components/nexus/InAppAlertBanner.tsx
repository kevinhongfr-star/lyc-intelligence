import React from 'react';
import { V1 } from '@/styles/v1-tokens';
import '@/styles/v1-motion.css';

export type AlertBannerType = 'info' | 'warning' | 'success';

interface InAppAlertBannerProps {
  type?: AlertBannerType;
  label?: string;
  message: string;
  onDismiss?: () => void;
}

const TYPE_STYLES: Record<
  AlertBannerType,
  { bg: string; border: string; labelColor: string }
> = {
  info: {
    bg: V1.teal50,
    border: V1.teal200,
    labelColor: V1.teal700,
  },
  warning: {
    bg: V1.fuchsia50,
    border: '#F5B7E9',
    labelColor: V1.fuchsia600,
  },
  success: {
    bg: 'rgba(6, 41, 38, 0.06)',
    border: V1.teal800,
    labelColor: V1.teal800,
  },
};

export const InAppAlertBanner: React.FC<InAppAlertBannerProps> = ({
  type = 'info',
  label,
  message,
  onDismiss,
}) => {
  const styles = TYPE_STYLES[type];
  const defaultLabel =
    type === 'success'
      ? 'CONFIRMED'
      : type === 'warning'
      ? 'ATTENTION'
      : 'NOTICE';

  return (
    <div
      className="v1-fade-in"
      style={{
        marginBottom: '8px',
        width: '100%',
        padding: '12px 16px',
        backgroundColor: styles.bg,
        border: `1px solid ${styles.border}`,
        borderRadius: V1.radius,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '12px',
          flex: 1,
          minWidth: 0,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: V1.monoFont,
            fontSize: '0.65rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: styles.labelColor,
            whiteSpace: 'nowrap',
          }}
        >
          {label ?? defaultLabel}
        </span>
        <span
          style={{
            fontFamily: V1.bodyFont,
            fontSize: '14px',
            color: V1.ink800,
            lineHeight: 1.5,
          }}
        >
          {message}
        </span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          style={{
            fontFamily: V1.monoFont,
            fontSize: '0.65rem',
            letterSpacing: '0.04em',
            color: V1.ink500,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Dismiss ×
        </button>
      )}
    </div>
  );
};

export default InAppAlertBanner;
