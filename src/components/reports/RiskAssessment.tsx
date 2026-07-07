import React from 'react';
import { AlertTriangle } from 'lucide-react';

export type Severity = 'high' | 'medium' | 'low';

export interface RiskItem {
  text: string;
  severity: Severity;
  mitigation: string;
}

export interface RiskAssessmentProps {
  risks?: RiskItem[];
}

const SEVERITY_CLASSES: Record<Severity, string> = {
  high: 'bg-error text-white',
  medium: 'bg-warning text-white',
  low: 'bg-teal text-white',
};

const DEFAULT_RISKS: RiskItem[] = [
  {
    text: 'Limited board-facing experience',
    severity: 'high',
    mitigation: 'Coach for Q3 board presentation; pair with current CTO.',
  },
  {
    text: 'Compensation expectation above band',
    severity: 'medium',
    mitigation: 'Structure with sign-on + equity refresh.',
  },
  {
    text: 'Visa dependency (Shanghai → Singapore)',
    severity: 'medium',
    mitigation: 'Initiate EP application pre-offer.',
  },
];

export function RiskAssessment({ risks = DEFAULT_RISKS }: RiskAssessmentProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-5">
        <AlertTriangle className="w-4 h-4 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">Risk Assessment</h3>
      </div>

      <div className="space-y-4">
        {risks.map((r, i) => (
          <div key={i} className="border border-bg-tertiary p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-sm text-text-primary font-medium leading-snug">{r.text}</p>
              <span
                className={`shrink-0 px-2 py-0.5 text-xs uppercase tracking-wider font-semibold ${SEVERITY_CLASSES[r.severity]}`}
              >
                {r.severity}
              </span>
            </div>
            <div className="pt-3 border-t border-bg-tertiary">
              <div className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-1">
                Mitigation
              </div>
              <p className="text-sm text-text-secondary">{r.mitigation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
