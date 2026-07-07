import React from 'react';
import { ClipboardList, Clock, ListChecks, Coins, ArrowRight } from 'lucide-react';

export interface AssessmentCardProps {
  name: string;
  creditCost: number;
  questionCount: number;
  durationLabel: string;
  onStart?: () => void;
}

export function AssessmentCard({
  name,
  creditCost,
  questionCount,
  durationLabel,
  onStart,
}: AssessmentCardProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 bg-accent-10 flex items-center justify-center shrink-0">
          <ClipboardList className="w-4 h-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wider text-text-muted mb-0.5">
            Assessment Offer
          </div>
          <h4 className="font-serif text-base font-bold text-text-primary">{name}</h4>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <Coins className="w-3.5 h-3.5 text-accent" />
          <div>
            <div className="text-text-muted">Credits</div>
            <div className="text-text-primary font-semibold">{creditCost}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ListChecks className="w-3.5 h-3.5 text-text-secondary" />
          <div>
            <div className="text-text-muted">Questions</div>
            <div className="text-text-primary font-semibold">{questionCount}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-text-secondary" />
          <div>
            <div className="text-text-muted">Duration</div>
            <div className="text-text-primary font-semibold">{durationLabel}</div>
          </div>
        </div>
      </div>

      <button
        onClick={onStart}
        className="w-full flex items-center justify-center gap-2 bg-accent text-white text-sm font-medium py-2 hover:bg-accent-hover transition-colors"
      >
        Start Assessment
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
