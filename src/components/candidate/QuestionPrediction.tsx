import React from 'react';
import { ListChecks } from 'lucide-react';

export interface QuestionPredictionProps {
  questions?: string[];
}

const MOCK_QUESTIONS: string[] = [
  'Technical leadership in high-growth environment',
  'Cross-cultural team management',
  'Architecture decisions at scale',
  'Hiring philosophy and team building',
  'Conflict resolution with stakeholders',
];

export function QuestionPrediction({ questions = MOCK_QUESTIONS }: QuestionPredictionProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <ListChecks className="w-4 h-4 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">PREDICTED QUESTIONS</h3>
      </div>

      <p className="text-sm text-text-secondary mb-4">
        AI-anticipated focus areas based on the role and panel composition.
      </p>

      <ol className="flex flex-col">
        {questions.map((q, i) => (
          <li
            key={i}
            className="flex items-start gap-3 py-3 border-b border-bg-tertiary last:border-b-0"
          >
            <span className="font-serif font-bold text-accent w-6 flex-shrink-0">
              {i + 1}
            </span>
            <span className="text-sm text-text-primary">{q}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
