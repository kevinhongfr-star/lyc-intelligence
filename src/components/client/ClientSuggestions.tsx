import React from 'react';

interface ClientSuggestionsProps {
  suggestions: string[];
}

export function ClientSuggestions({ suggestions }: ClientSuggestionsProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-4">
      <p className="text-xs text-text-muted mb-3">Suggested questions:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="px-3 py-2 bg-bg-primary border border-bg-tertiary text-sm text-text-secondary hover:border-accent/50 hover:text-accent transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}