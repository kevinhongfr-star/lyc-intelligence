import React from 'react';

interface Candidate {
  id: number;
  name: string;
  score: number;
  verdict: string;
  mandate: string;
  stage: string;
}

interface CandidateComparisonProps {
  candidates: Candidate[];
}

const COMPARISON_FIELDS = [
  { label: 'TRIDENT Score', key: 'score' },
  { label: 'Verdict', key: 'verdict' },
  { label: 'Mandate', key: 'mandate' },
  { label: 'Stage', key: 'stage' },
];

export function CandidateComparison({ candidates }: CandidateComparisonProps) {
  if (candidates.length === 0) {
    return (
      <div className="bg-bg-secondary border border-bg-tertiary p-6">
        <h2 className="font-serif text-lg font-bold text-text-primary mb-4">Candidate Comparison</h2>
        <div className="h-48 bg-bg-tertiary flex items-center justify-center">
          <span className="text-text-muted">Select 2-3 candidates to compare</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-6">
      <h2 className="font-serif text-lg font-bold text-text-primary mb-4">Candidate Comparison</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-bg-tertiary">
              <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Attribute</th>
              {candidates.map((candidate) => (
                <th key={candidate.id} className="text-left py-3 px-4 text-sm font-medium text-text-primary">
                  {candidate.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_FIELDS.map((field) => (
              <tr key={field.key} className="border-b border-bg-tertiary">
                <td className="py-3 px-4 text-sm text-text-muted">{field.label}</td>
                {candidates.map((candidate) => (
                  <td key={candidate.id} className="py-3 px-4 text-sm text-text-primary">
                    {candidate[field.key as keyof Candidate]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}