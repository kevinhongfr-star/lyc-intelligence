import React from 'react';
import { TrendingUp } from 'lucide-react';

interface MarketPositioningProps {
  score?: number;
  percentile?: number;
}

export function MarketPositioning({
  score = 72,
  percentile = 18,
}: MarketPositioningProps) {
  const scorePercent = Math.min(100, Math.max(0, score));

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">Market Positioning</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-bg-secondary border border-bg-tertiary p-4">
          <div className="text-xs uppercase tracking-wider text-text-muted mb-1">
            Market Score
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-3xl font-bold text-text-primary">{score}</span>
            <span className="text-sm text-text-muted">/100</span>
          </div>
        </div>
        <div className="bg-bg-secondary border border-bg-tertiary p-4">
          <div className="text-xs uppercase tracking-wider text-text-muted mb-1">
            Percentile
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-3xl font-bold text-accent">Top {percentile}%</span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-text-muted mb-1">
          <span>0</span>
          <span className="text-text-secondary font-semibold">Your position</span>
          <span>100</span>
        </div>
        <div className="relative h-3 bg-bg-tertiary">
          <div className="h-full bg-accent transition-all" style={{ width: `${scorePercent}%` }} />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-text-primary"
            style={{ left: `${scorePercent}%` }}
            aria-label={`score ${score}`}
          />
        </div>
      </div>
    </div>
  );
}
