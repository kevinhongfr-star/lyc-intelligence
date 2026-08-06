import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  name?: string;
  id?: string;
  'aria-label'?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder = 'Select an option',
      disabled,
      error,
      className,
      ...rest
    },
    ref,
  ) => {
    const internalRef = useRef<HTMLSelectElement>(null);
    const [internalValue, setInternalValue] = useState(value ?? '');

    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      onValueChange?.(newValue);
    };

    const resolvedRef = (ref as React.RefObject<HTMLSelectElement>) || internalRef;

    return (
      <div className={cn('relative', className)}>
        <select
          ref={resolvedRef}
          value={internalValue}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={error || undefined}
          aria-label={rest['aria-label']}
          className={cn(
            'w-full appearance-none px-3 py-2 pr-8 text-sm',
            'bg-white border text-[var(--echo-text-primary)]',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-[var(--echo-accent)]',
            error
              ? 'border-[var(--echo-error)] focus:ring-[var(--echo-error)]'
              : 'border-[var(--echo-border-default)] hover:border-[var(--echo-text-muted)]',
            disabled && 'opacity-50 cursor-not-allowed bg-[var(--echo-bg-surface)]',
          )}
          {...rest}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span
          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--echo-text-muted)]"
          aria-hidden="true"
        >
          ▼
        </span>
      </div>
    );
  },
);

Select.displayName = 'Select';
