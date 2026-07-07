import React from 'react';
import { TrendingUp } from 'lucide-react';

interface SkillSeries {
  name: string;
  color: string;
  values: number[];
}

interface SkillProgressionProps {
  skills?: SkillSeries[];
  labels?: string[];
}

const DEFAULT_SKILLS: SkillSeries[] = [
  { name: 'Strategic Thinking', color: 'var(--accent, #C108AB)', values: [6.5, 7.2, 7.8] },
  { name: 'Stakeholder Mgmt', color: 'var(--teal, #00897B)', values: [5.8, 6.1, 6.9] },
  { name: 'Executive Presence', color: 'var(--ocean, #4FC3F7)', values: [7.0, 7.3, 7.5] },
];

const DEFAULT_LABELS = ['Jan', 'Mar', 'Jun'];

const WIDTH = 400;
const HEIGHT = 200;
const PADDING = 40;
const MAX_SCORE = 10;

export function SkillProgression({
  skills = DEFAULT_SKILLS,
  labels = DEFAULT_LABELS,
}: SkillProgressionProps) {
  const n = labels.length;
  const chartWidth = WIDTH - 2 * PADDING;
  const chartHeight = HEIGHT - 2 * PADDING;

  const getX = (i: number) => PADDING + (i * chartWidth) / (n - 1);
  const getY = (value: number) => HEIGHT - PADDING - (value / MAX_SCORE) * chartHeight;

  const gridLines = [0, 2.5, 5, 7.5, 10];

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">SKILL PROGRESSION</h3>
      </div>

      <svg
        viewBox="0 0 400 200"
        className="w-full h-auto mb-4"
        role="img"
        aria-label="Skill progression chart"
      >
        {gridLines.map((v) => {
          const y = getY(v);
          return (
            <line
              key={v}
              x1={PADDING}
              y1={y}
              x2={WIDTH - PADDING}
              y2={y}
              stroke="var(--bg-tertiary, #EDEDED)"
              strokeWidth={1}
            />
          );
        })}

        {skills.map((skill) => {
          const points = skill.values.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
          return (
            <g key={skill.name}>
              <polyline
                points={points}
                stroke={skill.color}
                strokeWidth={2}
                fill="none"
              />
              {skill.values.map((v, i) => (
                <circle
                  key={`${skill.name}-${i}`}
                  cx={getX(i)}
                  cy={getY(v)}
                  r={3}
                  fill={skill.color}
                />
              ))}
            </g>
          );
        })}

        {labels.map((label, i) => (
          <text
            key={label}
            x={getX(i)}
            y={HEIGHT - PADDING + 16}
            textAnchor="middle"
            fontSize={10}
            fill="var(--text-muted, #666666)"
          >
            {label}
          </text>
        ))}
      </svg>

      <div className="flex flex-wrap gap-3">
        {skills.map((skill) => {
          const latest = skill.values[skill.values.length - 1];
          return (
            <div key={skill.name} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5"
                style={{ backgroundColor: skill.color }}
              />
              <span className="text-xs text-text-secondary">{skill.name}</span>
              <span className="text-xs font-semibold text-text-primary">{latest.toFixed(1)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
