import React from 'react';

export interface WeeklyActivityData {
  newMatches: number;
  interviews: number;
  assessments: number;
  feedback: number;
}

const MOCK_WEEKLY: WeeklyActivityData = {
  newMatches: 3,
  interviews: 1,
  assessments: 2,
  feedback: 1,
};

interface WeeklyActivityProps {
  data?: WeeklyActivityData;
}

export function WeeklyActivity({ data = MOCK_WEEKLY }: WeeklyActivityProps) {
  const stats = [
    { key: 'newMatches', label: 'New Matches', value: data.newMatches, accent: 'bg-accent' },
    { key: 'interviews', label: 'Interviews', value: data.interviews, accent: 'bg-ocean' },
    { key: 'assessments', label: 'Assessments', value: data.assessments, accent: 'bg-warning' },
    { key: 'feedback', label: 'Feedback', value: data.feedback, accent: 'bg-teal' },
  ];

  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-6">
      <h2 className="font-serif text-lg font-bold text-text-primary mb-4">This Week</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.key} className="border border-bg-tertiary p-4">
            <div className={`w-8 h-8 ${s.accent} flex items-center justify-center mb-3`}>
              <span className="text-white text-base font-bold">{s.value}</span>
            </div>
            <span className="text-xs text-text-muted">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
