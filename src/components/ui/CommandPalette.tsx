/**
 * Design system: CommandPalette (Cmd/Ctrl + K) (#33 shared chrome primitive)
 *
 * Spotlight-style fuzzy command navigator.
 * Zero border radius, ECHO v6.0 tokens. Marked print-hidden.
 * Keyboard: ↑/↓ navigate, Enter pick, Esc close, ⌘K open.
 */
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface CommandItem {
  id: string;
  label: string;
  hint?: string;                 // secondary description (right column)
  group?: string;                // e.g. "Navigate", "Actions"
  icon?: React.ReactNode;        // optional 16x16
  onSelect: () => void;
  keywords?: string[];           // extra fuzzy tokens
  disabled?: boolean;
}

export interface CommandPaletteProps {
  items: CommandItem[];
  placeholder?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export function CommandPalette({
  items,
  placeholder = 'Type a command or search...',
  open,
  onOpenChange,
  className,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // ── Shortcut: Cmd/Ctrl + K ────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  // Focus input on open, reset on close
  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      const t = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  // ── Fuzzy filter + group ──────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (it: CommandItem) => {
      if (!q) return true;
      const hay = [it.label.toLowerCase(), it.hint?.toLowerCase() ?? '', ...(it.keywords ?? []).map((k) => k.toLowerCase())].join(' ');
      // Subsequence-like scoring: every query character appears in order
      let i = 0;
      for (const ch of hay) {
        if (i < q.length && ch === q[i]) i++;
      }
      return i === q.length || hay.includes(q);
    };
    return items.filter(match);
  }, [items, query]);

  const grouped = useMemo(() => {
    const g = new Map<string | undefined, CommandItem[]>();
    for (const it of filtered) {
      const k = it.group;
      if (!g.has(k)) g.set(k, []);
      g.get(k)!.push(it);
    }
    return g;
  }, [filtered]);

  const flatList = useMemo(() => [...grouped.values()].flat(), [grouped]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  const selectAt = useCallback((idx: number) => {
    const item = flatList[idx];
    if (!item || item.disabled) return;
    onOpenChange(false);
    item.onSelect();
  }, [flatList, onOpenChange]);

  function onListKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(flatList.length - 1, c + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectAt(cursor);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onOpenChange(false);
    }
  }

  // ── Autoscroll active item into view ──────────────────────────
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector<HTMLElement>(`[data-idx="${cursor}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!open) return null;

  let globalIdx = 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      data-no-print
      className={cn(
        'fixed inset-0 z-[140] no-print',
        className,
      )}
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-[var(--color-ink)]/30 backdrop-blur-[1px]"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        className="relative mx-auto mt-[10vh] w-[min(92vw,640px)] border border-[var(--color-border-strong)] bg-[var(--color-card)] shadow-[var(--shadow-overlay)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* input row */}
        <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] px-4 py-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-muted)] shrink-0" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-autocomplete="list"
            value={query}
            placeholder={placeholder}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onListKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="w-full bg-transparent text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none border-0"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-[var(--font-mono)] text-[var(--color-muted)] border border-[var(--color-border-subtle)]">
            ESC
          </kbd>
        </div>

        {/* list */}
        <div
          ref={listRef}
          id="command-list"
          role="listbox"
          className="max-h-[50vh] overflow-y-auto py-2"
        >
          {flatList.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-[var(--color-muted)]">
              No commands match “{query}”.
            </div>
          ) : (
            [...grouped.entries()].map(([group, gItems]) => (
              <div key={group ?? '__ungrouped__'}>
                {group && (
                  <div className="px-4 py-1.5 text-[10px] font-[var(--font-mono)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-dim)]">
                    {group}
                  </div>
                )}
                {gItems.map((item) => {
                  const idx = globalIdx++;
                  const active = idx === cursor;
                  return (
                    <div
                      key={item.id}
                      data-idx={idx}
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setCursor(idx)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (!item.disabled) selectAt(idx);
                      }}
                      className={cn(
                        'mx-2 flex items-center gap-3 px-3 py-2 text-sm transition-colors cursor-default',
                        active && 'bg-[var(--color-accent-5)] text-[var(--color-text)]',
                        !active && 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-alt)]',
                        item.disabled && 'opacity-50 cursor-not-allowed',
                      )}
                    >
                      {item.icon && (
                        <span className="shrink-0 text-[var(--color-text-secondary)] w-4 h-4 flex items-center justify-center">
                          {item.icon}
                        </span>
                      )}
                      <span className="flex-1 min-w-0 truncate font-[var(--font-body)]">
                        {item.label}
                      </span>
                      {item.hint && (
                        <span className="shrink-0 text-xs font-[var(--font-mono)] text-[var(--color-muted)]">
                          {item.hint}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* footer hints */}
        <div className="flex items-center gap-4 border-t border-[var(--color-border-subtle)] px-4 py-2 text-[10px] font-[var(--font-mono)] text-[var(--color-muted)]">
          <span><kbd className="mx-0.5 border border-[var(--color-border-subtle)] px-1">↑</kbd><kbd className="mx-0.5 border border-[var(--color-border-subtle)] px-1">↓</kbd> navigate</span>
          <span><kbd className="mx-0.5 border border-[var(--color-border-subtle)] px-1">↵</kbd> select</span>
          <span><kbd className="mx-0.5 border border-[var(--color-border-subtle)] px-1">⌘</kbd><kbd className="mx-0.5 border border-[var(--color-border-subtle)] px-1">K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}
