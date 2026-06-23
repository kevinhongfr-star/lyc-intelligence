// Phase 3.12: Mandate Timeline Component
'use client';

import React from 'react';
import { Clock, CheckCircle2, AlertCircle, XCircle, Circle } from 'lucide-react';
import { Card } from '@/components/ui';

interface TimelineMilestone {
  stage: string;
  target_date: string;
  actual_date: string | null;
  status: 'pending' | 'completed' | 'at_risk' | 'breached';
}

interface MandateTimelineProps {
  milestones: TimelineMilestone[];
  currentStage: string;
  progress: number;
  daysRemaining: number | null;
  healthStatus: 'on_track' | 'at_risk' | 'breached' | 'completed';
}

const STATUS_CONFIG = {
  pending: { icon: Circle, color: 'text-gray-400', bg: 'bg-gray-100', label: 'Pending' },
  completed: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100', label: 'Completed' },
  at_risk: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-100', label: 'At Risk' },
  breached: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100', label: 'Breached' },
};

export function MandateTimeline({ milestones, currentStage, progress, daysRemaining, healthStatus }: MandateTimelineProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDaysUntil = (targetDate: string) => {
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Today';
    if (days === 1) return '1d';
    return `${days}d`;
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-text-primary">Timeline Progress</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              healthStatus === 'on_track' ? 'bg-green-100 text-green-700' :
              healthStatus === 'at_risk' ? 'bg-amber-100 text-amber-700' :
              healthStatus === 'breached' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {healthStatus.replace('_', ' ')}
            </span>
            {daysRemaining !== null && (
              <span className="text-sm text-text-muted">
                {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Overdue'}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-text-primary">{progress}%</div>
          <div className="text-sm text-text-muted">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-bg-alt rounded-full overflow-hidden mb-8">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            healthStatus === 'on_track' ? 'bg-green-500' :
            healthStatus === 'at_risk' ? 'bg-amber-500' :
            'bg-red-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

        {/* Milestones */}
        <div className="space-y-6">
          {milestones.map((milestone, index) => {
            const config = STATUS_CONFIG[milestone.status];
            const StatusIcon = config.icon;
            const isCurrentStage = milestone.stage === currentStage;

            return (
              <div key={milestone.stage} className="flex gap-4 relative">
                {/* Status Icon */}
                <div className={`relative z-10 w-12 h-12 rounded-full ${config.bg} flex items-center justify-center ${
                  isCurrentStage ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}>
                  <StatusIcon className={`w-6 h-6 ${config.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isCurrentStage ? 'text-primary' : 'text-text-primary'}`}>
                        {milestone.stage.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">{config.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-text-secondary">
                        {formatDate(milestone.target_date)}
                      </p>
                      <p className={`text-xs ${milestone.status === 'breached' ? 'text-red-500' : milestone.status === 'at_risk' ? 'text-amber-500' : 'text-text-muted'}`}>
                        {milestone.actual_date ? `Completed ${formatDate(milestone.actual_date)}` : getDaysUntil(milestone.target_date)}
                      </p>
                    </div>
                  </div>

                  {/* Progress indicator between stages */}
                  {index < milestones.length - 1 && (
                    <div className={`mt-3 h-1 rounded-full ${
                      milestone.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

export default MandateTimeline;