import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface TalentProfile {
  id: string;
  name: string;
  role: string;
  company: string;
  years: number;
  signal: 'open' | 'passive';
}

const MOCK_PROFILES: TalentProfile[] = [
  { id: '1', name: 'Sarah Lim', role: 'CTO', company: 'PayNow', years: 14, signal: 'open' },
  { id: '2', name: 'Raj Patel', role: 'VP Eng', company: 'Grab', years: 11, signal: 'open' },
  { id: '3', name: 'Wei Chen', role: 'Head Platform', company: 'Gojek', years: 9, signal: 'passive' },
  { id: '4', name: 'Yuki Tanaka', role: 'Dir Eng', company: 'LINE MAN', years: 8, signal: 'passive' },
];

const STATS = [
  'Results: 247 profiles',
  '38 open to moves',
  '$320K median comp',
  '42d avg time-to-hire',
];

export function TLEResultsGrid() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <h3 className="font-serif text-lg font-bold text-text-primary mb-4">TOP MATCHES</h3>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted mb-5">
        {STATS.map((stat, i) => (
          <React.Fragment key={stat}>
            <span>{stat}</span>
            {i < STATS.length - 1 && (
              <span aria-hidden className="inline-block w-px h-3 bg-bg-tertiary" />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_PROFILES.map((profile) => (
          <div key={profile.id} className="bg-bg-secondary border border-bg-tertiary p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-serif text-base font-bold text-text-primary truncate">
                  {profile.name}
                </div>
                <div className="text-sm text-text-secondary mt-0.5 truncate">
                  {profile.role} · {profile.company}
                </div>
                <div className="text-xs text-text-muted mt-1">
                  {profile.years} years experience
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 shrink-0">
                <span
                  className={`w-2 h-2 ${profile.signal === 'open' ? 'bg-teal' : 'bg-slate'}`}
                  aria-hidden
                />
                <span
                  className={`text-xs font-medium ${profile.signal === 'open' ? 'text-teal' : 'text-slate'}`}
                >
                  {profile.signal === 'open' ? 'Open' : 'Passive'}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-bg-tertiary">
        <a
          href="#"
          className="inline-flex items-center gap-1 text-accent text-sm font-medium hover:underline"
        >
          Submit a search request
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
