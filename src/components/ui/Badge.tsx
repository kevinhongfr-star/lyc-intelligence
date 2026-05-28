import React from 'react';
import { cn } from '@/lib/utils';
const variants = { default: 'bg-bg-tertiary text-text-secondary', success: 'bg-tier-1Bg text-tier-1', warning: 'bg-tier-2Bg text-tier-2', danger: 'bg-red-500/15 text-red-600' };
export function Badge({ variant = 'default', children, className }: { variant?: keyof typeof variants; children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', variants[variant], className)}>{children}</span>;
}
