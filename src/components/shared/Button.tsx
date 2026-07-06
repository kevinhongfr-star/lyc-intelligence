/**
 * Button — 3 variants: primary (dark bg), outline (border), fuchsia (fuchsia bg)
 * Mockup v14 button styles
 */
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'fuchsia';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const VARIANT_STYLES = {
  primary: 'bg-text-primary text-white hover:bg-text-secondary',
  outline: 'bg-white text-text-primary border border-border hover:bg-bg-warm',
  fuchsia: 'bg-fuchsia text-white hover:bg-fuchsia/90',
};

const SIZE_STYLES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
