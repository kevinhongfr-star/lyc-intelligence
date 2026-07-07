import React from 'react';
import { CQDiagnostic } from '@/components/b2c/CQDiagnostic';
import { CQInsightCard } from '@/components/b2c/CQInsightCard';
import { MarketIntelFeed } from '@/components/b2c/MarketIntelFeed';
import { TemporalBadge } from '@/components/shared/TemporalBadge';

export function B2CIntelligencePage() {
  return (
    <div className="space-y-6">
      <header className="border-b border-bg-tertiary pb-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold text-text-primary">
              Intelligence
            </h1>
            <p className="text-text-muted mt-1 text-sm">
              Cultural Intelligence diagnostic, blind spots, and personalized market signals.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TemporalBadge label="Updated today" />
            <TemporalBadge label="Q2 2026" />
          </div>
        </div>
      </header>

      <CQDiagnostic />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CQInsightCard
          variant="insight"
          title="Power Distance Gap"
          body="Your low power distance (3.8) vs. org context (8.1) — mismatch causing friction with senior stakeholders."
        />
        <CQInsightCard
          variant="blind-spot"
          title="Conflict Avoidance Pattern"
          body="Conflict avoidance (5.5) masking team disagreement. 3 members feel unheard in your last 5 leadership reviews."
        />
      </div>

      <MarketIntelFeed />
    </div>
  );
}
