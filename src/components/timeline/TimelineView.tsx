import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Circle,
  ChevronRight,
  Edit2,
  Loader2
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';

export type MilestoneStatus = 'pending' | 'on_track' | 'at_risk' | 'overdue' | 'completed' | 'completed_late';

export interface Milestone {
  target_date: string | null;
  actual_date: string | null;
  status: MilestoneStatus;
  notes?: string;
}

export interface MandateMilestones {
  intake_complete?: Milestone;
  solution_defined?: Milestone;
  jd_approved?: Milestone;
  market_defined?: Milestone;
  longlist_ready?: Milestone;
  shortlist_ready?: Milestone;
  client_presentation?: Milestone;
  first_interview?: Milestone;
  offer_extended?: Milestone;
  placement?: Milestone;
}

export const MILESTONE_LABELS: Record<string, string> = {
  intake_complete: 'Intake Complete',
  solution_defined: 'Solution Defined',
  jd_approved: 'JD Approved',
  market_defined: 'Market Defined',
  longlist_ready: 'Longlist Ready',
  shortlist_ready: 'Shortlist Ready',
  client_presentation: 'Client Presentation',
  first_interview: 'First Interview',
  offer_extended: 'Offer Extended',
  placement: 'Placement',
};

export const MILESTONE_ORDER = [
  'intake_complete',
  'solution_defined',
  'jd_approved',
  'market_defined',
  'longlist_ready',
  'shortlist_ready',
  'client_presentation',
  'first_interview',
  'offer_extended',
  'placement',
];

export const DEFAULT_SLA_DAYS: Record<string, number> = {
  intake_complete: 7,
  solution_defined: 14,
  jd_approved: 21,
  market_defined: 28,
  longlist_ready: 42,
  shortlist_ready: 56,
  client_presentation: 63,
  first_interview: 77,
  offer_extended: 98,
  placement: 112,
};

export function calculateMilestoneStatus(milestone: Milestone, today: Date = new Date()): MilestoneStatus {
  if (!milestone.target_date) return 'pending';

  if (milestone.actual_date) {
    return new Date(milestone.actual_date) <= new Date(milestone.target_date)
      ? 'completed'
      : 'completed_late';
  }

  const targetDate = new Date(milestone.target_date);
  const daysUntilDue = (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 7) return 'at_risk';
  return 'on_track';
}

