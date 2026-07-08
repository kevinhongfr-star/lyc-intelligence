import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { MOCK_GOALS, MOCK_ACTIVITIES } from '@/mocks/advancedFeatures';

interface TimelineEntry {
  id: string;
  date: string;
  label: string;
  type: 'activity' | 'milestone';
}

function GrowthTimeline() {
  const completedActivities: TimelineEntry[] = MOCK_ACTIVITIES.filter(
    (a) => a.completed
  ).map((a) => ({
    id: a.id,
    date: '',
    label: a.title,
    type: 'activity' as const,
  }));

  const completedMilestones: TimelineEntry[] = MOCK_GOALS.flatMap((g) =>
    g.milestones
      .filter((m) => m.completed)
      .map((m) => ({
        id: `${g.id}-${m.label}`,
        date: m.date || '',
        label: m.label,
        type: 'milestone' as const,
      }))
  );

  const entries = [...completedActivities, ...completedMilestones].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-xl text-text-primary">Growth Timeline</h2>

      {entries.length === 0 ? (
        <p className="text-sm text-text-muted">No completed items yet.</p>
      ) : (
        <div className="relative ml-4">
          {/* Vertical line */}
          <div
            className="absolute left-[7px] top-2 bottom-2 w-px bg-bg-tertiary"
          />

          <div className="space-y-6">
            {entries.map((entry) => (
              <div key={entry.id} className="relative pl-8">
                {/* Icon */}
                <div className="absolute left-0 top-0.5">
                  <CheckCircle className="w-4 h-4" style={{ color: '#C108AB' }} />
                </div>

                <div className="border border-bg-tertiary bg-bg-secondary p-4" style={{ borderRadius: 0 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
                      style={{
                        borderRadius: 0,
                        backgroundColor:
                          entry.type === 'milestone'
                            ? 'rgba(193,8,171,0.15)'
                            : 'rgba(37,99,235,0.15)',
                        color: entry.type === 'milestone' ? '#C108AB' : '#2563eb',
                      }}
                    >
                      {entry.type === 'milestone' ? 'Milestone' : 'Activity'}
                    </span>
                    {entry.date && (
                      <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                        <Clock className="w-3 h-3" />
                        {entry.date}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-primary font-medium">{entry.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default GrowthTimeline;
