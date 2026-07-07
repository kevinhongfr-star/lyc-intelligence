import React from 'react';

export interface SkillGap {
  name: string;
  current: number;
  target: number;
}

interface SkillGapAnalysisProps {
  skills?: SkillGap[];
}

const DEFAULT_SKILLS: SkillGap[] = [
  { name: 'Strategic Thinking', current: 6.5, target: 8.0 },
  { name: 'People Leadership', current: 7.2, target: 8.0 },
  { name: 'Technical Depth', current: 8.5, target: 7.5 },
  { name: 'Commercial Acumen', current: 5.8, target: 8.0 },
  { name: 'Global Mindset', current: 6.0, target: 7.5 },
];

const MAX_SCORE = 10;

export function SkillGapAnalysis({ skills = DEFAULT_SKILLS }: SkillGapAnalysisProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg font-bold text-text-primary">Skill Gap Analysis</h3>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-accent" /> Current
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-bg-tertiary border border-text-secondary" /> Target
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {skills.map((skill) => {
          const currentPercent = (skill.current / MAX_SCORE) * 100;
          const targetPercent = (skill.target / MAX_SCORE) * 100;
          const gap = skill.target - skill.current;
          const gapLabel = gap > 0 ? `+${gap.toFixed(1)} to close` : `${Math.abs(gap).toFixed(1)} surplus`;
          const gapColor = gap > 0 ? 'text-warning' : 'text-teal';

          return (
            <div key={skill.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-text-primary font-medium">{skill.name}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-secondary font-semibold">
                    {skill.current.toFixed(1)}
                  </span>
                  <span className="text-text-muted">→</span>
                  <span className="text-text-secondary font-semibold">
                    {skill.target.toFixed(1)}
                  </span>
                  <span className={`text-xs ${gapColor}`}>{gapLabel}</span>
                </div>
              </div>
              <div className="relative h-2.5 bg-bg-tertiary">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${currentPercent}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-text-secondary"
                  style={{ left: `${targetPercent}%` }}
                  aria-label={`target ${skill.target}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
