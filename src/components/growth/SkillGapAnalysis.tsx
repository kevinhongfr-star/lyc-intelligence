import React from 'react';
import { TrendingUp } from 'lucide-react';
import { MOCK_SKILL_GAPS } from '@/mocks/advancedFeatures';

function SkillGapAnalysis() {
  const { current, target } = MOCK_SKILL_GAPS;

  const skills = Object.keys(current)
    .map((name) => ({
      name,
      current: current[name],
      target: target[name],
      gap: target[name] - current[name],
    }))
    .sort((a, b) => b.gap - a.gap);

  const topGaps = skills.slice(0, 3);

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-xl text-text-primary">Skill Gap Analysis</h2>

      {/* Top 3 Development Areas */}
      <div className="border border-bg-tertiary bg-bg-secondary p-5" style={{ borderRadius: 0 }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4" style={{ color: '#C108AB' }} />
          <h3 className="font-serif text-base text-text-primary">Top 3 Development Areas</h3>
        </div>
        <ol className="list-decimal list-inside space-y-1.5">
          {topGaps.map((skill) => (
            <li key={skill.name} className="text-sm text-text-primary">
              {skill.name}{' '}
              <span className="text-text-muted">
                (gap: +{skill.gap})
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Skill bars */}
      <div className="space-y-5">
        {skills.map((skill) => (
          <div key={skill.name}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-text-primary">{skill.name}</span>
              <span className="text-xs text-text-muted">
                {skill.current}/{skill.target}{' '}
                <span
                  className="font-medium"
                  style={{ color: skill.gap > 15 ? '#C108AB' : '#666666' }}
                >
                  (+{skill.gap})
                </span>
              </span>
            </div>

            {/* Bar pair */}
            <div className="relative h-6">
              {/* Target bar (background / dashed outline) */}
              <div
                className="absolute inset-0 border-2 border-dashed border-bg-tertiary bg-transparent"
                style={{ borderRadius: 0 }}
              />
              {/* Target fill (gray) */}
              <div
                className="absolute top-0 left-0 h-full bg-bg-tertiary/40"
                style={{ width: `${skill.target}%`, borderRadius: 0 }}
              />
              {/* Current fill (fuchsia) */}
              <div
                className="absolute top-0 left-0 h-full"
                style={{
                  width: `${skill.current}%`,
                  backgroundColor: '#C108AB',
                  borderRadius: 0,
                }}
              />
            </div>

            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-text-muted">Current: {skill.current}</span>
              <span className="text-[10px] text-text-muted">Target: {skill.target}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SkillGapAnalysis;
