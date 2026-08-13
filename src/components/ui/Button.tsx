/**
 * Design system: Button (#1355).
 *
 * Single shared Button component for the entire surface. 3 canonical variants
 * × 3 sizes, plus semantic `success`/`danger` (status only, not decorative).
 *
 * Brand rules:
 *  - Zero border radius (#1349).
 *  - DM Sans body font, font-weight medium.
 *  - 150ms ease-out hover/transition (#1367) — no default "ease".
 *  - Min 44px touch target.
 *  - Fuchsia accent reserved for the Primary variant only.
 *
 * Variant aliases (`primary`/`secondary`/`ghost`) are the canonical ECHO v1.2
 * names; `default`/`outline` are retained as backwards-compatible aliases so
 * existing call sites keep rendering unchanged.
 *
 * Also adds: `loading` state, `leftIcon`/`rightIcon` slots, `forwardRef`, and
 * full `ButtonHTMLAttributes` passthrough.
 */
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'default'
  | 'outline'
  | 'success'
  | 'danger';
export type ButtonSize = 'sm' | 'default' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  // Canonical ECHO v1.2 variants (#1355)
  primary: 'bg-accent hover:bg-accent-hover text-white',
  secondary: 'bg-[var(--color-bg-dark)] text-white border border-[var(--color-bg-dark)] hover:opacity-90',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary',
  // Backwards-compatible aliases
  default: 'bg-accent hover:bg-accent-light text-white',
  outline: 'border border-bg-tertiary text-text-primary hover:bg-bg-tertiary',
  // Semantic status variants (permitted alongside the single decorative accent)
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
        'inline-flex items-center justify-center gap-2 font-sans font-medium',
        'rounded-none transition-colors duration-200 ease-out min-h-[44px]',
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
