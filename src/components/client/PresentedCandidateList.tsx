import React from 'react';

interface Candidate {
  name: string;
  score: number;
  verdict: string;
  mandate: string;
}

interface PresentedCandidateListProps {
  candidates: Candidate[];
}

const VERDICT_COLORS: Record<string, string> = {
  Strong: 'bg-teal/10 text-teal',
  Good: 'bg-ocean/10 text-ocean',
  Medium: 'bg-warning/10 text-warning',
  Weak: 'bg-error/10 text-error',
};

export function PresentedCandidateList({ candidates }: PresentedCandidateListProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-6">
      <h2 className="font-serif text-lg font-bold text-text-primary mb-4">Presented Candidates</h2>
      
      <div className="space-y-3">
        {candidates.map((candidate) => (
          <div
            key={candidate.name}
            className="bg-bg-primary border border-bg-tertiary p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">{candidate.name}</p>
                <p className="text-sm text-text-muted">{candidate.mandate}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xl font-bold text-text-primary">{candidate.score}</p>
                  <p className="text-xs text-text-muted">TRIDENT Score</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium ${VERDICT_COLORS[candidate.verdict] || 'bg-bg-tertiary text-text-muted'}`}>
                  {candidate.verdict}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}