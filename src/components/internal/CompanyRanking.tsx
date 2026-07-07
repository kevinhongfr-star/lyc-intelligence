import React from 'react';
import { Trophy } from 'lucide-react';

interface RankedCompany {
  rank: number;
  name: string;
  score: number;
  engLeaders: string;
}

const COMPANIES: RankedCompany[] = [
  { rank: 1, name: 'Grab', score: 92, engLeaders: '1,247' },
  { rank: 2, name: 'Gojek', score: 87, engLeaders: '834' },
  { rank: 3, name: 'Sea Ltd', score: 84, engLeaders: '672' },
  { rank: 4, name: 'PayNow', score: 79, engLeaders: '156' },
];

export function CompanyRanking() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">COMPANY RANKING</h3>
      </div>
      <p className="text-xs text-text-muted mb-4">By Talent Quality (SEA Fintech)</p>

      <div>
        {COMPANIES.map((c) => (
          <div
            key={c.name}
            className="flex items-center gap-4 border-b border-bg-tertiary py-3 last:border-b-0"
          >
            <span className="font-serif text-lg font-bold text-accent w-6 text-center">
              {c.rank}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{c.name}</p>
              <p className="text-xs text-text-muted">{c.engLeaders} eng leaders</p>
            </div>
            <span className="bg-accent-10 text-accent text-xs font-semibold px-2 py-1">
              Score: {c.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
