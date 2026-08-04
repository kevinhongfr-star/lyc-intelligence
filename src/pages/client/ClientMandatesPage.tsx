/**
 * ClientMandatesPage — Mandates list + Shortlist + Pipeline Kanban (S3-T02/T03)
 *
 * Shows all mandates for the client's company. Selecting a mandate reveals:
 *   - Shortlist: ranked candidates from `v_pipeline_rankings` with tier badges
 *   - Pipeline Kanban: read-only columns by stage (no drag-and-drop for clients)
 *
 * Renders inside AppShell → Outlet (the /client surface).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Briefcase, ChevronLeft, Users, Mail, Filter, AlertCircle, Building2, Trophy } from 'lucide-react';
import { Card, CardContent, Button, Badge, EmptyState, Select } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import {
  resolveClientCompany,
  fetchClientMandates,
  fetchMandateShortlist,
  fetchPipelineStageCounts,
  type ClientMandate,
  type PipelineRanking,
  type PipelineStageCount,
  type Tier,
  PIPELINE_STAGES,
  TIER_COLORS,
} from '@/services/clientPortalService';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  open: 'bg-green-100 text-green-700',
  on_hold: 'bg-amber-100 text-amber-700',
  paused: 'bg-amber-100 text-amber-700',
  closed: 'bg-gray-100 text-gray-600',
  filled: 'bg-blue-100 text-blue-700',
};

function statusColor(status: string | null): string {
  if (!status) return 'bg-gray-100 text-gray-600';
  return STATUS_COLORS[status.toLowerCase()] ?? 'bg-gray-100 text-gray-600';
}

function TierBadge({ tier }: { tier: Tier | null }) {
  if (!tier) return <Badge variant="outline" className="text-xs text-text-muted">Unranked</Badge>;
  const emoji = tier === 'Gold' ? '🥇' : tier === 'Silver' ? '🥈' : tier === 'Bronze' ? '🥉' : '—';
  return <Badge className={`text-xs border ${TIER_COLORS[tier]}`}>{emoji} {tier}</Badge>;
}

export function ClientMandatesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore(s => s.user);
  const profile = useAuthStore(s => s.profile);

  const [mandates, setMandates] = useState<ClientMandate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('id'));
  const [shortlist, setShortlist] = useState<PipelineRanking[]>([]);
  const [stageCounts, setStageCounts] = useState<PipelineStageCount[]>([]);
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noCompany, setNoCompany] = useState(false);

  // Load mandates list
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        setError(null);
        const { companyId } = await resolveClientCompany(user.id, profile?.organization_id);
        if (cancelled) return;
        if (!companyId) { setNoCompany(true); setLoading(false); return; }
        const m = await fetchClientMandates(companyId);
        if (cancelled) return;
        setMandates(m);
        // If no mandate pre-selected, auto-select the first active one
        if (!selectedId && m.length > 0) {
          const firstActive = m.find(x => ['active', 'open'].includes((x.status ?? '').toLowerCase()));
          setSelectedId((firstActive ?? m[0]).id);
        }
      } catch (e) {
        console.warn('[ClientMandatesPage] error:', e);
        if (!cancelled) setError('Failed to load mandates.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, profile?.organization_id]);

  // Load shortlist + stage counts when a mandate is selected
  useEffect(() => {
    if (!selectedId) { setShortlist([]); setStageCounts([]); return; }
    let cancelled = false;
    setDetailLoading(true);
    (async () => {
      try {
        const [sl, sc] = await Promise.all([
          fetchMandateShortlist(selectedId),
          fetchPipelineStageCounts(selectedId),
        ]);
        if (cancelled) return;
        setShortlist(sl);
        setStageCounts(sc);
      } catch (e) {
        console.warn('[ClientMandatesPage] detail error:', e);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedId]);

  // Sync selection to URL
  useEffect(() => {
    if (selectedId && searchParams.get('id') !== selectedId) {
      setSearchParams({ id: selectedId }, { replace: true });
    }
  }, [selectedId, searchParams, setSearchParams]);

  const selectedMandate = useMemo(
    () => mandates.find(m => m.id === selectedId) ?? null,
    [mandates, selectedId],
  );

  const filteredShortlist = useMemo(() => {
    if (tierFilter === 'all') return shortlist;
    return shortlist.filter(s => (s.tier ?? 'Unranked') === tierFilter);
  }, [shortlist, tierFilter]);

  const stageMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of stageCounts) m[s.stage] = s.count;
    return m;
  }, [stageCounts]);

  // Group shortlist by stage for Kanban
  const kanbanByStage = useMemo(() => {
    const groups: Record<string, PipelineRanking[]> = {};
    for (const stage of PIPELINE_STAGES) groups[stage] = [];
    for (const c of shortlist) {
      const stage = c.pipeline_stage ?? 'New';
      if (!groups[stage]) groups[stage] = [];
      groups[stage].push(c);
    }
    return groups;
  }, [shortlist]);

  if (loading) {
    return <div className="py-12 text-center text-text-muted text-sm">Loading mandates…</div>;
  }

  if (noCompany) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <EmptyState
          icon={<Building2 className="w-10 h-10 text-text-muted" />}
          title="No client account linked"
          description="Your account isn't linked to a client company yet."
        />
      </div>
    );
  }

  // ── Detail view (mandate selected) ──
  if (selectedMandate) {
    return (
      <div className="space-y-6">
        <button onClick={() => { setSelectedId(null); setSearchParams({}, { replace: true }); }} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary">
          <ChevronLeft className="w-4 h-4" /> Back to all mandates
        </button>

        {/* Mandate header */}
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-serif font-bold text-xl text-text-primary">{selectedMandate.title}</h1>
                  <Badge className={statusColor(selectedMandate.status)}>{selectedMandate.status ?? 'Unknown'}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                  {selectedMandate.company_name && <span>{selectedMandate.company_name}</span>}
                  {selectedMandate.company_industry && <span>· {selectedMandate.company_industry}</span>}
                  {selectedMandate.priority && <span>· {selectedMandate.priority} priority</span>}
                </div>
              </div>
              {selectedMandate.consultant_name && (
                <div className="flex items-center gap-2 bg-bg-warm px-3 py-2">
                  <div className="w-8 h-8 bg-fuchsia text-white flex items-center justify-center font-semibold text-xs">
                    {selectedMandate.consultant_name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-text-primary">{selectedMandate.consultant_name}</div>
                    <div className="text-[10px] text-text-muted capitalize">{selectedMandate.consultant_role?.replace(/_/g, ' ') ?? 'Consultant'}</div>
                  </div>
                  {selectedMandate.consultant_email && (
                    <a href={`mailto:${selectedMandate.consultant_email}`} className="text-fuchsia ml-1"><Mail className="w-3.5 h-3.5" /></a>
                  )}
                </div>
              )}
            </div>
            {selectedMandate.jd_description && (
              <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">{selectedMandate.jd_description}</p>
            )}
            {selectedMandate.skills_requirements && selectedMandate.skills_requirements.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {selectedMandate.skills_requirements.map(s => (
                  <span key={s} className="text-[10px] bg-bg-warm text-text-secondary px-2 py-0.5">{s}</span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {detailLoading ? (
          <div className="py-8 text-center text-text-muted text-sm">Loading candidates…</div>
        ) : shortlist.length === 0 ? (
          <EmptyState
            icon={<Users className="w-10 h-10 text-text-muted" />}
            title="No candidates shortlisted yet"
            description="Candidates will appear here once your consultant presents them."
          />
        ) : (
          <>
            {/* Shortlist table (S3-T02) */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-fuchsia" />
                    <h3 className="font-medium text-text-primary">Ranked Shortlist</h3>
                    <Badge variant="outline" className="text-xs">{shortlist.length} candidates</Badge>
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
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-text-muted">
                        <th className="py-2 pr-3 font-medium">#</th>
                        <th className="py-2 pr-3 font-medium">Candidate</th>
                        <th className="py-2 pr-3 font-medium">Current Role</th>
                        <th className="py-2 pr-3 font-medium">Score</th>
                        <th className="py-2 pr-3 font-medium">Tier</th>
                        <th className="py-2 pr-3 font-medium">Stage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredShortlist.map((c, idx) => (
                        <tr key={c.id} className="border-b border-border/50 hover:bg-bg-warm/50">
                          <td className="py-2.5 pr-3 text-text-muted">{c.rank ?? idx + 1}</td>
                          <td className="py-2.5 pr-3">
                            <div className="font-medium text-text-primary">{c.candidate_name ?? 'Confidential'}</div>
                            {c.current_company && <div className="text-xs text-text-muted">{c.current_company}</div>}
                          </td>
                          <td className="py-2.5 pr-3 text-text-secondary">{c.current_title ?? '—'}</td>
                          <td className="py-2.5 pr-3 font-semibold text-text-primary">{c.weighted_score ?? '—'}</td>
                          <td className="py-2.5 pr-3"><TierBadge tier={c.tier} /></td>
                          <td className="py-2.5 pr-3">
                            <Badge variant="outline" className="text-xs">{c.pipeline_stage ?? 'New'}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredShortlist.length === 0 && (
                  <div className="text-center py-6 text-sm text-text-muted">No candidates match this tier filter.</div>
                )}
              </CardContent>
            </Card>

            {/* Pipeline Kanban (S3-T03 — read-only) */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-medium text-text-primary mb-4">Pipeline Kanban (read-only)</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {PIPELINE_STAGES.map(stage => {
                    const candidates = kanbanByStage[stage] ?? [];
                    return (
                      <div key={stage} className="flex-shrink-0 w-52">
                        <div className="flex items-center justify-between mb-2 px-1">
                          <span className="text-xs font-medium text-text-secondary">{stage}</span>
                          <span className="text-xs text-text-muted bg-bg-warm px-1.5 py-0.5 rounded">{stageMap[stage] ?? candidates.length}</span>
                        </div>
                        <div className="space-y-2 min-h-[60px] bg-bg-warm/40 p-2">
                          {candidates.length === 0 ? (
                            <div className="text-[10px] text-text-muted text-center py-4">—</div>
                          ) : (
                            candidates.slice(0, 8).map(c => (
                              <div key={c.id} className="bg-white border border-border p-2 text-xs">
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="font-medium text-text-primary truncate">{c.candidate_name ?? 'Confidential'}</span>
                                  {c.tier && c.tier !== 'Unranked' && (
                                    <span className="text-[10px]">{c.tier === 'Gold' ? '🥇' : c.tier === 'Silver' ? '🥈' : '🥉'}</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-text-muted truncate">{c.current_title ?? '—'}</div>
                                {c.weighted_score != null && (
                                  <div className="text-[10px] text-fuchsia font-medium mt-0.5">Score: {c.weighted_score}</div>
                                )}
                              </div>
                            ))
                          )}
                          {candidates.length > 8 && (
                            <div className="text-[10px] text-text-muted text-center">+{candidates.length - 8} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }

  // ── List view (no mandate selected) ──
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif font-bold text-2xl text-text-primary">Mandates &amp; Pipeline</h1>
        <p className="text-text-secondary text-sm mt-1">Select a mandate to view its ranked shortlist and pipeline.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {mandates.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-10 h-10 text-text-muted" />}
          title="No mandates yet"
          description="Your executive search mandates will appear here."
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {mandates.map(m => (
            <Card
              key={m.id}
              className="p-4 hover:border-fuchsia/40 transition-colors cursor-pointer"
              onClick={() => setSelectedId(m.id)}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-text-primary truncate">{m.title}</span>
                    <Badge className={statusColor(m.status)}>{m.status ?? 'Unknown'}</Badge>
                  </div>
                  <div className="text-xs text-text-muted">
                    {m.company_industry ?? '—'} · Updated {m.updated_at ? new Date(m.updated_at).toLocaleDateString() : '—'}
                  </div>
                </div>
                {m.consultant_name && (
                  <div className="w-7 h-7 bg-fuchsia/10 text-fuchsia flex items-center justify-center font-semibold text-[10px] flex-shrink-0">
                    {m.consultant_name.charAt(0)}
                  </div>
                )}
              </div>
              {m.skills_requirements && m.skills_requirements.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {m.skills_requirements.slice(0, 4).map(s => (
                    <span key={s} className="text-[10px] bg-bg-warm text-text-secondary px-2 py-0.5">{s}</span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClientMandatesPage;
