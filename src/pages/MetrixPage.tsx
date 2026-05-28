import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { useMandates } from '@/hooks/useSupabaseData';
import { autoComputePHI, computePHI } from '@/services/phiScoring';
import type { Mandate } from '@/services/supabaseApi';

function BarChart({ data, color = '#C108AB', height = 180 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(20, Math.min(48, 600 / data.length - 4));
  return (
    <svg viewBox={`0 0 ${data.length * (barW + 8)} ${height}`} className="w-full" style={{ maxHeight: height }}>
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * (height - 40);
        return (
          <g key={i} transform={`translate(${i * (barW + 8) + 4}, 0)`}>
            <rect x={0} y={height - 24 - barH} width={barW} height={barH} rx={3} fill={color} opacity={0.85} />
            <text x={barW / 2} y={height - 8} textAnchor="middle" fill="#9CA3AF" fontSize={9}>{d.label.length > 10 ? d.label.slice(0, 9) + '…' : d.label}</text>
            <text x={barW / 2} y={height - 28 - barH} textAnchor="middle" fill="#E5E7EB" fontSize={9}>{d.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ segments, size = 120 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const cx = size / 2, cy = size / 2, r = size / 2 - 10, strokeW = 14;
  let cumAngle = 0;
  const arcs = segments.map(seg => {
    const angle = (seg.value / total) * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (startAngle + angle - 90) * Math.PI / 180;
    const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad), y2 = cy + r * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;
    return { ...seg, path: angle >= 360 ? '' : `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`, angle };
  });
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1F2937" strokeWidth={strokeW} />
        {arcs.map((arc, i) => arc.path ? <path key={i} d={arc.path} fill="none" stroke={arc.color} strokeWidth={strokeW} strokeLinecap="round" /> : <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={arc.color} strokeWidth={strokeW} />)}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#E5E7EB" fontSize={18} fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#9CA3AF" fontSize={9}>total</text>
      </svg>
      <div className="space-y-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-text-muted">{seg.label}</span>
            <span className="text-text-primary font-medium">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Sparkline({ data, color = '#C108AB', width = 200, height = 40 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (data.length < 2) return <div className="text-xs text-text-muted">Not enough data</div>;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

const STATUS_LABELS: Record<string, string> = { '1_search': 'SWEEP', '2_call': 'CANVA', '3_deliver': 'GRID/LENS', 'won': 'Won', 'on_hold': 'On Hold', 'lost': 'Lost', 'completed': 'Completed' };

export function MetrixPage() {
  const { data: mandates, count, loading } = useMandates({ limit: 500 });
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const analytics = useMemo(() => {
    const now = Date.now();
    const periodMs: Record<string, number> = { '7d': 7 * 86400000, '30d': 30 * 86400000, '90d': 90 * 86400000, 'all': Infinity };
    const cutoff = now - periodMs[period];
    const filtered = mandates.filter(m => new Date(m.created_at).getTime() > cutoff);

    const byStatus: Record<string, number> = {};
    for (const m of filtered) { const k = STATUS_LABELS[m.status] ?? m.status; byStatus[k] = (byStatus[k] || 0) + 1; }
    const statusData = Object.entries(byStatus).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

    const phiBuckets = { GREEN: 0, AMBER: 0, RED: 0 };
    for (const m of filtered) {
      const phi = m.phi_composite != null
        ? computePHI({ urgency: m.phi_urgency ?? 1, strategic: m.phi_strategic ?? 1, value: m.phi_value ?? 1, retainer: m.phi_retainer ?? 1, decision: m.phi_decision ?? 1 })
        : autoComputePHI(m);
      phiBuckets[phi.status]++;
    }

    const funnel = { SWEEP: 0, CANVA: 0, GRID: 0, LENS: 0, PLACED: 0 };
    for (const m of filtered) {
      funnel.SWEEP += m.tier1_count;
      funnel.CANVA += m.tier2_count;
      funnel.GRID += m.shortlisted_count;
      funnel.LENS += m.interview_count;
      funnel.PLACED += m.placed_count;
    }
    const funnelData = Object.entries(funnel).map(([label, value]) => ({ label, value }));

    const weekBuckets: Record<string, number> = {};
    for (const m of filtered) {
      const d = new Date(m.created_at);
      const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      weekBuckets[key] = (weekBuckets[key] || 0) + 1;
    }
    const trendData = Object.entries(weekBuckets).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);

    const totalPipeline = funnel.SWEEP || 1;
    const conversions = {
      'Sweep→Canvas': funnel.CANVA ? Math.round((funnel.CANVA / totalPipeline) * 100) : 0,
      'Canvas→Grid': funnel.CANVA && funnel.GRID ? Math.round((funnel.GRID / (funnel.CANVA || 1)) * 100) : 0,
      'Grid→Lens': funnel.GRID && funnel.LENS ? Math.round((funnel.LENS / (funnel.GRID || 1)) * 100) : 0,
      'Lens→Placed': funnel.LENS && funnel.PLACED ? Math.round((funnel.PLACED / (funnel.LENS || 1)) * 100) : 0,
    };

    const ages = filtered.map(m => Math.floor((now - new Date(m.created_at).getTime()) / 86400000));
    const avgAge = ages.length ? Math.round(ages.reduce((s, a) => s + a, 0) / ages.length) : 0;

    const tierDist = { T1: 0, T2: 0, T3: 0 };
    for (const m of filtered) { tierDist.T1 += m.tier1_count; tierDist.T2 += m.tier2_count; tierDist.T3 += m.total_candidates - m.tier1_count - m.tier2_count; }

    return { statusData, phiBuckets, funnelData, trendData, conversions, avgAge, tierDist, totalMandates: filtered.length };
  }, [mandates, period]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">METRIX</h1>
          <p className="text-text-secondary">Pipeline analytics and performance signals</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-2 text-sm rounded-lg min-h-[44px] ${period === p ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted'}`}>
              {p === 'all' ? 'All Time' : p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-text-muted mb-1">Total Mandates</p>
          <p className="text-2xl font-bold text-text-primary">{analytics.totalMandates}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-text-muted mb-1">Avg Age</p>
          <p className="text-2xl font-bold text-text-primary">{analytics.avgAge}<span className="text-sm text-text-muted"> days</span></p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-text-muted mb-1">Pipeline Volume</p>
          <p className="text-2xl font-bold text-text-primary">{analytics.funnelData.reduce((s, d) => s + d.value, 0).toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-text-muted mb-1">Placed</p>
          <p className="text-2xl font-bold text-green-400">{analytics.funnelData.find(d => d.label === 'PLACED')?.value ?? 0}</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Pipeline Funnel</CardTitle></CardHeader>
          <CardContent><BarChart data={analytics.funnelData} color="#00897B" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>PHI Health Distribution</CardTitle></CardHeader>
          <CardContent className="flex justify-center py-4">
            <DonutChart segments={[
              { label: 'Green (Healthy)', value: analytics.phiBuckets.GREEN, color: '#34D399' },
              { label: 'Amber (Watch)', value: analytics.phiBuckets.AMBER, color: '#FBBF24' },
              { label: 'Red (Critical)', value: analytics.phiBuckets.RED, color: '#F87171' },
            ]} size={140} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Mandate Creation Trend</CardTitle></CardHeader>
          <CardContent>
            {analytics.trendData.length > 1 ? (
              <Sparkline data={analytics.trendData} color="#C108AB" width={400} height={60} />
            ) : (
              <p className="text-text-muted text-sm">Not enough data for trend line</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Conversion Rates</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(analytics.conversions).map(([label, rate]) => (
              <div key={label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-text-secondary">{label}</span>
                  <span className="text-text-primary font-medium">{rate}%</span>
                </div>
                <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.min(100, rate)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Mandate Status Breakdown</CardTitle></CardHeader>
          <CardContent><BarChart data={analytics.statusData} color="#C108AB" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Candidate Tier Distribution</CardTitle></CardHeader>
          <CardContent className="flex justify-center py-4">
            <DonutChart segments={[
              { label: 'T1 (Strong Primary)', value: analytics.tierDist.T1, color: '#34D399' },
              { label: 'T2 (Strong Secondary)', value: analytics.tierDist.T2, color: '#FBBF24' },
              { label: 'T3 (Reserve)', value: Math.max(0, analytics.tierDist.T3), color: '#F87171' },
            ]} size={140} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
