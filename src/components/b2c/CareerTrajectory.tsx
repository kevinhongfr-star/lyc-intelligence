import React from 'react';
import { Briefcase } from 'lucide-react';

export interface Milestone {
  year: string;
  role: string;
  company: string;
  current?: boolean;
}

interface CareerTrajectoryProps {
  milestones?: Milestone[];
}

const DEFAULT_MILESTONES: Milestone[] = [
  { year: '2015', role: 'Senior Developer', company: 'StartupX' },
  { year: '2018', role: 'Tech Lead', company: 'GrowthLabs' },
  { year: '2020', role: 'VP Engineering', company: 'ScaleCo' },
  { year: '2024', role: 'VP Engineering', company: 'TechCorp', current: true },
];

export function CareerTrajectory({ milestones = DEFAULT_MILESTONES }: CareerTrajectoryProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-5">
        <Briefcase className="w-4 h-4 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">Career Trajectory</h3>
      </div>

      <div className="relative pl-6">
        <div className="absolute left-1.5 top-1 bottom-1 w-px bg-bg-tertiary" />
        {milestones.map((m) => (
          <div key={`${m.year}-${m.role}`} className="relative pb-6 last:pb-0">
            <span
              className={`absolute -left-[18px] top-1 w-3 h-3 ${
                m.current ? 'bg-accent' : 'bg-bg-tertiary border border-text-muted'
              }`}
            />
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-sm font-bold text-text-primary w-12 shrink-0">
                {m.year}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-text-primary">{m.role}</span>
                  {m.current && (
                    <span className="text-xs uppercase tracking-wider text-accent font-semibold">
                      Current
                    </span>
                  )}
                </div>
                <span className="text-xs text-text-muted">{m.company}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
