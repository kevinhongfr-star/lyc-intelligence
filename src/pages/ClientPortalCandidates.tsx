import React, { useState } from 'react';
import { ClientCandidateList } from '@/components/client/ClientCandidateList';
import { CandidateComparison } from '@/components/client/CandidateComparison';

const MOCK_CANDIDATES = [
  { id: 1, name: 'David Tan', score: 87, verdict: 'Strong', mandate: 'VP Risk', stage: 'LENS' },
  { id: 2, name: 'Sophie Lau', score: 84, verdict: 'Strong', mandate: 'VP Risk', stage: 'GRID' },
  { id: 3, name: 'Michael Chen', score: 78, verdict: 'Good', mandate: 'Head Digital', stage: 'CANVA' },
  { id: 4, name: 'Alice Wang', score: 82, verdict: 'Strong', mandate: 'CTO', stage: 'SWEEP' },
];

export function ClientPortalCandidates() {
  const [selectedCandidates, setSelectedCandidates] = useState<typeof MOCK_CANDIDATES.slice(0, 2)>([]);

  const toggleCandidate = (candidate: typeof MOCK_CANDIDATES[0]) => {
    setSelectedCandidates(prev => {
      const exists = prev.find(c => c.id === candidate.id);
      if (exists) {
        return prev.filter(c => c.id !== candidate.id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), candidate];
      }
      return [...prev, candidate];
    });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">Candidates</h1>
        <p className="text-text-muted mt-1">View all candidates across mandates</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <ClientCandidateList
            candidates={MOCK_CANDIDATES}
            selectedCandidates={selectedCandidates}
            onToggle={toggleCandidate}
          />
        </div>
        <div>
          <CandidateComparison candidates={selectedCandidates} />
        </div>
      </div>
    </div>
  );
}