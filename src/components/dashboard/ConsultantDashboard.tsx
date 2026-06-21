import React, { useState } from 'react';
import { BarChart3, Users, Briefcase, TrendingUp, CheckCircle2, Zap, Loader2, Activity, Clock, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { useAuth } from '@/contexts';
import { STAGE_CONFIG, STAGE_ORDER } from '@/types/mandate';
import { useDashboard } from '@/hooks/useSupabaseData';
import { CommandCenter } from './CommandCenter';

const STATUS_LABELS: Record<string, string> = { '1_search': 'Screened', '2_call': 'Client Submitted', '3_deliver': 'Interview', 'won': 'Won', 'on_hold': 'On Hold', 'lost': 'Lost', 'completed': 'Completed' };

const TIER_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  S: { color: '#D4AF37', bg: 'rgba(212,175,55,0.12)', label: 'S — C-Suite Elite' },
  A: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)', label: 'A — Senior Leader' },
  B: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', label: 'B — Mid-Senior' },
  C: { color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', label: 'C — Emerging' },
};

function TierBar({ tier, count, total }: { tier: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.C;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
        <span className="text-text-muted">{count} ({pct.toFixed(1)}%)</span>
      </div>
      <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
      </div>
    </div>
  );
}

function ActivityItem({ item }: { item: any }) {
  const icon = item.type === 'scoring' ? <Award className="w-4 h-4" /> : <Users className="w-4 h-4" />;
  const color = item.type === 'scoring' ? 'text-accent bg-accent/10' : 'text-blue-500 bg-blue-500/10';
  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-bg-tertiary last:border-0">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">{item.title}</p>
        <p className="text-xs text-text-muted truncate">{item.detail}</p>
      </div>
      <span className="text-[10px] text-text-muted whitespace-nowrap flex-shrink-0">{timeAgo(item.timestamp)}</span>
    </div>
  );
}

export function ConsultantDashboard() {
  const { user } = useAuth();
  const { data, loading } = useDashboard();
  const [activeTab, setActiveTab] = useState<'overview' | 'command'>('overview');

  const stats = data?.stats;
  const mandates = data?.mandates || [];
  const tiers = data?.tierDistribution || { S: 0, A: 0, B: 0, C: 0 };
  const activity = data?.recentActivity || [];
  const totalTier = tiers.S + tiers.A + tiers.B + tiers.C;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Good morning, {user?.name?.split(' ')[0]}</h1>
          <p className="text-text-secondary">Here's your pipeline overview for today</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 text-sm rounded-lg min-h-[44px] ${activeTab === 'overview' ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted'}`}>Overview</button>
          <button onClick={() => setActiveTab('command')} className={`px-4 py-2 text-sm rounded-lg min-h-[44px] ${activeTab === 'command' ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted'}`}>Command Center</button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-sweep/20 flex items-center justify-center"><Briefcase className="w-5 h-5 text-sweep-light" /></div><div><p className="text-2xl font-bold text-text-primary">{loading ? '—' : ((stats?.mandatesByStatus?.['1_search'] ?? 0) + (stats?.mandatesByStatus?.['2_call'] ?? 0) + (stats?.mandatesByStatus?.['3_deliver'] ?? 0))}</p><p className="text-xs text-text-muted">Active Mandates</p></div></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-sweep/20 flex items-center justify-center"><Users className="w-5 h-5 text-sweep-light" /></div><div><p className="text-2xl font-bold text-text-primary">{loading ? '—' : stats?.totalContacts?.toLocaleString() ?? '0'}</p><p className="text-xs text-text-muted">Total Candidates</p></div></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-tier-1Bg flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-tier-1" /></div><div><p className="text-2xl font-bold text-tier-1">{loading ? '—' : stats?.totalCompanies?.toLocaleString() ?? '0'}</p><p className="text-xs text-text-muted">Companies</p></div></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-tier-1Bg flex items-center justify-center"><TrendingUp className="w-5 h-5 text-tier-1" /></div><div><p className="text-2xl font-bold text-tier-1">{loading ? '—' : stats?.totalProposals ?? 0}</p><p className="text-xs text-text-muted">Proposals</p></div></div></CardContent></Card>
          </div>

          {/* Two-column: Mandates + Tier/Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mandates — 2/3 width */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Active Mandates</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {loading ? <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-text-muted" /></div> :
                    mandates.slice(0, 5).map((m: any) => (
                      <div key={m.id} className="p-4 bg-bg-tertiary rounded-lg">
                        <div className="flex items-center justify-between mb-3"><div><h3 className="font-medium text-text-primary">{m.title}</h3><p className="text-sm text-text-muted">{STATUS_LABELS[m.status] ?? m.status}</p></div><Badge variant={m.status === 'won' ? 'success' : 'default'}>{STATUS_LABELS[m.status] ?? m.status}</Badge></div>
                        <div className="flex gap-1">{PIPELINE_STAGES.map(s => { const c = s === 'screened' ? m.tier1_count : s === 'client_submitted' ? m.tier2_count : s === 'client_approved' ? m.shortlisted_count : s === 'interview_1' ? m.interview_count : m.placed_count; return <div key={s} className="flex-1 h-8 rounded flex items-center justify-center text-xs font-medium" style={{ backgroundColor: `${STAGE_COLOR[s].color}20`, color: STAGE_CONFIG[s] }}>{c}</div>; })}</div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>

            {/* Right column: Tier distribution + Activity feed */}
            <div className="space-y-6">
              {/* Tier Distribution */}
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-accent" />Talent Tier Distribution</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-text-muted" /></div>
                  ) : (
                    <>
                      <TierBar tier="S" count={tiers.S} total={totalTier} />
                      <TierBar tier="A" count={tiers.A} total={totalTier} />
                      <TierBar tier="B" count={tiers.B} total={totalTier} />
                      <TierBar tier="C" count={tiers.C} total={totalTier} />
                      <p className="text-[10px] text-text-muted pt-1 border-t border-bg-tertiary">Based on TRIDENT composite scores across {totalTier.toLocaleString()} contacts</p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Activity Feed */}
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="w-4 h-4 text-accent" />Recent Activity</CardTitle></CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-text-muted" /></div>
                  ) : activity.length === 0 ? (
                    <p className="text-sm text-text-muted text-center py-4">No recent activity</p>
                  ) : (
                    activity.slice(0, 8).map((item: any, i: number) => <ActivityItem key={`${item.type}-${item.id}-${i}`} item={item} />)
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : <CommandCenter />}
    </div>
  );
}
