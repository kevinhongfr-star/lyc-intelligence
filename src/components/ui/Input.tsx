/**
 * Design system: Input
 *
 * Adds label, error, hint, and forwardRef to the Phase 0 Input. The bare
 * `<input>` passthrough is preserved — when no label/error/hint is given
 * the rendered markup is identical to the Phase 0 version.
 */
import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Optional label rendered above the input. */
  label?: React.ReactNode;
  /** Optional helper text rendered below the input. */
  hint?: React.ReactNode;
  /** When set, the input is marked invalid + the message renders in red. */
  error?: React.ReactNode;
  /** Adornment rendered inside the input, on the left (e.g. an icon). */
  leftAdornment?: React.ReactNode;
  /** Adornment rendered inside the input, on the right. */
  rightAdornment?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftAdornment, rightAdornment, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedById = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  const inputEl = (
    <input
      ref={ref}
      id={inputId}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedById}
      className={cn(
        'w-full px-3 py-2 bg-bg-tertiary border rounded-none text-sm text-text-primary placeholder:text-text-muted',
        'focus:outline-none focus:border-accent transition-colors',
        leftAdornment ? 'pl-9' : null,
        rightAdornment ? 'pr-9' : null,
        error ? 'border-red-500' : 'border-bg-hover',
        className,
      )}
      {...rest}
    />
  );

  if (!label && !hint && !error && !leftAdornment && !rightAdornment) {
    return inputEl;
  }

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-primary mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftAdornment && (
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted pointer-events-none">
            {leftAdornment}
          </span>
        )}
        {inputEl}
        {rightAdornment && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted">
            {rightAdornment}
          </span>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1 text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
