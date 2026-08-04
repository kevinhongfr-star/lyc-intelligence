import React from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function Select({ options, className, onChange, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'h-9 px-3 text-sm bg-bg-warm border border-border text-text-primary',
        'focus:outline-none focus:border-fuchsia transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      onChange={onChange}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
