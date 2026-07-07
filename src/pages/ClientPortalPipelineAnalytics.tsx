import React from 'react';

export function ClientPortalPipelineAnalytics() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">Pipeline Analytics</h1>
        <p className="text-text-muted mt-1">Coming in Phase 2</p>
      </header>

      <div className="bg-bg-secondary border border-bg-tertiary p-12 text-center">
        <div className="max-w-md mx-auto">
          <p className="text-text-secondary text-lg mb-4">
            Funnel visualization, time-to-hire, conversion rates, forecast model
          </p>
          <div className="h-32 bg-bg-tertiary flex items-center justify-center">
            <span className="text-text-muted">Analytics dashboard placeholder</span>
          </div>
        </div>
      </div>
    </div>
  );
}