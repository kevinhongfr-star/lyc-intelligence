import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Award,
  Users,
  Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui';

export interface StageAnalytics {
  stage: string;
  label: string;
  avgDays: number;
  minDays: number;
  maxDays: number;
  count: number;
}

export interface ConsultantAnalytics {
  consultantId: string;
  consultantName: string;
  avgDaysToShortlist: number;
  avgDaysToPlacement: number;
  placementsCount: number;
}

export interface TimelineAnalyticsProps {
  stageAnalytics: StageAnalytics[];
  consultantAnalytics: ConsultantAnalytics[];
  totalMandates: number;
  completedMandates: number;
  onStageClick?: (stage: string) => void;
}

export function TimelineAnalytics({
  stageAnalytics,
  consultantAnalytics,
  totalMandates,
  completedMandates,
  onStageClick,
}: TimelineAnalyticsProps) {
  const overallStats = useMemo(() => {
    if (stageAnalytics.length === 0) {
      return {
        avgDaysToShortlist: 0,
        avgDaysToPlacement: 0,
        fastestPlacement: 0,
        avgTimePerStage: 0,
      };
    }

    const shortlistStage = stageAnalytics.find(s => s.stage === 'shortlist_ready');
    const placementStage = stageAnalytics.find(s => s.stage === 'placement');

    const avgDaysToShortlist = shortlistStage?.avgDays || 0;
    const avgDaysToPlacement = placementStage?.avgDays || 0;
    const fastestPlacement = placementStage?.minDays || 0;

    const avgTimePerStage = stageAnalytics.length > 0
      ? Math.round(stageAnalytics.reduce((sum, s) => sum + s.avgDays, 0) / stageAnalytics.length)
      : 0;

    return {
      avgDaysToShortlist,
      avgDaysToPlacement,
      fastestPlacement,
      avgTimePerStage,
    };
  }, [stageAnalytics]);

  const maxDays = useMemo(() => {
    return Math.max(...stageAnalytics.map(s => s.maxDays), 1);
  }, [stageAnalytics]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-card-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Avg Time to Shortlist</p>
              <p className="text-2xl font-bold text-text-primary">{overallStats.avgDaysToShortlist}</p>
            </div>
          </div>
          <p className="text-xs text-text-muted">days from mandate start</p>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Avg Time to Placement</p>
              <p className="text-2xl font-bold text-text-primary">{overallStats.avgDaysToPlacement}</p>
            </div>
          </div>
          <p className="text-xs text-text-muted">days from mandate start</p>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Fastest Placement</p>
              <p className="text-2xl font-bold text-green-600">{overallStats.fastestPlacement}</p>
            </div>
          </div>
          <p className="text-xs text-text-muted">days (best case)</p>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Avg Time Per Stage</p>
              <p className="text-2xl font-bold text-text-primary">{overallStats.avgTimePerStage}</p>
            </div>
          </div>
          <p className="text-xs text-text-muted">days per milestone</p>
        </div>
      </div>

      {/* Stage Analytics Chart */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            Time Per Stage Analysis
          </h3>
          <Badge variant="default">
            {completedMandates} / {totalMandates} Mandates Completed
          </Badge>
        </div>

        <div className="space-y-4">
          {stageAnalytics.map((stage) => {
            const avgWidth = (stage.avgDays / maxDays) * 100;
            const minWidth = (stage.minDays / maxDays) * 100;
            const maxWidth = (stage.maxDays / maxDays) * 100;

            return (
              <div
                key={stage.stage}
                className="cursor-pointer hover:bg-bg-alt rounded-lg p-3 -mx-3 transition-colors"
                onClick={() => onStageClick?.(stage.stage)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-text-primary">{stage.label}</span>
                  <div className="flex items-center gap-4 text-sm text-text-muted">
                    <span>
                      Avg: <span className="font-semibold text-text-primary">{stage.avgDays}d</span>
                    </span>
                    <span>
                      Range: <span className="font-semibold text-text-primary">{stage.minDays}-{stage.maxDays}d</span>
                    </span>
                    <span>
                      ({stage.count} samples)
                    </span>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="relative">
                  {/* Min-Max Range */}
                  <div
                    className="absolute h-3 bg-gray-200 rounded-full"
                    style={{ width: `${maxWidth}%`, left: `${minWidth}%` }}
                  />
                  {/* Average Bar */}
                  <div
                    className="relative h-3 bg-gradient-to-r from-accent to-accent/70 rounded-full"
                    style={{ width: `${avgWidth}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent border-2 border-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {stageAnalytics.length === 0 && (
          <div className="text-center py-8 text-text-muted">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No completed mandates yet to analyze</p>
            <p className="text-sm">Stage analytics will appear once mandates are completed</p>
          </div>
        )}
      </div>

      {/* Consultant Breakdown */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <h3 className="font-semibold text-text-primary flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-accent" />
          Consultant Performance
        </h3>

        <div className="space-y-4">
          {consultantAnalytics
            .sort((a, b) => a.avgDaysToPlacement - b.avgDaysToPlacement)
            .map((consultant, idx) => (
              <div
                key={consultant.consultantId}
                className="flex items-center gap-4 p-4 bg-bg-alt rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{consultant.consultantName}</p>
                  <p className="text-sm text-text-muted">
                    {consultant.placementsCount} placement{consultant.placementsCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text-muted">Avg to Placement</p>
                  <p className="text-lg font-bold text-green-600">{consultant.avgDaysToPlacement}d</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text-muted">Avg to Shortlist</p>
                  <p className="text-lg font-bold text-blue-600">{consultant.avgDaysToShortlist}d</p>
                </div>
                {idx === 0 && (
                  <Badge className="bg-yellow-100 text-yellow-700">
                    <Award className="w-3 h-3 mr-1" />
                    Best
                  </Badge>
                )}
              </div>
            ))}
        </div>

        {consultantAnalytics.length === 0 && (
          <div className="text-center py-8 text-text-muted">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No consultant data available</p>
          </div>
        )}
      </div>
    </div>
  );
}