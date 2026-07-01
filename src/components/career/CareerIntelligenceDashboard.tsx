'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  Target,
  Bell,
  PlayCircle,
  Activity,
  Sparkles,
  Clock,
  Award,
  BarChart3,
  ArrowRight,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  const colorClasses: Record<string, { bg: string; text: string; iconBg: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-700', iconBg: 'bg-emerald-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', iconBg: 'bg-purple-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100' },
    red: { bg: 'bg-red-50', text: 'text-red-700', iconBg: 'bg-red-100' },
    gray: { bg: 'bg-gray-50', text: 'text-gray-700', iconBg: 'bg-gray-100' },
  };
  const c = colorClasses[color] || colorClasses.gray;

  return (
    <div className={`p-5 rounded-xl border border-border bg-card`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-muted">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${c.text}`}>{value}</p>
          {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${c.iconBg}`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
      </div>
    </div>
  );
}

const TIER_COLORS: Record<string, string> = {
  ALPHA: 'bg-purple-500',
  BETA: 'bg-blue-500',
  GAMMA: 'bg-gray-400',
  DORMANT: 'bg-gray-200',
};

const NURTURE_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-500',
  PAUSED: 'bg-gray-400',
  COMPLETED: 'bg-blue-500',
  CONVERTED: 'bg-purple-500',
  DECLINED: 'bg-red-500',
};

export function CareerIntelligenceDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [nurtureQueue, setNurtureQueue] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'nurture' | 'signals'>('overview');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  useEffect(() => {
    loadData();
  }, [activeTab, tierFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await fetch('/api/career/dashboard');
        const data = await res.json();
        if (data.success) setDashboardData(data);
      }
      if (activeTab === 'leaderboard') {
        const url = tierFilter === 'ALL'
          ? '/api/career/engagement-leaderboard?limit=50'
          : `/api/career/engagement-leaderboard?tier=${tierFilter}&limit=50`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) setLeaderboard(data.candidates || []);
      }
      if (activeTab === 'nurture') {
        const res = await fetch('/api/career/nurture/queue');
        const data = await res.json();
        if (data.success) setNurtureQueue(data.sequences || []);
      }
    } catch (e) {
      console.error('Failed to load career dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !dashboardData && activeTab === 'overview') {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-text-muted">Loading career intelligence...</span>
      </div>
    );
  }

  const tierDist = dashboardData?.tier_distribution || { ALPHA: 0, BETA: 0, GAMMA: 0, DORMANT: 0 };
  const totalCandidates = Object.values(tierDist).reduce((a: number, b: number) => a + b, 0);
  const nurturePipeline = dashboardData?.nurture_pipeline || { by_status: {}, total_touches: 0, total_responses: 0, response_rate: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Career Intelligence</h1>
          <p className="text-text-muted mt-1">Passive candidate nurturing and market intelligence</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <BarChart3 className="w-4 h-4" />
          <span>
            {totalCandidates} candidates tracked
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg-alt rounded-lg w-fit">
        {[
          { key: 'overview', label: 'Overview', icon: Activity },
          { key: 'leaderboard', label: 'Leaderboard', icon: Award },
          { key: 'nurture', label: 'Nurture Queue', icon: PlayCircle },
          { key: 'signals', label: 'Signal Alerts', icon: Bell },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-sm rounded-md flex items-center gap-2 transition-colors ${
              activeTab === tab.key
                ? 'bg-card text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Alpha Candidates"
              value={tierDist.ALPHA}
              icon={Award}
              color="purple"
              subtitle="Highest engagement tier"
            />
            <StatCard
              title="Beta Candidates"
              value={tierDist.BETA}
              icon={TrendingUp}
              color="blue"
              subtitle="Growing engagement"
            />
            <StatCard
              title="Active Nurture"
              value={nurturePipeline.by_status?.ACTIVE || 0}
              icon={PlayCircle}
              color="green"
              subtitle={`${nurturePipeline.response_rate || 0}% response rate`}
            />
            <StatCard
              title="Signal Alerts"
              value={dashboardData?.pending_signal_alerts || 0}
              icon={Bell}
              color="amber"
              subtitle="Candidates with signals"
            />
          </div>

          {/* Tier Distribution + Nurture Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tier Distribution */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-text-primary mb-4">Tier Distribution</h3>
              <div className="space-y-4">
                {Object.entries(tierDist).map(([tier, count]) => {
                  const pct = totalCandidates > 0 ? Math.round(((count as number) / totalCandidates) * 100) : 0;
                  return (
                    <div key={tier} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-text-primary capitalize">{tier}</span>
                        <span className="text-text-muted">{count as number} ({pct}%)</span>
                      </div>
                      <div className="h-3 bg-bg-alt rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${TIER_COLORS[tier] || 'bg-gray-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nurture Pipeline */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-text-primary mb-4">Nurture Pipeline</h3>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {['ACTIVE', 'PAUSED', 'COMPLETED', 'CONVERTED', 'DECLINED'].map(status => (
                  <div key={status} className="text-center">
                    <div className={`w-full h-16 rounded-lg flex items-center justify-center ${
                      (nurturePipeline.by_status?.[status] || 0) > 0
                        ? NURTURE_STATUS_COLORS[status] + '/20'
                        : 'bg-bg-alt'
                    }`}>
                      <span className={`text-xl font-bold ${
                        (nurturePipeline.by_status?.[status] || 0) > 0
                          ? ''
                          : 'text-text-muted'
                      }`}>
                        {nurturePipeline.by_status?.[status] || 0}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-1 capitalize">{status.toLowerCase()}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm pt-3 border-t border-border">
                <span className="text-text-muted">Total Touches Sent</span>
                <span className="font-medium text-text-primary">{nurturePipeline.total_touches || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2">
                <span className="text-text-muted">Responses Received</span>
                <span className="font-medium text-text-primary">{nurturePipeline.total_responses || 0}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-blue-500" />
                <h4 className="font-medium text-text-primary">Due This Week</h4>
              </div>
              <p className="text-3xl font-bold text-text-primary">{dashboardData?.nurture_due_7d || 0}</p>
              <p className="text-sm text-text-muted mt-1">nurture touches scheduled</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <h4 className="font-medium text-text-primary">Stale Benchmarks</h4>
              </div>
              <p className="text-3xl font-bold text-text-primary">{dashboardData?.benchmarks_stale || 0}</p>
              <p className="text-sm text-text-muted mt-1">need refresh (90+ days)</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-emerald-500" />
                <h4 className="font-medium text-text-primary">Avg Engagement</h4>
              </div>
              <p className="text-3xl font-bold text-text-primary">
                {totalCandidates > 0 ? Math.round((tierDist.ALPHA + tierDist.BETA) / totalCandidates * 100) : 0}%
              </p>
              <p className="text-sm text-text-muted mt-1">in Alpha/Beta tiers</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            {['ALL', 'ALPHA', 'BETA', 'GAMMA', 'DORMANT'].map(tier => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  tierFilter === tier
                    ? 'bg-primary text-white border-primary'
                    : 'border-border text-text-muted hover:text-text-primary'
                }`}
              >
                {tier === 'ALL' ? 'All Tiers' : tier}
              </button>
            ))}
          </div>

          {/* Leaderboard Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-alt">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Candidate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Tier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Engagement</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Last Engaged</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Nurture</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                        No candidates found
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((c: any, i: number) => (
                      <tr key={c.id} className="hover:bg-bg-alt/50">
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                            i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-bg-alt text-text-muted'
                          }`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-text-primary">{c.full_name}</p>
                          <p className="text-xs text-text-muted">
                            {c.current_role} {c.current_company ? `at ${c.current_company}` : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            c.career_tier === 'ALPHA' ? 'bg-purple-100 text-purple-700' :
                            c.career_tier === 'BETA' ? 'bg-blue-100 text-blue-700' :
                            c.career_tier === 'GAMMA' ? 'bg-gray-100 text-gray-700' :
                            'bg-gray-50 text-gray-400'
                          }`}>
                            {c.career_tier}
                          </span>
                        </td>
                        <td className="px-4 py-3 w-40">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-bg-alt rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  c.engagement_score >= 70 ? 'bg-emerald-500' :
                                  c.engagement_score >= 40 ? 'bg-amber-500' :
                                  'bg-gray-300'
                                }`}
                                style={{ width: `${c.engagement_score || 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-text-muted w-8">{c.engagement_score || 0}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-muted">
                          {c.last_engaged_at
                            ? new Date(c.last_engaged_at).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${
                            c.nurture_stage === 'RESPONDED' ? 'text-green-600' :
                            c.nurture_stage === 'ENGAGED' ? 'text-blue-600' :
                            'text-text-muted'
                          }`}>
                            {c.nurture_stage || 'Not enrolled'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Nurture Queue Tab */}
      {activeTab === 'nurture' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">Upcoming Nurture Touches</h3>
            <span className="text-sm text-text-muted">{nurtureQueue.length} sequences</span>
          </div>
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
              </div>
            ) : nurtureQueue.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                No upcoming nurture touches
              </div>
            ) : (
              nurtureQueue.map((seq: any) => {
                const contact = seq.contacts;
                const isDue = new Date(seq.next_touch_at) < new Date();
                return (
                  <div key={seq.id} className="p-4 hover:bg-bg-alt/30 flex items-center gap-4">
                    <div className={`w-1 h-10 rounded-full ${
                      isDue ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {contact?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {contact?.current_role} {contact?.current_company ? `at ${contact?.current_company}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-text-primary">{seq.sequence_type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-text-muted">
                        Step {seq.current_step}/{seq.total_steps} · {seq.touch_count} touches
                      </p>
                    </div>
                    <div className="text-right w-32">
                      <p className={`text-sm font-medium ${isDue ? 'text-red-600' : 'text-text-primary'}`}>
                        {new Date(seq.next_touch_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-text-muted">
                        {isDue ? 'Overdue' : 'Scheduled'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Signals Tab */}
      {activeTab === 'signals' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-text-primary mb-2">Movement Signal Alerts</h3>
            <p className="text-sm text-text-muted mb-4">
              Candidates with detected movement signals that may indicate openness to new opportunities
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-text-muted">Critical/High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-text-muted">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-sm text-text-muted">Low</span>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Bell className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
            <p className="text-text-muted">
              Signal detection runs daily. {dashboardData?.pending_signal_alerts || 0} candidates have active signals.
            </p>
            <p className="text-sm text-text-muted mt-2">
              View individual candidate profiles to see their specific signals.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CareerIntelligenceDashboard;
