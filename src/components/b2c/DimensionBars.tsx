import React from 'react';

export interface Dimension {
  name: string;
  score: number;
  benchmark: number;
}

interface DimensionBarsProps {
  dimensions: Dimension[];
}

export function DimensionBars({ dimensions }: DimensionBarsProps) {
  const MAX_SCORE = 10;

  return (
    <div className="space-y-3">
      {dimensions.map((dim) => {
        const meetsBenchmark = dim.score >= dim.benchmark;
        const barColor = meetsBenchmark ? 'bg-teal' : 'bg-warning';
        const scorePercent = (dim.score / MAX_SCORE) * 100;
        const benchmarkPercent = (dim.benchmark / MAX_SCORE) * 100;

        return (
          <div key={dim.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-text-primary font-medium">{dim.name}</span>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span className="text-text-secondary font-semibold">{dim.score.toFixed(1)}</span>
                <span>·</span>
                <span>bench {dim.benchmark.toFixed(1)}</span>
              </div>
            </div>
            <div className="relative h-2 bg-bg-tertiary">
              <div
                className={`h-full ${barColor} transition-all`}
                style={{ width: `${scorePercent}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-px bg-text-primary"
                style={{ left: `${benchmarkPercent}%` }}
                aria-label={`benchmark ${dim.benchmark}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
