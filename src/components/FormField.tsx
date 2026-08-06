import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  children: React.ReactElement;
  className?: string;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, htmlFor, error, helpText, required, disabled, children, className }, ref) => {
    const generatedId = useId();
    const fieldId = htmlFor || generatedId;
    const errorId = `${fieldId}-error`;
    const helpId = `${fieldId}-help`;

    const child = React.Children.only(children);

    return (
      <div ref={ref} className={cn('flex flex-col gap-1.5', className)}>
        <label
          htmlFor={fieldId}
          className={cn(
            'text-sm font-medium',
            error ? 'text-[var(--echo-error)]' : 'text-[var(--echo-text-primary)]',
            disabled && 'opacity-50',
          )}
        >
          {label}
          {required && <span className="text-[var(--echo-error)] ml-0.5" aria-hidden="true">*</span>}
        </label>
        {React.cloneElement(child, {
          id: fieldId,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': cn(
            error && errorId,
            !error && helpText && helpId,
          ),
        })}
        {error && (
          <p id={errorId} className="text-xs text-[var(--echo-error)]" role="alert">
            {error}
          </p>
        )}
        {!error && helpText && (
          <p id={helpId} className="text-xs text-[var(--echo-text-tertiary)]">
            {helpText}
          </p>
        )}
      </div>
    );
  },
);

FormField.displayName = 'FormField';
