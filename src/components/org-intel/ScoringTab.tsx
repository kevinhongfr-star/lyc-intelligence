/**
 * ScoringTab — platform-wide view of 5-criteria scoring outcomes.
 *
 * Features:
 *   - Company selector (with "All companies" option)
 *   - Count of evaluations by tier (4 buckets)
 *   - Average sub-score per criterion across all evaluations
 *   - Recent evaluations list (last 10)
 *   - Bar chart: average score per criterion (recharts)
 *
 * Phase 1: read-only. No "trigger new evaluation" — that's done from
 * Evaluations tab or via API directly.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3, Loader2, AlertTriangle, Award, TrendingUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { useAuthStore } from '@/stores/authStore';
import { CompanySelect } from './CompanySelect';
import { CRITERIA, TIER_BOUNDARIES, type CriterionId, type TierId } from '@/lib/scoringCriteria';

interface Evaluation {
  id: string;
  talent_id: string;
  overall_score: number | null;
  scorecard: any;
  is_final: boolean | null;
  updated_at: string;
  talent_name?: string;
}

export function ScoringTab() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = useAuthStore.getState().supabase;
    if (!sb) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        // Build a query that optionally filters by company
        let evQuery = sb
          .from('org_evaluations')
          .select('id, talent_id, overall_score, scorecard, is_final, updated_at, org_talent_pools!inner(name, target_company_id)')
          .order('updated_at', { ascending: false })
          .limit(500);
        if (companyId) {
          evQuery = evQuery.eq('org_talent_pools.target_company_id', companyId);
        }
        const { data: evData, error: e1 } = await evQuery;
        if (e1) {
          setError(e1.message);
          setEvaluations([]);
          setScores([]);
          return;
        }
        const evs = (evData ?? []).map((r: any) => ({
          ...r,
          talent_name: r.org_talent_pools?.name,
          org_talent_pools: undefined,
        })) as Evaluation[];
        setEvaluations(evs);

        // Fetch all sub-scores for these evaluations
        if (evs.length > 0) {
          const evIds = evs.map((e) => e.id);
          const { data: scoreData, error: e2 } = await sb
            .from('org_evaluation_scores')
            .select('*')
            .in('evaluation_id', evIds);
          if (e2) {
            setError(e2.message);
            setScores([]);
          } else {
            setScores((scoreData ?? []) as any[]);
          }
        } else {
          setScores([]);
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  // Tier distribution
  const tierCounts = useMemo(() => {
    const counts: Record<TierId, number> = { T1_STRONG: 0, T2_GOOD: 0, T3_POTENTIAL: 0, T4_NOT_YET: 0 };
    for (const ev of evaluations) {
      if (ev.overall_score == null) continue;
      const score = Number(ev.overall_score);
      if (score >= TIER_BOUNDARIES.T1_STRONG.min) counts.T1_STRONG++;
      else if (score >= TIER_BOUNDARIES.T2_GOOD.min) counts.T2_GOOD++;
      else if (score >= TIER_BOUNDARIES.T3_POTENTIAL.min) counts.T3_POTENTIAL++;
      else counts.T4_NOT_YET++;
    }
    return counts;
  }, [evaluations]);

  // Average per criterion
  const criterionAvgs = useMemo(() => {
    const sums: Record<CriterionId, { sum: number; n: number }> = {
      C1: { sum: 0, n: 0 }, C2: { sum: 0, n: 0 },
      C3: { sum: 0, n: 0 }, C4: { sum: 0, n: 0 }, C5: { sum: 0, n: 0 },
    };
    for (const s of scores) {
      const k = s.criterion_key as CriterionId;
      if (sums[k]) {
        sums[k].sum += Number(s.score);
        sums[k].n += 1;
      }
    }
    return (Object.keys(sums) as CriterionId[]).map((k) => ({
      criterion: CRITERIA[k].shortName,
      fullName: CRITERIA[k].name,
      avg: sums[k].n > 0 ? Math.round((sums[k].sum / sums[k].n) * 10) / 10 : 0,
      n: sums[k].n,
    }));
  }, [scores]);

  const totalEvals = evaluations.length;
  const finalEvals = evaluations.filter((e) => e.is_final).length;

  return (
    <div className="space-y-6">
      <CompanySelect value={companyId} onChange={setCompanyId} allowAll />

      {loading ? (
        <div className="flex items-center gap-2 text-text-muted text-sm py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading scoring data…
        </div>
      ) : error ? (
        <div className="text-sm text-red-600 py-4 border border-red-200 bg-red-50 rounded-md p-3">
          <AlertTriangle className="w-4 h-4 inline mr-1" /> {error}
        </div>
      ) : totalEvals === 0 ? (
        <EmptyHint
          title="No evaluations yet"
          note={companyId
            ? 'No evaluations have been run for this company. Trigger a re-score from the Evaluations tab.'
            : 'No evaluations across the platform yet. Run the first one from the Evaluations tab.'}
        />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total evaluations" value={totalEvals} icon={<BarChart3 className="w-4 h-4" />} />
            <StatCard label="Final" value={finalEvals} icon={<Award className="w-4 h-4" />} />
            <StatCard
              label="Strong Fit"
              value={tierCounts.T1_STRONG}
              color="text-green-700"
            />
            <StatCard
              label="Not Yet Fit"
              value={tierCounts.T4_NOT_YET}
              color="text-text-muted"
            />
          </div>

          {/* Tier distribution */}
          <div className="border border-bg-hover rounded-md p-4">
            <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Tier distribution
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              {(['T1_STRONG', 'T2_GOOD', 'T3_POTENTIAL', 'T4_NOT_YET'] as TierId[]).map((t) => {
                const c = TIER_BOUNDARIES[t];
                const count = tierCounts[t];
                const pct = totalEvals > 0 ? (count / totalEvals) * 100 : 0;
                return (
                  <div key={t} className="border border-bg-hover rounded-md p-3">
                    <div className={`text-2xl font-semibold ${t === 'T1_STRONG' ? 'text-green-700' : t === 'T2_GOOD' ? 'text-blue-700' : t === 'T3_POTENTIAL' ? 'text-amber-700' : 'text-text-muted'}`}>
                      {count}
                    </div>
                    <div className="text-xs text-text-secondary mt-1">{c.label}</div>
                    <div className="text-xs text-text-muted">{pct.toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Average per criterion — bar chart */}
          <div className="border border-bg-hover rounded-md p-4">
            <h3 className="text-sm font-medium text-text-primary mb-3">
              Average sub-score per criterion
            </h3>
            {criterionAvgs.every((c) => c.n === 0) ? (
              <div className="text-text-muted text-sm">No sub-scores yet</div>
            ) : (
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={criterionAvgs} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="criterion" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload[0]) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white border border-bg-hover rounded-md p-2 text-xs shadow-sm">
                            <div className="font-medium">{d.fullName}</div>
                            <div>Avg: <span className="font-mono">{d.avg}</span> / 20</div>
                            <div className="text-text-muted">n = {d.n}</div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                      {criterionAvgs.map((c, i) => (
                        <Cell key={i} fill={c.avg >= 14 ? '#16a34a' : c.avg >= 8 ? '#3b82f6' : '#a3a3a3'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Recent evaluations */}
          <div className="border border-bg-hover rounded-md p-4">
            <h3 className="text-sm font-medium text-text-primary mb-3">
              Recent evaluations (top 10)
            </h3>
            <div className="space-y-1">
              {evaluations.slice(0, 10).map((ev) => (
                <div key={ev.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-bg-hover last:border-b-0">
                  <span className="flex-1 truncate text-text-primary">{ev.talent_name ?? '—'}</span>
                  <span className="text-xs text-text-muted">{ev.updated_at?.slice(0, 10) ?? '—'}</span>
                  {ev.overall_score != null && (
                    <span className="font-mono font-medium">{Number(ev.overall_score).toFixed(1)}</span>
                  )}
                  {ev.scorecard?.tier_label && (
                    <span className="text-xs text-text-muted">{ev.scorecard.tier_label}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon?: React.ReactNode; color?: string }) {
  return (
    <div className="border border-bg-hover rounded-md p-3">
      <div className="flex items-center gap-1 text-xs text-text-muted">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-semibold mt-1 ${color ?? 'text-text-primary'}`}>
        {value}
      </div>
    </div>
  );
}

function EmptyHint({ title, note }: { title: string; note?: string }) {
  return (
    <div className="border-2 border-dashed border-bg-hover rounded-lg p-8 text-center">
      <BarChart3 className="w-6 h-6 text-text-muted mx-auto mb-2" />
      <p className="text-text-primary font-medium">{title}</p>
      {note && <p className="text-text-muted text-sm mt-1">{note}</p>}
    </div>
  );
}
