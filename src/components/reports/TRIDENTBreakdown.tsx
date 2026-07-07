import React from 'react';
import { Shield } from 'lucide-react';

export interface TridentDimension {
  name: string;
  /** 0–10 score. */
  score: number;
}

export interface TRIDENTBreakdownProps {
  dimensions?: TridentDimension[];
  overall?: number;
}

const DEFAULT_DIMENSIONS: TridentDimension[] = [
  { name: 'Track Record', score: 8.2 },
  { name: 'Risk Profile', score: 7.0 },
  { name: 'Intellectual Depth', score: 7.8 },
  { name: 'Narrative', score: 6.5 },
  { name: 'Development Potential', score: 8.0 },
  { name: 'Executive Presence', score: 7.4 },
];

const DEFAULT_OVERALL = 7.5;

export function TRIDENTBreakdown({
  dimensions = DEFAULT_DIMENSIONS,
  overall = DEFAULT_OVERALL,
}: TRIDENTBreakdownProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-5">
        <Shield className="w-4 h-4 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">TRIDENT Score Breakdown</h3>
      </div>

      {/* Overall score card */}
      <div className="bg-accent-10 border border-bg-tertiary p-5 mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-text-muted font-semibold">
            Overall TRIDENT
          </div>
          <div className="text-text-secondary text-sm mt-1">
            Composite across {dimensions.length} dimensions
          </div>
        </div>
        <div className="text-right">
          <div className="font-serif text-4xl font-bold text-accent tabular-nums leading-none">
            {overall.toFixed(1)}
          </div>
          <div className="text-xs text-text-muted mt-1">out of 10.0</div>
        </div>
      </div>

      {/* Per-dimension bars */}
      <ul className="space-y-4">
        {dimensions.map((d) => {
          const pct = Math.min(100, Math.max(0, (d.score / 10) * 100));
          return (
            <li key={d.name}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm text-text-primary font-medium">{d.name}</span>
                <span className="text-sm font-bold text-accent tabular-nums">
                  {d.score.toFixed(1)}
                </span>
              </div>
              <div className="w-full h-2.5 bg-bg-tertiary">
                <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
