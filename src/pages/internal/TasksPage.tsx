import React, { useState } from 'react';
import { ClipboardList, KanbanSquare, Clock, ListChecks } from 'lucide-react';
import TaskBoard from '@/components/internal/TaskBoard';
import SLATracker from '@/components/internal/SLATracker';
import TaskTemplates from '@/components/internal/TaskTemplates';

const TABS = [
  { id: 'board', label: 'Board', icon: KanbanSquare },
  { id: 'sla', label: 'SLA Tracker', icon: Clock },
  { id: 'templates', label: 'Templates', icon: ListChecks },
] as const;

type TabId = typeof TABS[number]['id'];

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<TabId>('board');

  const renderContent = () => {
    switch (activeTab) {
      case 'board':
        return <TaskBoard />;
      case 'sla':
        return <SLATracker />;
      case 'templates':
        return <TaskTemplates />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-6 h-6 text-accent" />
        <h1 className="font-serif font-semibold text-2xl text-text-primary">Tasks</h1>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-bg-tertiary">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
              style={{ borderRadius: 0 }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>{renderContent()}</div>
    </div>
  );
}
