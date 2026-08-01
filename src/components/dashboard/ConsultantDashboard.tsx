'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, Target, TrendingUp, CheckSquare,
  Loader2, Mail, MessageCircle, Phone,
} from 'lucide-react';
import { StatCard, PipelineFunnel, ActivityFeed } from './DashboardWidgets';
import { TodayFocus } from './TodayFocus';
import { MyMandateCards } from './MyMandateCards';
import { ConsultantOnboarding } from './ConsultantOnboarding';
import { authFetch } from '@/utils/authFetch';
import { useAuthStore } from '@/stores/authStore';

export function ConsultantDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [velocityData, setVelocityData] = useState<any>(null);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [kpisData, setKpisData] = useState<any[]>([]);

  useEffect(() => { loadAllData(); }, []);


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
        pipelineRes.json(), velocityRes.json(), activityRes.json(), kpisRes.json(),
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

  // Show the onboarding flow for consultants who haven't completed it yet.
  if (profile && !profile.onboarding_completed) {
    return <ConsultantOnboarding />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-5 h-5 animate-spin text-[#C108AB]" />
        <span className="ml-3 text-sm text-[#737373]">Loading...</span>
      </div>
    );
  }

  const myKPIs = kpisData.filter((k: any) => k.applies_to === 'individual' || k.category === 'activity');

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#171717] tracking-tight">Dashboard</h1>
        <p className="text-sm text-[#737373] mt-1">Your pipeline and activity overview</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="My Candidates" value={pipelineData?.summary?.total_active || 0} icon={Users} color="blue"
          subtitle={`${pipelineData?.summary?.engagement_rate || 0}% engagement`} onClick={() => navigate('/app/candidates')} />
        <StatCard title="Engaged" value={pipelineData?.summary?.engaged || 0} icon={Target} color="green"
          subtitle="actively in conversation" onClick={() => navigate('/app/pipeline')} />
        <StatCard title="This Week" value={velocityData?.candidates_advancing_per_week || 0} icon={TrendingUp} color="fuchsia"
          subtitle="stage advances" />
        <StatCard title="Placements" value={pipelineData?.summary?.closed || 0} icon={CheckSquare} color="amber"
          subtitle="total closed won" />
      </div>

      {/* My Active Mandates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#171717]">My Active Mandates</h2>
        </div>
        <MyMandateCards />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <PipelineFunnel funnel={pipelineData?.funnel || {}} conversions={pipelineData?.conversions || {}}
            onStageClick={(stage) => navigate(`/app/pipeline?stage=${stage}`)} />
        </div>

        {/* Today's Focus */}
        <TodayFocus />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 bg-white border border-[#E5E5E5]">
          <div className="px-5 py-4 border-b border-[#E5E5E5]">
            <h3 className="font-semibold text-[15px] text-[#171717]">My Performance</h3>
          </div>
          <div className="px-5 py-4 space-y-5">
            {myKPIs.slice(0, 4).map((kpi: any) => {
              const progress = Math.min(kpi.progress_percent || 0, 100);
              const barColor = kpi.status === 'met' ? '#16A34A' : kpi.status === 'on_track' ? '#2563EB' : '#CA8A04';
              return (
                <div key={kpi.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[#171717]">{kpi.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#171717] tabular-nums">
                        {kpi.current_value}<span className="text-[#737373] font-normal text-xs">/{kpi.target_value}</span>
                      </span>
                      <div className="w-2 h-2" style={{ background: barColor }} />
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#F7F7F7] overflow-hidden">
                    <div className="h-full transition-all duration-500 ease-out" style={{ width: `${progress}%`, background: barColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2">
          <ActivityFeed items={activityData}
            onActivityClick={(item) => {
              if (item.mandate_id) navigate(`/app/mandates/${item.mandate_id}`);
              else if (item.candidate_id) navigate(`/app/candidates/${item.candidate_id}`);
            }} />
        </div>
      </div>
    </div>
  );
}
