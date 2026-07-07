import React from 'react';
import { Target, CircleCheck, Circle, Clock } from 'lucide-react';

type MilestoneStatus = 'complete' | 'in-progress' | 'not-started';

interface Milestone {
  title: string;
  month: string;
  status: MilestoneStatus;
  detail?: string;
}

interface DevelopmentPlanProps {
  planName?: string;
  startDate?: string;
  targetDate?: string;
  progress?: number;
  milestones?: Milestone[];
}

const DEFAULT_MILESTONES: Milestone[] = [
  { title: 'Complete 360 feedback', month: 'Feb', status: 'complete' },
  { title: 'Lead cross-functional project', month: 'Mar', status: 'complete' },
  { title: 'Executive coaching sessions', month: 'Ongoing', status: 'in-progress', detail: '4/6 done' },
  { title: 'Board presentation opportunity', month: 'TBD', status: 'not-started' },
  { title: 'Strategic P&L ownership', month: 'TBD', status: 'not-started' },
];

export function DevelopmentPlan({
  planName = 'Executive Leadership Acceleration',
  startDate = 'Jan 2026',
  targetDate = 'Jul 2026',
  progress = 65,
  milestones = DEFAULT_MILESTONES,
}: DevelopmentPlanProps) {
  const getStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case 'complete':
        return <CircleCheck className="w-4 h-4 text-teal shrink-0" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-warning shrink-0" />;
      case 'not-started':
        return <Circle className="w-4 h-4 text-text-muted shrink-0" />;
    }
  };

  const getStatusLabel = (status: MilestoneStatus) => {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'in-progress':
        return 'In Progress';
      case 'not-started':
        return 'Not Started';
    }
  };

  const getStatusColor = (status: MilestoneStatus) => {
    switch (status) {
      case 'complete':
        return 'text-teal';
      case 'in-progress':
        return 'text-warning';
      case 'not-started':
        return 'text-text-muted';
    }
  };

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">
          ACTIVE DEVELOPMENT PLAN
        </h3>
      </div>

      <div className="mb-4">
        <h2 className="font-serif text-xl font-bold text-text-primary">{planName}</h2>
        <p className="text-sm text-text-muted mt-1">
          {startDate} – {targetDate}
        </p>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-text-muted">Progress</span>
          <span className="text-xs font-semibold text-text-secondary">{progress}% complete</span>
        </div>
        <div className="h-2.5 bg-bg-tertiary">
          <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="border-t border-bg-tertiary pt-3">
        <div className="text-xs uppercase tracking-wider text-text-muted mb-3 font-semibold">
          Milestones
        </div>
        <div className="space-y-0">
          {milestones.map((milestone, index) => (
            <div
              key={`${milestone.title}-${index}`}
              className="flex items-center gap-3 py-3 border-b border-bg-tertiary last:border-b-0"
            >
              {getStatusIcon(milestone.status)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary">{milestone.title}</div>
                <div className="text-xs text-text-muted">
                  {milestone.month}
                  {milestone.detail && ` · ${milestone.detail}`}
                </div>
              </div>
              <span className={`text-xs font-semibold ${getStatusColor(milestone.status)}`}>
                {getStatusLabel(milestone.status)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
