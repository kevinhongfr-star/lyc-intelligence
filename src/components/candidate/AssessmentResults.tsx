import React from 'react';
import { Award } from 'lucide-react';

interface SubScore {
  name: string;
  percentile: number;
}

const SUB_SCORES: SubScore[] = [
  { name: 'Verbal Reasoning', percentile: 88 },
  { name: 'Numerical Reasoning', percentile: 76 },
  { name: 'Abstract Reasoning', percentile: 85 },
  { name: 'Logical Reasoning', percentile: 79 },
];

interface AssessmentResultsProps {
  assessmentName?: string;
  overallPercentile?: number;
  completedDate?: string;
  subScores?: SubScore[];
}

export function AssessmentResults({
  assessmentName = 'Cognitive Ability Test',
  overallPercentile = 82,
  completedDate = 'Jul 5, 2026',
  subScores = SUB_SCORES,
}: AssessmentResultsProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary">
      <div className="flex items-center gap-2 p-4 border-b border-bg-tertiary">
        <Award className="w-5 h-5 text-accent" />
        <h2 className="font-serif text-sm font-bold text-text-primary tracking-wider">MY RESULTS</h2>
      </div>
      <div className="p-5 space-y-6">
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-2">
            <span className="font-serif text-4xl font-bold text-accent">{overallPercentile}nd</span>
            <span className="text-text-muted">percentile</span>
          </div>
          <p className="font-serif text-lg font-bold text-text-primary mt-2">{assessmentName}</p>
          <p className="text-sm text-text-muted mt-1">Completed {completedDate}</p>
        </div>

        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-text-primary">Sub-score Breakdown</h3>
          {subScores.map((score) => (
            <div key={score.name} className="space-y-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-primary">{score.name}</span>
                <span className="font-medium text-text-primary">{score.percentile}th</span>
              </div>
              <div className="h-2.5 bg-bg-tertiary">
                <div
                  className="h-full bg-accent"
                  style={{ width: `${score.percentile}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <h3 className="font-serif text-lg font-bold text-text-primary mb-2">Insights</h3>
          <p className="text-sm text-text-secondary">
            Your cognitive ability score is in the top quintile of executive candidates.
            Strength in verbal reasoning, room to grow in numerical.
          </p>
        </div>
      </div>
    </div>
  );
}
