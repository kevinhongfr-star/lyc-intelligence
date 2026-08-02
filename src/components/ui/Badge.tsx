import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Premium Badge — pill-shaped, refined color palette
 */
const variants = {
  default: 'bg-[#F7F7F7] text-[#404040]',
  success: 'bg-[rgba(26,125,66,0.08)] text-[#1A7D42]',
  warning: 'bg-[rgba(184,134,11,0.08)] text-[#B8860B]',
  danger: 'bg-[rgba(192,57,43,0.08)] text-[#C0392B]',
  fuchsia: 'bg-[rgba(193,8,171,0.08)] text-[#C108AB]',
  secondary: 'bg-[rgba(99,102,241,0.08)] text-[#6366F1]',
  info: 'bg-[rgba(6,182,212,0.08)] text-[#06B6D4]',
  error: 'bg-[rgba(192,57,43,0.08)] text-[#C0392B]',
  outline: 'bg-transparent border border-[#E5E5E5] text-[#404040]',
  primary: 'bg-[rgba(193,8,171,0.08)] text-[#C108AB]',
};

export function Badge({ variant = 'default', children, className, style, ...props }: { 
  variant?: keyof typeof variants; 
  children: React.ReactNode; 
  className?: string; 
  style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span 
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[13px] font-semibold tracking-wide uppercase',
        variants[variant],
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </span>
  );
}
