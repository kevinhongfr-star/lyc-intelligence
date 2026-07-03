// Phase 2.8: BD Pipeline Metrics Component
'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Target,
  Users,
  ArrowRight,
  Percent,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { STAGE_LABELS, STAGE_ORDER } from '@/types/bd';
import { cn } from '@/lib/utils';

interface PipelineMetricsProps {
  orgId: string;
  period?: 'all' | 'week' | 'month' | 'quarter';
}

interface MetricsData {
  funnel: {
    new_prospects: number;
    qualified: number;
    proposals_sent: number;
    pitches_delivered: number;
    signed: number;
    lost: number;
  };
  conversion_rates: {
    prospect_to_qualified_pct: number;
    qualified_to_signed_pct: number;
    overall_win_rate_pct: number;
  };
  value: {
    total_pipeline_value: number;
    signed_value: number;
    avg_deal_size: number;
  };
  stage_counts: Record<string, number>;
  total_opportunities: number;
}

export function PipelineMetrics({ orgId, period = 'all' }: PipelineMetricsProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [orgId, period]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(
        `/api/bd/metrics?org_id=${orgId}&period=${period}`
      );
      const result = await response.json();
      if (result.success) {
        setMetrics(result.data.current);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'CNY',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-text-muted">Loading metrics...</div>
      </Card>
    );
  }

  if (!metrics) return null;

  const activeStages = STAGE_ORDER.filter((s) => s !== 'signed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-accent" />
        <h2 className="font-serif font-semibold text-lg text-text-primary">
          Pipeline Metrics
        </h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">Pipeline Value</span>
            <DollarSign className="w-5 h-5 text-accent" />
          </div>
          <div className="font-serif font-bold text-2xl text-text-primary">
            {formatCurrency(metrics.value.total_pipeline_value)}
          </div>
          <div className="text-xs text-text-muted mt-1">
            {metrics.total_opportunities} opportunities
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">Win Rate</span>
            <Target className="w-5 h-5 text-tier-1" />
          </div>
          <div className="font-serif font-bold text-2xl text-text-primary">
            {metrics.conversion_rates.overall_win_rate_pct}%
          </div>
          <div className="text-xs text-text-muted mt-1">
            {metrics.funnel.signed} signed / {metrics.funnel.lost} lost
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">Avg Deal Size</span>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div className="font-serif font-bold text-2xl text-text-primary">
            {formatCurrency(metrics.value.avg_deal_size)}
          </div>
          <div className="text-xs text-text-muted mt-1">
            Based on signed deals
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">Signed Value</span>
            <Percent className="w-5 h-5 text-purple-500" />
          </div>
          <div className="font-serif font-bold text-2xl text-text-primary">
            {formatCurrency(metrics.value.signed_value)}
          </div>
          <div className="text-xs text-text-muted mt-1">
            {metrics.funnel.signed} closed deals
          </div>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card className="p-5">
        <h3 className="font-medium text-text-primary mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-accent" />
          Conversion Funnel
        </h3>

        <div className="space-y-3">
          {[
            { label: 'Prospects', count: metrics.stage_counts.prospect, pct: 100, color: 'bg-gray-400' },
            { label: 'Qualified', count: metrics.stage_counts.qualified, pct: metrics.conversion_rates.prospect_to_qualified_pct, color: 'bg-blue-400' },
            { label: 'Proposals', count: metrics.stage_counts.proposal_sent, pct: null, color: 'bg-amber-400' },
            { label: 'Pitches', count: metrics.stage_counts.pitch_delivered, pct: null, color: 'bg-purple-400' },
            { label: 'Negotiations', count: metrics.stage_counts.negotiate, pct: null, color: 'bg-pink-400' },
            { label: 'Signed', count: metrics.stage_counts.signed, pct: metrics.conversion_rates.qualified_to_signed_pct, color: 'bg-tier-1' },
          ].map((item, index) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-28 text-sm text-text-muted text-right">
                {item.label}
              </div>
              <div className="flex-1">
                <div className="h-8 bg-bg-secondary rounded-lg overflow-hidden flex items-center">
                  <div
                    className={cn(item.color, 'h-full rounded-lg flex items-center justify-end pr-2')}
                    style={{ width: `${Math.max((item.count / Math.max(metrics.total_opportunities, 1)) * 100, 5)}%` }}
                  >
                    <span className="text-xs font-medium text-white">
                      {item.count}
                    </span>
                  </div>
                </div>
              </div>
              {item.pct !== null && index > 0 && (
                <div className="w-16 text-xs text-text-muted flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" />
                  {item.pct}%
                </div>
              )}
              {index === 0 && <div className="w-16" />}
            </div>
          ))}
        </div>

        {/* Conversion Rates Summary */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-bg-hover">
          <div className="text-center">
            <div className="font-serif font-bold text-xl text-text-primary">
              {metrics.conversion_rates.prospect_to_qualified_pct}%
            </div>
            <div className="text-xs text-text-muted">
              Prospect → Qualified
            </div>
          </div>
          <div className="text-center">
            <div className="font-serif font-bold text-xl text-text-primary">
              {metrics.conversion_rates.qualified_to_signed_pct}%
            </div>
            <div className="text-xs text-text-muted">
              Qualified → Signed
            </div>
          </div>
          <div className="text-center">
            <div className="font-serif font-bold text-xl text-tier-1">
              {metrics.conversion_rates.overall_win_rate_pct}%
            </div>
            <div className="text-xs text-text-muted">
              Overall Win Rate
            </div>
          </div>
        </div>
      </Card>

      {/* Stage Breakdown */}
      <div className="grid grid-cols-6 gap-3">
        {activeStages.map((stage) => (
          <Card key={stage} className="p-4 text-center">
            <div className="text-xs text-text-muted mb-1">
              {STAGE_LABELS[stage]}
            </div>
            <div className="font-serif font-bold text-xl text-text-primary">
              {metrics.stage_counts[stage] || 0}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default PipelineMetrics;
