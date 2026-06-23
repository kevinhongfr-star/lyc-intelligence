// Phase 3.8: Compensation Benchmark Card Component
'use client';

import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Target,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  CONFIDENCE_LABELS,
  CONFIDENCE_COLORS,
} from '@/types/compensation';
import type { BenchmarkResult, BenchmarkInput } from '@/types/compensation';
import { cn } from '@/lib/utils';

interface BenchmarkCardProps {
  benchmark: BenchmarkResult | null;
  query: BenchmarkInput;
  loading?: boolean;
}

const PERCENTILE_LABELS: Array<{ key: keyof BenchmarkResult; label: string; pct: number }> = [
  { key: 'p10', label: 'P10', pct: 10 },
  { key: 'p25', label: 'P25', pct: 25 },
  { key: 'p50', label: 'Median', pct: 50 },
  { key: 'p75', label: 'P75', pct: 75 },
  { key: 'p90', label: 'P90', pct: 90 },
];

export function BenchmarkCard({ benchmark, query, loading }: BenchmarkCardProps) {
  const formatCurrency = (value: number): string => {
    const currency = benchmark?.currency || 'CNY';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
      notation: value >= 100000 ? 'compact' : 'standard',
    }).format(value);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-bg-secondary rounded w-1/3" />
          <div className="h-32 bg-bg-secondary rounded" />
          <div className="h-20 bg-bg-secondary rounded" />
        </div>
      </Card>
    );
  }

  if (!benchmark) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-50" />
          <h3 className="font-medium text-text-primary mb-2">
            No Benchmark Data Available
          </h3>
          <p className="text-sm text-text-muted max-w-md mx-auto">
            We need at least 3 data points to calculate a benchmark for{' '}
            <span className="font-medium">{query.jobTitle}</span>.
            Try broadening your search or adding more placement data.
          </p>
        </div>
      </Card>
    );
  }

  const percentileValues = PERCENTILE_LABELS.map((p) => ({
    ...p,
    value: benchmark[p.key] as number,
  }));

  const minVal = benchmark.p10 || 0;
  const maxVal = benchmark.p90 || 1;
  const range = maxVal - minVal || 1;

  const getPosition = (value: number): number => {
    return ((value - minVal) / range) * 100;
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h3 className="font-serif font-semibold text-lg text-text-primary">
              {query.jobTitle}
            </h3>
          </div>
          <p className="text-sm text-text-muted">
            {[query.city, query.country].filter(Boolean).join(', ')}
            {query.industry && ` • ${query.industry}`}
          </p>
        </div>
        <div className="text-right">
          <Badge
            variant={
              benchmark.confidence === 'high'
                ? 'success'
                : benchmark.confidence === 'medium'
                ? 'default'
                : 'warning'
            }
          >
            {CONFIDENCE_LABELS[benchmark.confidence]} Confidence
          </Badge>
          <p className="text-xs text-text-muted mt-1">
            {benchmark.sampleSize} data points
          </p>
        </div>
      </div>

      {/* Relaxation Note */}
      {benchmark.relaxationNote && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">{benchmark.relaxationNote}</p>
        </div>
      )}

      {/* Percentile Bar Visualization */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-text-primary">
          Total Cash Compensation ({benchmark.currency})
        </h4>

        {/* Bar */}
        <div className="relative h-8">
          {/* Range bar */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 bg-bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-300 via-accent to-tier-1 rounded-full" />
          </div>

          {/* Percentile markers */}
          {percentileValues.map((p) => (
            <div
              key={p.key}
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: `${getPosition(p.value)}%` }}
            >
              <div className="w-1.5 h-6 bg-white border-2 border-accent rounded-full -translate-x-1/2" />
            </div>
          ))}

          {/* Median highlight */}
          <div
            className="absolute top-1/2 -translate-y-1/2"
            style={{ left: `${getPosition(benchmark.p50)}%` }}
          >
            <div className="w-3 h-8 bg-tier-1 rounded-full -translate-x-1/2 shadow-md" />
          </div>
        </div>

        {/* Labels */}
        <div className="flex justify-between text-xs">
          {percentileValues.map((p) => (
            <div key={p.key} className="text-center" style={{ width: '60px' }}>
              <div className="font-medium text-text-primary text-xs">
                {formatCurrency(p.value)}
              </div>
              <div className="text-text-muted text-[10px]">{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-bg-hover">
        <div className="text-center">
          <div className="text-xs text-text-muted mb-1">Median (P50)</div>
          <div className="font-serif font-bold text-xl text-text-primary">
            {formatCurrency(benchmark.p50)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-text-muted mb-1">Average</div>
          <div className="font-serif font-bold text-xl text-text-primary">
            {formatCurrency(benchmark.mean)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-text-muted mb-1">Top Tier (P90)</div>
          <div className="font-serif font-bold text-xl text-tier-1">
            {formatCurrency(benchmark.p90)}
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="flex items-center gap-2 pt-2">
        <DollarSign className="w-4 h-4 text-text-muted" />
        <span className="text-xs text-text-muted">Data sources:</span>
        <div className="flex gap-1">
          {benchmark.dataSources.map((source) => (
            <Badge key={source} variant="default" className="text-[10px]">
              {source.replace('_', ' ')}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default BenchmarkCard;
