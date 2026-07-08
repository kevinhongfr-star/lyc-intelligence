import React, { useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Target,
  BarChart3
} from 'lucide-react';
import { Badge } from '@/components/ui';
import type { QualityOfHireMetrics } from '@/services/analytics/AnalyticsService';

export interface QualityOfHireChartProps {
  metrics: QualityOfHireMetrics;
}

export function QualityOfHireChart({ metrics }: QualityOfHireChartProps) {
  const {
    probationPassRate,
    probationPassed,
    probationFailed,
    probationPending,
    totalPlacements,
    avgMatchScore,
    retention6Month,
  } = metrics;

  // Donut chart data
  const donutData = useMemo(() => {
    const total = probationPassed + probationFailed;
    const passedAngle = total > 0 ? (probationPassed / total) * 360 : 0;
    const failedAngle = total > 0 ? (probationFailed / total) * 360 : 0;
    return { passedAngle, failedAngle };
  }, [probationPassed, probationFailed]);

  return (
    <div className="bg-card border border-card-border rounded-none overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-card-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <Award className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Quality of Hire</h2>
            <p className="text-sm text-text-muted">Post-placement performance metrics</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-bg-alt rounded-none text-center">
            <div className="text-2xl font-bold text-green-600">{probationPassRate}%</div>
            <div className="text-sm text-text-muted">Probation Pass Rate</div>
          </div>
          <div className="p-4 bg-bg-alt rounded-none text-center">
            <div className="text-2xl font-bold text-text-primary">{totalPlacements}</div>
            <div className="text-sm text-text-muted">Total Placements</div>
          </div>
          <div className="p-4 bg-bg-alt rounded-none text-center">
            <div className="text-2xl font-bold text-blue-600">{avgMatchScore}</div>
            <div className="text-sm text-text-muted">Avg Match Score</div>
          </div>
          <div className="p-4 bg-bg-alt rounded-none text-center">
            <div className="text-2xl font-bold text-purple-600">{retention6Month}%</div>
            <div className="text-sm text-text-muted">6-Month Retention</div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut Chart */}
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-text-primary mb-4">Probation Status</h3>
            <div className="relative w-48 h-48">
              {/* Donut Chart SVG */}
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Background */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="12"
                />
                {/* Failed (red) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="12"
                  strokeDasharray={`${donutData.failedAngle * 2.51} 251`}
                  strokeDashoffset="0"
                  className="transition-all duration-500"
                />
                {/* Passed (green) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="12"
                  strokeDasharray={`${donutData.passedAngle * 2.51} 251`}
                  strokeDashoffset={`${-donutData.failedAngle * 2.51}`}
                  className="transition-all duration-500"
                />
              </svg>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-text-primary">{probationPassRate}%</span>
                <span className="text-sm text-text-muted">Pass Rate</span>
              </div>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-text-muted">Passed ({probationPassed})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-text-muted">Failed ({probationFailed})</span>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div>
            <h3 className="font-semibold text-text-primary mb-4">Detailed Breakdown</h3>
            <div className="space-y-4">
              {/* Passed */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-none">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Probation Passed</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">{probationPassed}</span>
                </div>
                <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${totalPlacements > 0 ? (probationPassed / totalPlacements) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Failed */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-none">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-800">Probation Failed</span>
                  </div>
                  <span className="text-xl font-bold text-red-600">{probationFailed}</span>
                </div>
                <div className="h-2 bg-red-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${totalPlacements > 0 ? (probationFailed / totalPlacements) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Pending */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-none">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Pending Review</span>
                  </div>
                  <span className="text-xl font-bold text-yellow-600">{probationPending}</span>
                </div>
                <div className="h-2 bg-yellow-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                    style={{ width: `${totalPlacements > 0 ? (probationPending / totalPlacements) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-card-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">{avgMatchScore}</p>
              <p className="text-xs text-text-muted">Avg Match Score</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">{retention6Month}%</p>
              <p className="text-xs text-text-muted">6-Month Retention</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">{totalPlacements}</p>
              <p className="text-xs text-text-muted">Total Placements</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Quality Stats Cards
export function QualityStatsCards({ metrics }: { metrics: QualityOfHireMetrics }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-card border border-green-200 rounded-none p-4 bg-green-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{metrics.probationPassRate}%</p>
            <p className="text-sm text-green-700">Pass Rate</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-none p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{metrics.avgMatchScore}</p>
            <p className="text-sm text-text-muted">Avg Match Score</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-none p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{metrics.retention6Month}%</p>
            <p className="text-sm text-text-muted">6-Month Retention</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-none p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <Award className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{metrics.totalPlacements}</p>
            <p className="text-sm text-text-muted">Total Placed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
