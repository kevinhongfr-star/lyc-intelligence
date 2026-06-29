'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Activity,
  Target,
  TrendingUp,
  UserCheck,
  Clock,
  Loader2,
  BarChart3,
} from 'lucide-react';
import {
  StatCard,
  PipelineFunnel,
  MandateHealthGrid,
  ActivityFeed,
  ConsultantLeaderboard,
  BottleneckAlert,
} from './DashboardWidgets';

export function TeamLeadDashboard() {
  const [loading, setLoading] = useState(true);
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [velocityData, setVelocityData] = useState<any>(null);
  const [mandatesData, setMandatesData] = useState<any[]>([]);
  const [consultantsData, setConsultantsData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [kpisData, setKpisData] = useState<any[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [pipelineRes, velocityRes, mandatesRes, consultantsRes, activityRes, kpisRes] = await Promise.all([
        fetch('/api/analytics/pipeline?scope=platform'),
        fetch('/api/analytics/velocity'),
        fetch('/api/analytics/mandates'),
        fetch('/api/analytics/consultants'),
        fetch('/api/analytics/activity?limit=20'),
        fetch('/api/analytics/kpis'),
      ]);

      const [pipeline, velocity, mandates, consultants, activity, kpis] = await Promise.all([
        pipelineRes.json(),
        velocityRes.json(),
        mandatesRes.json(),
        consultantsRes.json(),
        activityRes.json(),
        kpisRes.json(),
      ]);

      if (pipeline.success) setPipelineData(pipeline);
      if (velocity.success) setVelocityData(velocity);
      if (mandates.success) setMandatesData(mandates.mandates || []);
      if (consultants.success) setConsultantsData(consultants.consultants || []);
      if (activity.success) setActivityData(activity.items || []);
      if (kpis.success) setKpisData(kpis.kpis || []);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-text-muted">Loading team dashboard...</span>
      </div>
    );
  }

  // Calculate workload distribution
  const totalCandidates = consultantsData.reduce(
    (sum, c) => sum + (c.pipeline_count || 0), 0
  );
  const avgPerConsultant = consultantsData.length
    ? Math.round(totalCandidates / consultantsData.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Team Dashboard</h1>
          <p className="text-text-muted mt-1">Team performance and workload overview</p>
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

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Team Pipeline"
          value={pipelineData?.summary?.total_active || 0}
          icon={Users}
          color="blue"
          subtitle={`${consultantsData.length} consultants`}
        />
        <StatCard
          title="Engagement Rate"
          value={`${pipelineData?.summary?.engagement_rate || 0}%`}
          icon={Target}
          color="green"
          subtitle={`${pipelineData?.summary?.engaged || 0} engaged candidates`}
        />
        <StatCard
          title="Weekly Advances"
          value={velocityData?.candidates_advancing_per_week || 0}
          icon={TrendingUp}
          color="purple"
          subtitle="candidates progressing"
        />
        <StatCard
          title="Active Mandates"
          value={mandatesData.length}
          icon={UserCheck}
          color="amber"
          subtitle={`${mandatesData.filter(m => m.health_label === 'healthy').length} healthy`}
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

        {/* Consultant Leaderboard */}
        <div>
          <ConsultantLeaderboard consultants={consultantsData} />
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload Distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-text-primary mb-4">Workload Distribution</h3>
          <div className="space-y-3">
            {consultantsData.map(c => {
              const percent = totalCandidates > 0
                ? Math.round((c.pipeline_count / totalCandidates) * 100)
                : 0;
              const loadLevel = c.pipeline_count > avgPerConsultant * 1.3
                ? 'high'
                : c.pipeline_count < avgPerConsultant * 0.7
                ? 'low'
                : 'balanced';
              const barColor = loadLevel === 'high'
                ? 'bg-amber-500'
                : loadLevel === 'low'
                ? 'bg-blue-400'
                : 'bg-emerald-500';

              return (
                <div key={c.consultant_id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-text-primary">{c.name}</span>
                    <span className="text-text-muted">
                      {c.pipeline_count} candidates ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 bg-bg-alt rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-border text-xs text-text-muted flex items-center gap-4">
            <span>Avg: {avgPerConsultant} candidates / consultant</span>
          </div>
        </div>

        {/* Activity Feed */}
        <ActivityFeed items={activityData} />
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mandate Health */}
        <MandateHealthGrid mandates={mandatesData} />

        {/* Velocity Stats */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-text-primary mb-4">Team Velocity</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-bg-alt rounded-lg text-center">
              <Activity className="w-5 h-5 text-blue-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-text-primary">
                {velocityData?.total_transitions_90d || 0}
              </p>
              <p className="text-xs text-text-muted">transitions (90d)</p>
            </div>
            <div className="p-4 bg-bg-alt rounded-lg text-center">
              <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-text-primary">
                {velocityData?.candidates_advancing_per_week || 0}/wk
              </p>
              <p className="text-xs text-text-muted">advancement rate</p>
            </div>
            <div className="p-4 bg-bg-alt rounded-lg text-center">
              <Clock className="w-5 h-5 text-purple-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-text-primary">
                {Object.keys(velocityData?.avg_days_per_transition || {}).length}
              </p>
              <p className="text-xs text-text-muted">stage transitions tracked</p>
            </div>
            <div className="p-4 bg-bg-alt rounded-lg text-center">
              <Target className="w-5 h-5 text-amber-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-text-primary">
                {pipelineData?.summary?.advancement_rate || 0}%
              </p>
              <p className="text-xs text-text-muted">advancement to S11+</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamLeadDashboard;
