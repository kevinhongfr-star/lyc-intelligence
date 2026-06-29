'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  Target,
  TrendingUp,
  Activity,
  AlertTriangle,
  Loader2,
  BarChart3,
} from 'lucide-react';
import {
  StatCard,
  PipelineFunnel,
  KPIScorecard,
  MandateHealthGrid,
  ActivityFeed,
  ConsultantLeaderboard,
  BottleneckAlert,
} from './DashboardWidgets';

export function ExecutiveDashboard() {
  const [loading, setLoading] = useState(true);
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [velocityData, setVelocityData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [mandatesData, setMandatesData] = useState<any[]>([]);
  const [kpisData, setKpisData] = useState<any[]>([]);
  const [consultantsData, setConsultantsData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [pipelineRes, velocityRes, revenueRes, mandatesRes, kpisRes, consultantsRes, activityRes] = await Promise.all([
        fetch('/api/analytics/pipeline?scope=platform'),
        fetch('/api/analytics/velocity'),
        fetch('/api/analytics/revenue'),
        fetch('/api/analytics/mandates'),
        fetch('/api/analytics/kpis'),
        fetch('/api/analytics/consultants'),
        fetch('/api/analytics/activity?limit=20'),
      ]);

      const [pipeline, velocity, revenue, mandates, kpis, consultants, activity] = await Promise.all([
        pipelineRes.json(),
        velocityRes.json(),
        revenueRes.json(),
        mandatesRes.json(),
        kpisRes.json(),
        consultantsRes.json(),
        activityRes.json(),
      ]);

      if (pipeline.success) setPipelineData(pipeline);
      if (velocity.success) setVelocityData(velocity);
      if (revenue.success) setRevenueData(revenue);
      if (mandates.success) setMandatesData(mandates.mandates || []);
      if (kpis.success) setKpisData(kpis.kpis || []);
      if (consultants.success) setConsultantsData(consultants.consultants || []);
      if (activity.success) setActivityData(activity.items || []);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-text-muted">Loading executive dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Executive Dashboard</h1>
          <p className="text-text-muted mt-1">Platform-wide metrics and strategic overview</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <BarChart3 className="w-4 h-4" />
          <span>Real-time data</span>
        </div>
      </div>

      {/* Bottleneck Alerts */}
      {velocityData?.bottlenecks?.length > 0 && (
        <BottleneckAlert bottlenecks={velocityData.bottlenecks} />
      )}

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Candidates"
          value={pipelineData?.summary?.total_active || 0}
          change={5}
          icon={Users}
          color="blue"
          subtitle={`${pipelineData?.summary?.engagement_rate || 0}% engagement rate`}
        />
        <StatCard
          title="Pipeline Value"
          value={`¥${((revenueData?.total_pipeline_value || 0) / 10000).toFixed(0)}万`}
          change={12}
          icon={DollarSign}
          color="green"
          subtitle={`${revenueData?.active_mandates || 0} active mandates`}
        />
        <StatCard
          title="Placement Rate"
          value={`${pipelineData?.summary?.placement_rate || 0}%`}
          change={2}
          icon={Target}
          color="purple"
          subtitle={`${pipelineData?.summary?.closed || 0} placements total`}
        />
        <StatCard
          title="Team Activity (30d)"
          value={consultantsData.reduce((sum, c) => sum + (c.activity_30d?.outreach || 0), 0)}
          change={8}
          icon={Activity}
          color="amber"
          subtitle={`${consultantsData.length} consultants`}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Funnel */}
        <div className="lg:col-span-2">
          <PipelineFunnel
            funnel={pipelineData?.funnel || {}}
            conversions={pipelineData?.conversions || {}}
          />
        </div>

        {/* KPI Scorecard */}
        <div>
          <KPIScorecard kpis={kpisData} />
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mandate Health */}
        <div className="lg:col-span-2">
          <MandateHealthGrid mandates={mandatesData} />
        </div>

        {/* Consultant Leaderboard */}
        <div>
          <ConsultantLeaderboard consultants={consultantsData} />
        </div>
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Summary */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-text-primary mb-4">Revenue Pipeline</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-bg-alt rounded-lg">
              <p className="text-sm text-text-muted">Active Mandates</p>
              <p className="text-2xl font-bold text-text-primary mt-1">
                {revenueData?.active_mandates || 0}
              </p>
            </div>
            <div className="p-4 bg-bg-alt rounded-lg">
              <p className="text-sm text-text-muted">Total Pipeline Value</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                ¥{((revenueData?.total_pipeline_value || 0) / 10000).toFixed(0)}万
              </p>
            </div>
            <div className="p-4 bg-bg-alt rounded-lg">
              <p className="text-sm text-text-muted">Avg Fee / Mandate</p>
              <p className="text-2xl font-bold text-text-primary mt-1">
                ¥{((revenueData?.avg_fee_per_mandate || 0) / 10000).toFixed(1)}万
              </p>
            </div>
            <div className="p-4 bg-bg-alt rounded-lg">
              <p className="text-sm text-text-muted">Placements This Quarter</p>
              <p className="text-2xl font-bold text-text-primary mt-1">
                {revenueData?.placements_this_quarter || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <ActivityFeed items={activityData} />
      </div>

      {/* Velocity Stats */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-text-primary mb-4">Pipeline Velocity</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-bg-alt rounded-lg">
            <TrendingUp className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-text-primary">
              {velocityData?.candidates_advancing_per_week || 0}
            </p>
            <p className="text-xs text-text-muted mt-1">advancing / week</p>
          </div>
          <div className="text-center p-4 bg-bg-alt rounded-lg">
            <Activity className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-text-primary">
              {velocityData?.total_transitions_90d || 0}
            </p>
            <p className="text-xs text-text-muted mt-1">transitions (90d)</p>
          </div>
          <div className="text-center p-4 bg-bg-alt rounded-lg">
            <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-text-primary">
              {velocityData?.backward_rate || 0}%
            </p>
            <p className="text-xs text-text-muted mt-1">backward rate</p>
          </div>
          <div className="text-center p-4 bg-bg-alt rounded-lg">
            <Target className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-text-primary">
              {pipelineData?.summary?.advancement_rate || 0}%
            </p>
            <p className="text-xs text-text-muted mt-1">advancement rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExecutiveDashboard;
