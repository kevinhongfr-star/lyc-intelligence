import React, { useState, useEffect } from 'react';
import {
  AlertCircle, CheckCircle, Clock, Users, Target, TrendingUp,
  ArrowUpRight, ArrowDownRight, RefreshCw, Eye, Send, Filter,
  Calendar, Building2, Star, MessageSquare
} from 'lucide-react';
import { Badge, Button, Card, Progress } from '@/components/ui';

interface MappingSummary {
  id: string;
  mandate: { id: string; title: string };
  consultant: string;
  mapping_type: string;
  last_updated: string;
  standards: Record<string, any>;
  overall_score: number;
  red_flags: Array<{ type: string; message: string }>;
  p1_count: number;
  p1_uncontacted: number;
}

interface DailyGridData {
  mapping_id: string;
  generated_at: string;
  day_number: number;
  message_text: string;
}

interface QualityMetrics {
  mapping_id: string;
  mandate_title: string;
  generated_at: string;
  metrics: {
    quality_ratio: { value: number; target: string; status: string; pipeline: number; total_mapped: number };
    contact_to_response: { value: number; target: string; status: string; responded: number; contacted: number };
    response_to_interest: { value: number; target: string; status: string; interested: number; responded: number };
    conversion_contact_to_interest: { value: number; target: string; status: string; interested: number; contacted: number };
    stale_candidates: { s3_over_5_days: number; s7_over_10_days: number; total_stale: number };
    motivation_accuracy: {
      green_positive_rate: number;
      yellow_positive_rate: number;
      red_positive_rate: number;
      screen_effective: boolean;
      sample_size: number;
    };
  };
  alerts: Array<{ type: string; message: string }>;
}

