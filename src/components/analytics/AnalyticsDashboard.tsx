import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Users, DollarSign, Clock, Target,
  BarChart3, PieChart, RefreshCw, Calendar, AlertCircle, CheckCircle,
  ArrowUpRight, ArrowDownRight, Filter
} from 'lucide-react';
import { Badge, Button, Card, Progress } from '@/components/ui';

interface AnalyticsOverview {
  mandates: {
    active: number;
    completed: number;
    cancelled: number;
    placement_rate: string;
  };
  time_to_fill: {
    average_days: number | null;
    median_days: number | null;
    trend: string;
  };
  pipeline: {
    total_candidates_in_pipeline: number;
    avg_candidates_per_mandate: number;
    avg_pipeline_velocity: string;
  };
  revenue: {
    pipeline_value: number;
    collected_ytd: number;
    overdue_amount: number;
    avg_fee_per_mandate: number;
  };
  consultant_performance: Array<{
    id: string;
    name: string;
    active_mandates: number;
    completed_this_quarter: number;
    avg_time_to_fill: number | null;
    client_satisfaction: number | null;
  }>;
  bottlenecks: Array<{
    stage: string;
    avg_days: number;
    issue: string;
  }>;
}

interface ConsultantWorkload {
  id: string;
  name: string;
  email: string;
  workload: {
    active: number;
    completed: number;
    on_hold: number;
    at_risk: number;
  };
  phases: Record<string, number>;
}

interface QualityMetrics {
  generated_at: string;
  across_mandates: {
    total_active_mandates: number;
    total_mapped_candidates: number;
    total_viable_pool: number;
    avg_quality_ratio: number;
    avg_contact_to_response: number;
    avg_response_to_interest: number;
    avg_close_rate: number;
    total_stale_candidates: number;
  };
  per_mandate: Array<{
    mandate_id: string;
    title: string;
    quality_ratio: number;
    contact_to_response: number;
    response_to_interest: number;
    stale_count: number;
    status: string;
  }>;
  alerts: Array<{ type: string; message: string }>;
}

interface DeclineAnalysis {
  total_declines: number;
  reason_distribution: Record<string, number>;
  motivation_calibration: {
    green_positive_rate: number;
    yellow_positive_rate: number;
    red_positive_rate: number;
    screen_effective: boolean;
    sample_size: number;
    recommendation: string;
  };
  trends: {
    compensation_concerns_trend: string;
    action_suggested: string | null;
  };
}

