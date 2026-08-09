/**
 * AdminRankingDashboard — Ranked mandates table view (S5-T01)
 *
 * Table view of all rows from `v_pipeline_rankings` with tier badges
 * (Gold/Silver/Bronze/Unranked), sortable columns, tier/stage filters,
 * and CSV export.
 *
 * Renders inside AppShell → Outlet (the /app surface), gated by AdminRoute.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, Download, Filter, AlertCircle, Search, X, Info } from 'lucide-react';
import { Card, CardContent, Button, Badge, Select, Input, TierBadge, EmptyState } from '@/components/ui';
import type { Tier } from '@/components/ui';
import { getSupabase } from '@/services/supabaseApi';

interface RankingRow {
  id: string;
  mandate_id: string | null;
  candidate_id: string | null;
  candidate_name: string | null;
  current_title: string | null;
  current_company: string | null;
  mandate_title: string | null;
  company_name: string | null;
  pipeline_stage: string | null;
  weighted_score: number | null;
  tier: Tier | null;
  rank: number | null;
  consultant_name: string | null;
  scored_at: string | null;
}

type SortKey = 'rank' | 'weighted_score' | 'tier' | 'pipeline_stage' | 'consultant_name' | 'candidate_name';

const TIER_ORDER: Record<string, number> = { Gold: 0, Silver: 1, Bronze: 2, Unranked: 3 };

const PIPELINE_STAGES = [
  'New', 'Sourcing', 'Screening', 'Shortlisted', 'Presented', 'Interview', 'Offer', 'Hired',
] as const;

// Olympic-medal stage weights (from scoring_config / TRAEE_NEXT_SPRINTS spec).
const STAGE_WEIGHTS: Record<string, number> = {
  Hired: 100,
  Offer: 80,
  Interview: 50,
  Presented: 30,
  Shortlisted: 20,
  Screening: 10,
  Sourcing: 5,
  New: 2,
  Rejected: 0,
};

const TIER_THRESHOLDS: Array<{ tier: Tier; min: number; color: string }> = [
  { tier: 'Gold', min: 200, color: 'bg-amber-400' },
  { tier: 'Silver', min: 100, color: 'bg-gray-400' },
  { tier: 'Bronze', min: 50, color: 'bg-orange-700' },
  { tier: 'Unranked', min: 0, color: 'bg-gray-300' },
];

function tierRank(t: Tier | null | undefined): number {
  return TIER_ORDER[t ?? 'Unranked'] ?? 3;
}

export function AdminRankingDashboard() {
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [consultantFilter, setConsultantFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<RankingRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const sb = getSupabase();
        const { data, error: sbError } = await sb
          .from('v_pipeline_rankings')
          .select('*')
          .order('rank', { ascending: true, nullsFirst: false })
          .limit(500);
        if (cancelled) return;
        if (sbError) {
          console.warn('[AdminRankingDashboard] query failed:', sbError.message);
          setError('Unable to load rankings right now.');
        } else {
          setRows((data as RankingRow[]) ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          console.warn('[AdminRankingDashboard] error:', e);
          setError('Unable to load rankings right now.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const consultants = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => { if (r.consultant_name) set.add(r.consultant_name); });
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let out = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(r =>
        (r.candidate_name ?? '').toLowerCase().includes(q) ||
        (r.mandate_title ?? '').toLowerCase().includes(q) ||
        (r.company_name ?? '').toLowerCase().includes(q) ||
        (r.current_title ?? '').toLowerCase().includes(q),
      );
    }
    if (tierFilter !== 'all') {
      out = out.filter(r => (r.tier ?? 'Unranked') === tierFilter);
    }
    if (stageFilter !== 'all') {
      out = out.filter(r => (r.pipeline_stage ?? 'New') === stageFilter);
    }
    if (consultantFilter !== 'all') {
      out = out.filter(r => r.consultant_name === consultantFilter);
    }
    // Sort
    out = [...out].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'rank': cmp = (a.rank ?? 9999) - (b.rank ?? 9999); break;
        case 'weighted_score': cmp = (a.weighted_score ?? 0) - (b.weighted_score ?? 0); break;
        case 'tier': cmp = tierRank(a.tier) - tierRank(b.tier); break;
        case 'pipeline_stage':
          cmp = (a.pipeline_stage ?? '').localeCompare(b.pipeline_stage ?? ''); break;
        case 'consultant_name':
          cmp = (a.consultant_name ?? '').localeCompare(b.consultant_name ?? ''); break;
        case 'candidate_name':
          cmp = (a.candidate_name ?? '').localeCompare(b.candidate_name ?? ''); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return out;
  }, [rows, search, tierFilter, stageFilter, consultantFilter, sortKey, sortDir]);

  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = { Gold: 0, Silver: 0, Bronze: 0, Unranked: 0 };
    rows.forEach(r => { const t = r.tier ?? 'Unranked'; counts[t] = (counts[t] ?? 0) + 1; });
    return counts;
  }, [rows]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'rank' || key === 'weighted_score' ? 'asc' : 'asc');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Rank', 'Candidate', 'Current Title', 'Company', 'Mandate', 'Score', 'Tier', 'Stage', 'Consultant'];
    const lines = [headers.join(',')];
    for (const r of filtered) {
      const cells = [
        r.rank ?? '',
        `"${(r.candidate_name ?? '').replace(/"/g, '""')}"`,
        `"${(r.current_title ?? '').replace(/"/g, '""')}"`,
        `"${(r.company_name ?? '').replace(/"/g, '""')}"`,
        `"${(r.mandate_title ?? '').replace(/"/g, '""')}"`,
        r.weighted_score ?? '',
        r.tier ?? 'Unranked',
        r.pipeline_stage ?? '',
        `"${(r.consultant_name ?? '').replace(/"/g, '""')}"`,
      ];
      lines.push(cells.join(','));
    }
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline_rankings_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortArrow = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? '↑' : '↓') : '');

  if (loading) {
    return <div className="py-12 text-center text-text-muted text-sm">Loading rankings…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif font-bold text-2xl text-text-primary flex items-center gap-2">
            <Trophy className="w-6 h-6 text-fuchsia" /> Pipeline Rankings
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            All ranked candidates from <code className="text-xs bg-bg-warm px-1">v_pipeline_rankings</code>. {rows.length} total.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filtered.length === 0}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Tier summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['Gold', 'Silver', 'Bronze', 'Unranked'] as Tier[]).map(t => (
          <Card key={t} className="p-4">
            <div className="flex items-center justify-between">
              <TierBadge tier={t} size="sm" />
              <span className="text-2xl font-bold text-text-primary">{tierCounts[t] ?? 0}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search candidate, mandate, company…"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-text-muted" />
              <Select
                value={tierFilter}
                onChange={e => setTierFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Tiers' },
                  { value: 'Gold', label: '🥇 Gold' },
                  { value: 'Silver', label: '🥈 Silver' },
                  { value: 'Bronze', label: '🥉 Bronze' },
                  { value: 'Unranked', label: 'Unranked' },
                ]}
              />
              <Select
                value={stageFilter}
                onChange={e => setStageFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Stages' },
                  ...PIPELINE_STAGES.map(s => ({ value: s, label: s })),
                ]}
              />
              <Select
                value={consultantFilter}
                onChange={e => setConsultantFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Consultants' },
                  ...consultants.map(c => ({ value: c, label: c })),
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-10 h-10 text-text-muted" />}
          title="No rankings match your filters"
          description="Adjust the filters or search to see ranked candidates."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-text-muted">
                    <th className="py-3 px-4 font-medium cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('rank')}>
                      Rank{sortArrow('rank')}
                    </th>
                    <th className="py-3 px-4 font-medium cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('candidate_name')}>
                      Candidate{sortArrow('candidate_name')}
                    </th>
                    <th className="py-3 px-4 font-medium">Mandate / Company</th>
                    <th className="py-3 px-4 font-medium cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('weighted_score')}>
                      Score{sortArrow('weighted_score')}
                    </th>
                    <th className="py-3 px-4 font-medium cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('tier')}>
                      Tier{sortArrow('tier')}
                    </th>
                    <th className="py-3 px-4 font-medium cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('pipeline_stage')}>
                      Stage{sortArrow('pipeline_stage')}
                    </th>
                    <th className="py-3 px-4 font-medium cursor-pointer select-none hover:text-text-primary" onClick={() => toggleSort('consultant_name')}>
                      Consultant{sortArrow('consultant_name')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 200).map(r => (
                    <tr
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className="border-b border-border/50 hover:bg-bg-warm/50 cursor-pointer"
                    >
                      <td className="py-2.5 px-4 text-text-muted font-medium">{r.rank ?? '—'}</td>
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-text-primary">{r.candidate_name ?? 'Confidential'}</div>
                        {r.current_title && <div className="text-xs text-text-muted">{r.current_title}</div>}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="text-text-secondary truncate max-w-[200px]">{r.mandate_title ?? r.company_name ?? '—'}</div>
                        {r.company_name && r.mandate_title && (
                          <div className="text-xs text-text-muted">{r.company_name}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-text-primary">{r.weighted_score ?? '—'}</td>
                      <td className="py-2.5 px-4"><TierBadge tier={r.tier} size="sm" /></td>
                      <td className="py-2.5 px-4">
                        <Badge variant="outline" className="text-xs">{r.pipeline_stage ?? 'New'}</Badge>
                      </td>
                      <td className="py-2.5 px-4 text-text-secondary">{r.consultant_name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length > 200 && (
              <div className="text-center py-3 text-xs text-text-muted border-t border-border">
                Showing first 200 of {filtered.length} results. Export CSV for the full list.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selected && (
        <ScoreBreakdownModal row={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// ── Score breakdown modal (S5-T02) ──
function ScoreBreakdownModal({ row, onClose }: { row: RankingRow; onClose: () => void }) {
  const currentStage = row.pipeline_stage ?? 'New';
  const stageWeight = STAGE_WEIGHTS[currentStage] ?? 0;
  const score = row.weighted_score ?? 0;
  const maxScale = 250; // bar scale (above Gold threshold of 200)

  // Stages the candidate has progressed through (up to current stage).
  const reachedStages = useMemo(() => {
    const order = ['New', 'Sourcing', 'Screening', 'Shortlisted', 'Presented', 'Interview', 'Offer', 'Hired'];
    const idx = order.indexOf(currentStage);
    if (idx === -1) return [currentStage];
    return order.slice(0, idx + 1);
  }, [currentStage]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-serif font-bold text-lg text-[#1A1A2E]">
                {row.candidate_name ?? 'Confidential'}
              </h3>
              <TierBadge tier={row.tier} size="sm" />
            </div>
            <p className="text-xs text-gray-500">
              {row.mandate_title ?? '—'}{row.company_name ? `· ${row.company_name}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Score summary */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Weighted score</div>
              <div className="text-3xl font-bold text-[#1A1A2E]">{score}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Current stage</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">{currentStage}</Badge>
                <span className="text-sm text-gray-500">× {stageWeight}</span>
              </div>
            </div>
          </div>

          {/* Tier threshold bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-600">Tier position</span>
              <span className="text-xs text-gray-400">Gold ≥ 200 · Silver ≥ 100 · Bronze ≥ 50</span>
            </div>
            <div className="relative h-3 bg-gray-100 overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-fuchsia"
                style={{ width: `${Math.min((score / maxScale) * 100, 100)}%` }}
              />
              {/* threshold markers */}
              {[50, 100, 200].map(t => (
                <div
                  key={t}
                  className="absolute top-0 h-full w-px bg-gray-400/60"
                  style={{ left: `${Math.min((t / maxScale) * 100, 100)}%` }}
                  title={`${t}`}
                />
              ))}
            </div>
          </div>

          {/* Stage contribution breakdown */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-600">Stage contribution</span>
            </div>
            <div className="space-y-1.5">
              {reachedStages.map(stage => {
                const w = STAGE_WEIGHTS[stage] ?? 0;
                return (
                  <div key={stage} className="flex items-center gap-3 text-sm">
                    <span className="w-24 text-gray-600">{stage}</span>
                    <div className="flex-1 h-2 bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-fuchsia/70"
                        style={{ width: `${Math.min((w / 100) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-gray-500">{stage} × {w}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tier assignment explanation */}
          <div className="p-3 bg-gray-50 text-xs text-gray-500 leading-relaxed">
            Tier is assigned by total weighted score across the candidate's mandate pipeline:
            {''}
            {TIER_THRESHOLDS.filter(t => score >= t.min).length > 0 && (
              <span>
                score <strong className="text-[#1A1A2E]">{score}</strong> qualifies as{''}
                <strong className="text-[#1A1A2E]">{row.tier ?? 'Unranked'}</strong>.
              </span>
            )}
            {row.consultant_name && <> Consultant: {row.consultant_name}.</>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminRankingDashboard;
