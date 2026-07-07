import React, { useState } from 'react';
import { Radar } from 'lucide-react';
import { TLESearchBar } from './TLESearchBar';
import { TLEResultsGrid } from './TLEResultsGrid';

export function TalentLandscapeExplorer() {
  const [query, setQuery] = useState<string>('');

  return (
    <section className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-3">
        <Radar className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">
          TALENT LANDSCAPE EXPLORER
        </h3>
      </div>
      <p className="text-sm text-text-muted mt-1 mb-4">AI-powered market intelligence</p>

      <TLESearchBar onSearch={setQuery} />

      {query && (
        <div className="mt-4">
          <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-accent bg-accent-10">
            Query: {query}
          </span>
        </div>
      )}

      <div className="mt-5">
        <TLEResultsGrid />
      </div>
    </section>
  );
}
