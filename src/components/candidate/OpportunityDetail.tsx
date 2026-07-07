import React from 'react';
import { MapPin, Briefcase, Sparkles } from 'lucide-react';
import type { Opportunity } from './OpportunityList';
import { fitTier } from './OpportunityList';
import { InterestButton } from './InterestButton';

interface OpportunityDetailProps {
  opportunity: Opportunity | null;
}

export function OpportunityDetail({ opportunity }: OpportunityDetailProps) {
  if (!opportunity) {
    return (
      <div className="bg-bg-secondary border border-bg-tertiary p-12 text-center">
        <p className="text-text-muted">Select an opportunity to view the fit analysis.</p>
      </div>
    );
  }

  const tier = fitTier(opportunity.fit);

  return (
    <div className="bg-bg-secondary border border-bg-tertiary">
      <div className="p-6 border-b border-bg-tertiary">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-text-primary">{opportunity.role}</h2>
            <p className="text-text-muted mt-1">{opportunity.company}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {opportunity.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {opportunity.salary}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 ${tier.dot}`} />
              <span className={`font-serif text-3xl font-bold ${tier.text}`}>{opportunity.fit}%</span>
            </span>
            <span className={`text-xs ${tier.text}`}>fit · {tier.label}</span>
          </div>
        </div>
      </div>

      <div className="p-6 border-b border-bg-tertiary">
        <h3 className="font-serif text-base font-bold text-text-primary mb-2">Role Overview</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{opportunity.description}</p>
      </div>

      <div className="p-6 border-b border-bg-tertiary">
        <h3 className="font-serif text-base font-bold text-text-primary mb-4">Fit Breakdown</h3>
        <div className="space-y-3">
          {opportunity.fitBreakdown.map((d) => (
            <div key={d.dimension}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-text-secondary">{d.dimension}</span>
                <span className="text-text-primary font-medium">{d.score}%</span>
              </div>
              <div className="h-2 bg-bg-tertiary">
                <div className="h-full bg-accent" style={{ width: `${d.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 border-b border-bg-tertiary">
        <h3 className="font-serif text-base font-bold text-text-primary mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          Why This Match
        </h3>
        <ul className="space-y-2">
          {opportunity.matchReasons.map((reason, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
              <span className="mt-1.5 w-1.5 h-1.5 bg-accent shrink-0" />
              {reason}
            </li>
          ))}
        </ul>
      </div>

      <div className="p-6">
        <InterestButton />
      </div>
    </div>
  );
}
