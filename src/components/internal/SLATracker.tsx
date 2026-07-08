import React from 'react';
import { Clock, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { MOCK_TASKS } from '@/mocks/internalPortal';

function getDaysUntilDeadline(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  return Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function SLATracker() {
  const tasksWithSLA = MOCK_TASKS
    .filter(t => t.status !== 'done')
    .map(t => ({
      ...t,
      daysUntil: getDaysUntilDeadline(t.deadline),
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const overdue = tasksWithSLA.filter(t => t.daysUntil < 0);
  const dueToday = tasksWithSLA.filter(t => t.daysUntil === 0);
  const dueThisWeek = tasksWithSLA.filter(t => t.daysUntil > 0 && t.daysUntil <= 7);

  const getSLABorderStyle = (daysUntil: number): string => {
    if (daysUntil < 0) return 'border-l-4 border-l-red-500';
    if (daysUntil === 0) return 'border-l-4 border-l-amber-500';
    return 'border-l-4 border-l-bg-tertiary';
  };

  const getSLALabel = (daysUntil: number): { text: string; icon: React.ReactNode; color: string } => {
    if (daysUntil < 0) {
      return {
        text: `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} overdue`,
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        color: 'text-red-600',
      };
    }
    if (daysUntil === 0) {
      return {
        text: 'Due today',
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        color: 'text-amber-600',
      };
    }
    return {
      text: `${daysUntil} day${daysUntil !== 1 ? 's' : ''} remaining`,
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      color: 'text-tier-1',
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-accent" />
        <h2 className="font-serif font-semibold text-lg text-text-primary">SLA Tracker</h2>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 text-red-600 text-xs font-medium" style={{ borderRadius: 0 }}>
          <AlertTriangle className="w-3.5 h-3.5" />
          {overdue.length} overdue
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 text-amber-600 text-xs font-medium" style={{ borderRadius: 0 }}>
          <AlertCircle className="w-3.5 h-3.5" />
          {dueToday.length} due today
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-tertiary text-text-muted text-xs font-medium" style={{ borderRadius: 0 }}>
          <CheckCircle className="w-3.5 h-3.5" />
          {dueThisWeek.length} due this week
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {tasksWithSLA.map(task => {
          const sla = getSLALabel(task.daysUntil);
          return (
            <div
              key={task.id}
              className={`bg-bg-primary border border-bg-tertiary p-3 ${getSLABorderStyle(task.daysUntil)}`}
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                    <span>{task.assignee}</span>
                    <span>|</span>
                    <span>Deadline: {task.deadline}</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${sla.color}`}>
                  {sla.icon}
                  {sla.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
