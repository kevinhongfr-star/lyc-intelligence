/**
 * Design system: Button
 *
 * Strengthened from the Phase 0 version. Adds:
 *   - `loading` state (renders a spinner, disables interaction)
 *   - `leftIcon` / `rightIcon` slots
 *   - `forwardRef` for ref forwarding
 *   - Full `ButtonHTMLAttributes` passthrough
 *
 * Variant keys (`default | outline | ghost | success`) are kept identical to
 * the Phase 0 Button so existing call sites keep rendering unchanged.
 */
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'default' | 'outline' | 'ghost' | 'success' | 'danger';
export type ButtonSize = 'sm' | 'default' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  default: 'bg-accent hover:bg-accent-light text-white',
  outline: 'border border-bg-tertiary text-text-primary hover:bg-bg-tertiary',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary',
  success: 'bg-tier-1 hover:bg-tier-1/80 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  default: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Children are optional so an icon-only button is valid. */
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'default',
    size = 'default',
    loading = false,
    leftIcon,
    rightIcon,
    children,
    className,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors min-h-[44px]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
