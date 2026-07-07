import React from 'react';
import { Briefcase } from 'lucide-react';

export interface CareerMilestone {
  year: string;
  role: string;
  company: string;
  current?: boolean;
}

export interface CareerTrajectoryReportProps {
  candidate?: string;
  milestones?: CareerMilestone[];
}

const DEFAULT_CANDIDATE = 'David Tan';

const DEFAULT_MILESTONES: CareerMilestone[] = [
  { year: '2016', role: 'Software Engineer', company: 'StartupA' },
  { year: '2019', role: 'Senior Software Engineer', company: 'FinBeta' },
  { year: '2021', role: 'Tech Lead', company: 'FinBeta' },
  { year: '2023', role: 'VP Engineering', company: 'FinanceHub' },
  { year: '2024', role: 'VP Engineering', company: 'FinanceHub', current: true },
];

export function CareerTrajectoryReport({
  candidate = DEFAULT_CANDIDATE,
  milestones = DEFAULT_MILESTONES,
}: CareerTrajectoryReportProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-5">
        <Briefcase className="w-4 h-4 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">Career Trajectory</h3>
        <span className="text-text-muted text-sm ml-2">— {candidate}</span>
      </div>

      <div className="relative pl-6">
        <div className="absolute left-1.5 top-1 bottom-1 w-px bg-bg-tertiary" />
        {milestones.map((m) => (
          <div key={`${m.year}-${m.role}-${m.company}`} className="relative pb-6 last:pb-0">
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
