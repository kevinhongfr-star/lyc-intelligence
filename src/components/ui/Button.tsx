import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Premium Button — refined hover states, subtle depth
 */
const variants = {
  default: 'bg-[#C108AB] hover:bg-[#A50798] text-white shadow-sm hover:shadow-md',
  outline: 'border border-[#E5E5E5] text-[var(--color-text)] hover:bg-[#F7F7F7] hover:border-[#C108AB]/30',
  ghost: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[#F7F7F7]',
  success: 'bg-[#1A7D42] hover:bg-[#156B36] text-white shadow-sm hover:shadow-md',
  danger: 'bg-[#C0392B] hover:bg-[#A33025] text-white shadow-sm hover:shadow-md',
};

const sizes = {
  xs: 'px-2.5 py-1 text-[13px]',
  sm: 'px-3 py-1.5 text-xs',
  default: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base',
};

export function Button({ 
  variant = 'default', 
  size = 'default', 
  children, 
  className, 
  ...props 
}: { 
  variant?: keyof typeof variants; 
  size?: keyof typeof sizes; 
  children: React.ReactNode; 
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button 
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]',
        variants[variant], 
        sizes[size], 
        className
      )} 
      {...props}
    >
      {children}
    </button>
  );
}