export function AnalyticsDashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [workload, setWorkload] = useState<ConsultantWorkload[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
  const [declineAnalysis, setDeclineAnalysis] = useState<DeclineAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'consultants' | 'quality' | 'revenue'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [overviewRes, workloadRes, qualityRes, declineRes] = await Promise.all([
        fetch('/api/analytics/overview'),
        fetch('/api/consultants/workload'),
        fetch('/api/analytics/quality-metrics'),
        fetch('/api/analytics/decline-analysis'),
      ]);

      const [overviewData, workloadData, qualityData, declineData] = await Promise.all([
        overviewRes.json(),
        workloadRes.json(),
        qualityRes.json(),
        declineRes.json(),
      ]);

      if (overviewData.success) setOverview(overviewData.data);
      if (workloadData.success) setWorkload(workloadData.data);
      if (qualityData.success) setQualityMetrics(qualityData.data);
      if (declineData.success) setDeclineAnalysis(declineData.data);
    } catch (err) {
      console.error('Load analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerSnapshot = async () => {
    try {
      await fetch('/api/analytics/snapshot', { method: 'POST' });
      loadAnalytics();
    } catch (err) {
      console.error('Trigger snapshot error:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving' || trend === 'increasing') return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (trend === 'declining' || trend === 'decreasing') return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return null;
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon,
    trend,
    color = 'accent',
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: string;
    color?: string;
  }) => (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-none bg-${color === 'accent' ? 'accent/10' : color === 'green' ? 'green-500/10' : color === 'yellow' ? 'yellow-500/10' : color === 'purple' ? 'purple-500/10' : 'gray-500/10'}`}>
          {icon}
        </div>
        {trend && getTrendIcon(trend)}
      </div>
      <div className="text-2xl font-bold text-text-primary">{value}</div>
      <div className="text-sm text-text-muted">{title}</div>
      {subtitle && <div className="text-xs text-text-muted mt-1">{subtitle}</div>}
    </Card>
  );

  const OverviewTab = () => {
    if (!overview) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Analytics Overview</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadAnalytics}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button variant="outline" onClick={triggerSnapshot}>
              <Calendar className="w-4 h-4 mr-1" /> Snapshot
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <StatCard
            title="Active Mandates"
            value={overview.mandates.active}
            subtitle={`${overview.mandates.completed} completed | ${overview.mandates.cancelled} cancelled`}
            icon={<Target className="w-5 h-5 text-accent" />}
            color="accent"
          />
          <StatCard
            title="Placement Rate"
            value={overview.mandates.placement_rate}
            icon={<CheckCircle className="w-5 h-5 text-green-500" />}
            color="green"
          />
          <StatCard
            title="Avg Time to Fill"
            value={overview.time_to_fill.average_days ? `${overview.time_to_fill.average_days}d` : 'N/A'}
            subtitle={`Median: ${overview.time_to_fill.median_days || 'N/A'}d`}
            icon={<Clock className="w-5 h-5 text-yellow-500" />}
            color="yellow"
            trend={overview.time_to_fill.trend}
          />
          <StatCard
            title="Pipeline Value"
            value={formatCurrency(overview.revenue.pipeline_value)}
            subtitle={`Collected: ${formatCurrency(overview.revenue.collected_ytd)}`}
            icon={<DollarSign className="w-5 h-5 text-purple-500" />}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="font-medium text-text-primary mb-4">Pipeline Metrics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-muted">Total Candidates</span>
                  <span className="text-sm font-medium">{overview.pipeline.total_candidates_in_pipeline}</span>
                </div>
                <Progress value={Math.min((overview.pipeline.total_candidates_in_pipeline / (overview.mandates.active * 30)) * 100, 100)} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-muted">Avg per Mandate</span>
                  <span className="text-sm font-medium">{overview.pipeline.avg_candidates_per_mandate.toFixed(1)}</span>
                </div>
                <Progress value={(overview.pipeline.avg_candidates_per_mandate / 30) * 100} className="h-2" />
              </div>
              <div className="pt-2 border-t border-border">
                <div className="text-sm text-text-muted">Pipeline Velocity</div>
                <div className="text-lg font-bold text-text-primary">{overview.pipeline.avg_pipeline_velocity}</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium text-text-primary mb-4">Revenue</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-text-muted">Pipeline Value</div>
                <div className="text-lg font-bold text-text-primary">{formatCurrency(overview.revenue.pipeline_value)}</div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Collected YTD</div>
                <div className="text-lg font-bold text-green-600">{formatCurrency(overview.revenue.collected_ytd)}</div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Overdue</div>
                <div className="text-lg font-bold text-red-600">{formatCurrency(overview.revenue.overdue_amount)}</div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Avg Fee per Mandate</div>
                <div className="text-lg font-bold text-text-primary">{formatCurrency(overview.revenue.avg_fee_per_mandate)}</div>
              </div>
            </div>
          </Card>
        </div>

        {overview.bottlenecks.length > 0 && (
          <Card className="p-4">
            <h3 className="font-medium text-text-primary mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" /> Bottlenecks
            </h3>
            <div className="space-y-2">
              {overview.bottlenecks.map((b, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-yellow-50 rounded-none">
                  <div>
                    <span className="font-medium text-text-primary">{b.stage}</span>
                    <span className="text-sm text-text-muted ml-2">({b.avg_days}d avg)</span>
                  </div>
                  <span className="text-sm text-yellow-700">{b.issue}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  };

  const ConsultantsTab = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-text-primary">Consultant Workload</h2>

      <div className="grid grid-cols-3 gap-4">
        {workload.map(consultant => (
          <Card key={consultant.id} className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium">
                {consultant.name?.[0] || '?'}
              </div>
              <div>
                <div className="font-medium text-text-primary">{consultant.name}</div>
                <div className="text-sm text-text-muted">{consultant.email}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center p-2 bg-green-50 rounded-none">
                <div className="text-lg font-bold text-green-600">{consultant.workload.active}</div>
                <div className="text-xs text-text-muted">Active</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-none">
                <div className="text-lg font-bold text-blue-600">{consultant.workload.completed}</div>
                <div className="text-xs text-text-muted">Completed</div>
              </div>
            </div>

            {consultant.workload.at_risk > 0 && (
              <Badge variant="warning" className="mb-2">
                {consultant.workload.at_risk} at risk
              </Badge>
            )}

            <div className="space-y-1">
              {Object.entries(consultant.phases).map(([phase, count]) => (
                <div key={phase} className="flex items-center justify-between text-sm">
                  <span className="text-text-muted capitalize">{phase}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const QualityTab = () => {
    if (!qualityMetrics) return null;

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text-primary">Pipeline Quality Metrics</h2>

        {qualityMetrics.alerts.length > 0 && (
          <div className="space-y-2">
            {qualityMetrics.alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 p-3 rounded-none ${
                  alert.type === 'warning' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                {alert.message}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-text-muted">Quality Ratio</div>
            <div className="text-2xl font-bold text-text-primary">
              {Math.round(qualityMetrics.across_mandates.avg_quality_ratio * 100)}%
            </div>
            <div className="text-xs text-text-muted">Target: 20-30%</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-text-muted">Contact → Response</div>
            <div className="text-2xl font-bold text-text-primary">
              {Math.round(qualityMetrics.across_mandates.avg_contact_to_response * 100)}%
            </div>
            <div className="text-xs text-text-muted">Target: {'\u003E'}40%</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-text-muted">Response → Interest</div>
            <div className="text-2xl font-bold text-text-primary">
              {Math.round(qualityMetrics.across_mandates.avg_response_to_interest * 100)}%
            </div>
            <div className="text-xs text-text-muted">Target: {'\u003E'}30%</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-text-muted">Close Rate</div>
            <div className="text-2xl font-bold text-text-primary">
              {Math.round(qualityMetrics.across_mandates.avg_close_rate * 100)}%
            </div>
            <div className="text-xs text-text-muted">Target: {'\u003E'}60%</div>
          </Card>
        </div>

        {declineAnalysis && (
          <Card className="p-4">
            <h3 className="font-medium text-text-primary mb-4">Decline Analysis</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm text-text-muted mb-2">Decline Reasons</h4>
                <div className="space-y-2">
                  {Object.entries(declineAnalysis.reason_distribution).map(([reason, count]) => (
                    <div key={reason} className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">{reason.replace('_', ' ')}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm text-text-muted mb-2">Motivation Calibration</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-green-600">GREEN</span>
                      <span className="text-sm font-medium">
                        {Math.round(declineAnalysis.motivation_calibration.green_positive_rate * 100)}%
                      </span>
                    </div>
                    <Progress value={declineAnalysis.motivation_calibration.green_positive_rate * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-yellow-600">YELLOW</span>
                      <span className="text-sm font-medium">
                        {Math.round(declineAnalysis.motivation_calibration.yellow_positive_rate * 100)}%
                      </span>
                    </div>
                    <Progress value={declineAnalysis.motivation_calibration.yellow_positive_rate * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-red-600">RED</span>
                      <span className="text-sm font-medium">
                        {Math.round(declineAnalysis.motivation_calibration.red_positive_rate * 100)}%
                      </span>
                    </div>
                    <Progress value={declineAnalysis.motivation_calibration.red_positive_rate * 100} className="h-2" />
                  </div>
                </div>
                <Badge
                  variant={declineAnalysis.motivation_calibration.screen_effective ? 'success' : 'warning'}
                  className="mt-3"
                >
                  Screen {declineAnalysis.motivation_calibration.screen_effective ? 'Effective' : 'Needs Review'}
                </Badge>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4">
          <h3 className="font-medium text-text-primary mb-4">Per-Mandate Quality</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-sm text-text-muted border-b">
                  <th className="text-left p-2">Mandate</th>
                  <th className="text-center p-2">Quality Ratio</th>
                  <th className="text-center p-2">Contact→Response</th>
                  <th className="text-center p-2">Response→Interest</th>
                  <th className="text-center p-2">Stale</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {qualityMetrics.per_mandate.map(mandate => (
                  <tr key={mandate.mandate_id} className="border-b">
                    <td className="p-2 font-medium">{mandate.title}</td>
                    <td className="p-2 text-center">{Math.round(mandate.quality_ratio * 100)}%</td>
                    <td className="p-2 text-center">{Math.round(mandate.contact_to_response * 100)}%</td>
                    <td className="p-2 text-center">{Math.round(mandate.response_to_interest * 100)}%</td>
                    <td className="p-2 text-center">
                      {mandate.stale_count > 0 ? (
                        <Badge variant="warning">{mandate.stale_count}</Badge>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      <Badge variant={mandate.status === 'on_track' ? 'success' : 'warning'}>
                        {mandate.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const RevenueTab = () => {
    if (!overview) return null;

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text-primary">Revenue Analytics</h2>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm text-text-muted">Pipeline Value</div>
            <div className="text-3xl font-bold text-text-primary">
              {formatCurrency(overview.revenue.pipeline_value)}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-text-muted">Collected YTD</div>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(overview.revenue.collected_ytd)}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-text-muted">Overdue</div>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(overview.revenue.overdue_amount)}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'consultants', label: 'Consultants', icon: <Users className="w-4 h-4" /> },
    { key: 'quality', label: 'Quality', icon: <Target className="w-4 h-4" /> },
    { key: 'revenue', label: 'Revenue', icon: <DollarSign className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
        <p className="text-text-muted">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === tab.key
                ? 'text-accent border-accent'
                : 'text-text-muted border-transparent hover:text-text-primary'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'consultants' && <ConsultantsTab />}
        {activeTab === 'quality' && <QualityTab />}
        {activeTab === 'revenue' && <RevenueTab />}
      </div>
    </div>
  );
}