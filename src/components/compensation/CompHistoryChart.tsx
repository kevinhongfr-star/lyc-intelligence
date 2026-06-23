// Phase 3.8: Compensation History Chart Component
// SVG-based line chart showing compensation trends over time
'use client';

import React from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { HistoryDataPoint } from '@/types/compensation';
import { cn } from '@/lib/utils';

interface CompHistoryChartProps {
  data: HistoryDataPoint[];
  currency?: string;
  title?: string;
  loading?: boolean;
}

export function CompHistoryChart({
  data,
  currency = 'CNY',
  title = 'Compensation Trend',
  loading,
}: CompHistoryChartProps) {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
      notation: value >= 100000 ? 'compact' : 'standard',
    }).format(value);
  };

  const formatMonth = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-bg-secondary rounded w-1/3" />
          <div className="h-48 bg-bg-secondary rounded" />
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-text-muted opacity-50" />
          <p className="text-sm text-text-muted">
            Not enough historical data for trend analysis
          </p>
        </div>
      </Card>
    );
  }

  // Chart dimensions
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const allValues = data.flatMap((d) => [d.p25, d.p50, d.p75]);
  const minVal = Math.min(...allValues) * 0.9;
  const maxVal = Math.max(...allValues) * 1.1;
  const valueRange = maxVal - minVal || 1;

  const xScale = (index: number): number => {
    if (data.length <= 1) return chartWidth / 2;
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  const yScale = (value: number): number => {
    return padding.top + chartHeight - ((value - minVal) / valueRange) * chartHeight;
  };

  // Generate path for a line
  const generatePath = (key: 'p25' | 'p50' | 'p75'): string => {
    return data
      .map((d, i) => {
        const x = xScale(i);
        const y = yScale(d[key]);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  // Generate area between p25 and p75
  const generateArea = (): string => {
    const topPath = data
      .map((d, i) => {
        const x = xScale(i);
        const y = yScale(d.p75);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    const bottomPath = [...data]
      .reverse()
      .map((d, i) => {
        const x = xScale(data.length - 1 - i);
        const y = yScale(d.p25);
        return `L ${x} ${y}`;
      })
      .join(' ');

    return `${topPath} ${bottomPath} Z`;
  };

  // Y-axis ticks
  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => {
    return minVal + (i / yTicks) * valueRange;
  });

  // Calculate overall change
  const firstP50 = data[0]?.p50 || 0;
  const lastP50 = data[data.length - 1]?.p50 || 0;
  const changePct = firstP50 > 0 ? ((lastP50 - firstP50) / firstP50) * 100 : 0;
  const isPositive = changePct >= 0;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h3 className="font-serif font-semibold text-lg text-text-primary">
            {title}
          </h3>
        </div>
        <Badge
          variant={isPositive ? 'success' : 'danger'}
          className="text-sm"
        >
          {isPositive ? '+' : ''}
          {changePct.toFixed(1)}%
        </Badge>
      </div>

      {/* Chart */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[400px]"
        >
          {/* Grid lines */}
          {tickValues.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={yScale(tick)}
                x2={width - padding.right}
                y2={yScale(tick)}
                stroke="currentColor"
                className="text-bg-hover"
                strokeDasharray="4,4"
              />
              <text
                x={padding.left - 8}
                y={yScale(tick) + 4}
                textAnchor="end"
                className="text-[10px] fill-text-muted"
              >
                {formatCurrency(tick)}
              </text>
            </g>
          ))}

          {/* Area between p25 and p75 */}
          <path
            d={generateArea()}
            fill="currentColor"
            className="text-accent"
            opacity={0.15}
          />

          {/* P25 line */}
          <path
            d={generatePath('p25')}
            fill="none"
            stroke="currentColor"
            className="text-text-muted"
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />

          {/* P50 (median) line */}
          <path
            d={generatePath('p50')}
            fill="none"
            stroke="currentColor"
            className="text-accent"
            strokeWidth={2.5}
          />

          {/* P75 line */}
          <path
            d={generatePath('p75')}
            fill="none"
            stroke="currentColor"
            className="text-tier-1"
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />

          {/* Data points for p50 */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={xScale(i)}
              cy={yScale(d.p50)}
              r={4}
              fill="currentColor"
              className="text-accent"
            />
          ))}

          {/* X-axis labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={xScale(i)}
              y={height - padding.bottom + 16}
              textAnchor="middle"
              className="text-[10px] fill-text-muted"
            >
              {formatMonth(d.date)}
            </text>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-text-muted" style={{ borderStyle: 'dashed' }} />
          <span className="text-xs text-text-muted">P25 - Bottom Quartile</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-accent" />
          <span className="text-xs text-text-muted">P50 - Median</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-tier-1" style={{ borderStyle: 'dashed' }} />
          <span className="text-xs text-text-muted">P75 - Top Quartile</span>
        </div>
      </div>

      {/* Sample sizes */}
      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-text-muted">
        <span>Sample sizes range:</span>
        <span className="font-medium">
          {Math.min(...data.map((d) => d.sampleSize))} -{' '}
          {Math.max(...data.map((d) => d.sampleSize))}
        </span>
      </div>
    </Card>
  );
}

export default CompHistoryChart;
