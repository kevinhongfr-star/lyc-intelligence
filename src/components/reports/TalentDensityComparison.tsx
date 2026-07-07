import React from 'react';
import { Users } from 'lucide-react';

export interface TalentDensityCompany {
  name: string;
  engineers: number;
  /** 0–100 talent quality score. */
  quality: number;
}

export interface TalentDensityComparisonProps {
  companies?: TalentDensityCompany[];
}

const DEFAULT_COMPANIES: TalentDensityCompany[] = [
  { name: 'Grab', engineers: 5084, quality: 84 },
  { name: 'Gojek', engineers: 3712, quality: 78 },
  { name: 'FinanceHub', engineers: 1314, quality: 91 },
];

export function TalentDensityComparison({
  companies = DEFAULT_COMPANIES,
}: TalentDensityComparisonProps) {
  const maxEngineers = Math.max(...companies.map((c) => c.engineers), 1);

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-5">
        <Users className="w-4 h-4 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">Talent Density</h3>
      </div>

      <div className="space-y-5">
        {companies.map((c) => {
          const headcountPct = Math.round((c.engineers / maxEngineers) * 100);
          const qualityPct = Math.min(100, Math.max(0, c.quality));
          return (
            <div key={c.name} className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="font-serif text-text-primary font-medium">{c.name}</span>
                <span className="text-xs text-text-muted tabular-nums">
                  {c.engineers.toLocaleString()} engineers
                </span>
              </div>

              {/* Headcount bar (scaled to max) */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-bg-tertiary">
                  <div
                    className="h-full bg-slate"
                    style={{ width: `${headcountPct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs text-text-secondary tabular-nums">
                  {headcountPct}%
                </span>
              </div>

              {/* Quality bar (bg-accent) */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-bg-tertiary">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${qualityPct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs text-accent font-bold tabular-nums">
                  {c.quality}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
