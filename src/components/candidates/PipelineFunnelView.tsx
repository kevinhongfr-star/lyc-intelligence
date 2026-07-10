// PipelineFunnelView.tsx — DEX Candidate Tracking (Technical Blueprint 01)
// Visual 19-stage pipeline funnel with quality metrics

'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Badge } from '@/components/ui';

interface FunnelData {
  funnel: Record<string, number>;
  summary: {
    active_pipeline: number;
    dead: number;
    upstream: number;
  };
}

interface MetricsData {
  quality_ratio: number;
  quality_ratio_status: string;
  contact_to_response_rate: number;
  stale_count: {
    S3_stale_over_5_days: number;
    S7_stale_over_10_days: number;
  };
  motivation_accuracy: {
    green_positive_response_rate: number;
    screen_effective: boolean;
  };
  total_mapped: number;
  viable_pool: number;
}

const STAGE_ORDER = ['GRID', 'LENS', 'SWEEP', 'CANVA', 'PLACED'];

const STAGE_SHORT_LABELS: Record<string, string> = {
  S1_Sourced: 'S1',
  S2_Screened: 'S2',
  S3_Contacted: 'S3',
  S4_No_Response: 'S4',
  S5_Responded: 'S5',
  S6_WeChat_Added: 'S6',
  S7_Interested: 'S7',
  S8_Not_Interested: 'S8',
  S9_Call_Positive: 'S9',
  S10_Call_Negative: 'S10',
  S11_Internal_Interview: 'S11',
  S12_Presented_to_Client: 'S12',
  S13_Client_Int_Scheduled: 'S13',
  S14_Client_Interviewed: 'S14',
  S15_Client_2nd_Interview: 'S15',
  S16_Offer_Extended: 'S16',
  S17_Offer_Accepted: 'S17',
  S18_Offer_Declined: 'S18',
  S19_Closed: 'S19',
};

const STAGE_COLORS: Record<string, string> = {
  GRID: 'bg-blue-100 text-blue-700', LENS: 'bg-indigo-100 text-indigo-700',
  SWEEP: 'bg-yellow-100 text-yellow-700', CANVA: 'bg-purple-100 text-purple-700',
  PLACED: 'bg-green-200 text-green-800',
};

export function PipelineFunnelView() {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch funnel
        const funnelRes = await fetch('/api/candidates/pipeline/funnel');
        const funnelJson = await funnelRes.json();
        if (funnelJson.success) {
          setFunnelData(funnelJson.data);
        }

        // Fetch metrics
        const metricsRes = await fetch('/api/candidates/pipeline/metrics');
        const metricsJson = await metricsRes.json();
        if (metricsJson.success) {
          setMetricsData(metricsJson.data);
        }
      } catch (e) {
        setError('Failed to load pipeline data');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-text-secondary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">{error}</div>
    );
  }

  const funnel = funnelData?.funnel || {};
  const summary = funnelData?.summary || { active_pipeline: 0, dead: 0, upstream: 0 };

  // Calculate max for scaling
  const maxCount = Math.max(...Object.values(funnel), 1);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-text-secondary">Total Mapped</div>
          <div className="text-2xl font-semibold text-text-primary mt-1">
            {metricsData?.total_mapped || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-text-secondary">Viable Pool</div>
          <div className="text-2xl font-semibold text-green-600 mt-1">
            {metricsData?.viable_pool || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-text-secondary">Active Pipeline</div>
          <div className="text-2xl font-semibold text-blue-600 mt-1">
            {summary.active_pipeline}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-text-secondary">Quality Ratio</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-semibold text-text-primary">
              {(metricsData?.quality_ratio || 0) * 100}%
            </span>
            {metricsData?.quality_ratio_status === 'healthy' ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            )}
          </div>
        </Card>
      </div>

      {/* Quality Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Quality Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-text-secondary">Contact → Response</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-semibold">
                  {(metricsData?.contact_to_response_rate || 0) * 100}%
                </span>
                <Badge variant={metricsData?.contact_to_response_rate >= 0.4 ? 'success' : 'warning'}>
                  {metricsData?.contact_to_response_rate >= 0.4 ? 'Healthy' : 'Low'}
                </Badge>
              </div>
            </div>
            <div>
              <div className="text-sm text-text-secondary">GREEN Positive Rate</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-semibold">
                  {(metricsData?.motivation_accuracy?.green_positive_response_rate || 0) * 100}%
                </span>
                <Badge variant={metricsData?.motivation_accuracy?.screen_effective ? 'success' : 'warning'}>
                  {metricsData?.motivation_accuracy?.screen_effective ? 'Effective' : 'Review'}
                </Badge>
              </div>
            </div>
            <div>
              <div className="text-sm text-text-secondary">Stale Alerts</div>
              <div className="mt-1">
                {(metricsData?.stale_count?.S3_stale_over_5_days || 0) > 0 && (
                  <Badge variant="warning" className="mr-2">
                    S3: {metricsData?.stale_count?.S3_stale_over_5_days} stale
                  </Badge>
                )}
                {(metricsData?.stale_count?.S7_stale_over_10_days || 0) > 0 && (
                  <Badge variant="warning">
                    S7: {metricsData?.stale_count?.S7_stale_over_10_days} stale
                  </Badge>
                )}
                {!metricsData?.stale_count?.S3_stale_over_5_days && !metricsData?.stale_count?.S7_stale_over_10_days && (
                  <Badge variant="success">No stale</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Funnel Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            19-Stage Pipeline Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {STAGE_ORDER.map((stage) => {
              const count = funnel[stage] || 0;
              const widthPercent = (count / maxCount) * 100;
              const color = STAGE_COLORS[stage] || 'bg-gray-400';

              // Determine stage category for visual grouping
              let categoryLabel = '';
              if (stage === 'S1_Sourced' || stage === 'S2_Screened') {
                categoryLabel = 'Upstream';
              } else if (stage === 'S8_Not_Interested' || stage === 'S10_Call_Negative' || stage === 'S18_Offer_Declined') {
                categoryLabel = 'Dead';
              } else if (stage === 'S19_Closed') {
                categoryLabel = 'Closed';
              }

              return (
                <div key={stage} className="flex items-center gap-2">
                  {/* Stage label */}
                  <div className="w-12 text-xs font-medium text-text-secondary">
                    {STAGE_SHORT_LABELS[stage]}
                  </div>

                  {/* Bar */}
                  <div className="flex-1 h-6 bg-gray-100 rounded relative">
                    <div
                      className={`h-full rounded ${color} transition-all`}
                      style={{ width: `${widthPercent}%` }}
                    />
                    {/* Count label */}
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {count > 0 && (
                        <span className={widthPercent > 30 ? 'text-white' : 'text-text-primary'}>
                          {count}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category label */}
                  <div className="w-16 text-xs text-text-secondary">
                    {categoryLabel}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-text-secondary">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-400" />
              <span>Upstream</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-400" />
              <span>Dead</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-cyan-400" />
              <span>Client Phase</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}