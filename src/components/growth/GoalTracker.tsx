import React from 'react';
import { Target, Plus, CheckCircle, Circle } from 'lucide-react';
import { MOCK_GOALS } from '@/mocks/advancedFeatures';

function GoalTracker() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-text-primary">Your Goals</h2>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: '#C108AB', borderRadius: 0 }}
        >
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
      </div>

      <div className="space-y-4">
        {MOCK_GOALS.map((goal) => (
          <div
            key={goal.id}
            className="border border-bg-tertiary bg-bg-secondary p-5"
            style={{ borderRadius: 0 }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <Target className="w-4 h-4 text-text-muted" />
                  <h3 className="font-serif text-lg text-text-primary">{goal.title}</h3>
                  <span
                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
                    style={{
                      borderRadius: 0,
                      backgroundColor:
                        goal.type === 'short_term' ? 'rgba(37,99,235,0.15)' : 'rgba(193,8,171,0.15)',
                      color: goal.type === 'short_term' ? '#2563eb' : '#C108AB',
                    }}
                  >
                    {goal.type === 'short_term' ? 'Short-term' : 'Long-term'}
                  </span>
                </div>
                <p className="text-sm text-text-muted ml-7">{goal.description}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="ml-7 mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-text-muted">Progress</span>
                <span className="text-xs font-medium text-text-primary">{goal.progress}%</span>
              </div>
              <div className="w-full h-2 bg-bg-tertiary" style={{ borderRadius: 0 }}>
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${goal.progress}%`,
                    backgroundColor: '#C108AB',
                    borderRadius: 0,
                  }}
                />
              </div>
            </div>

            {/* Milestones */}
            <div className="ml-7 space-y-2">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Milestones
              </span>
              {goal.milestones.map((milestone, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {milestone.completed ? (
                    <CheckCircle className="w-4 h-4" style={{ color: '#C108AB' }} />
                  ) : (
                    <Circle className="w-4 h-4 text-text-muted" />
                  )}
                  <span
                    className={`text-sm ${
                      milestone.completed ? 'text-text-primary' : 'text-text-muted'
                    }`}
                  >
                    {milestone.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Deadline */}
            <div className="ml-7 mt-3 pt-3 border-t border-bg-tertiary">
              <span className="text-xs text-text-muted">
                Deadline:{' '}
                <span className="text-text-primary font-medium">{goal.deadline}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GoalTracker;