export function GridReviewDashboard() {
  const [mappings, setMappings] = useState<MappingSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<string | null>(null);
  const [dailyGrid, setDailyGrid] = useState<DailyGridData | null>(null);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detail'>('overview');

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/grid/dashboard/review');
      const data = await response.json();
      if (data.success) {
        setMappings(data.data.mappings);
      }
    } catch (err) {
      console.error('Load mappings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyGrid = async (mappingId: string) => {
    try {
      const response = await fetch(`/api/grid/mappings/${mappingId}/daily-grid`);
      const data = await response.json();
      if (data.success) {
        setDailyGrid(data.data);
      }
    } catch (err) {
      console.error('Load daily grid error:', err);
    }
  };

  const loadQualityMetrics = async (mappingId: string) => {
    try {
      const response = await fetch(`/api/grid/mappings/${mappingId}/quality-metrics`);
      const data = await response.json();
      if (data.success) {
        setQualityMetrics(data.data);
      }
    } catch (err) {
      console.error('Load quality metrics error:', err);
    }
  };

  const selectMapping = async (mappingId: string) => {
    setSelectedMapping(mappingId);
    setViewMode('detail');
    await Promise.all([loadDailyGrid(mappingId), loadQualityMetrics(mappingId)]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'green': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'yellow': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'red': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green': return 'text-green-500 bg-green-50';
      case 'yellow': return 'text-yellow-500 bg-yellow-50';
      case 'red': return 'text-red-500 bg-red-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getMetricsStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'insufficient_data': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const OverviewView = () => {
    const summary = {
      total_active: mappings.length,
      all_green: mappings.filter(m => m.red_flags.length === 0).length,
      has_red_flags: mappings.filter(m => m.red_flags.length > 0).length,
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">GRID Weekly Review</h2>
            <p className="text-sm text-text-muted mt-1">Weekly review dashboard for team leads</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={loadMappings}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button>
              <Calendar className="w-4 h-4 mr-1" /> Export Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Target className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="text-sm text-text-muted">Active Mappings</div>
                <div className="text-2xl font-bold text-text-primary">{summary.total_active}</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <div className="text-sm text-text-muted">All Green</div>
                <div className="text-2xl font-bold text-green-500">{summary.all_green}</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <div className="text-sm text-text-muted">Red Flags</div>
                <div className="text-2xl font-bold text-red-500">{summary.has_red_flags}</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-sm text-text-muted">Total P1</div>
                <div className="text-2xl font-bold text-text-primary">
                  {mappings.reduce((sum, m) => sum + m.p1_count, 0)}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium text-text-primary">Mapping Status</h3>
          </div>

          <div className="divide-y divide-border">
            {mappings.map(mapping => (
              <div
                key={mapping.id}
                className="p-4 hover:bg-bg-alt transition-colors cursor-pointer"
                onClick={() => selectMapping(mapping.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">{mapping.mandate.title}</div>
                      <div className="text-sm text-text-muted">Consultant: {mapping.consultant} | {mapping.mapping_type.toUpperCase()}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-sm text-text-muted">Standards</div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5, 6, 7].map(i => {
                          const metric = mapping.standards[`m${i}_${['companies', 'sectors', 'candidates', 'contacted', 'gap_filled', 'p1_contacted', 'last_update'][i - 1]}`];
                          return (
                            <div key={i} className={`w-3 h-3 rounded-full ${metric?.status === 'green' ? 'bg-green-500' : metric?.status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                          );
                        })}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-text-muted">P1 Status</div>
                      <div className="flex items-center gap-2">
                        <Badge variant={mapping.p1_uncontacted === 0 ? 'success' : 'warning'}>
                          {mapping.p1_count - mapping.p1_uncontacted}/{mapping.p1_count} contacted
                        </Badge>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-text-muted">Last Update</div>
                      <div className="text-sm text-text-primary">
                        {new Date(mapping.last_updated).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {mapping.red_flags.map((flag, i) => (
                        <Badge key={i} variant="error" className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {flag.type}
                        </Badge>
                      ))}
                      {mapping.red_flags.length === 0 && (
                        <Badge variant="success">All Clear</Badge>
                      )}
                    </div>

                    <button className="p-2 hover:bg-bg rounded-lg">
                      <Eye className="w-4 h-4 text-text-muted" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const DetailView = () => {
    if (!selectedMapping || !dailyGrid || !qualityMetrics) {
      return (
        <div className="p-8 text-center text-text-muted">
          <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Loading mapping details...</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setViewMode('overview')}>
              ← Back to Overview
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">{qualityMetrics.mandate_title}</h2>
              <p className="text-sm text-text-muted">GRID Mapping Detail View</p>
            </div>
          </div>
          <Button onClick={() => loadDailyGrid(selectedMapping)}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh Daily Grid
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-text-primary">Daily Grid — Day {dailyGrid.day_number}</h3>
              <Button variant="outline" size="sm">
                <Send className="w-4 h-4 mr-1" /> Send to Feishu
              </Button>
            </div>
            <pre className="text-sm text-text-primary whitespace-pre-wrap bg-bg-alt p-4 rounded-lg max-h-[400px] overflow-y-auto">
              {dailyGrid.message_text}
            </pre>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium text-text-primary mb-4">Quality Metrics</h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-muted">Quality Ratio</span>
                  <span className={`text-sm font-medium ${getMetricsStatusColor(qualityMetrics.metrics.quality_ratio.status)}`}>
                    {Math.round(qualityMetrics.metrics.quality_ratio.value * 100)}%
                  </span>
                </div>
                <Progress value={qualityMetrics.metrics.quality_ratio.value * 100} className="h-2" />
                <div className="text-xs text-text-muted mt-1">
                  {qualityMetrics.metrics.quality_ratio.pipeline} / {qualityMetrics.metrics.quality_ratio.total_mapped} mapped
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-muted">Contact → Response</span>
                  <span className={`text-sm font-medium ${getMetricsStatusColor(qualityMetrics.metrics.contact_to_response.status)}`}>
                    {Math.round(qualityMetrics.metrics.contact_to_response.value * 100)}%
                  </span>
                </div>
                <Progress value={qualityMetrics.metrics.contact_to_response.value * 100} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-muted">Response → Interest</span>
                  <span className={`text-sm font-medium ${getMetricsStatusColor(qualityMetrics.metrics.response_to_interest.status)}`}>
                    {Math.round(qualityMetrics.metrics.response_to_interest.value * 100)}%
                  </span>
                </div>
                <Progress value={qualityMetrics.metrics.response_to_interest.value * 100} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-muted">Contact → Interest</span>
                  <span className={`text-sm font-medium ${getMetricsStatusColor(qualityMetrics.metrics.conversion_contact_to_interest.status)}`}>
                    {Math.round(qualityMetrics.metrics.conversion_contact_to_interest.value * 100)}%
                  </span>
                </div>
                <Progress value={qualityMetrics.metrics.conversion_contact_to_interest.value * 100} className="h-2" />
              </div>
            </div>

            {qualityMetrics.alerts.length > 0 && (
              <div className="mt-4 space-y-2">
                {qualityMetrics.alerts.map((alert, i) => (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${alert.type === 'warning' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                    <AlertCircle className={`w-4 h-4 ${alert.type === 'warning' ? 'text-yellow-500' : 'text-red-500'}`} />
                    <span className={`text-sm ${alert.type === 'warning' ? 'text-yellow-700' : 'text-red-700'}`}>
                      {alert.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card className="p-4">
          <h3 className="font-medium text-text-primary mb-4">Motivation Calibration</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-700">GREEN</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(qualityMetrics.metrics.motivation_accuracy.green_positive_rate * 100)}%
              </div>
              <div className="text-sm text-green-600">
                Positive response rate
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-700">YELLOW</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {Math.round(qualityMetrics.metrics.motivation_accuracy.yellow_positive_rate * 100)}%
              </div>
              <div className="text-sm text-yellow-600">
                Positive response rate
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">RED</span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {Math.round(qualityMetrics.metrics.motivation_accuracy.red_positive_rate * 100)}%
              </div>
              <div className="text-sm text-red-600">
                Positive response rate
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Badge variant={qualityMetrics.metrics.motivation_accuracy.screen_effective ? 'success' : 'warning'}>
              {qualityMetrics.metrics.motivation_accuracy.screen_effective ? 'Screen Effective' : 'Screen Needs Improvement'}
            </Badge>
            <span className="text-sm text-text-muted">
              Based on {qualityMetrics.metrics.motivation_accuracy.sample_size} contacted candidates
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-medium text-text-primary mb-4">Stale Candidates</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <div className="text-sm text-text-muted">S3 >5 days</div>
                <div className="text-xl font-bold text-yellow-500">
                  {qualityMetrics.metrics.stale_candidates.s3_over_5_days}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <div className="text-sm text-text-muted">S7 >10 days</div>
                <div className="text-xl font-bold text-red-500">
                  {qualityMetrics.metrics.stale_candidates.s7_over_10_days}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Users className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <div className="text-sm text-text-muted">Total Stale</div>
                <div className="text-xl font-bold text-orange-500">
                  {qualityMetrics.metrics.stale_candidates.total_stale}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
        <p className="text-text-muted">Loading dashboard...</p>
      </div>
    );
  }

  return viewMode === 'overview' ? <OverviewView /> : <DetailView />;
}