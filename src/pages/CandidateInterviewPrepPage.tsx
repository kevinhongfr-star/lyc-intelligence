import React from 'react';

export function CandidateInterviewPrepPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">Interview Prep</h1>
        <p className="text-text-muted mt-1">Mock simulator preview</p>
      </header>
      <div className="bg-bg-secondary border border-bg-tertiary p-12 text-center">
        <div className="max-w-md mx-auto">
          <p className="text-text-secondary text-lg mb-4">
            Sharpen your pitch with mock interviews and prep guides tailored to each role.
          </p>
          <div className="h-32 bg-bg-tertiary flex items-center justify-center">
            <span className="text-text-muted">Placeholder</span>
          </div>
        </div>
      </div>
    </div>
  );
}
