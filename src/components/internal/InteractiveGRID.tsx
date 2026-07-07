import React, { useState } from 'react';
import { Grid3x3, ChevronRight } from 'lucide-react';

interface Quadrant {
  id: string;
  label: string;
  count: number;
  tint: string;
  candidates: string[];
}

const QUADRANTS: Quadrant[] = [
  {
    id: 'hi-impact-hi-perform',
    label: 'High Impact / High Perform',
    count: 47,
    tint: 'rgba(0, 137, 123, 0.15)',
    candidates: ['Wei Ling T.', 'Arjun M.', 'Sofia R.'],
  },
  {
    id: 'hi-impact-lo-perform',
    label: 'High Impact / Low Perform',
    count: 23,
    tint: 'rgba(245, 158, 11, 0.15)',
    candidates: ['Daniel K.', 'Mei L.', 'Ravi S.'],
  },
  {
    id: 'lo-impact-hi-perform',
    label: 'Low Impact / High Perform',
    count: 31,
    tint: 'rgba(79, 195, 247, 0.15)',
    candidates: ['Hendra W.', 'Priya N.', 'Tom H.'],
  },
  {
    id: 'lo-impact-lo-perform',
    label: 'Low Impact / Low Perform',
    count: 18,
    tint: 'rgba(96, 125, 139, 0.15)',
    candidates: ['Lin Z.', 'Budi A.', 'Chen Y.'],
  },
];

export function InteractiveGRID() {
  const [selected, setSelected] = useState<Quadrant | null>(null);

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <Grid3x3 className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">GRID INTERACTIVE VIEW</h3>
      </div>

      <div className="flex gap-3">
        <div className="flex items-center justify-center w-5">
          <span
            className="text-xs font-medium text-text-muted uppercase tracking-widest"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Impact
          </span>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-2">
            {QUADRANTS.map((q) => {
              const isActive = selected?.id === q.id;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setSelected(isActive ? null : q)}
                  className={`h-40 border border-bg-tertiary p-4 text-left flex flex-col justify-between transition-colors ${
                    isActive ? 'ring-2 ring-accent' : ''
                  }`}
                  style={{ backgroundColor: q.tint }}
                >
                  <div>
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      {q.label}
                    </p>
                    <p className="font-serif text-2xl font-bold text-text-primary mt-1">
                      {q.count}
                      <span className="text-sm font-sans font-normal text-text-muted ml-1">
                        candidates
                      </span>
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-accent font-medium">
                    [Drill Down]
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs font-medium text-text-muted uppercase tracking-widest mt-2">
            Performance
          </p>
        </div>
      </div>

      {selected && (
        <div className="mt-4 border-t border-bg-tertiary pt-4">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
            {selected.label} — Sample Candidates
          </p>
          <ul className="space-y-1">
            {selected.candidates.map((name) => (
              <li
                key={name}
                className="flex items-center gap-2 text-sm text-text-primary bg-bg-secondary border border-bg-tertiary px-3 py-2"
              >
                <span className="w-2 h-2 bg-accent" />
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
