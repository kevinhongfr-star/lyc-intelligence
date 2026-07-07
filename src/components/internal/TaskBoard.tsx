import React from 'react';
import { KanbanSquare } from 'lucide-react';
import { TaskCard } from './TaskCard';

export interface Task {
  id: string;
  title: string;
  mandate?: string;
  overdue?: boolean;
  overdueDays?: number;
}

interface Column {
  key: string;
  title: string;
  tasks: Task[];
}

const COLUMNS: Column[] = [
  {
    key: 'todo',
    title: 'To Do',
    tasks: [
      {
        id: 't1',
        title: 'Schedule David T. interview',
        mandate: 'M-028',
        overdue: true,
        overdueDays: 3,
      },
      { id: 't2', title: 'Prepare M-032 search', mandate: 'M-032' },
      { id: 't3', title: 'Send M-25 shortlist', mandate: 'M-25' },
    ],
  },
  {
    key: 'progress',
    title: 'In Progress',
    tasks: [{ id: 't4', title: 'Client feedback pending', mandate: 'M-028' }],
  },
  {
    key: 'review',
    title: 'Review',
    tasks: [
      { id: 't5', title: 'Score shortlist for M-31', mandate: 'M-31' },
      { id: 't6', title: 'Review CV David T.' },
    ],
  },
  {
    key: 'done',
    title: 'Done',
    tasks: [
      { id: 't7', title: 'Market map M-028', mandate: 'M-028' },
      { id: 't8', title: 'Send offer David T.' },
      { id: 't9', title: 'Complete assessment batch' },
    ],
  },
];

export function TaskBoard() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <KanbanSquare className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">TASK BOARD</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.key} className="bg-bg-secondary border border-bg-tertiary p-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-serif font-medium text-text-muted uppercase text-xs">
                {col.title}
              </h4>
              <span className="text-xs text-text-muted bg-bg-tertiary px-1.5 py-0.5">
                {col.tasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {col.tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
