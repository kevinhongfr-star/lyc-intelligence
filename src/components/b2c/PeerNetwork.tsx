import React from 'react';
import { Users } from 'lucide-react';

export interface PeerConnection {
  id: string;
  name: string;
  initials: string;
  role: string;
  industry: string;
  yearsExperience: number;
  similarityNote: string;
}

interface PeerNetworkProps {
  peers?: PeerConnection[];
}

const DEFAULT_PEERS: PeerConnection[] = [
  {
    id: '1',
    name: 'Sarah L.',
    initials: 'SL',
    role: 'CTO',
    industry: 'Fintech',
    yearsExperience: 14,
    similarityNote: 'Similar career path',
  },
  {
    id: '2',
    name: 'James W.',
    initials: 'JW',
    role: 'VP Eng',
    industry: 'SaaS',
    yearsExperience: 11,
    similarityNote: 'Same industry',
  },
];

export function PeerNetwork({ peers = DEFAULT_PEERS }: PeerNetworkProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-4 h-4 text-accent" />
          <h3 className="font-serif text-lg font-bold text-text-primary">
            PEER NETWORK
          </h3>
        </div>
        <p className="text-xs text-text-muted">Suggested connections</p>
      </div>
      <div className="space-y-4">
        {peers.map((peer) => (
          <div
            key={peer.id}
            className="border border-bg-tertiary p-4 bg-bg-secondary"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-accent-10 text-accent flex items-center justify-center font-serif font-bold shrink-0">
                {peer.initials}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-text-primary">{peer.name}</h4>
                <p className="text-sm text-text-secondary">
                  {peer.role}, {peer.industry}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {peer.similarityNote} · {peer.yearsExperience}yr exp
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button className="border border-accent text-accent px-3 py-1 text-sm hover:bg-accent hover:text-white transition-colors">
                Connect
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
