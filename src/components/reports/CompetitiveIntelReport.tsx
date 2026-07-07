import React from 'react';
import { Target } from 'lucide-react';
import { CompanyComparison } from './CompanyComparison';
import { TalentDensityComparison } from './TalentDensityComparison';

export interface CompetitiveIntelReportProps {
  subtitle?: string;
  insights?: string[];
}

const DEFAULT_SUBTITLE = 'Grab vs Gojek vs FinanceHub';

const DEFAULT_INSIGHTS: string[] = [
  'Grab leads on engineering density; Gojek competitive on leadership tenure.',
  'FinanceHub punches above its weight on talent quality (91/100) despite a smaller bench.',
  'Median comp at FinanceHub is the highest — expect premium offers to pull senior talent.',
];

export function CompetitiveIntelReport({
  subtitle = DEFAULT_SUBTITLE,
  insights = DEFAULT_INSIGHTS,
}: CompetitiveIntelReportProps) {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-accent" />
          <h2 className="font-serif text-2xl font-bold text-text-primary">COMPETITIVE INTELLIGENCE</h2>
        </div>
        <p className="text-text-muted mt-1 ml-7">{subtitle}</p>
      </header>

      <CompanyComparison />
      <TalentDensityComparison />

      <div className="bg-bg-primary border border-bg-tertiary p-5">
        <h3 className="font-serif text-lg font-bold text-text-primary mb-3">Market Positioning</h3>
        <ul className="space-y-3">
          {insights.map((line, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
              <span className="mt-1.5 w-1.5 h-1.5 shrink-0 bg-accent" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
