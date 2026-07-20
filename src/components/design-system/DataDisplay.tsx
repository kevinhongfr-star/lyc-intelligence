import React from 'react';
import { COLORS, SPACING, RADII } from '@/styles/tokens';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default',
  className = '' 
}) => {
  const variants: Record<string, {
    backgroundColor: string;
    color: string;
  }> = {
    default: {
      backgroundColor: COLORS.primaryLight,
      color: COLORS.primary,
    },
    success: {
      backgroundColor: COLORS.successLight,
      color: COLORS.success,
    },
    warning: {
      backgroundColor: COLORS.warningLight,
      color: COLORS.warning,
    },
    error: {
      backgroundColor: COLORS.errorLight,
      color: COLORS.error,
    },
    info: {
      backgroundColor: COLORS.infoLight,
      color: COLORS.info,
    },
  };

  const style = variants[variant];

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: `${SPACING[1]}px ${SPACING[3]}px`,
        fontSize: `${SPACING[3]}px`,
        fontWeight: 600,
        backgroundColor: style.backgroundColor,
        color: style.color,
        borderRadius: `${RADII.pill}px`,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {children}
    </span>
  );
};

interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({ 
  value, 
  max = 100,
  label,
  className = '' 
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={className}>
      {label && (
        <div
          style={{
            fontSize: `${SPACING[3]}px`,
            color: COLORS.textMuted,
            marginBottom: `${SPACING[1]}px`,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>{label}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        style={{
          height: `${SPACING[2]}px`,
          backgroundColor: COLORS.borderLight,
          borderRadius: `${RADII.pill}px`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            backgroundColor: COLORS.primary,
            borderRadius: `${RADII.pill}px`,
            transition: 'width 300ms ease-out',
          }}
        />
      </div>
    </div>
  );
};

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  name, 
  src, 
  size = 'md',
  className = '' 
}) => {
  const sizes: Record<string, string> = {
    sm: `${SPACING[8]}px`,
    md: `${SPACING[10]}px`,
    lg: `${SPACING[12]}px`,
  };

  const initials = name 
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div
      className={className}
      style={{
        width: sizes[size],
        height: sizes[size],
        borderRadius: `${RADII.full}px`,
        backgroundColor: COLORS.primaryLight,
        color: COLORS.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${SPACING[4]}px`,
        fontWeight: 600,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        initials
      )}
    </div>
  );
};

interface TagProps {
  children: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export const Tag: React.FC<TagProps> = ({ 
  children, 
  removable = false,
  onRemove,
  className = '' 
}) => (
  <span
    className={className}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: `${SPACING[1]}px`,
      padding: `${SPACING[1]}px ${SPACING[3]}px`,
      fontSize: `${SPACING[3]}px`,
      backgroundColor: COLORS.bgAlt,
      color: COLORS.textSecondary,
      border: `1px solid ${COLORS.border}`,
      borderRadius: `${RADII.pill}px`,
    }}
  >
    {children}
    {removable && onRemove && (
      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          color: COLORS.textMuted,
          cursor: 'pointer',
          fontSize: `${SPACING[4]}px`,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    )}
  </span>
);