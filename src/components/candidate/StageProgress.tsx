import React from 'react';

export const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Placed'] as const;
export type StageName = (typeof STAGES)[number];

interface StageProgressProps {
  currentStage: number;
  stages?: readonly string[];
}

export function StageProgress({ currentStage, stages = STAGES }: StageProgressProps) {
  const clamped = Math.max(0, Math.min(stages.length - 1, currentStage));

  return (
    <div>
      <div className="flex items-center">
        {stages.map((stage, i) => {
          const completed = i <= clamped;
          const isLast = i === stages.length - 1;
          return (
            <div key={stage} className="flex items-center flex-1 last:flex-none">
              <div className={`h-1.5 flex-1 ${completed ? 'bg-accent' : 'bg-bg-tertiary'}`} />
              {!isLast && <div className="w-2" />}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-2">
        {stages.map((stage, i) => (
          <span
            key={stage}
            className={`text-[10px] uppercase tracking-wide ${
              i <= clamped ? 'text-accent font-medium' : 'text-text-muted'
            }`}
          >
            {stage}
          </span>
        ))}
      </div>
    </div>
  );
}