export function getStatusColor(status: MilestoneStatus): { bg: string; border: string; text: string; icon: typeof Circle } {
  switch (status) {
    case 'completed':
      return { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700', icon: CheckCircle2 };
    case 'completed_late':
      return { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-700', icon: AlertTriangle };
    case 'at_risk':
      return { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700', icon: AlertTriangle };
    case 'overdue':
      return { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700', icon: AlertTriangle };
    case 'on_track':
      return { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700', icon: Circle };
    default:
      return { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-600', icon: Circle };
  }
}

export function getStatusLabel(status: MilestoneStatus): string {
  switch (status) {
    case 'completed': return 'Completed';
    case 'completed_late': return 'Completed Late';
    case 'at_risk': return 'At Risk';
    case 'overdue': return 'Overdue';
    case 'on_track': return 'On Track';
    default: return 'Pending';
  }
}

export interface TimelineViewProps {
  milestones: MandateMilestones;
  mandateCreatedAt: string;
  mandateTitle: string;
  onMilestoneClick?: (key: string) => void;
  onEditMilestone?: (key: string, milestone: Milestone) => void;
  readOnly?: boolean;
}

export function TimelineView({
  milestones,
  mandateCreatedAt,
  mandateTitle,
  onMilestoneClick,
  onEditMilestone,
  readOnly = false,
}: TimelineViewProps) {
  const today = useMemo(() => new Date(), []);

  const { dateRange, gridWeeks } = useMemo(() => {
    const createdDate = new Date(mandateCreatedAt);
    const todayDate = new Date();
    
    // Find the earliest target date and latest target date
    let earliestDate = createdDate;
    let latestDate = new Date(Math.max(
      createdDate.getTime() + 112 * 24 * 60 * 60 * 1000, // Default 112 days
      todayDate.getTime() + 30 * 24 * 60 * 60 * 1000 // At least 30 days in future
    ));

    MILESTONE_ORDER.forEach(key => {
      const milestone = milestones[key as keyof MandateMilestones];
      if (milestone?.target_date) {
        const targetDate = new Date(milestone.target_date);
        if (targetDate < earliestDate) earliestDate = targetDate;
        if (targetDate > latestDate) latestDate = targetDate;
      }
      if (milestone?.actual_date) {
        const actualDate = new Date(milestone.actual_date);
        if (actualDate > latestDate) latestDate = actualDate;
      }
    });

    // Add padding
    earliestDate.setDate(earliestDate.getDate() - 7);
    latestDate.setDate(latestDate.getDate() + 14);

    // Generate week markers
    const weeks: Array<{ date: Date; label: string }> = [];
    const currentWeek = new Date(earliestDate);
    currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay()); // Start from Sunday

    while (currentWeek <= latestDate) {
      weeks.push({
        date: new Date(currentWeek),
        label: currentWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
      currentWeek.setDate(currentWeek.getDate() + 7);
    }

    return {
      dateRange: { start: earliestDate, end: latestDate },
      gridWeeks: weeks,
    };
  }, [mandateCreatedAt, milestones]);

  const dayWidth = 20; // pixels per day
  const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
  const chartWidth = totalDays * dayWidth;

  const getPositionForDate = (dateStr: string | null): number => {
    if (!dateStr) return -1;
    const date = new Date(dateStr);
    const days = (date.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
    return days * dayWidth;
  };

  const todayPosition = getPositionForDate(today.toISOString());

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-card-border bg-bg-alt">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-accent" />
            <div>
              <h3 className="font-semibold text-text-primary">Engagement Timeline</h3>
              <p className="text-sm text-text-muted">{mandateTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>On Time</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Late</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>On Track</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>At Risk</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Overdue</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${chartWidth + 200}px` }}>
          {/* Week Headers */}
          <div className="flex border-b border-card-border bg-bg-alt" style={{ paddingLeft: '180px' }}>
            {gridWeeks.map((week, idx) => (
              <div
                key={idx}
                className="text-xs text-text-muted text-center py-2 border-l border-card-border"
                style={{ width: `${7 * dayWidth}px`, minWidth: `${7 * dayWidth}px` }}
              >
                {week.label}
              </div>
            ))}
          </div>

          {/* Milestone Rows */}
          <div className="relative">
            {/* Today Marker */}
            {todayPosition >= 0 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-accent z-10"
                style={{ left: `${180 + todayPosition}px` }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-accent text-white px-1 rounded">
                  Today
                </div>
              </div>
            )}

            {MILESTONE_ORDER.map((key) => {
              const milestone = milestones[key as keyof MandateMilestones];
              const computedStatus = milestone ? calculateMilestoneStatus(milestone, today) : 'pending';
              const statusColors = getStatusColor(computedStatus);
              const StatusIcon = statusColors.icon;
              const label = MILESTONE_LABELS[key];

              const startPos = milestone?.target_date ? getPositionForDate(milestone.target_date) : -1;
              const endPos = milestone?.actual_date
                ? getPositionForDate(milestone.actual_date)
                : todayPosition >= 0 ? todayPosition : startPos;

              return (
                <div
                  key={key}
                  className={`flex items-center border-b border-card-border hover:bg-bg-alt transition-colors ${readOnly ? '' : 'cursor-pointer'}`}
                  style={{ height: '48px' }}
                  onClick={() => !readOnly && onMilestoneClick?.(key)}
                >
                  {/* Milestone Label */}
                  <div className="flex items-center gap-2 px-4" style={{ width: '180px', minWidth: '180px' }}>
                    <StatusIcon className={`w-4 h-4 ${statusColors.text}`} />
                    <span className="text-sm font-medium text-text-primary">{label}</span>
                  </div>

                  {/* Timeline Bar */}
                  <div className="relative flex-1 h-full" style={{ minWidth: `${chartWidth}px` }}>
                    {/* Bar */}
                    {startPos >= 0 && (
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-full ${statusColors.bg} border-2 ${statusColors.border}`}
                        style={{
                          left: `${startPos}px`,
                          width: `${Math.max(endPos - startPos + dayWidth, 24)}px`,
                        }}
                      >
                        {/* Progress fill for completed */}
                        {milestone?.actual_date && (
                          <div
                            className="absolute inset-0 rounded-full bg-current opacity-20"
                            style={{
                              width: `${((new Date(milestone.actual_date).getTime() - new Date(milestone.target_date!).getTime()) / (1000 * 60 * 60 * 24) + 1) * 10}%`,
                            }}
                          />
                        )}
                      </div>
                    )}

                    {/* Target Date Marker */}
                    {startPos >= 0 && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-400 border border-white z-10"
                        style={{ left: `${startPos - 4}px` }}
                        title={`Target: ${milestone?.target_date}`}
                      />
                    )}

                    {/* Actual Date Marker */}
                    {milestone?.actual_date && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-green-600 border-2 border-white z-10"
                        style={{ left: `${endPos - 6}px` }}
                        title={`Actual: ${milestone.actual_date}`}
                      />
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="px-4" style={{ width: '100px' }}>
                    <Badge className={`${statusColors.bg} ${statusColors.text} text-xs`}>
                      {getStatusLabel(computedStatus)}
                    </Badge>
                  </div>

                  {/* Edit Button */}
                  {!readOnly && (
                    <div className="px-4" style={{ width: '60px' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditMilestone?.(key, milestone || { target_date: null, actual_date: null, status: 'pending', notes: '' });
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-card-border bg-bg-alt">
        <div className="flex items-center gap-6 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-100" />
            <span>On Time</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-yellow-500 bg-yellow-100" />
            <span>Completed Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-100" />
            <span>On Track</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-orange-500 bg-orange-100" />
            <span>At Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-100" />
            <span>Overdue</span>
          </div>
        </div>
      </div>
    </div>
  );
}