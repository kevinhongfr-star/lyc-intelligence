/**
 * Design system: Select
 *
 * Strengthened from the Phase 0 version. Adds:
 *   - `label`, `error`, `hint` (parity with Input)
 *   - `placeholder` option (renders a disabled first <option>)
 *   - `forwardRef` for ref forwarding
 *   - Full SelectHTMLAttributes passthrough
 *
 * The existing `options: SelectOption[]` + `onChange` signature is preserved
 * so existing call sites keep working.
 */
import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  /** Optional label rendered above the select. */
  label?: React.ReactNode;
  /** Optional helper text rendered below the select. */
  hint?: React.ReactNode;
  /** When set, the select is marked invalid + the message renders in red. */
  error?: React.ReactNode;
  /** Optional placeholder shown as a disabled first option. */
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    options,
    label,
    hint,
    error,
    placeholder,
    className,
    id,
    onChange,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const describedById = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined;

  const selectEl = (
    <select
      ref={ref}
      id={selectId}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedById}
      className={cn(
        'w-full px-3 py-2 bg-bg-tertiary border text-sm text-text-primary',
        'focus:outline-none focus:border-accent transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        error ? 'border-red-500' : 'border-bg-hover',
        className,
      )}
      onChange={onChange}
      {...rest}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  );

  if (!label && !hint && !error) {
    return selectEl;
  }

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-text-primary mb-1"
        >
          {label}
        </label>
      )}
      {selectEl}
      {error ? (
        <p id={`${selectId}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${selectId}-hint`} className="mt-1 text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
