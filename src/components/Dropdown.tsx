import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface DropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactElement;
  items: DropdownItem[];
  onSelect?: (value: string) => void;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({
  trigger,
  items,
  onSelect,
  align = 'right',
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusIndex, setFocusIndex] = useState(-1);

  const close = useCallback(() => {
    setOpen(false);
    setFocusIndex(-1);
  }, []);

  useEffect(() => {
    if (open && focusIndex >= 0) {
      itemsRef.current[focusIndex]?.focus();
    }
  }, [open, focusIndex]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        close();
        buttonRef.current?.focus();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, close]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    const enabledItems = items.filter((i) => !i.disabled && !i.divider);
    const enabledIndices = items
      .map((item, idx) => (!item.disabled && !item.divider ? idx : -1))
      .filter((idx) => idx >= 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = enabledIndices.indexOf(focusIndex) + 1;
      setFocusIndex(enabledIndices[nextIndex % enabledIndices.length] ?? enabledIndices[0] ?? 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentIdx = enabledIndices.indexOf(focusIndex);
      const prevIndex = currentIdx <= 0 ? enabledIndices.length - 1 : currentIdx - 1;
      setFocusIndex(enabledIndices[prevIndex] ?? enabledIndices[0] ?? 0);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusIndex(enabledIndices[0] ?? 0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setFocusIndex(enabledIndices[enabledIndices.length - 1] ?? 0);
    }
  };

  const handleSelect = (item: DropdownItem) => {
    if (item.disabled || item.divider) return;
    onSelect?.(item.value);
    close();
  };

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      {React.cloneElement(trigger, {
        ref: buttonRef,
        onClick: () => setOpen((o) => !o),
        'aria-haspopup': 'menu',
        'aria-expanded': open,
      })}
      {open && (
        <div
          role="menu"
          onKeyDown={handleKeyDown}
          className={cn(
            'absolute z-[1000] min-w-[180px] py-1',
            'bg-white border border-[var(--echo-border-default)] shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, i) =>
            item.divider ? (
              <div
                key={`divider-${i}`}
                className="my-1 border-t border-[var(--echo-border-subtle)]"
                role="separator"
              />
            ) : (
              <button
                key={item.value}
                ref={(el) => { itemsRef.current[i] = el; }}
                role="menuitem"
                tabIndex={focusIndex === i ? 0 : -1}
                disabled={item.disabled}
                onClick={() => handleSelect(item)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm text-left',
                  'transition-colors duration-150',
                  item.disabled && 'opacity-50 cursor-not-allowed',
                  item.danger && 'text-[var(--echo-error)] hover:bg-[var(--echo-error-soft)]',
                  !item.danger && 'text-[var(--echo-text-primary)] hover:bg-[var(--echo-accent-soft)]',
                  'focus:bg-[var(--echo-accent-soft)] focus:outline-none',
                )}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
