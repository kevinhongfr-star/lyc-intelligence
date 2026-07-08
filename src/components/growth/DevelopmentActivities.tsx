import React, { useState } from 'react';
import { BookOpen, Clock, Circle, CheckCircle } from 'lucide-react';
import { MOCK_ACTIVITIES, DevelopmentActivity } from '@/mocks/advancedFeatures';

const TABS = ['All', 'Course', 'Reading', 'Exercise', 'Workshop'] as const;
type Tab = (typeof TABS)[number];

function DevelopmentActivities() {
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [activities, setActivities] = useState<DevelopmentActivity[]>(MOCK_ACTIVITIES);

  const filtered =
    activeTab === 'All'
      ? activities
      : activities.filter((a) => a.type === activeTab.toLowerCase());

  function toggleCompleted(id: string) {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a))
    );
  }

  const typeColor: Record<string, { bg: string; text: string }> = {
    course: { bg: 'rgba(37,99,235,0.15)', text: '#2563eb' },
    reading: { bg: 'rgba(124,58,237,0.15)', text: '#7c3aed' },
    exercise: { bg: 'rgba(22,163,74,0.15)', text: '#16a34a' },
    workshop: { bg: 'rgba(193,8,171,0.15)', text: '#C108AB' },
  };

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-xl text-text-primary">Development Activities</h2>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-bg-tertiary">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              borderRadius: 0,
              backgroundColor: activeTab === tab ? '#C108AB' : 'transparent',
              color: activeTab === tab ? '#ffffff' : '#666666',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Activity cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((activity) => {
          const colors = typeColor[activity.type] || typeColor.course;
          return (
            <div
              key={activity.id}
              className="border border-bg-tertiary bg-bg-secondary p-4"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-text-muted" />
                  <h3 className="font-serif text-base text-text-primary">{activity.title}</h3>
                </div>
                <span
                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
                  style={{ borderRadius: 0, backgroundColor: colors.bg, color: colors.text }}
                >
                  {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                </span>
              </div>

              <p className="text-sm text-text-muted mb-3">{activity.description}</p>

              <div className="flex items-center gap-4 text-xs text-text-muted">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {activity.duration}
                </span>
                <span>{activity.category}</span>
              </div>

              <div className="mt-3 pt-3 border-t border-bg-tertiary flex items-center justify-between">
                <button
                  onClick={() => toggleCompleted(activity.id)}
                  className="inline-flex items-center gap-2 text-sm cursor-pointer"
                  style={{ borderRadius: 0 }}
                >
                  {activity.completed ? (
                    <>
                      <CheckCircle className="w-4 h-4" style={{ color: '#C108AB' }} />
                      <span className="text-text-primary font-medium">Completed</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4 text-text-muted" />
                      <span className="text-text-muted">Mark complete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DevelopmentActivities;
