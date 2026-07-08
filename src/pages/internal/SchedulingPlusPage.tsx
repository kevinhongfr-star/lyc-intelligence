import React, { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import CalendarSync from '@/components/internal/CalendarSync';
import MultiInterviewerScheduler from '@/components/internal/MultiInterviewerScheduler';
import ScorecardBuilder from '@/components/internal/ScorecardBuilder';
import InterviewTemplates from '@/components/internal/InterviewTemplates';

const tabs = ['Calendar Sync', 'Scheduler', 'Scorecards', 'Templates'] as const;
type Tab = typeof tabs[number];

export default function SchedulingPlusPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Calendar Sync');

  return (
    <div className="min-h-screen bg-bg-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <CalendarDays className="w-6 h-6 text-[#C108AB]" />
          <h1 className="text-2xl font-serif font-bold text-text-primary">Scheduling+</h1>
        </div>

        <div className="flex border-b border-bg-tertiary mb-6">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? 'text-[#C108AB]'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              style={{ borderRadius: 0 }}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C108AB]" />
              )}
            </button>
          ))}
        </div>

        <div>
          {activeTab === 'Calendar Sync' && <CalendarSync />}
          {activeTab === 'Scheduler' && <MultiInterviewerScheduler />}
          {activeTab === 'Scorecards' && <ScorecardBuilder />}
          {activeTab === 'Templates' && <InterviewTemplates />}
        </div>
      </div>
    </div>
  );
}
