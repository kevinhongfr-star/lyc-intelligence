import React from 'react';
import { Check } from 'lucide-react';

interface Candidate {
  id: number;
  name: string;
  score: number;
  verdict: string;
  mandate: string;
  stage: string;
}

interface ClientCandidateListProps {
  candidates: Candidate[];
  selectedCandidates: Candidate[];
  onToggle: (candidate: Candidate) => void;
}

const VERDICT_COLORS: Record<string, string> = {
  Strong: 'bg-teal/10 text-teal',
  Good: 'bg-ocean/10 text-ocean',
  Medium: 'bg-warning/10 text-warning',
  Weak: 'bg-error/10 text-error',
};

export function ClientCandidateList({ candidates, selectedCandidates, onToggle }: ClientCandidateListProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-6">
      <h2 className="font-serif text-lg font-bold text-text-primary mb-4">Candidate List</h2>
      <p className="text-sm text-text-muted mb-4">Select 2-3 candidates for comparison</p>
      
      <div className="space-y-2">
        {candidates.map((candidate) => {
          const isSelected = selectedCandidates.some(c => c.id === candidate.id);
          
          return (
            <button
              key={candidate.id}
              onClick={() => onToggle(candidate)}
              className={`w-full text-left p-4 border transition-colors flex items-center justify-between ${
                isSelected
                  ? 'bg-accent/10 border-accent'
                  : 'bg-bg-primary border-bg-tertiary hover:border-accent/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 flex items-center justify-center ${isSelected ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted'}`}>
                  {isSelected ? <Check className="w-4 h-4" /> : <span className="text-xs">{candidate.id}</span>}
                </div>
                <div>
                  <p className="font-medium text-text-primary">{candidate.name}</p>
                  <p className="text-sm text-text-muted">{candidate.mandate} · {candidate.stage}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-text-primary">{candidate.score}</span>
                <span className={`px-2 py-1 text-xs font-medium ${VERDICT_COLORS[candidate.verdict] || 'bg-bg-tertiary text-text-muted'}`}>
                  {candidate.verdict}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}