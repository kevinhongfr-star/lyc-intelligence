'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Target,
  TrendingUp,
  CheckSquare,
  Clock,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  BarChart3,
} from 'lucide-react';
import {
  StatCard,
  PipelineFunnel,
  ActivityFeed,
} from './DashboardWidgets';
import { authFetch } from '@/utils/authFetch';

export function ConsultantDashboard() {
  const [loading, setLoading] = useState(true);
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [velocityData, setVelocityData] = useState<any>(null);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [kpisData, setKpisData] = useState<any[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [pipelineRes, velocityRes, activityRes, kpisRes] = await Promise.all([
        authFetch('/api/analytics/pipeline?scope=personal'),
        authFetch('/api/analytics/velocity'),
        authFetch('/api/analytics/activity?limit=15'),
        authFetch('/api/analytics/kpis'),
      ]);

      const [pipeline, velocity, activity, kpis] = await Promise.all([
        pipelineRes.json(),
        velocityRes.json(),
        activityRes.json(),
        kpisRes.json(),
      ]);

      if (pipeline.success) setPipelineData(pipeline);
      if (velocity.success) setVelocityData(velocity);
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
        <span className="ml-3 text-text-muted">Loading your dashboard...</span>
      </div>
    );
  }

  const myKPIs = kpisData.filter((k: any) => k.applies_to === 'individual' || k.category === 'activity');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Dashboard</h1>
          <p className="text-text-muted mt-1">Your pipeline and activity overview</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <BarChart3 className="w-4 h-4" />
          <span>Real-time data</span>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Candidates"
          value={pipelineData?.summary?.total_active || 0}
          icon={Users}
          color="blue"
          subtitle={`${pipelineData?.summary?.engagement_rate || 0}% engagement`}
        />
        <StatCard
          title="Engaged"
          value={pipelineData?.summary?.engaged || 0}
          icon={Target}
          color="green"
          subtitle="actively in conversation"
        />
        <StatCard
          title="This Week"
          value={velocityData?.candidates_advancing_per_week || 0}
          icon={TrendingUp}
          color="purple"
          subtitle="stage advances"
        />
        <StatCard
          title="Placements"
          value={pipelineData?.summary?.closed || 0}
          icon={CheckSquare}
          color="amber"
          subtitle="total closed won"
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

        {/* Today's Actions */}
        <div className="bg-card border border-border rounded-none p-5">
          <h3 className="font-semibold text-text-primary mb-4">Today's Actions</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-bg-alt rounded-none">
              <div className="w-10 h-10 rounded-none bg-blue-50 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">Follow up on emails</p>
                <p className="text-xs text-text-muted">
                  {Math.round((pipelineData?.funnel?.S3_Contacted || 0) * 0.3)} candidates need follow-up
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-bg-alt rounded-none">
              <div className="w-10 h-10 rounded-none bg-green-50 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">WeChat check-ins</p>
                <p className="text-xs text-text-muted">
                  {pipelineData?.funnel?.S6_WeChat_Added || 0} candidates to check in with
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-bg-alt rounded-none">
              <div className="w-10 h-10 rounded-none bg-purple-50 flex items-center justify-center">
                <Phone className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">Scheduling calls</p>
                <p className="text-xs text-text-muted">
                  {pipelineData?.funnel?.S7_Interested || 0} interested candidates
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-bg-alt rounded-none">
              <div className="w-10 h-10 rounded-none bg-amber-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">Interviews this week</p>
                <p className="text-xs text-text-muted">
                  {(pipelineData?.funnel?.S11_Internal_Interview || 0) +
                   (pipelineData?.funnel?.S13_Client_Int_Scheduled || 0)} upcoming
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal KPIs */}
        <div className="bg-card border border-border rounded-none p-5">
          <h3 className="font-semibold text-text-primary mb-4">My Performance</h3>
          <div className="space-y-4">
            {myKPIs.slice(0, 4).map((kpi: any) => {
              const progress = Math.min(kpi.progress_percent || 0, 100);
              const statusColor = kpi.status === 'met'
                ? 'bg-emerald-500'
                : kpi.status === 'on_track'
                ? 'bg-blue-500'
                : 'bg-amber-500';

              return (
                <div key={kpi.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-text-primary">{kpi.name}</span>
                    <span className="text-text-muted">
                      {kpi.current_value} / {kpi.target_value}
                    </span>
                  </div>
                  <div className="h-2 bg-bg-alt rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${statusColor} transition-all`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <ActivityFeed items={activityData} />
        </div>
      </div>

      {/* Velocity */}
      <div className="bg-card border border-border rounded-none p-5">
        <h3 className="font-semibold text-text-primary mb-4">My Pipeline Velocity</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-bg-alt rounded-none">
            <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-text-primary">
              {velocityData?.candidates_advancing_per_week || 0}
            </p>
            <p className="text-xs text-text-muted">advancing / week</p>
          </div>
          <div className="text-center p-4 bg-bg-alt rounded-none">
            <Clock className="w-5 h-5 text-blue-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-text-primary">
              {velocityData?.total_transitions_90d || 0}
            </p>
            <p className="text-xs text-text-muted">transitions (90d)</p>
          </div>
          <div className="text-center p-4 bg-bg-alt rounded-none">
            <Target className="w-5 h-5 text-purple-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-text-primary">
              {pipelineData?.summary?.advancement_rate || 0}%
            </p>
            <p className="text-xs text-text-muted">to S11+ stage</p>
          </div>
          <div className="text-center p-4 bg-bg-alt rounded-none">
            <CheckSquare className="w-5 h-5 text-amber-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-text-primary">
              {pipelineData?.summary?.placement_rate || 0}%
            </p>
            <p className="text-xs text-text-muted">placement rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConsultantDashboard;
