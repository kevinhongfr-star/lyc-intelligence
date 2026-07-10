'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, Target, TrendingUp, CheckSquare,
  Loader2, Mail, MessageCircle, Phone,
} from 'lucide-react';
import { StatCard, PipelineFunnel, ActivityFeed } from './DashboardWidgets';
import { authFetch } from '@/utils/authFetch';

export function ConsultantDashboard() {
  const navigate = useNavigate();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-5 h-5 animate-spin text-[#C108AB]" />
        <span className="ml-3 text-sm text-[#A3A3A3]">Loading...</span>
      </div>
    );
  }

  const myKPIs = kpisData.filter((k: any) => k.applies_to === 'individual' || k.category === 'activity');

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#171717] tracking-tight">Dashboard</h1>
        <p className="text-sm text-[#A3A3A3] mt-1">Your pipeline and activity overview</p>
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <PipelineFunnel funnel={pipelineData?.funnel || {}} conversions={pipelineData?.conversions || {}}
            onStageClick={(stage) => navigate(`/app/pipeline?stage=${stage}`)} />
        </div>

        {/* Today's Actions */}
        <div className="bg-white border border-[#EBEBEB]">
          <div className="px-5 py-4 border-b border-[#EBEBEB]">
            <h3 className="font-semibold text-[15px] text-[#171717]">Today's Actions</h3>
          </div>
          <div className="divide-y divide-[#F7F7F7]">
            {[
              { icon: Mail, color: '#2563EB', bg: 'rgba(37,99,235,0.05)', title: 'Follow up on emails',
                detail: `${Math.round((pipelineData?.funnel?.S3_Contacted || 0) * 0.3)} candidates need follow-up`,
                action: () => navigate('/app/notifications') },
              { icon: MessageCircle, color: '#16A34A', bg: 'rgba(22,163,74,0.05)', title: 'WeChat check-ins',
                detail: `${pipelineData?.funnel?.S6_WeChat_Added || 0} candidates to check in with`,
                action: () => navigate('/app/notifications') },
              { icon: Phone, color: '#7C3AED', bg: 'rgba(124,58,237,0.05)', title: 'Scheduling calls',
                detail: `${pipelineData?.funnel?.S7_Interested || 0} interested candidates`,
                action: () => navigate('/app/scheduler') },
              { icon: Calendar, color: '#CA8A04', bg: 'rgba(202,138,4,0.05)', title: 'Interviews this week',
                detail: `${(pipelineData?.funnel?.S11_Internal_Interview || 0) + (pipelineData?.funnel?.S13_Client_Int_Scheduled || 0)} upcoming`,
                action: () => navigate('/app/scheduler') },
            ].map((action, idx) => (
              <button key={idx} onClick={action.action}
                className="flex items-center gap-3.5 px-5 py-3.5 w-full text-left transition-colors duration-150 hover:bg-[#FAFAFA]">
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: action.bg }}>
                  <action.icon className="w-4 h-4" style={{ color: action.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#171717]">{action.title}</p>
                  <p className="text-xs text-[#A3A3A3] mt-0.5">{action.detail}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 bg-white border border-[#EBEBEB]">
          <div className="px-5 py-4 border-b border-[#EBEBEB]">
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
                        {kpi.current_value}<span className="text-[#A3A3A3] font-normal text-xs">/{kpi.target_value}</span>
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
