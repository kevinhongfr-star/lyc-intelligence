import React, { useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Clock,
  TrendingUp,
  Target
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { MandateMilestones, MILESTONE_LABELS, MILESTONE_ORDER } from './TimelineView';

export interface ClientTimelineProps {
  milestones: MandateMilestones;
  mandateTitle: string;
  mandateStatus: string;
}

export function ClientTimeline({ milestones, mandateTitle, mandateStatus }: ClientTimelineProps) {
  const { completedMilestones, currentMilestone, upcomingMilestones, progress } = useMemo(() => {
    const completed: Array<{ key: string; label: string; actualDate: string }> = [];
    let current: { key: string; label: string; targetDate: string } | null = null;
    const upcoming: Array<{ key: string; label: string; targetDate: string }> = [];

    let foundCurrent = false;

    MILESTONE_ORDER.forEach((key) => {
      const milestone = milestones[key as keyof MandateMilestones];
      if (!milestone) return;

      const label = MILESTONE_LABELS[key];

      if (milestone.actual_date) {
        completed.push({ key, label, actualDate: milestone.actual_date });
      } else if (!foundCurrent) {
        current = {
          key,
          label,
          targetDate: milestone.target_date || '',
        };
        foundCurrent = true;
      } else {
        upcoming.push({
          key,
          label,
          targetDate: milestone.target_date || '',
        });
      }
    });

    const totalMilestones = completed.length + (current ? 1 : 0) + upcoming.length;
    const progressPercentage = totalMilestones > 0 ? Math.round((completed.length / totalMilestones) * 100) : 0;

    return {
      completedMilestones: completed,
      currentMilestone: current,
      upcomingMilestones: upcoming,
      progress: progressPercentage,
    };
  }, [milestones]);

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      '1_search': 'Searching',
      '2_shortlist': 'Shortlisting',
      '3_interview': 'Interviewing',
      '4_offer': 'Offer Stage',
      '5_placed': 'Placed',
      '6_closed': 'Closed',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="bg-card border border-card-border rounded-none overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-card-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">{mandateTitle}</h2>
              <Badge variant="default" className="mt-1">
                {getStatusLabel(mandateStatus)}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-accent">{progress}%</p>
            <p className="text-sm text-text-muted">Complete</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-bg-alt rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-sm text-text-muted mt-2">
          {completedMilestones.length} milestone{completedMilestones.length !== 1 ? 's' : ''} completed
          {currentMilestone && ` · Currently working on: ${currentMilestone.label}`}
        </p>
      </div>

      {/* Milestones List */}
      <div className="divide-y divide-card-border">
        {/* Completed Milestones */}
        {completedMilestones.map((milestone) => (
          <div
            key={milestone.key}
            className="p-4 flex items-center gap-4 bg-green-50/50"
          >
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-text-primary">{milestone.label}</p>
              <p className="text-sm text-green-600">Completed {formatDate(milestone.actualDate)}</p>
            </div>
          </div>
        ))}

        {/* Current Milestone */}
        {currentMilestone && (
          <div className="p-4 flex items-center gap-4 bg-blue-50/50 border-l-4 border-accent">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 animate-pulse">
              <Circle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-text-primary">{currentMilestone.label}</p>
              <p className="text-sm text-accent font-medium">
                In Progress · Expected {formatDate(currentMilestone.targetDate)}
              </p>
            </div>
            <div className="w-4 h-4 rounded-full bg-accent animate-bounce">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
          </div>
        )}

        {/* Upcoming Milestones */}
        {upcomingMilestones.map((milestone) => (
          <div
            key={milestone.key}
            className="p-4 flex items-center gap-4 opacity-60"
          >
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
              <Circle className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-text-secondary">{milestone.label}</p>
              <p className="text-sm text-text-muted">
                Expected {formatDate(milestone.targetDate)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-card-border bg-bg-alt">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Clock className="w-4 h-4" />
          <span>Timeline is managed by your dedicated consultant</span>
        </div>
      </div>
    </div>
  );
}