import React from 'react';
import { COLORS, SPACING, RADII, SHADOWS, TRANSITIONS } from '@/styles/tokens';

type SpacingInput = keyof typeof SPACING | number | (string & {});

const spacingPx = (val: SpacingInput | undefined): number | undefined => {
  if (val === undefined) return undefined;
  if (typeof val === 'number') {
    return SPACING[val] ?? val;
  }
  return SPACING[val] ?? parseInt(val, 10);
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  mb?: SpacingInput;
  mt?: SpacingInput;
  style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  className = '',
  onClick,
  mb,
  mt,
  style,
  ...rest
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

  const v = variants[variant];
  const marginBottom = spacingPx(mb);
  const marginTop = spacingPx(mt);

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...sizes[size],
        backgroundColor: disabled ? COLORS.border : v.backgroundColor,
        color: disabled ? COLORS.textMuted : v.color,
        border: `1px solid ${v.borderColor}`,
        borderRadius: `${RADII.button}px`,
        boxShadow: disabled ? SHADOWS.none : v.shadow,
        transition: TRANSITIONS.all,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: `${SPACING[2]}px`,
        ...(marginBottom !== undefined ? { marginBottom: `${marginBottom}px` } : {}),
        ...(marginTop !== undefined ? { marginTop: `${marginTop}px` } : {}),
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = v.hoverBackgroundColor;
          e.currentTarget.style.color = v.hoverColor;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = v.backgroundColor;
          e.currentTarget.style.color = v.color;
        }
      }}
      {...rest}
    >
      {children}
    </button>
  );
};

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
  style?: React.CSSProperties;
}

export const IconButton: React.FC<IconButtonProps> = ({ 
  children, 
  variant = 'ghost', 
  size = 'md',
  disabled = false,
  className = '',
  onClick,
  ariaLabel,
  style,
  ...rest
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

  const v = variants[variant];

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        width: sizes[size],
        height: sizes[size],
        backgroundColor: disabled ? COLORS.border : v.backgroundColor,
        color: disabled ? COLORS.textMuted : v.color,
        border: 'none',
        borderRadius: `${RADII.md}px`,
        transition: TRANSITIONS.all,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = v.hoverBackgroundColor;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = v.backgroundColor;
        }
      }}
      {...rest}
    >
      {children}
    </button>
  );
};
