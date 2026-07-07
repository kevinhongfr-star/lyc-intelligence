import React from 'react';
import { User, Target } from 'lucide-react';
import { TRIDENTBreakdown } from './TRIDENTBreakdown';
import { CareerTrajectoryReport } from './CareerTrajectoryReport';
import { RiskAssessment } from './RiskAssessment';

export interface ApproachStrategy {
  approach: string;
  sellingPoints: string[];
  watchOuts: string[];
}

export interface TalentDeepDiveProps {
  candidateName?: string;
  candidateTitle?: string;
  candidateCompany?: string;
  approach?: ApproachStrategy;
}

const DEFAULT_APPROACH: ApproachStrategy = {
  approach:
    'Approach as a growth-stage build — frame the VP Risk mandate as the natural extension of his platform leadership at FinanceHub, with a clear 18-month path to CTO.',
  sellingPoints: [
    'Direct ownership of a risk-platform rebuild — rare scope for a VP-level role.',
    'Compensation package can lead with equity refresh to bridge the band gap.',
    'Singapore HQ aligns with his stated relocation timeline.',
  ],
  watchOuts: [
    'Board-facing exposure is thin — must be coached before Q3 board cycle.',
    'Visa timing could slip the start date by 6–10 weeks.',
    'Counter-offer risk from FinanceHub is high; move quickly once aligned.',
  ],
};

export function TalentDeepDive({
  candidateName = 'David Tan',
  candidateTitle = 'VP Engineering',
  candidateCompany = 'FinanceHub',
  approach = DEFAULT_APPROACH,
}: TalentDeepDiveProps) {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-accent" />
          <h2 className="font-serif text-2xl font-bold text-text-primary">TALENT DEEP-DIVE</h2>
        </div>
        <p className="text-text-muted mt-1 ml-7">Full candidate assessment and approach.</p>
      </header>

      {/* Candidate header card */}
      <div className="bg-bg-primary border border-bg-tertiary p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 shrink-0 bg-accent-10 flex items-center justify-center">
            <User className="w-6 h-6 text-accent" />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif text-xl font-bold text-text-primary">{candidateName}</h3>
            <p className="text-sm text-text-secondary mt-1">
              {candidateTitle}, {candidateCompany}
            </p>
          </div>
        </div>
      </div>

      <TRIDENTBreakdown />
      <CareerTrajectoryReport candidate={candidateName} />
      <RiskAssessment />

      {/* Approach Strategy */}
      <div className="bg-bg-primary border border-bg-tertiary p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-accent" />
          <h3 className="font-serif text-lg font-bold text-text-primary">Approach Strategy</h3>
        </div>

        <div className="mb-5">
          <div className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-2">
            Recommended Approach
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{approach.approach}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-2">
              Key Selling Points
            </div>
            <ul className="space-y-2">
              {approach.sellingPoints.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="mt-1.5 w-1.5 h-1.5 shrink-0 bg-teal" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-2">
              Watch-Outs
            </div>
            <ul className="space-y-2">
              {approach.watchOuts.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="mt-1.5 w-1.5 h-1.5 shrink-0 bg-error" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
