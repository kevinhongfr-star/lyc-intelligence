import React, { useState } from 'react';
import { TaskBoard } from '@/components/internal/TaskBoard';
import { AutoTaskGenerator } from '@/components/internal/AutoTaskGenerator';
import { SLATracker } from '@/components/internal/SLATracker';

const FILTERS = ['My Tasks', 'Team Tasks', 'Auto-Generated'] as const;
type Filter = (typeof FILTERS)[number];

export function TasksPage() {
  const [filter, setFilter] = useState<Filter>('My Tasks');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">TASKS</h1>
      </header>

      <nav className="flex gap-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
              filter === f
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {f}
          </button>
        ))}
      </nav>

      <TaskBoard />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AutoTaskGenerator />
        <SLATracker />
      </div>
    </div>
  );
}
