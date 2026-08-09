import React from 'react';
import { cn } from '@/lib/utils';

export interface HoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function HoverButton({ children, className, variant = 'primary', ...rest }: HoverButtonProps) {
  const variantClasses = {
    primary: 'bg-[var(--echo-accent)] text-white hover:bg-[var(--echo-accent-hover)]',
    secondary: 'border border-[var(--echo-border-default)] text-[var(--echo-text-primary)] hover:bg-[var(--echo-bg-surface-hover)]',
    ghost: 'text-[var(--echo-text-secondary)] hover:text-[var(--echo-text-primary)] hover:bg-[var(--echo-bg-surface-hover)]',
  };

  return (
    <button
      className={cn(
        'px-4 py-2 font-medium transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--echo-accent)]',
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export interface HoverCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
}

export function HoverCard({ children, className, interactive = true, ...rest }: HoverCardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--echo-bg-surface)] border border-[var(--echo-border-default)]',
        'transition-all duration-300 ease-out',
        interactive && 'hover:-translate-y-1 hover:shadow-lg hover:border-[var(--echo-accent)]/30',
        'focus-within:ring-2 focus-within:ring-[var(--echo-accent)]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface HoverLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
}

export function HoverLink({ children, className, ...rest }: HoverLinkProps) {
  return (
    <a
      className={cn(
        'inline-flex items-center gap-1 text-[var(--echo-accent)] font-medium',
        'transition-all duration-200',
        'hover:gap-2 hover:text-[var(--echo-accent-hover)]',
        'hover:underline underline-offset-2',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--echo-accent)] focus-visible:ring-offset-2',
        className,
      )}
      {...rest}
    >
      {children}
    </a>
  );
}

export const MicroInteractions = {
  HoverButton,
  HoverCard,
  HoverLink,
};
