import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, Briefcase, TrendingUp, CheckCircle2, Zap, Plus, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { useAuth } from '@/contexts';
import { STAGE_CONFIG, STAGE_ORDER } from '@/types/mandate';
import { useDashboardStats, useMandates } from '@/hooks/useSupabaseData';
import { CommandCenter } from './CommandCenter';

const STATUS_LABELS: Record<string, string> = { '1_search': 'SWEEP', '2_call': 'CANVA', '3_deliver': 'GRID/LENS', 'won': 'Won', 'on_hold': 'On Hold', 'lost': 'Lost', 'completed': 'Completed' };

export function ConsultantDashboard() {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useDashboardStats();
  const { data: mandates, count, loading: mandatesLoading } = useMandates({ limit: 10 });
  const [activeTab, setActiveTab] = useState<'overview' | 'command'>('overview');

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-sweep/20 flex items-center justify-center"><Briefcase className="w-5 h-5 text-sweep-light" /></div><div><p className="text-2xl font-bold text-text-primary">{statsLoading ? '—' : (stats?.mandatesByStatus?.['1_search'] ?? 0) + (stats?.mandatesByStatus?.['2_call'] ?? 0) + (stats?.mandatesByStatus?.['3_deliver'] ?? 0)}</p><p className="text-xs text-text-muted">Active Mandates</p></div></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-sweep/20 flex items-center justify-center"><Users className="w-5 h-5 text-sweep-light" /></div><div><p className="text-2xl font-bold text-text-primary">{statsLoading ? '—' : stats?.totalContacts?.toLocaleString() ?? '0'}</p><p className="text-xs text-text-muted">Total Candidates</p></div></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-tier-1Bg flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-tier-1" /></div><div><p className="text-2xl font-bold text-tier-1">{statsLoading ? '—' : stats?.totalCompanies?.toLocaleString() ?? '0'}</p><p className="text-xs text-text-muted">Companies</p></div></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-tier-1Bg flex items-center justify-center"><TrendingUp className="w-5 h-5 text-tier-1" /></div><div><p className="text-2xl font-bold text-tier-1">{statsLoading ? '—' : stats?.totalProposals ?? 0}</p><p className="text-xs text-text-muted">Proposals</p></div></div></CardContent></Card>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Active Mandates</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {mandatesLoading ? <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-text-muted" /></div> :
                mandates.slice(0, 5).map(m => (
                  <div key={m.id} className="p-4 bg-bg-tertiary rounded-lg">
                    <div className="flex items-center justify-between mb-3"><div><h3 className="font-medium text-text-primary">{m.title}</h3><p className="text-sm text-text-muted">{m.company?.name ?? 'No client'} · {STATUS_LABELS[m.status] ?? m.status}</p></div><Badge variant={m.status === 'won' ? 'success' : 'default'}>{STATUS_LABELS[m.status] ?? m.status}</Badge></div>
                    <div className="flex gap-1">{STAGE_ORDER.map(s => { const c = s === 'SWEEP' ? m.tier1_count : s === 'CANVA' ? m.tier2_count : s === 'GRID' ? m.shortlisted_count : s === 'LENS' ? m.interview_count : m.placed_count; return <div key={s} className="flex-1 h-8 rounded flex items-center justify-center text-xs font-medium" style={{ backgroundColor: `${STAGE_CONFIG[s].color}20`, color: STAGE_CONFIG[s].color }}>{c}</div>; })}</div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </>
      ) : <CommandCenter />}
    </div>
  );
}
