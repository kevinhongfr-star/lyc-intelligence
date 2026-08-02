/**
 * Checkbox — Custom styled checkbox with label support
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  onChange?: (checked: boolean) => void;
}

export function Checkbox({
  label,
  error,
  className,
  id,
  checked,
  onChange,
  disabled,
  ...props
}: CheckboxProps) {
  const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2, 9)}`;

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange?.(e.target.checked);
  };

  return (
    <div className="flex items-start gap-2">
      <div className="relative flex items-center mt-0.5">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="peer sr-only cursor-pointer disabled:cursor-not-allowed"
          {...props}
        />
        <div
          className={cn(
            'w-4 h-4 border flex items-center justify-center transition-all',
            'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[#C108AB] peer-focus-visible:ring-offset-2',
            'peer-checked:bg-[#C108AB] peer-checked:border-[#C108AB]',
            disabled ? 'opacity-40 cursor-not-allowed bg-[#F5F5F5]' : 'bg-white cursor-pointer',
            error ? 'border-red-500' : 'border-[#E5E5E5]',
            className
          )}
          style={{ borderRadius: 0 }}
        >
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
      </div>
      {label && (
        <label
          htmlFor={checkboxId}
          className={cn(
            'text-sm text-[#171717] cursor-pointer',
            disabled ? 'opacity-40 cursor-not-allowed' : ''
          )}
        >
          {label}
        </label>
      )}
    </div>
  );
}

export default Checkbox;
