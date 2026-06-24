import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  PieChart,
  BarChart3,
  Calendar,
  Briefcase,
  Users,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const PERIODS = ['month', 'quarter', 'year'];

const MOCK_REVENUE = {
  collected: {
    current: 450000,
    previous: 380000,
    target: 500000,
  },
  pipeline: {
    total: 2850000,
    weighted: 980000,
    count: 12,
  },
  won: {
    current: 12,
    previous: 9,
    averageFee: 75000,
  },
  byMonth: [
    { month: 'Jan', won: 120000, pipeline: 350000, collected: 380000 },
    { month: 'Feb', won: 150000, pipeline: 420000, collected: 420000 },
    { month: 'Mar', won: 180000, pipeline: 380000, collected: 450000 },
    { month: 'Apr', won: 100000, pipeline: 450000, collected: 400000 },
    { month: 'May', won: 140000, pipeline: 500000, collected: 430000 },
    { month: 'Jun', won: 80000, pipeline: 750000, collected: 450000 },
  ],
  byConsultant: [
    { name: 'Alex Wang', revenue: 480000, placements: 4, pipeline: 850000 },
    { name: 'Sarah Li', revenue: 420000, placements: 3, pipeline: 1200000 },
    { name: 'Emily Zhang', revenue: 350000, placements: 3, pipeline: 580000 },
    { name: 'Mike Chen', revenue: 240000, placements: 2, pipeline: 420000 },
  ],
  byStage: [
    { stage: 'Sourcing', value: 800000, count: 5, color: 'bg-blue-500' },
    { stage: 'Shortlisted', value: 650000, count: 3, color: 'bg-purple-500' },
    { stage: 'Interview', value: 550000, count: 2, color: 'bg-amber-500' },
    { stage: 'Offer', value: 480000, count: 2, color: 'bg-green-500' },
    { stage: 'Negotiation', value: 370000, count: 1, color: 'bg-emerald-500' },
  ],
  topClients: [
    { name: 'TechCorp', revenue: 320000, mandates: 2, avgFee: 160000 },
    { name: 'FinanceCo', revenue: 200000, mandates: 1, avgFee: 200000 },
    { name: 'HealthTech', revenue: 160000, mandates: 1, avgFee: 160000 },
    { name: 'Retail Group', revenue: 150000, mandates: 1, avgFee: 150000 },
  ],
};

export function TL_RevenueDashboard() {
  const [period, setPeriod] = useState('quarter');

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  const maxCollected = Math.max(...MOCK_REVENUE.byMonth.map((m) => m.collected));
  const maxPipeline = Math.max(...MOCK_REVENUE.byMonth.map((m) => m.pipeline));
  const maxBar = Math.max(maxCollected, maxPipeline);

  const collectionPercent = Math.round((MOCK_REVENUE.collected.current / MOCK_REVENUE.collected.target) * 100);

  const byStageTotal = MOCK_REVENUE.byStage.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Revenue</h1>
          <p className="text-text-muted">Pipeline, forecast, and collected revenue</p>
        </div>
        <div className="flex bg-bg-tertiary rounded-lg p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm rounded-md capitalize transition-colors ${
                period === p
                  ? 'bg-bg-secondary text-text-primary font-medium'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              This {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Collected</span>
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xl font-bold text-text-primary">{formatCurrency(MOCK_REVENUE.collected.current)}</p>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-green-600">+18%</span>
              <span className="text-text-muted">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Pipeline Value</span>
              <BarChart3 className="w-4 h-4 text-accent" />
            </div>
            <p className="text-xl font-bold text-text-primary">{formatCurrency(MOCK_REVENUE.pipeline.total)}</p>
            <p className="text-xs text-text-muted mt-1">{MOCK_REVENUE.pipeline.count} active mandates</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Weighted Forecast</span>
              <Target className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xl font-bold text-text-primary">{formatCurrency(MOCK_REVENUE.pipeline.weighted)}</p>
            <p className="text-xs text-text-muted mt-1">Probability-adjusted</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Target Progress</span>
              <TrendingUp className="w-4 h-4 text-accent" />
            </div>
            <p className="text-xl font-bold text-text-primary">{collectionPercent}%</p>
            <div className="w-full h-1.5 bg-bg-tertiary rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-accent rounded-full"
                style={{ width: `${collectionPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-4 px-4">
            {MOCK_REVENUE.byMonth.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end gap-1 h-48">
                  <div
                    className="flex-1 bg-accent/30 rounded-t-sm transition-all"
                    style={{ height: `${(m.pipeline / maxBar) * 100}%` }}
                    title={`Pipeline: ${formatCurrency(m.pipeline)}`}
                  />
                  <div
                    className="flex-1 bg-accent rounded-t-sm transition-all"
                    style={{ height: `${(m.collected / maxBar) * 100}%` }}
                    title={`Collected: ${formatCurrency(m.collected)}`}
                  />
                </div>
                <span className="text-xs text-text-muted">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-accent/30 rounded-sm" />
              <span className="text-text-muted">Pipeline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-accent rounded-sm" />
              <span className="text-text-muted">Collected</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-accent" />
              Pipeline by Stage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_REVENUE.byStage.map((s) => (
              <div key={s.stage}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-text-primary">{s.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">{s.count} mandates</span>
                    <span className="font-medium text-text-primary">{formatCurrency(s.value)}</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.color}`}
                    style={{ width: `${(s.value / byStageTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              Revenue by Consultant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_REVENUE.byConsultant.sort((a, b) => b.revenue - a.revenue).map((c, i) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="font-medium text-text-primary">{c.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-medium text-text-primary">{formatCurrency(c.revenue)}</p>
                  <p className="text-xs text-text-muted">{c.placements} placements</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-accent" />
            Top Clients by Revenue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {MOCK_REVENUE.topClients.map((client) => (
            <div key={client.name} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
              <div>
                <p className="font-medium text-text-primary">{client.name}</p>
                <p className="text-xs text-text-muted">{client.mandates} mandates · Avg fee {formatCurrency(client.avgFee)}</p>
              </div>
              <p className="font-semibold text-text-primary">{formatCurrency(client.revenue)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
