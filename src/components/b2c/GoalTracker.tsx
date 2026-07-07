import React from 'react';
import { Award } from 'lucide-react';

type GoalStatus = 'on-track' | 'needs-attention';

interface Goal {
  title: string;
  progress: number;
  status: GoalStatus;
}

interface GoalTrackerProps {
  goals?: Goal[];
}

const DEFAULT_GOALS: Goal[] = [
  { title: 'Become CTO-ready by Q4 2026', progress: 72, status: 'on-track' },
  { title: 'Improve public speaking', progress: 45, status: 'needs-attention' },
];

export function GoalTracker({ goals = DEFAULT_GOALS }: GoalTrackerProps) {
  const getStatusBadge = (status: GoalStatus) => {
    switch (status) {
      case 'on-track':
        return (
          <div
            className="px-2 py-0.5 text-xs font-semibold text-teal"
            style={{ backgroundColor: 'rgba(0, 137, 123, 0.1)' }}
          >
            On track
          </div>
        );
      case 'needs-attention':
        return (
          <div
            className="px-2 py-0.5 text-xs font-semibold text-warning"
            style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
          >
            Needs attention
          </div>
        );
    }
  };

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-accent" />
          <h3 className="font-serif text-lg font-bold text-text-primary">GOALS</h3>
        </div>
        <button className="text-accent text-sm font-medium">+ New Goal</button>
      </div>

      <div className="space-y-4">
        {goals.map((goal, index) => (
          <div
            key={`${goal.title}-${index}`}
            className="bg-bg-secondary border border-bg-tertiary p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="text-sm font-medium text-text-primary">{goal.title}</span>
              {getStatusBadge(goal.status)}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-bg-tertiary">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-text-secondary w-10 text-right">
                {goal.progress}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
