/**
 * HiringFunnel — Live pipeline funnel + conversion rates + time-to-fill +
 * velocity trend (S1-T14)
 *
 * Replaces the previous MOCK_HIRING_FUNNEL static component.  Now pulls
 * live data from candidates_pipeline + mandates via the Supabase client
 * (RLS scoped) and renders 4 visualizations:
 *
 * 1. Stage Funnel — horizontal BarChart, stages ordered New → Hired
 * 2. Conversion Rates — vs previous stage and vs top-of-funnel, with bars
 * 3. Time-to-Fill — median days in each stage (BarChart, purple)
 * 4. Velocity Trend — 30-day candidates moved (LineChart, fuchsia)
 *
 * Realtime: useMultiTableRealtimeRefresh on contacts / mandates /
 * scoring_config (750 ms debounce) auto-refreshes without page reload.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Filter, TrendingUp, Clock, Activity, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useMultiTableRealtimeRefresh } from '@/hooks/useRealtime';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';

const STAGES = ['New', 'Sourcing', 'Screening', 'Shortlisted', 'Presented', 'Interview', 'Offer', 'Hired'] as const;

// Map candidates_pipeline.stage values → canonical stage labels
function normalizeStage(raw: string | null | undefined): string {
  if (!raw) return 'New';
  const s = String(raw);
  if (STAGES.includes(s as any)) return s;
  if (/sourced|s1_/i.test(s)) return 'Sourcing';
  if (/screened|s2_/i.test(s)) return 'Screening';
  if (/shortlist|presented|s12/i.test(s)) return 'Shortlisted';
  if (/client.*int|interview|s13/i.test(s)) return 'Interview';
  if (/offer|s16/i.test(s)) return 'Offer';
  if (/closed|placed|s19/i.test(s)) return 'Hired';
  return 'New';
}

const STAGE_RANK: Record<string, number> = Object.fromEntries(
  STAGES.map((s, i) => [s, i]),
);

interface FunnelRow {
  stage: string;
  count: number;
  conv_from_top_pct: number | null;
  conv_vs_prev_pct: number | null;
}

export default function HiringFunnel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [funnel, setFunnel] = useState<FunnelRow[]>([]);
  const [ttfData, setTtfData] = useState<Array<{ stage: string; median_days: number }>>([]);
  const [velocity, setVelocity] = useState<Array<{ day: string; candidates: number }>>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Pull candidates_pipeline (RLS scoped) — we only need stage + dates
      const { data, error: sbError } = await supabase
        .from('candidates_pipeline')
        .select('id, stage, created_at, updated_at')
        .limit(5000);

      if (sbError) throw new Error(sbError.message);

      const rows = (data ?? []) as any[];

      // ── Stage funnel ──────────────────────────────────────────────────
      const counts: Record<string, number> = {};
      for (const r of rows) {
        const stage = normalizeStage(r.stage);
        counts[stage] = (counts[stage] ?? 0) + 1;
      }

      const ordered = STAGES.map(stage => ({
        stage,
        count: counts[stage] ?? 0,
      }));

      let prev: number | null = null;
      const topCount = ordered[0]?.count ?? 0;
      for (const r of ordered) {
        r['conv_from_top_pct' as any] =
          topCount === 0 ? null : Math.round((r.count / topCount) * 100);
        r['conv_vs_prev_pct' as any] =
          prev === null || prev === 0 ? null : Math.round((r.count / prev) * 100);
        prev = r.count;
      }
      setFunnel(ordered as FunnelRow[]);

      // ── Time-to-fill (median days per stage, derived from updated_at -
      //    created_at for candidates currently in each stage) ────────────
      const daysByStage: Record<string, number[]> = {};
      for (const r of rows) {
        const stage = normalizeStage(r.stage);
        const created = new Date(r.created_at).getTime();
        const updated = new Date(r.updated_at).getTime();
        if (!Number.isNaN(created) && !Number.isNaN(updated)) {
          const days = Math.max(0, Math.floor((updated - created) / 86400000));
          if (!daysByStage[stage]) daysByStage[stage] = [];
          daysByStage[stage].push(days);
        }
      }

      const ttf = STAGES.map(stage => {
        const arr = daysByStage[stage] ?? [];
        if (arr.length === 0) return { stage, median_days: 0 };
        arr.sort((a, b) => a - b);
        const mid = Math.floor(arr.length / 2);
        const median = arr.length % 2 === 0
          ? Math.round((arr[mid - 1] + arr[mid]) / 2)
          : arr[mid];
        return { stage, median_days: median };
      });
      setTtfData(ttf);

      // ── 30-day velocity (candidates_pipeline entries created per day) ─
      const last = new Date();
      const buckets: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(last.getTime() - i * 86400000);
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        buckets[key] = 0;
      }
      for (const r of rows) {
        const d = new Date(r.created_at);
        if (Number.isNaN(d.getTime())) continue;
        const daysAgo = Math.floor((last.getTime() - d.getTime()) / 86400000);
        if (daysAgo >= 0 && daysAgo < 30) {
          const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (buckets[key] !== undefined) buckets[key] += 1;
        }
      }
      setVelocity(
        Object.entries(buckets).map(([day, candidates]) => ({ day, candidates })),
      );
    } catch (e: any) {
      console.warn('[HiringFunnel] load error:', e);
      setError(e?.message || 'Failed to load progression data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useMultiTableRealtimeRefresh(
    [
      { table: 'contacts' },
      { table: 'mandates' },
      { table: 'scoring_config' },
    ],
    () => {
      console.debug('[HiringFunnel] realtime: refresh triggered');
      setLoading(true);
      loadData();
    },
    { debounceMs: 750 },
  );

  const totalCandidates = useMemo(
    () => funnel.reduce((s, r) => s + r.count, 0),
    [funnel],
  );
  const hiredCount = funnel.find(r => r.stage === 'Hired')?.count ?? 0;
  const fillRate = totalCandidates > 0 ? Math.round((hiredCount / totalCandidates) * 100) : 0;

  if (loading && funnel.length === 0) {
    return <div className="py-12 text-center text-text-muted text-sm">Loading hiring progression…</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-primary border border-bg-tertiary p-4">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <Filter className="w-3.5 h-3.5" /> Total in Pipeline
          </div>
          <div className="text-2xl font-bold text-text-primary">{totalCandidates}</div>
        </div>
        <div className="bg-bg-primary border border-bg-tertiary p-4">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <Activity className="w-3.5 h-3.5" /> Top of Pipeline
          </div>
          <div className="text-2xl font-bold text-text-primary">{funnel[0]?.count ?? 0}</div>
        </div>
        <div className="bg-bg-primary border border-bg-tertiary p-4">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <TrendingUp className="w-3.5 h-3.5" /> Fill Rate
          </div>
          <div className="text-2xl font-bold text-text-primary">{fillRate}%</div>
        </div>
        <div className="bg-bg-primary border border-bg-tertiary p-4">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <Clock className="w-3.5 h-3.5" /> Hired
          </div>
          <div className="text-2xl font-bold text-text-primary">{hiredCount}</div>
        </div>
      </div>

      {/* Stage Funnel + Conversion */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Funnel BarChart */}
        <div className="bg-bg-primary border border-bg-tertiary p-5">
          <h3 className="font-medium text-text-primary mb-4">Stage Progression</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnel}
                layout="vertical"
                margin={{ top: 5, right: 15, bottom: 5, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#666' }} allowDecimals={false} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: '#666' }} width={90} />
                <RTooltip
                  contentStyle={{ border: '1px solid #e5e7eb',  fontSize: 12 }}
                />
                <Bar dataKey="count" name="Candidates" fill="#C108AB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion rates list */}
        <div className="bg-bg-primary border border-bg-tertiary p-5">
          <h3 className="font-medium text-text-primary mb-4">
            Conversion Rates (from previous stage)
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-auto pr-2">
            {funnel.map((row, idx) => (
              <div key={row.stage} className="text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-text-primary font-medium">{row.stage}</span>
                  <span className="text-text-muted">
                    {row.count} candidates
                    {idx > 0 && row.conv_vs_prev_pct !== null && (
                      <> · <b className="text-fuchsia">{row.conv_vs_prev_pct}%</b> vs prev</>
                    )}
                    {row.conv_from_top_pct !== null && (
                      <> · <span className="text-text-secondary">{row.conv_from_top_pct}% of top</span></>
                    )}
                  </span>
                </div>
                {idx > 0 && (
                  <div className="h-2 bg-bg-warm overflow-hidden">
                    <div
                      className="h-full bg-fuchsia"
                      style={{ width: `${Math.min(100, row.conv_vs_prev_pct ?? 0)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Time-to-fill + velocity */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-bg-primary border border-bg-tertiary p-5">
          <h3 className="font-medium text-text-primary mb-4">Median Days in Stage</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ttfData} margin={{ top: 10, right: 10, bottom: 30, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 11, fill: '#666' }}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11, fill: '#666' }} unit="d" allowDecimals={false} />
                <RTooltip
                  contentStyle={{ border: '1px solid #e5e7eb',  fontSize: 12 }}
                />
                <Bar dataKey="median_days" name="Median days" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg-primary border border-bg-tertiary p-5">
          <h3 className="font-medium text-text-primary mb-4">
            30-day Candidate Velocity
          </h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={velocity} margin={{ top: 10, right: 10, bottom: 30, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: '#666' }}
                  interval={3}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11, fill: '#666' }} allowDecimals={false} />
                <RTooltip
                  contentStyle={{ border: '1px solid #e5e7eb',  fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="candidates"
                  name="Candidates moved"
                  stroke="#C108AB"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
