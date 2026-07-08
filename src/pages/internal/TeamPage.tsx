import React, { useState } from 'react';
import { Users, List, BarChart3, BarChart2 } from 'lucide-react';
import TeamList from '@/components/internal/TeamList';
import TeamPerformance from '@/components/internal/TeamPerformance';
import WorkloadDistribution from '@/components/internal/WorkloadDistribution';

const TABS = [
  { id: 'team-list', label: 'Team List', icon: List },
  { id: 'performance', label: 'Performance', icon: BarChart3 },
  { id: 'workload', label: 'Workload', icon: BarChart2 },
] as const;

type TabId = typeof TABS[number]['id'];

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<TabId>('team-list');

  const renderContent = () => {
    switch (activeTab) {
      case 'team-list':
        return <TeamList />;
      case 'performance':
        return <TeamPerformance />;
      case 'workload':
        return <WorkloadDistribution />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="w-6 h-6 text-accent" />
        <h1 className="font-serif font-semibold text-2xl text-text-primary">Team Management</h1>
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
