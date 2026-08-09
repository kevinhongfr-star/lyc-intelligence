/**
 * Phase 5: ECHO v6.0 Theme Toggle
 *
 * Three-state toggle for light / dark / system theme.
 * Uses the useTheme hook and lucide-react icons.
 *
 * The toggle is a segmented control with three sections.
 * Clicking each segment sets the corresponding theme.
 * Active segment is highlighted with the #C108AB accent.
 *
 * @example
 * ```tsx * <ThemeToggle /> *```
 */
import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme, type Theme } from '@/hooks/useTheme';

export interface ThemeToggleProps {
  /** Additional class names for the wrapper. */
  className?: string;
  /** Size of the toggle. 'sm' for compact, 'md' for standard. */
  size?: 'sm' | 'md';
}

const SEGMENTS: { value: Theme; icon: React.ReactNode; label: string }[] = [
  { value: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light theme' },
  { value: 'system', icon: <Monitor className="w-4 h-4" />, label: 'System theme' },
  { value: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark theme' },
];

export function ThemeToggle({ className, size = 'md' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const sizeClasses =
    size === 'sm'
      ? 'h-7 text-[10px]'
      : 'h-9 text-xs';

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div
      role="radiogroup"
      aria-label="Theme preference"
      className={cn(
        'inline-flex items-center border border-[var(--echo-border)] bg-[var(--echo-surface)]',
        sizeClasses,
        className,
      )}
    >
      {SEGMENTS.map(({ value, icon, label }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              'inline-flex items-center justify-center gap-1 px-2 transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--echo-accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--echo-background)]',
              size === 'sm' ? 'min-w-[28px]' : 'min-w-[36px]',
              isActive
                ? 'bg-[var(--echo-accent)] text-white'
                : 'text-[var(--echo-text-muted)] hover:text-[var(--echo-text-primary)] hover:bg-[var(--echo-surface-hover)]',
            )}
          >
            {React.cloneElement(icon as React.ReactElement, {
              className: cn(iconSize, (icon as React.ReactElement).props?.className),
            })}
          </button>
        );
      })}
    </div>
  );
}
