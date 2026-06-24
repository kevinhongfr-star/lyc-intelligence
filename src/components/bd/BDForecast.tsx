import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Target,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FORECAST_DATA = {
  thisMonth: {
    won: 95000,
    weighted: 210000,
    pipeline: 420000,
  },
  nextMonth: {
    won: 60000,
    weighted: 180000,
    pipeline: 380000,
  },
  quarter: {
    won: 320000,
    weighted: 450000,
    pipeline: 1100000,
    target: 500000,
  },
};

const MONTHLY_PIPELINE = [
  { month: 'Jan', won: 50000, weighted: 120000, pipeline: 280000 },
  { month: 'Feb', won: 75000, weighted: 150000, pipeline: 320000 },
  { month: 'Mar', won: 100000, weighted: 180000, pipeline: 400000 },
  { month: 'Apr', won: 85000, weighted: 195000, pipeline: 450000 },
  { month: 'May', won: 95000, weighted: 200000, pipeline: 420000 },
  { month: 'Jun', won: 95000, weighted: 210000, pipeline: 420000 },
];

const STAGE_FORECAST = [
  { stage: 'Prospect', count: 8, value: 320000, weighted: 32000 },
  { stage: 'Meeting Booked', count: 5, value: 250000, weighted: 62500 },
  { stage: 'Meeting Held', count: 3, value: 180000, weighted: 72000 },
  { stage: 'Proposal Sent', count: 2, value: 300000, weighted: 150000 },
  { stage: 'Negotiation', count: 2, value: 270000, weighted: 189000 },
];

export function BDForecast() {
  const [viewPeriod, setViewPeriod] = useState<'month' | 'quarter' | 'year'>('quarter');
  const [showByStage, setShowByStage] = useState(true);

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  const maxPipeline = Math.max(...MONTHLY_PIPELINE.map((m) => m.pipeline));

  const targetProgress = FORECAST_DATA.quarter.weighted / FORECAST_DATA.quarter.target * 100;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Forecast</h1>
          <p className="text-text-muted">Weighted pipeline and revenue projections</p>
        </div>
        <div className="flex bg-bg-tertiary rounded-lg p-0.5">
          {['month', 'quarter', 'year'].map((period) => (
            <button
              key={period}
              onClick={() => setViewPeriod(period as any)}
              className={`px-3 py-1.5 text-xs rounded-md capitalize transition-colors min-h-[36px] ${
                viewPeriod === period
                  ? 'bg-bg-secondary text-text-primary font-medium'
                  : 'text-text-muted'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Pipeline Value</span>
              <DollarSign className="w-4 h-4 text-text-muted" />
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {formatCurrency(FORECAST_DATA.quarter.pipeline)}
            </p>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +12% vs last quarter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Weighted Forecast</span>
              <TrendingUp className="w-4 h-4 text-text-muted" />
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {formatCurrency(FORECAST_DATA.quarter.weighted)}
            </p>
            <p className="text-xs text-text-muted mt-1">
              Based on stage probability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Won Revenue</span>
              <Target className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {formatCurrency(FORECAST_DATA.quarter.won)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              ${(FORECAST_DATA.quarter.won / 1000).toFixed(0)}K already closed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Target Progress</span>
              <BarChart3 className="w-4 h-4 text-text-muted" />
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {Math.round(targetProgress)}%
            </p>
            <div className="w-full h-1.5 bg-bg-tertiary rounded-full mt-2">
              <div
                className="h-full bg-accent rounded-full"
                style={{ width: `${Math.min(100, targetProgress)}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-1">
              Target: {formatCurrency(FORECAST_DATA.quarter.target)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            Pipeline Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-2 px-2">
            {MONTHLY_PIPELINE.map((month) => {
              const wonHeight = (month.won / maxPipeline) * 100;
              const weightedHeight = (month.weighted / maxPipeline) * 100;
              const pipelineHeight = (month.pipeline / maxPipeline) * 100;
              return (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex gap-1 items-end h-48">
                    <div
                      className="flex-1 bg-green-500 rounded-t transition-all"
                      style={{ height: `${wonHeight}%` }}
                    />
                    <div
                      className="flex-1 bg-accent rounded-t transition-all"
                      style={{ height: `${weightedHeight}%` }}
                    />
                    <div
                      className="flex-1 bg-accent/20 rounded-t transition-all"
                      style={{ height: `${pipelineHeight}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-muted">{month.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-xs text-text-muted">Won</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-accent rounded" />
              <span className="text-xs text-text-muted">Weighted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-accent/20 rounded" />
              <span className="text-xs text-text-muted">Pipeline</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            Forecast by Stage
          </CardTitle>
          <button
            onClick={() => setShowByStage(!showByStage)}
            className="text-sm text-accent hover:underline"
          >
            {showByStage ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </CardHeader>
        {showByStage && (
          <CardContent className="space-y-3">
            {STAGE_FORECAST.map((stage) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{stage.stage}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {stage.count} deals
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-text-primary">
                      {formatCurrency(stage.value)}
                    </span>
                    <span className="text-xs text-text-muted ml-2">
                      → {formatCurrency(stage.weighted)} weighted
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full"
                    style={{ width: `${(stage.value / STAGE_FORECAST[0].value) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
