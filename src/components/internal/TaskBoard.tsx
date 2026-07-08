import React from 'react';
import { KanbanSquare } from 'lucide-react';
import { MOCK_TASKS, type TaskStatus } from '@/mocks/internalPortal';
import TaskCard from '@/components/internal/TaskCard';

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
];

export default function TaskBoard() {
  const tasksByStatus = COLUMNS.reduce<Record<string, typeof MOCK_TASKS>>((acc, col) => {
    acc[col.id] = MOCK_TASKS.filter(t => t.status === col.id);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <KanbanSquare className="w-5 h-5 text-accent" />
        <h2 className="font-serif font-semibold text-lg text-text-primary">Task Board</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const columnTasks = tasksByStatus[col.id];
          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-72 flex flex-col"
            >
              {/* Column Header */}
              <div className="px-3 py-2 bg-bg-secondary flex items-center justify-between border-b border-bg-tertiary">
                <span className="text-sm font-medium text-text-primary">{col.label}</span>
                <span
                  className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-bg-tertiary text-text-muted"
                  style={{ borderRadius: 0 }}
                >
                  {columnTasks.length}
                </span>
              </div>

              {/* Column Body */}
              <div className="flex-1 min-h-[200px] bg-bg-secondary p-2 space-y-2 border-x border-b border-bg-tertiary">
                {columnTasks.length === 0 ? (
                  <div className="text-center text-text-muted text-xs py-8">
                    No tasks
                  </div>
                ) : (
                  columnTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
