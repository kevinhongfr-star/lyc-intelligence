import React, { useState } from 'react';
import { BarChart3, Filter, Award, DollarSign } from 'lucide-react';
import PerformanceLeaderboard from '@/components/internal/PerformanceLeaderboard';
import HiringFunnel from '@/components/internal/HiringFunnel';
import QualityOfHire from '@/components/internal/QualityOfHire';
import RevenueAnalytics from '@/components/internal/RevenueAnalytics';

const TABS = [
  { key: 'leaderboard', label: 'Leaderboard', icon: Award },
  { key: 'funnel', label: 'Funnel', icon: Filter },
  { key: 'quality', label: 'Quality', icon: BarChart3 },
  { key: 'revenue', label: 'Revenue', icon: DollarSign },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('leaderboard');

  return (
    <div className="min-h-screen bg-bg-secondary p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-serif text-3xl font-bold text-text-primary mb-2">Analytics</h1>
        <p className="text-text-muted mb-6">Performance metrics and operational insights</p>

        <div className="flex gap-1 mb-6 border-b border-bg-tertiary">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
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

        <div>
          {activeTab === 'leaderboard' && <PerformanceLeaderboard />}
          {activeTab === 'funnel' && <HiringFunnel />}
          {activeTab === 'quality' && <QualityOfHire />}
          {activeTab === 'revenue' && <RevenueAnalytics />}
        </div>
      </div>
    </div>
  );
}
