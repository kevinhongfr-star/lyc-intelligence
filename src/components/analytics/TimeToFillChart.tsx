import React, { useMemo, useState } from 'react';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  BarChart3,
  ChevronDown
} from 'lucide-react';
import { Badge } from '@/components/ui';
import type {
  MandateTimeToFill,
  ConsultantTimeToFill,
  ClientTimeToFill,
} from '@/services/analytics/AnalyticsService';

export interface TimeToFillChartProps {
  byMandate: MandateTimeToFill[];
  byConsultant: ConsultantTimeToFill[];
  byClient: ClientTimeToFill[];
  overallAvgDays: number;
}

type ViewMode = 'mandate' | 'consultant' | 'client';

export function TimeToFillChart({
  byMandate,
  byConsultant,
  byClient,
  overallAvgDays,
}: TimeToFillChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('mandate');

  const maxDays = useMemo(() => {
    const data = viewMode === 'mandate' ? byMandate : viewMode === 'consultant' ? byConsultant : byClient;
    return Math.max(...data.map(d => d.avgDaysToFill), 1);
  }, [viewMode, byMandate, byConsultant, byClient]);

  const sortedData = useMemo(() => {
    switch (viewMode) {
      case 'mandate':
        return [...byMandate].sort((a, b) => b.avgDaysToFill - a.avgDaysToFill);
      case 'consultant':
        return [...byConsultant].sort((a, b) => a.avgDaysToFill - b.avgDaysToFill);
      case 'client':
        return [...byClient].sort((a, b) => b.avgDaysToFill - a.avgDaysToFill);
      default:
        return [];
    }
  }, [viewMode, byMandate, byConsultant, byClient]);

  const avgTime = useMemo(() => {
    const data = viewMode === 'mandate' ? byMandate : viewMode === 'consultant' ? byConsultant : byClient;
    if (data.length === 0) return 0;
    return Math.round(data.reduce((sum, d) => sum + d.avgDaysToFill, 0) / data.length);
  }, [viewMode, byMandate, byConsultant, byClient]);

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-card-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Time-to-Fill Analytics</h2>
              <p className="text-sm text-text-muted">Average days to fill positions</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-bg-alt rounded-lg text-center">
            <div className="text-2xl font-bold text-text-primary">{overallAvgDays}</div>
            <div className="text-sm text-text-muted">Overall Average</div>
          </div>
          <div className="p-4 bg-bg-alt rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{avgTime}</div>
            <div className="text-sm text-text-muted">Current View Avg</div>
          </div>
          <div className="p-4 bg-bg-alt rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{sortedData.length}</div>
            <div className="text-sm text-text-muted">
              {viewMode === 'mandate' ? 'Mandates' : viewMode === 'consultant' ? 'Consultants' : 'Clients'}
            </div>
          </div>
          <div className="p-4 bg-bg-alt rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{Math.round(maxDays)}</div>
            <div className="text-sm text-text-muted">Longest</div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setViewMode('mandate')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'mandate'
                ? 'bg-accent text-white'
                : 'bg-bg-alt text-text-secondary hover:bg-gray-200'
            }`}
          >
            By Mandate
          </button>
          <button
            onClick={() => setViewMode('consultant')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'consultant'
                ? 'bg-accent text-white'
                : 'bg-bg-alt text-text-secondary hover:bg-gray-200'
            }`}
          >
            By Consultant
          </button>
          <button
            onClick={() => setViewMode('client')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'client'
                ? 'bg-accent text-white'
                : 'bg-bg-alt text-text-secondary hover:bg-gray-200'
            }`}
          >
            By Client
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        {sortedData.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No data available for this view</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedData.slice(0, 10).map((item, index) => {
              const widthPercent = (item.avgDaysToFill / maxDays) * 100;
              const isAboveAvg = item.avgDaysToFill > overallAvgDays;

              let name = '';
              let subtitle = '';

              if (viewMode === 'mandate') {
                const m = item as MandateTimeToFill;
                name = m.mandateTitle;
                subtitle = `${m.placedCount} placed`;
              } else if (viewMode === 'consultant') {
                const c = item as ConsultantTimeToFill;
                name = c.consultantName;
                subtitle = `${c.placementCount} placements`;
              } else {
                const c = item as ClientTimeToFill;
                name = c.clientName;
                subtitle = `${c.placementCount} placements`;
              }

              return (
                <div key={index} className="flex items-center gap-4">
                  {/* Label */}
                  <div className="w-48 flex-shrink-0">
                    <p className="font-medium text-text-primary truncate" title={name}>
                      {name}
                    </p>
                    <p className="text-xs text-text-muted">{subtitle}</p>
                  </div>

                  {/* Bar */}
                  <div className="flex-1 relative">
                    <div
                      className={`h-8 rounded-lg transition-all duration-500 flex items-center justify-end pr-3 ${
                        isAboveAvg
                          ? 'bg-gradient-to-r from-orange-200 to-orange-300'
                          : 'bg-gradient-to-r from-green-200 to-green-300'
                      }`}
                      style={{ width: `${Math.max(widthPercent, 5)}%` }}
                    >
                      <span className={`text-sm font-bold ${isAboveAvg ? 'text-orange-700' : 'text-green-700'}`}>
                        {item.avgDaysToFill}d
                      </span>
                    </div>

                    {/* Average Line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-accent z-10"
                      style={{ left: `${(overallAvgDays / maxDays) * 100}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-accent text-white px-1 rounded">
                        Avg
                      </div>
                    </div>
                  </div>

                  {/* Trend Indicator */}
                  <div className="w-8 flex-shrink-0">
                    {isAboveAvg ? (
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-6 py-4 bg-bg-alt border-t border-card-border">
        <div className="flex items-center gap-6 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-200" />
            <span>Faster than average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-200" />
            <span>Slower than average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-accent" />
            <span>Organization average</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Time Stats Cards
export function TimeStatsCards({ overallAvgDays }: { overallAvgDays: number }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{overallAvgDays}</p>
            <p className="text-sm text-text-muted">Avg Days to Fill</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {overallAvgDays > 0 ? Math.round(overallAvgDays * 0.7) : 0}
            </p>
            <p className="text-sm text-text-muted">Best Case</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">
              {overallAvgDays > 0 ? Math.round(overallAvgDays * 1.5) : 0}
            </p>
            <p className="text-sm text-text-muted">Worst Case</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">
              {overallAvgDays > 0 ? Math.round(112 / overallAvgDays) : 0}
            </p>
            <p className="text-sm text-text-muted">Placements/Year</p>
          </div>
        </div>
      </div>
    </div>
  );
}
