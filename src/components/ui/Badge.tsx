import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Premium Badge — pill-shaped, refined color palette
 */
const variants = {
  default: 'bg-[#F0EDEA] text-[#4A4541]',
  success: 'bg-[rgba(26,125,66,0.08)] text-[#1A7D42]',
  warning: 'bg-[rgba(184,134,11,0.08)] text-[#B8860B]',
  danger: 'bg-[rgba(192,57,43,0.08)] text-[#C0392B]',
  fuchsia: 'bg-[rgba(193,8,171,0.08)] text-[#C108AB]',
};

export function Badge({ variant = 'default', children, className }: { 
  variant?: keyof typeof variants; 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
