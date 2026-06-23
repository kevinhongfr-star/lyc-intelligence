import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Users,
  Target,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui';
import type { FunnelStage } from '@/services/analytics/AnalyticsService';

export interface FunnelChartProps {
  stages: FunnelStage[];
  bottleneck: FunnelStage | null;
  totalCandidates: number;
  totalPlaced: number;
  overallConversion: number;
}

export function FunnelChart({
  stages,
  bottleneck,
  totalCandidates,
  totalPlaced,
  overallConversion,
}: FunnelChartProps) {
  const maxCount = useMemo(() => {
    return Math.max(...stages.map(s => s.count), 1);
  }, [stages]);

  const avgConversion = useMemo(() => {
    const conversions = stages.filter(s => s.conversionRate > 0 && s.conversionRate < 100);
    if (conversions.length === 0) return 0;
    return Math.round(conversions.reduce((sum, s) => sum + s.conversionRate, 0) / conversions.length);
  }, [stages]);

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-card-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Candidate Funnel</h2>
              <p className="text-sm text-text-muted">Conversion rates by pipeline stage</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-bg-alt rounded-lg text-center">
            <div className="text-2xl font-bold text-text-primary">{totalCandidates}</div>
            <div className="text-sm text-text-muted">Total Candidates</div>
          </div>
          <div className="p-4 bg-bg-alt rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{totalPlaced}</div>
            <div className="text-sm text-text-muted">Total Placed</div>
          </div>
          <div className="p-4 bg-bg-alt rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{overallConversion}%</div>
            <div className="text-sm text-text-muted">Overall Conversion</div>
          </div>
          <div className="p-4 bg-bg-alt rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{avgConversion}%</div>
            <div className="text-sm text-text-muted">Avg Stage Conversion</div>
          </div>
        </div>
      </div>

      {/* Bottleneck Alert */}
      {bottleneck && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">
                Bottleneck Identified: {bottleneck.label}
              </p>
              <p className="text-sm text-red-600">
                Only {bottleneck.conversionRate}% of candidates convert at this stage
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Funnel Visualization */}
      <div className="p-6">
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const widthPercent = Math.max((stage.count / maxCount) * 100, 5);
            const isBottleneck = stage.isBottleneck;
            const showConversion = index > 0 && stage.conversionRate > 0;

            return (
              <div key={stage.stage} className="relative">
                {/* Stage Row */}
                <div className="flex items-center gap-4">
                  {/* Stage Label */}
                  <div className="w-32 flex-shrink-0">
                    <span className={`font-medium ${isBottleneck ? 'text-red-600' : 'text-text-primary'}`}>
                      {stage.label}
                    </span>
                  </div>

                  {/* Funnel Bar */}
                  <div className="flex-1 relative">
                    <div
                      className={`h-10 rounded-lg transition-all duration-500 flex items-center justify-end pr-4 ${
                        isBottleneck
                          ? 'bg-gradient-to-r from-red-200 to-red-300 border-2 border-red-400'
                          : stage.count === 0
                          ? 'bg-gray-100'
                          : 'bg-gradient-to-r from-accent/30 to-accent border border-accent/30'
                      }`}
                      style={{ width: `${widthPercent}%` }}
                    >
                      <span className={`font-bold text-sm ${isBottleneck ? 'text-red-700' : 'text-text-primary'}`}>
                        {stage.count}
                      </span>
                    </div>
                  </div>

                  {/* Conversion Rate */}
                  <div className="w-24 flex-shrink-0 text-right">
                    {showConversion ? (
                      <Badge
                        className={
                          stage.conversionRate >= 70
                            ? 'bg-green-100 text-green-700'
                            : stage.conversionRate >= 40
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }
                      >
                        {stage.conversionRate}%
                      </Badge>
                    ) : (
                      <span className="text-text-muted text-sm">—</span>
                    )}
                  </div>
                </div>

                {/* Conversion Arrow */}
                {showConversion && (
                  <div className="flex items-center ml-36 mt-1">
                    <div className="flex-1 h-6 flex items-center">
                      <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-gray-300 mx-auto" />
                    </div>
                    <span className={`text-xs px-2 ${stage.conversionRate < 50 ? 'text-red-500' : 'text-text-muted'}`}>
                      {stage.conversionRate >= 50 ? (
                        <TrendingDown className="w-3 h-3 inline" />
                      ) : (
                        <TrendingUp className="w-3 h-3 inline" />
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 bg-bg-alt border-t border-card-border">
        <div className="flex items-center gap-6 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-accent/30 border border-accent/30" />
            <span>Normal flow</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-200 border-2 border-red-400" />
            <span>Bottleneck ({bottleneck?.conversionRate}% conversion)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simplified Funnel Stats Card
export function FunnelStatsCards({
  totalCandidates,
  totalPlaced,
  overallConversion,
}: {
  totalCandidates: number;
  totalPlaced: number;
  overallConversion: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{totalCandidates}</p>
            <p className="text-sm text-text-muted">Total Candidates</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{totalPlaced}</p>
            <p className="text-sm text-text-muted">Total Placed</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Target className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">{overallConversion}%</p>
            <p className="text-sm text-text-muted">Conversion Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}
