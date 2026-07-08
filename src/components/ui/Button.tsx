import React from 'react';
import { cn } from '@/lib/utils';
const variants = { default: 'bg-accent hover:bg-accent-light text-white', outline: 'border border-bg-tertiary text-text-primary hover:bg-bg-tertiary', ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary', success: 'bg-tier-1 hover:bg-tier-1/80 text-white' };
const sizes = { sm: 'px-3 py-1.5 text-xs', default: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
export function Button({ variant = 'default', size = 'default', children, className, ...props }: { variant?: keyof typeof variants; size?: keyof typeof sizes; children: React.ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn('inline-flex items-center justify-center gap-2 font-medium rounded-none transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed', variants[variant], sizes[size], className)} {...props}>{children}</button>;
}
