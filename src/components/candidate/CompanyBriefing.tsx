import React from 'react';
import { Building2 } from 'lucide-react';

export interface CompanyBriefingFact {
  label: string;
  value: string;
}

export interface CompanyBriefingData {
  name: string;
  facts: CompanyBriefingFact[];
}

const MOCK_COMPANY: CompanyBriefingData = {
  name: 'TechCorp',
  facts: [
    { label: 'Stage', value: 'Series D' },
    { label: 'Valuation', value: '$2B' },
    { label: 'Expansion', value: 'SEA (Southeast Asia)' },
    { label: 'Engineering team', value: '12 engineers' },
    { label: 'VP-level hires', value: '3' },
    { label: 'Reporting line', value: 'Reports to CTO' },
    { label: 'Recent news', value: 'Acquired FinFlow (Mar 2026)' },
  ],
};

export interface CompanyBriefingProps {
  company?: CompanyBriefingData;
}

export function CompanyBriefing({ company = MOCK_COMPANY }: CompanyBriefingProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-4 h-4 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">COMPANY BRIEFING</h3>
      </div>

      <p className="text-sm text-text-secondary mb-4">
        <span className="font-serif font-bold text-text-primary">{company.name}</span> — interview context at a glance.
      </p>

      <ul className="space-y-3">
        {company.facts.map((fact) => (
          <li key={fact.label} className="flex items-start gap-3">
            <span className="mt-1 inline-block w-2 h-2 bg-accent flex-shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 min-w-0">
              <span className="text-xs uppercase tracking-wider text-text-muted sm:w-36 flex-shrink-0">
                {fact.label}
              </span>
              <span className="text-sm text-text-primary">{fact.value}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
