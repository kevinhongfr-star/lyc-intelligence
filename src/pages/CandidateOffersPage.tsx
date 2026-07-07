import React from 'react';
import { MOCK_OFFERS } from '@/components/candidate/OfferList';
import { OfferComparison } from '@/components/candidate/OfferComparison';
import { CompBreakdown } from '@/components/candidate/CompBreakdown';
import { DecisionTimeline } from '@/components/candidate/DecisionTimeline';
import { OfferActionFlow } from '@/components/candidate/OfferActionFlow';

export function CandidateOffersPage() {
  const offers = MOCK_OFFERS;
  const nearestDeadline = 'Jul 15';

  return (
    <div className="space-y-6">
      <header className="border-b border-bg-tertiary pb-6">
        <h1 className="font-serif text-2xl font-bold text-text-primary">
          OFFERS &amp; DECISIONS
        </h1>
        <p className="text-text-muted mt-1">
          {offers.length} active offers · Decision deadline: {nearestDeadline}
        </p>
      </header>

      <OfferComparison offers={offers} />

      <CompBreakdown offers={offers} />

      <DecisionTimeline />

      <OfferActionFlow offers={offers} />
    </div>
  );
}
