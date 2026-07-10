import React from 'react';

/**
 * Premium Input — clean underline style with focus animation
 */
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input 
      className={`
        w-full px-4 py-2.5 
        bg-[#FFFFFF] 
        border border-[#E5E5E5] 
        text-sm text-[var(--color-text)] 
        placeholder:text-[#A3A3A3]
        focus:outline-none 
        focus:border-[#C108AB]/40 
        focus:shadow-[0_0_0_3px_rgba(193,8,171,0.06)]
        transition-all duration-200
        ${className || ''}
      `}
      {...props} 
    />
  );
}
