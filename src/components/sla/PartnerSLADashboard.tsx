// Phase 3.12: Partner SLA Dashboard Component
'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';

interface TimelineMilestone {
  stage: string;
  target_date: string;
  actual_date: string | null;
  status: 'pending' | 'completed' | 'at_risk' | 'breached';
}

interface MandateTimeline {
  id: string;
  mandate_id: string;
  current_stage: string;
  milestones: TimelineMilestone[];
  overall_progress_pct: number;
  days_remaining: number | null;
  health_status: 'on_track' | 'at_risk' | 'breached' | 'completed';
}

interface SLADashboardProps {
  orgId: string;
}

interface DashboardData {
  summary: {
    total_mandates: number;
    on_track: number;
    at_risk: number;
    breached: number;
    completed: number;
    active_escalations: number;
    warning_escalations: number;
    critical_escalations: number;
    breach_escalations: number;
  };
  sla_metrics: {
    average_duration: number;
    sla_met_rate: number;
    breached_count: number;
  };
  timelines: MandateTimeline[];
}

const HEALTH_CONFIG = {
  on_track: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100', label: 'On Track' },
  at_risk: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-100', label: 'At Risk' },
  breached: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100', label: 'Breached' },
  completed: { icon: CheckCircle2, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Completed' },
};

export function PartnerSLADashboard({ orgId }: SLADashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sla/dashboard?org_id=${orgId}`);
      const result = await response.json();

      if (result.success) {
        setData(result);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [orgId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className={`w-6 h-6 text-primary animate-spin ${isRefreshing ? '' : ''}`} />
        <span className="ml-2 text-text-muted">Loading SLA dashboard...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 text-text-muted mx-auto" />
        <p className="text-text-muted mt-4">Failed to load dashboard</p>
        <Button onClick={handleRefresh} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">SLA Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">
            Track mandate timelines and SLA compliance
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{data.summary.total_mandates}</p>
              <p className="text-sm text-text-muted">Total Mandates</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{data.summary.on_track}</p>
              <p className="text-sm text-text-muted">On Track</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{data.summary.at_risk}</p>
              <p className="text-sm text-text-muted">At Risk</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{data.summary.active_escalations}</p>
              <p className="text-sm text-text-muted">Active Escalations</p>
            </div>
          </div>
        </Card>
      </div>

      {/* SLA Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-muted">Average Duration</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{data.sla_metrics.average_duration} days</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-muted">SLA Met Rate</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{data.sla_metrics.sla_met_rate}%</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-muted">Breached</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{data.sla_metrics.breached_count}</p>
        </Card>
      </div>

      {/* Timeline List */}
      <Card className="p-6">
        <h3 className="font-semibold text-text-primary mb-4">Active Mandates</h3>
        <div className="space-y-4">
          {data.timelines.length === 0 ? (
            <p className="text-text-muted text-center py-8">No active mandates</p>
          ) : (
            data.timelines.map(timeline => {
              const healthConfig = HEALTH_CONFIG[timeline.health_status];
              const HealthIcon = healthConfig.icon;
              const lastMilestone = timeline.milestones[timeline.milestones.length - 1];

              return (
                <div
                  key={timeline.id}
                  className="flex items-center gap-4 p-4 bg-bg-alt rounded-none hover:bg-bg-base transition-colors cursor-pointer"
                >
                  {/* Status */}
                  <div className={`w-10 h-10 rounded-full ${healthConfig.bg} flex items-center justify-center`}>
                    <HealthIcon className={`w-5 h-5 ${healthConfig.color}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">
                        Mandate {timeline.mandate_id.slice(0, 8)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${healthConfig.bg} ${healthConfig.color}`}>
                        {healthConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-text-muted">
                        Current: {timeline.current_stage.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-text-muted">
                        Progress: {timeline.overall_progress_pct}%
                      </span>
                      {timeline.days_remaining !== null && (
                        <span className={`text-sm ${timeline.days_remaining <= 0 ? 'text-red-500' : 'text-text-muted'}`}>
                          {timeline.days_remaining > 0 ? `${timeline.days_remaining}d left` : 'Overdue'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-5 h-5 text-text-muted" />
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

export default PartnerSLADashboard;