import React from 'react';

export function CandidateCommunityPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">Community</h1>
        <p className="text-text-muted mt-1">Peer network</p>
      </header>
      <div className="bg-bg-secondary border border-bg-tertiary p-12 text-center">
        <div className="max-w-md mx-auto">
          <p className="text-text-secondary text-lg mb-4">
            Connect with a vetted peer network of senior leaders and operators.
          </p>
          <div className="h-32 bg-bg-tertiary flex items-center justify-center">
            <span className="text-text-muted">Placeholder</span>
          </div>
        </div>
      </div>
    </div>
  );
}
