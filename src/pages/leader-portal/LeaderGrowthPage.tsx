import React, { useState } from 'react';
import { Target, BookOpen, Users, Clock, TrendingUp } from 'lucide-react';
import GoalTracker from '@/components/growth/GoalTracker';
import DevelopmentActivities from '@/components/growth/DevelopmentActivities';
import MentorMatching from '@/components/growth/MentorMatching';
import GrowthTimeline from '@/components/growth/GrowthTimeline';
import SkillGapAnalysis from '@/components/growth/SkillGapAnalysis';

const TABS = [
  { key: 'goals', label: 'Goals', icon: Target },
  { key: 'activities', label: 'Activities', icon: BookOpen },
  { key: 'mentors', label: 'Mentors', icon: Users },
  { key: 'timeline', label: 'Timeline', icon: Clock },
  { key: 'skills', label: 'Skills', icon: TrendingUp },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function LeaderGrowthPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('goals');

  function renderContent() {
    switch (activeTab) {
      case 'goals':
        return <GoalTracker />;
      case 'activities':
        return <DevelopmentActivities />;
      case 'mentors':
        return <MentorMatching />;
      case 'timeline':
        return <GrowthTimeline />;
      case 'skills':
        return <SkillGapAnalysis />;
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-text-primary mb-2">Growth Plan</h1>
          <p className="text-text-muted text-sm max-w-2xl">
            Track your professional development goals, discover learning activities,
            connect with mentors, and identify skill gaps to accelerate your leadership journey.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-0 border-b border-bg-tertiary mb-8">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2"
                style={{
                  borderRadius: 0,
                  borderColor: isActive ? '#C108AB' : 'transparent',
                  color: isActive ? '#C108AB' : '#666666',
                  backgroundColor: isActive ? 'rgba(193,8,171,0.05)' : 'transparent',
                }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div>{renderContent()}</div>
      </div>
    </div>
  );
}

export default LeaderGrowthPage;
