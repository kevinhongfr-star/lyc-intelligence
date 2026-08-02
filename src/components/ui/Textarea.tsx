/**
 * Textarea — Native textarea with custom styling
 */
import React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className,
  id,
  rows = 4,
  ...props
}: TextareaProps) {
  const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-semibold text-[#171717] mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={cn(
          'w-full px-3 py-2.5 text-sm bg-white text-[#171717]',
          'border resize-y',
          'focus:outline-none focus:border-[#C108AB] focus:ring-1 focus:ring-[#C108AB]',
          'disabled:bg-[#F5F5F5] disabled:cursor-not-allowed',
          'placeholder:text-[#A3A3A3]',
          error ? 'border-red-500' : 'border-[#E5E5E5]',
          className
        )}
        style={{ borderRadius: 0 }}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

export default Textarea;
