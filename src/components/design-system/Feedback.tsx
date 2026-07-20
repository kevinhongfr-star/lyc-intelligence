import React from 'react';
import { COLORS, SPACING, RADII, SHADOWS, TRANSITIONS, Z_INDEX } from '@/styles/tokens';

interface ToastProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  children, 
  variant = 'info',
  onClose,
  duration = 5000,
}) => {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const variants: Record<string, {
    backgroundColor: string;
    icon: string;
  }> = {
    success: {
      backgroundColor: COLORS.successLight,
      icon: '✓',
    },
    error: {
      backgroundColor: COLORS.errorLight,
      icon: '✕',
    },
    warning: {
      backgroundColor: COLORS.warningLight,
      icon: '⚠',
    },
    info: {
      backgroundColor: COLORS.infoLight,
      icon: 'ℹ',
    },
  };

  const style = variants[variant];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${SPACING[3]}px`,
        padding: `${SPACING[3]}px ${SPACING[4]}px`,
        backgroundColor: style.backgroundColor,
        borderRadius: `${RADII.md}px`,
        boxShadow: SHADOWS.md,
        fontSize: `${SPACING[4]}px`,
        color: COLORS.text,
        zIndex: Z_INDEX.toast,
        animation: 'slideIn 300ms ease-out',
      }}
    >
      <span
        style={{
          width: `${SPACING[8]}px`,
          height: `${SPACING[8]}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: `${RADII.full}px`,
          backgroundColor: 'rgba(0,0,0,0.05)',
          fontSize: `${SPACING[5]}px`,
        }}
      >
        {style.icon}
      </span>
      <span style={{ flex: 1 }}>{children}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: COLORS.textMuted,
            cursor: 'pointer',
            fontSize: `${SPACING[5]}px`,
            lineHeight: 1,
            padding: `${SPACING[1]}px`,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

interface AlertProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ 
  children, 
  variant = 'info',
  title,
  className = '',
}) => {
  const variants: Record<string, {
    backgroundColor: string;
    borderColor: string;
    icon: string;
  }> = {
    success: {
      backgroundColor: COLORS.successLight,
      borderColor: COLORS.success,
      icon: '✓',
    },
    error: {
      backgroundColor: COLORS.errorLight,
      borderColor: COLORS.error,
      icon: '✕',
    },
    warning: {
      backgroundColor: COLORS.warningLight,
      borderColor: COLORS.warning,
      icon: '⚠',
    },
    info: {
      backgroundColor: COLORS.infoLight,
      borderColor: COLORS.info,
      icon: 'ℹ',
    },
  };

  const style = variants[variant];

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap: `${SPACING[4]}px`,
        padding: `${SPACING[4]}px`,
        backgroundColor: style.backgroundColor,
        borderLeft: `3px solid ${style.borderColor}`,
        borderRadius: `${RADII.md}px`,
        fontSize: `${SPACING[4]}px`,
        color: COLORS.text,
      }}
    >
      <span
        style={{
          fontSize: `${SPACING[6]}px`,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {style.icon}
      </span>
      <div>
        {title && (
          <div
            style={{
              fontWeight: 600,
              marginBottom: `${SPACING[1]}px`,
            }}
          >
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({ size = 'md', className = '' }) => {
  const sizes: Record<string, string> = {
    sm: `${SPACING[6]}px`,
    md: `${SPACING[8]}px`,
    lg: `${SPACING[10]}px`,
  };

  return (
    <div
      className={className}
      style={{
        width: sizes[size],
        height: sizes[size],
        border: `3px solid ${COLORS.border}`,
        borderTopColor: COLORS.primary,
        borderRadius: `${RADII.full}px`,
        animation: 'spin 1s linear infinite',
      }}
    />
  );
};

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description,
  action,
  className = '' 
}) => (
  <div
    className={className}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${SPACING[16]}px`,
      textAlign: 'center',
    }}
  >
    <div
      style={{
        width: `${SPACING[20]}px`,
        height: `${SPACING[20]}px`,
        backgroundColor: COLORS.primaryLight,
        borderRadius: `${RADII.full}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: `${SPACING[6]}px`,
      }}
    >
      {icon}
    </div>
    <div
      style={{
        fontSize: `${SPACING[6]}px`,
        fontWeight: 700,
        color: COLORS.text,
        marginBottom: `${SPACING[2]}px`,
      }}
    >
      {title}
    </div>
    {description && (
      <div
        style={{
          fontSize: `${SPACING[4]}px`,
          color: COLORS.textSecondary,
          marginBottom: `${SPACING[6]}px`,
          maxWidth: '320px',
        }}
      >
        {description}
      </div>
    )}
    {action}
  </div>
);