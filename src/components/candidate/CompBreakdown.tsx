import React from 'react';
import { TrendingUp } from 'lucide-react';
import type { Offer } from './OfferList';

interface CompBreakdownProps {
  offers: Offer[];
}

function formatCurrencyK(value: number): string {
  return `$${Math.round(value / 1000)}K`;
}

export function CompBreakdown({ offers }: CompBreakdownProps) {
  const maxTotal = Math.max(...offers.map((o) => o.totalY1));

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-accent" />
        <h2 className="font-serif text-lg font-bold text-text-primary">
          TOTAL COMPENSATION BREAKDOWN
        </h2>
      </div>

      <div className="space-y-4">
        {offers.map((offer) => {
          const pctOfMax = Math.round((offer.totalY1 / maxTotal) * 100);
          const isLargest = offer.totalY1 === maxTotal;
          return (
            <div key={offer.id}>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="font-medium text-text-primary">
                  Offer {offer.id}: {formatCurrencyK(offer.totalY1)}
                </span>
                <span className="text-text-muted">{pctOfMax}% of max</span>
              </div>
              <div className="h-6 bg-bg-tertiary w-full">
                <div
                  className={`h-full ${isLargest ? 'bg-accent' : 'bg-slate'}`}
                  style={{ width: `${pctOfMax}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
