import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Loader2, SlidersHorizontal } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  debounceMs?: number;
  showFiltersToggle?: boolean;
  onFiltersToggle?: () => void;
  filtersActive?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search...',
  loading = false,
  debounceMs = 300,
  showFiltersToggle = false,
  onFiltersToggle,
  filtersActive = false,
  autoFocus = false,
  disabled = false,
  className = '',
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  }, [onChange, debounceMs]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      onSubmit(localValue);
    }
    if (e.key === 'Escape') {
      setLocalValue('');
      onChange('');
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    inputRef.current?.select();
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-10 pr-${showFiltersToggle || localValue || loading ? '20' : '10'} py-2.5
            bg-white border border-border rounded-none
            text-sm text-text-primary
            placeholder:text-text-muted
            focus:outline-none focus:border-primary/40 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)]
            disabled:bg-bg-alt disabled:cursor-not-allowed
            transition-all
          `}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          )}
          {!loading && localValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-bg-alt text-text-muted hover:text-text-secondary transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {showFiltersToggle && (
            <button
              type="button"
              onClick={onFiltersToggle}
              className={`p-1.5 rounded-none transition-colors ${
                filtersActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-alt'
              }`}
              title="Toggle filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {value && (
        <div className="absolute right-3 -bottom-6 text-xs text-text-muted pointer-events-none">
          Press <kbd className="px-1.5 py-0.5 bg-bg-alt border border-border text-xxs rounded-none font-mono">ESC</kbd> to clear
        </div>
      )}
    </div>
  );
}

export default SearchBar;
