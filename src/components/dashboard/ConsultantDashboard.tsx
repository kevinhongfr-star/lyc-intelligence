'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-[#C108AB]" />
        <span className="ml-3 text-sm text-[#8C857D]">Loading dashboard...</span>
      </div>
    );
  }

  const myKPIs = kpisData.filter((k: any) => k.applies_to === 'individual' || k.category === 'activity');

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#1A1714] tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-[#8C857D] mt-1">Your pipeline and activity overview</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white" style={{ boxShadow: '0 1px 3px rgba(26,23,20,0.04)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#1A7D42] animate-pulse" />
          <span className="text-xs font-medium text-[#8C857D]">Live data</span>
        </div>
      </div>

      {/* ── Top Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="My Candidates"
          value={pipelineData?.summary?.total_active || 0}
          icon={Users}
          color="blue"
          subtitle={`${pipelineData?.summary?.engagement_rate || 0}% engagement`}
          onClick={() => navigate('/platform/candidates')}
        />
        <StatCard
          title="Engaged"
          value={pipelineData?.summary?.engaged || 0}
          icon={Target}
          color="green"
          subtitle="actively in conversation"
          onClick={() => navigate('/platform/pipeline')}
        />
        <StatCard
          title="This Week"
          value={velocityData?.candidates_advancing_per_week || 0}
          icon={TrendingUp}
          color="fuchsia"
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

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Funnel */}
        <div className="lg:col-span-2">
          <PipelineFunnel
            funnel={pipelineData?.funnel || {}}
            conversions={pipelineData?.conversions || {}}
            onStageClick={(stage) => navigate(`/platform/pipeline?stage=${stage}`)}
          />
        </div>

        {/* Today's Actions */}
        <div
          className="bg-white"
          style={{ boxShadow: '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)' }}
        >
          <div className="px-6 py-5 border-b border-[#F0EDEA]">
            <h3 className="font-serif font-bold text-base text-[#1A1714]">Today's Actions</h3>
          </div>
          <div className="divide-y divide-[#F5F3F0]">
            {[
              {
                icon: Mail,
                iconColor: '#2C5282',
                iconBg: 'rgba(44,82,130,0.06)',
                title: 'Follow up on emails',
                detail: `${Math.round((pipelineData?.funnel?.S3_Contacted || 0) * 0.3)} candidates need follow-up`,
                action: () => navigate('/platform/notifications'),
              },
              {
                icon: MessageCircle,
                iconColor: '#1A7D42',
                iconBg: 'rgba(26,125,66,0.06)',
                title: 'WeChat check-ins',
                detail: `${pipelineData?.funnel?.S6_WeChat_Added || 0} candidates to check in with`,
                action: () => navigate('/platform/notifications'),
              },
              {
                icon: Phone,
                iconColor: '#7C3AED',
                iconBg: 'rgba(124,58,237,0.06)',
                title: 'Scheduling calls',
                detail: `${pipelineData?.funnel?.S7_Interested || 0} interested candidates`,
                action: () => navigate('/platform/scheduler'),
              },
              {
                icon: Calendar,
                iconColor: '#B8860B',
                iconBg: 'rgba(184,134,11,0.06)',
                title: 'Interviews this week',
                detail: `${(pipelineData?.funnel?.S11_Internal_Interview || 0) + (pipelineData?.funnel?.S13_Client_Int_Scheduled || 0)} upcoming`,
                action: () => navigate('/platform/scheduler'),
              },
            ].map((action, idx) => (
              <button
                key={idx}
                onClick={action.action}
                className="flex items-center gap-4 px-6 py-4 w-full text-left transition-colors duration-150 hover:bg-[#FAF9F7]"
                style={{ background: 'transparent' }}
              >
                <div
                  className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                  style={{ background: action.iconBg }}
                >
                  <action.icon className="w-4.5 h-4.5" style={{ color: action.iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A1714]">{action.title}</p>
                  <p className="text-xs text-[#8C857D] mt-0.5">{action.detail}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Second Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal KPIs */}
        <div className="lg:col-span-1">
          <div
            className="bg-white h-full"
            style={{ boxShadow: '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)' }}
          >
            <div className="px-6 py-5 border-b border-[#F0EDEA]">
              <h3 className="font-serif font-bold text-base text-[#1A1714]">My Performance</h3>
            </div>
            <div className="px-6 py-4 space-y-5">
              {myKPIs.slice(0, 4).map((kpi: any) => {
                const progress = Math.min(kpi.progress_percent || 0, 100);
                const barColor = kpi.status === 'met' ? '#1A7D42' : kpi.status === 'on_track' ? '#2C5282' : '#B8860B';
                const statusColor = kpi.status === 'met' ? '#1A7D42' : kpi.status === 'on_track' ? '#2C5282' : '#B8860B';

                return (
                  <div key={kpi.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[#1A1714]">{kpi.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1A1714]">
                          {kpi.current_value}
                          <span className="text-[#8C857D] font-normal text-xs">/{kpi.target_value}</span>
                        </span>
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: statusColor }}
                        />
                      </div>
                    </div>
                    <div className="h-1.5 bg-[#F0EDEA] overflow-hidden">
                      <div
                        className="h-full transition-all duration-700 ease-out"
                        style={{ width: `${progress}%`, background: barColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <ActivityFeed
            items={activityData}
            onActivityClick={(item) => {
              if (item.mandate_id) navigate(`/platform/mandates/${item.mandate_id}`);
              else if (item.candidate_id) navigate(`/platform/candidates/${item.candidate_id}`);
            }}
          />
        </div>
      </div>
    </div>
  );
}
