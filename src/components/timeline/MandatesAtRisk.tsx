import React, { useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus,
  Loader2
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { MandateMilestones, MILESTONE_LABELS, MILESTONE_ORDER, calculateMilestoneStatus, MilestoneStatus } from './TimelineView';

export interface AtRiskMandate {
  mandateId: string;
  mandateTitle: string;
  clientName: string;
  milestones: MandateMilestones;
  urgency: number; // Lower = more urgent (more overdue)
}

export interface MandatesAtRiskProps {
  mandates: AtRiskMandate[];
  loading?: boolean;
  onMandateClick?: (mandateId: string) => void;
  onViewAll?: () => void;
}

function getUrgencyScore(milestones: MandateMilestones): number {
  let lowestScore = Infinity;
  const today = new Date();

  MILESTONE_ORDER.forEach((key) => {
    const milestone = milestones[key as keyof MandateMilestones];
    if (!milestone || milestone.actual_date) return;

    const status = calculateMilestoneStatus(milestone, today);
    if (status === 'overdue') {
      const daysOverdue = Math.ceil((today.getTime() - new Date(milestone.target_date!).getTime()) / (1000 * 60 * 60 * 24));
      lowestScore = Math.min(lowestScore, -daysOverdue); // Negative = overdue, more negative = more urgent
    } else if (status === 'at_risk') {
      const daysUntil = Math.ceil((new Date(milestone.target_date!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      lowestScore = Math.min(lowestScore, daysUntil); // Low positive = urgent
    }
  });

  return lowestScore === Infinity ? 999 : lowestScore;
}

function getRiskMilestone(milestones: MandateMilestones): { key: string; label: string; status: MilestoneStatus; daysUntilDue: number } | null {
  const today = new Date();
  let mostUrgent: { key: string; label: string; status: MilestoneStatus; daysUntilDue: number } | null = null;

  MILESTONE_ORDER.forEach((key) => {
    const milestone = milestones[key as keyof MandateMilestones];
    if (!milestone || milestone.actual_date) return;

    const status = calculateMilestoneStatus(milestone, today);
    if (status !== 'on_track' && status !== 'completed') {
      const daysUntilDue = Math.ceil((new Date(milestone.target_date!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const urgency = status === 'overdue' ? -1000 - daysUntilDue : daysUntilDue;

      if (!mostUrgent || urgency < (mostUrgent.status === 'overdue' ? -1000 - mostUrgent.daysUntilDue : mostUrgent.daysUntilDue)) {
        mostUrgent = { key, label: MILESTONE_LABELS[key], status, daysUntilDue };
      }
    }
  });

  return mostUrgent;
}

export function MandatesAtRisk({ mandates, loading, onMandateClick, onViewAll }: MandatesAtRiskProps) {
  const sortedMandates = useMemo(() => {
    return [...mandates].sort((a, b) => {
      const scoreA = getUrgencyScore(a.milestones);
      const scoreB = getUrgencyScore(b.milestones);
      return scoreA - scoreB; // Lower score = more urgent
    });
  }, [mandates]);

  const stats = useMemo(() => {
    const atRisk = mandates.filter(m => {
      const milestone = getRiskMilestone(m.milestones);
      return milestone?.status === 'at_risk';
    }).length;
    const overdue = mandates.filter(m => {
      const milestone = getRiskMilestone(m.milestones);
      return milestone?.status === 'overdue';
    }).length;
    const onTrack = mandates.length - atRisk - overdue;
    
    return { atRisk, overdue, onTrack, total: mandates.length };
  }, [mandates]);

  if (loading) {
    return (
      <div className="bg-card border border-card-border rounded-none p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-card-border rounded-none overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-card-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              stats.overdue > 0 ? 'bg-red-100' : stats.atRisk > 0 ? 'bg-orange-100' : 'bg-green-100'
            }`}>
              {stats.overdue > 0 ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : stats.atRisk > 0 ? (
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              ) : (
                <TrendingUp className="w-5 h-5 text-green-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Mandates at Risk</h3>
              <p className="text-sm text-text-muted">
                {stats.total > 0
                  ? `${stats.onTrack}/${stats.total} on track`
                  : 'No active mandates'
                }
              </p>
            </div>
          </div>
          {onViewAll && mandates.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Stats Pills */}
        {stats.total > 0 && (
          <div className="flex items-center gap-2 mt-4">
            <Badge className="bg-green-100 text-green-700">
              <ArrowUp className="w-3 h-3 mr-1" />
              {stats.onTrack} On Track
            </Badge>
            <Badge className="bg-orange-100 text-orange-700">
              <Minus className="w-3 h-3 mr-1" />
              {stats.atRisk} At Risk
            </Badge>
            <Badge className="bg-red-100 text-red-700">
              <ArrowDown className="w-3 h-3 mr-1" />
              {stats.overdue} Overdue
            </Badge>
          </div>
        )}
      </div>

      {/* Mandate List */}
      <div className="divide-y divide-card-border max-h-96 overflow-y-auto">
        {sortedMandates.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-text-primary font-medium">All mandates on track!</p>
            <p className="text-sm text-text-muted mt-1">
              No mandates currently at risk or overdue
            </p>
          </div>
        ) : (
          sortedMandates.map((mandate) => {
            const riskMilestone = getRiskMilestone(mandate.milestones);
            const isOverdue = riskMilestone?.status === 'overdue';
            const isAtRisk = riskMilestone?.status === 'at_risk';

            return (
              <div
                key={mandate.mandateId}
                className="p-4 hover:bg-bg-alt cursor-pointer transition-colors"
                onClick={() => onMandateClick?.(mandate.mandateId)}
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isOverdue ? 'bg-red-100' : 'bg-orange-100'
                  }`}>
                    {isOverdue ? (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">
                      {mandate.mandateTitle}
                    </p>
                    <p className="text-sm text-text-muted truncate">
                      {mandate.clientName}
                    </p>
                    {riskMilestone && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          className={`text-xs ${
                            isOverdue
                              ? 'bg-red-100 text-red-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {riskMilestone.label}
                        </Badge>
                        <span className={`text-xs font-medium ${
                          isOverdue ? 'text-red-600' : 'text-orange-600'
                        }`}>
                          {isOverdue
                            ? `${Math.abs(riskMilestone.daysUntilDue)}d overdue`
                            : `${riskMilestone.daysUntilDue}d left`
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-text-muted flex-shrink-0" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {stats.total > 0 && (
        <div className="p-3 border-t border-card-border bg-bg-alt">
          <p className="text-xs text-text-muted text-center">
            Sorted by urgency · Most critical at top
          </p>
        </div>
      )}
    </div>
  );
}