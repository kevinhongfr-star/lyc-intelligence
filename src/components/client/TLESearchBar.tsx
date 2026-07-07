import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface TLESearchBarProps {
  onSearch: (query: string) => void;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  'Top 10 CTOs in SEA Fintech',
  'VP Engineering candidates in Singapore',
  'Heads of Platform at Series D companies',
];

const DEFAULT_VALUE = 'Top 10 CTOs in SEA Fintech';

export function TLESearchBar({ onSearch, suggestions = DEFAULT_SUGGESTIONS }: TLESearchBarProps) {
  const [value, setValue] = useState<string>(DEFAULT_VALUE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setValue(suggestion);
    onSearch(suggestion);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex items-stretch w-full">
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Describe the talent you're looking for..."
            className="w-full pl-10 pr-4 py-3 bg-bg-primary border border-bg-tertiary text-text-primary text-sm focus:border-accent"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-3 bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors whitespace-nowrap"
        >
          Run Query
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mt-3">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleSuggestion(s)}
            className="px-3 py-1.5 text-xs bg-bg-secondary border border-bg-tertiary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
