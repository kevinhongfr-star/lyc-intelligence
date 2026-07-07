import React from 'react';
import { Clock } from 'lucide-react';
import type { Task } from './TaskBoard';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-3">
      <p className="text-sm font-medium text-text-primary">{task.title}</p>
      {task.mandate && (
        <p className="text-xs text-text-muted mt-1">{task.mandate}</p>
      )}
      {task.overdue && (
        <div className="flex items-center gap-1 mt-2">
          <span className="bg-error text-white text-[10px] px-1.5 py-0.5">
            OVERDUE
          </span>
          <Clock className="w-3 h-3 text-error" />
          <span className="text-[10px] text-error">
            {task.overdueDays}d ago
          </span>
        </div>
      )}
    </div>
  );
}
