/**
 * Select — Native select with custom styling
 * Spec 17 base component
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  label?: string;
  error?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
}

export function Select({
  label,
  error,
  options,
  placeholder,
  className,
  id,
  value,
  onValueChange,
  onChange,
  children,
  ...props
}: SelectProps) {
  const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`;

  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    onChange?.(e);
    onValueChange?.(e.target.value);
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-[#171717] mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            'w-full px-3 py-2.5 text-sm bg-white text-[#171717]',
            'border appearance-none cursor-pointer',
            'focus:outline-none focus:border-[#C108AB] focus:ring-1 focus:ring-[#C108AB]',
            'disabled:bg-[#F5F5F5] disabled:cursor-not-allowed',
            error ? 'border-red-500' : 'border-[#E5E5E5]',
            className
          )}
          style={{ borderRadius: 0 }}
          value={value}
          onChange={handleChange}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {!options && children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] pointer-events-none" />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

export default Select;