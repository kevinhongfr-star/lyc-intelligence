import React from 'react';
import { Users, HelpCircle } from 'lucide-react';

interface Peer {
  id: string;
  role: string;
  industry: string;
  yearsExperience: number;
}

const MOCK_PEERS: Peer[] = [
  { id: '1', role: 'Senior Tech Leader', industry: 'SEA Fintech', yearsExperience: 12 },
  { id: '2', role: 'VP Product', industry: 'E-commerce', yearsExperience: 9 },
  { id: '3', role: 'Head of Platform', industry: 'Mobility', yearsExperience: 11 },
];

export function CandidatePeerNetwork() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">PEER NETWORK (Anonymized)</h3>
      </div>
      <p className="text-sm text-text-muted mb-4">Connect with vetted peers in your industry.</p>

      <div className="space-y-3">
        {MOCK_PEERS.map((peer) => (
          <div
            key={peer.id}
            className="flex items-center justify-between gap-4 p-4 bg-bg-secondary border border-bg-tertiary"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-bg-tertiary flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-text-muted" />
              </div>
              <div>
                <div className="font-medium text-text-primary">{peer.role}</div>
                <div className="text-xs text-text-muted">{peer.industry}</div>
                <div className="text-xs text-text-muted mt-1">{peer.yearsExperience}yr exp</div>
              </div>
            </div>
            <button className="text-accent text-sm border border-accent px-3 py-1 hover:bg-accent hover:text-white transition-colors">
              Request Introduction
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
