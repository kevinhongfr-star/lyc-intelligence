import React from 'react';

export function CandidateNexusCoachPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">NEXUS Coach</h1>
        <p className="text-text-muted mt-1">AI coaching chat</p>
      </header>
      <div className="bg-bg-secondary border border-bg-tertiary p-12 text-center">
        <div className="max-w-md mx-auto">
          <p className="text-text-secondary text-lg mb-4">
            Your always-on AI coach for career decisions, prep, and negotiation.
          </p>
          <div className="h-32 bg-bg-tertiary flex items-center justify-center">
            <span className="text-text-muted">Placeholder</span>
          </div>
        </div>
      </div>
    </div>
  );
}
