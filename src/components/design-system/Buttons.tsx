import React from 'react';
import { COLORS, SPACING, RADII, SHADOWS, TRANSITIONS } from '@/styles/tokens';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  className = '',
  onClick,
}) => {
  const sizes: Record<string, { padding: string; fontSize: string }> = {
    sm: { padding: `${SPACING[2]}px ${SPACING[3]}px`, fontSize: `${SPACING[3]}px` },
    md: { padding: `${SPACING[3]}px ${SPACING[6]}px`, fontSize: `${SPACING[4]}px` },
    lg: { padding: `${SPACING[4]}px ${SPACING[8]}px`, fontSize: `${SPACING[4]}px` },
  };

  const variants: Record<string, {
    backgroundColor: string;
    color: string;
    borderColor: string;
    hoverBackgroundColor: string;
    hoverColor: string;
    shadow: string;
  }> = {
    primary: {
      backgroundColor: COLORS.primary,
      color: COLORS.white,
      borderColor: 'transparent',
      hoverBackgroundColor: COLORS.primaryHover,
      hoverColor: COLORS.white,
      shadow: SHADOWS.button,
    },
    secondary: {
      backgroundColor: COLORS.bgAlt,
      color: COLORS.text,
      borderColor: COLORS.border,
      hoverBackgroundColor: COLORS.primaryLight,
      hoverColor: COLORS.primary,
      shadow: SHADOWS.none,
    },
    outline: {
      backgroundColor: 'transparent',
      color: COLORS.primary,
      borderColor: COLORS.primary,
      hoverBackgroundColor: COLORS.primary,
      hoverColor: COLORS.white,
      shadow: SHADOWS.none,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: COLORS.textSecondary,
      borderColor: 'transparent',
      hoverBackgroundColor: COLORS.primaryLight,
      hoverColor: COLORS.primary,
      shadow: SHADOWS.none,
    },
    danger: {
      backgroundColor: COLORS.error,
      color: COLORS.white,
      borderColor: 'transparent',
      hoverBackgroundColor: COLORS.errorDark,
      hoverColor: COLORS.white,
      shadow: SHADOWS.none,
    },
  };

  const style = variants[variant];

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...sizes[size],
        backgroundColor: disabled ? COLORS.border : style.backgroundColor,
        color: disabled ? COLORS.textMuted : style.color,
        border: `1px solid ${style.borderColor}`,
        borderRadius: `${RADII.button}px`,
        boxShadow: disabled ? SHADOWS.none : style.shadow,
        transition: TRANSITIONS.all,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: `${SPACING[2]}px`,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = style.hoverBackgroundColor;
          e.currentTarget.style.color = style.hoverColor;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = style.backgroundColor;
          e.currentTarget.style.color = style.color;
        }
      }}
    >
      {children}
    </button>
  );
};

interface IconButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({ 
  children, 
  variant = 'ghost', 
  size = 'md',
  disabled = false,
  className = '',
  onClick,
  ariaLabel,
}) => {
  const sizes: Record<string, string> = {
    sm: `${SPACING[6]}px`,
    md: `${SPACING[8]}px`,
    lg: `${SPACING[10]}px`,
  };

  const variants: Record<string, {
    backgroundColor: string;
    color: string;
    hoverBackgroundColor: string;
  }> = {
    primary: {
      backgroundColor: COLORS.primary,
      color: COLORS.white,
      hoverBackgroundColor: COLORS.primaryHover,
    },
    secondary: {
      backgroundColor: COLORS.bgAlt,
      color: COLORS.text,
      hoverBackgroundColor: COLORS.primaryLight,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: COLORS.textSecondary,
      hoverBackgroundColor: COLORS.bgHover,
    },
  };

  const style = variants[variant];

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        width: sizes[size],
        height: sizes[size],
        backgroundColor: disabled ? COLORS.border : style.backgroundColor,
        color: disabled ? COLORS.textMuted : style.color,
        border: 'none',
        borderRadius: `${RADII.md}px`,
        transition: TRANSITIONS.all,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = style.hoverBackgroundColor;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = style.backgroundColor;
        }
      }}
    >
      {children}
    </button>
  );
};