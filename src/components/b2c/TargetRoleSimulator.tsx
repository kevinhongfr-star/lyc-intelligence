import React, { useState } from 'react';
import { Target } from 'lucide-react';

interface SkillGap {
  name: string;
  current: number;
  target: number;
}

interface TargetRole {
  name: string;
  skills: SkillGap[];
}

const TARGET_ROLES: TargetRole[] = [
  {
    name: 'CTO',
    skills: [
      { name: 'Strategic', current: 6.5, target: 8.5 },
      { name: 'Commercial', current: 5.8, target: 8.5 },
      { name: 'People', current: 7.2, target: 8.0 },
      { name: 'Technical', current: 8.5, target: 7.0 },
      { name: 'Global', current: 6.0, target: 7.5 },
    ],
  },
  {
    name: 'SVP Engineering',
    skills: [
      { name: 'Strategic', current: 6.5, target: 7.5 },
      { name: 'Commercial', current: 5.8, target: 6.5 },
      { name: 'People', current: 7.2, target: 8.5 },
      { name: 'Technical', current: 8.5, target: 7.5 },
      { name: 'Global', current: 6.0, target: 6.5 },
    ],
  },
  {
    name: 'GM / Business Unit Lead',
    skills: [
      { name: 'Strategic', current: 6.5, target: 8.0 },
      { name: 'Commercial', current: 5.8, target: 9.0 },
      { name: 'People', current: 7.2, target: 7.5 },
      { name: 'Technical', current: 8.5, target: 6.0 },
      { name: 'Global', current: 6.0, target: 8.0 },
    ],
  },
];

const MAX_SCORE = 10;

export function TargetRoleSimulator() {
  const [selectedRole, setSelectedRole] = useState<string>(TARGET_ROLES[0].name);
  const active =
    TARGET_ROLES.find((r) => r.name === selectedRole) ?? TARGET_ROLES[0];

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-accent" />
          <h3 className="font-serif text-lg font-bold text-text-primary">Target Role Simulator</h3>
        </div>
        <p className="text-xs text-text-muted mt-1">See how your gaps shift by target role</p>
      </div>

      <div className="mb-4">
        <label className="block text-xs uppercase tracking-wider text-text-muted mb-1">
          Target role
        </label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="bg-bg-secondary border border-bg-tertiary px-3 py-2 text-sm text-text-primary"
        >
          {TARGET_ROLES.map((role) => (
            <option key={role.name} value={role.name}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {active.skills.map((skill) => {
          const currentPercent = (skill.current / MAX_SCORE) * 100;
          const targetPercent = (skill.target / MAX_SCORE) * 100;
          const gap = skill.target - skill.current;
          const gapLabel =
            gap > 0 ? `+${gap.toFixed(1)} to close` : `${Math.abs(gap).toFixed(1)} surplus`;
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
                  <span className={gapColor}>{gapLabel}</span>
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
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
