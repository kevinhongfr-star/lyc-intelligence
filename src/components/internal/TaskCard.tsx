import React from 'react';
import { GripVertical, User, Calendar, Briefcase } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  assignee: string;
  status: string;
  priority: string;
  deadline: string;
  source: string;
  mandate: string | null;
}

interface TaskCardProps {
  task: Task;
}

const priorityStyles: Record<string, string> = {
  high: 'bg-red-500/15 text-red-600',
  medium: 'bg-tier-2Bg text-tier-2',
  low: 'bg-bg-tertiary text-text-muted',
};

const sourceStyles: Record<string, string> = {
  auto: 'bg-blue-500/15 text-blue-600',
  manual: 'bg-bg-tertiary text-text-muted',
};

export default function TaskCard({ task }: TaskCardProps) {
  return (
    <div
      className="bg-bg-primary border border-bg-tertiary p-3 hover:bg-bg-secondary transition-colors"
      style={{ borderRadius: 0 }}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5 cursor-grab" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary mb-2">{task.title}</p>

          <div className="flex items-center gap-1.5 text-xs text-text-muted mb-2">
            <User className="w-3 h-3" />
            <span>{task.assignee}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium ${priorityStyles[task.priority] || priorityStyles.low}`}
              style={{ borderRadius: 0 }}
            >
              {task.priority}
            </span>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium ${sourceStyles[task.source] || sourceStyles.manual}`}
              style={{ borderRadius: 0 }}
            >
              {task.source}
            </span>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{task.deadline}</span>
            </div>
            {task.mandate && (
              <div className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{task.mandate}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
