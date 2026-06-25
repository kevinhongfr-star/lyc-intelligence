/**
 * EvaluationsTab — list of evaluation runs in `org_evaluations` for selected company.
 *
 * Features:
 *   - Company selector
 *   - List of evaluations: talent, date, evaluator, composite, tier, source count
 *   - "Re-score" button calls T4 compute endpoint (admin only)
 *   - Click row to expand: 5 sub-scores + rationales
 *   - Override modal: admin can adjust any sub-score with reason (≥30 chars)
 *
 * Phase 1: read + re-score + override. No batch operations.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { authFetch } from '@/utils/authFetch';
import {
  ClipboardCheck, Loader2, RefreshCw, AlertTriangle,
  ChevronRight, ChevronDown, Edit3, CheckCircle2, X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { CompanySelect } from './CompanySelect';
import { CRITERIA, OVERRIDE_MIN_REASON_LENGTH, type CriterionId } from '@/lib/scoringCriteria';

interface Evaluation {
  id: string;
  talent_id: string;
  eval_type: string;
  eval_date: string;
  evaluator_id: string | null;
  overall_score: number | null;
  scorecard: any;
  notes: string | null;
  is_final: boolean | null;
  created_at: string;
  updated_at: string;
  talent_name?: string;       // joined
  talent_title?: string | null;
}

interface EvaluationScore {
  id: string;
  evaluation_id: string;
  criterion_key: string;
  criterion_label: string;
  score: number;
  source: string | null;
  rationale: string | null;
  confidence: number | null;
  overridden_by: string | null;
  overridden_at: string | null;
}

export function EvaluationsTab() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [scores, setScores] = useState<Record<string, EvaluationScore[]>>({});
  const [rescoring, setRescoring] = useState<string | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<{ evaluationId: string; scores: EvaluationScore[] } | null>(null);

  const fetchEvaluations = async () => {
    if (!companyId) {
      setEvaluations([]);
      return;
    }
    const sb = useAuthStore.getState().supabase;
    if (!sb) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch evaluations joined with talent via two-step (PostgREST FK hint)
      const { data: evalData, error: e1 } = await sb
        .from('org_evaluations')
        .select('*, org_talent_pools!inner(name, title, target_company_id)')
        .eq('org_talent_pools.target_company_id', companyId)
        .order('updated_at', { ascending: false })
        .limit(200);
      if (e1) {
        setError(e1.message);
        setEvaluations([]);
        return;
      }
      const rows = (evalData ?? []).map((row: any) => ({
        ...row,
        talent_name: row.org_talent_pools?.name,
        talent_title: row.org_talent_pools?.title,
        org_talent_pools: undefined,
      })) as Evaluation[];
      setEvaluations(rows);
    } catch (caughtErr) {
      setError((caughtErr as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvaluations(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [companyId]);

  const fetchScores = async (evaluationId: string) => {
    const sb = useAuthStore.getState().supabase;
    if (!sb) return;
    const { data, error: fetchErr } = await sb
      .from('org_evaluation_scores')
      .select('*')
      .eq('evaluation_id', evaluationId)
      .order('criterion_key', { ascending: true });
    if (fetchErr) {
      setError(fetchErr.message);
      return;
    }
    setScores((prev) => ({ ...prev, [evaluationId]: (data ?? []) as EvaluationScore[] }));
  };

  const toggleExpand = async (evaluationId: string) => {
    const next = new Set(expanded);
    if (next.has(evaluationId)) {
      next.delete(evaluationId);
    } else {
      next.add(evaluationId);
      if (!scores[evaluationId]) {
        await fetchScores(evaluationId);
      }
    }
    setExpanded(next);
  };

  const rescore = async (ev: Evaluation) => {
    setRescoring(ev.id);
    setError(null);
    const sb = useAuthStore.getState().supabase;
    if (!sb) {
      setRescoring(null);
      return;
    }
    // Find the mandate from the talent's target_company
    const { data: talent } = await sb
      .from('org_talent_pools')
      .select('target_company_id, target_companies!inner(mandate_id)')
      .eq('id', ev.talent_id)
      .single();
    const mandateId = (talent as any)?.target_companies?.mandate_id;
    if (!mandateId) {
      setError('Cannot find mandate_id for this talent');
      setRescoring(null);
      return;
    }
    try {
      const { data: sess } = await sb.auth.getSession();
      const token = sess.session?.access_token;
      const res = await authFetch('/api/admin/org-intelligence/scoring/compute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ talent_id: ev.talent_id, mandate_id: mandateId, force: true }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(`Re-score failed (${res.status}): ${text.slice(0, 200)}`);
      } else {
        await fetchEvaluations();
        if (expanded.has(ev.id)) {
          await fetchScores(ev.id);
        }
      }
    } catch (caughtErr) {
      setError((caughtErr as Error).message);
    } finally {
      setRescoring(null);
    }
  };

  return (
    <div className="space-y-4">
      <CompanySelect value={companyId} onChange={setCompanyId} />

      {!companyId ? (
        <EmptyHint title="Select a company to view its evaluations" />
      ) : loading ? (
        <div className="flex items-center gap-2 text-text-muted text-sm py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading evaluations…
        </div>
      ) : error ? (
        <div className="text-sm text-red-600 py-4 border border-red-200 bg-red-50 rounded-md p-3">
          <AlertTriangle className="w-4 h-4 inline mr-1" /> {error}
        </div>
      ) : evaluations.length === 0 ? (
        <EmptyHint
          title="No evaluations yet"
          note="Re-score a talent from this page, or trigger scoring from the Scoring tab."
        />
      ) : (
        <div className="border border-bg-hover rounded-md overflow-hidden">
          {evaluations.map((ev) => {
            const isOpen = expanded.has(ev.id);
            const tier = ev.scorecard?.tier ?? null;
            const tierLabel = ev.scorecard?.tier_label ?? null;
            return (
              <div key={ev.id} className="border-b border-bg-hover last:border-b-0">
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary/30">
                  <button
                    onClick={() => toggleExpand(ev.id)}
                    className="text-text-muted"
                  >
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-text-primary truncate">
                      {ev.talent_name ?? '—'}
                      {ev.talent_title && <span className="text-text-muted font-normal"> · {ev.talent_title}</span>}
                    </div>
                    <div className="text-xs text-text-muted">
                      {ev.eval_date} · eval type: {ev.eval_type} · {ev.is_final ? 'Final' : 'Draft'}
                    </div>
                  </div>
                  {ev.overall_score != null && (
                    <div className="text-right">
                      <div className="font-mono text-lg font-semibold text-text-primary">
                        {Number(ev.overall_score).toFixed(1)}
                      </div>
                      {tierLabel && (
                        <div className={`text-xs font-medium ${tier === 'T1_STRONG' ? 'text-green-700' : tier === 'T2_GOOD' ? 'text-blue-700' : tier === 'T3_POTENTIAL' ? 'text-amber-700' : 'text-text-muted'}`}>
                          {tierLabel}
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => rescore(ev)}
                    disabled={rescoring === ev.id}
                    className="px-2 py-1 text-xs border border-bg-hover rounded-md hover:bg-bg-secondary flex items-center gap-1"
                  >
                    {rescoring === ev.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Re-score
                  </button>
                </div>
                {isOpen && (
                  <div className="bg-bg-secondary/30 px-4 py-3 border-t border-bg-hover">
                    {scores[ev.id] ? (
                      <div className="space-y-2">
                        <div className="text-xs text-text-muted mb-1">
                          {scores[ev.id].length} criteria · source: {ev.scorecard?.model ?? '—'} · tokens: {ev.scorecard?.total_tokens ?? '—'}
                        </div>
                        {scores[ev.id].map((s) => (
                          <div key={s.id} className="border border-bg-hover rounded-md p-3 bg-white">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-text-primary">{s.criterion_key}</span>
                              <span className="text-sm text-text-secondary">{s.criterion_label}</span>
                              <span className="ml-auto font-mono text-lg font-semibold">{s.score}/20</span>
                              {s.overridden_at && (
                                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                                  OVERRIDDEN
                                </span>
                              )}
                            </div>
                            {s.rationale && (
                              <p className="text-sm text-text-muted mt-1 italic">"{s.rationale}"</p>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => setOverrideTarget({ evaluationId: ev.id, scores: scores[ev.id] })}
                          className="px-3 py-1.5 text-xs border border-bg-hover rounded-md hover:bg-bg-secondary flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Override sub-scores
                        </button>
                      </div>
                    ) : (
                      <div className="text-text-muted text-sm">Loading sub-scores…</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {overrideTarget && (
        <OverrideModal
          evaluationId={overrideTarget.evaluationId}
          scores={overrideTarget.scores}
          onClose={() => setOverrideTarget(null)}
          onSaved={() => {
            setOverrideTarget(null);
            fetchScores(overrideTarget.evaluationId);
            fetchEvaluations();
          }}
        />
      )}
    </div>
  );
}

function OverrideModal({ evaluationId, scores, onClose, onSaved }: {
  evaluationId: string;
  scores: EvaluationScore[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changed = Object.keys(overrides).filter((k) => {
    const orig = scores.find((s) => s.criterion_key === k)?.score;
    return orig != null && overrides[k] !== orig;
  });

  const save = async () => {
    if (changed.length === 0) {
      setError('No changes to save');
      return;
    }
    if (reason.length < OVERRIDE_MIN_REASON_LENGTH) {
      setError(`Reason must be at least ${OVERRIDE_MIN_REASON_LENGTH} characters`);
      return;
    }
    setSubmitting(true);
    setError(null);
    const sb = useAuthStore.getState().supabase;
    if (!sb) { setSubmitting(false); return; }
    try {
      // For Phase 1, override writes to overridden_by + overridden_at on the score row
      // and inserts an audit entry. Composite recompute is Phase 2.
      for (const key of changed) {
        const orig = scores.find((s) => s.criterion_key === key);
        if (!orig) continue;
        const { error: updateErr } = await sb
          .from('org_evaluation_scores')
          .update({
            score: overrides[key],
            overridden_by: (await sb.auth.getUser()).data.user?.id,
            overridden_at: new Date().toISOString(),
          })
          .eq('id', orig.id);
        if (updateErr) throw updateErr;
      }
      // Audit log
      const { data: userData } = await sb.auth.getUser();
      await sb.from('org_audit_log').insert({
        actor_id: userData.user?.id,
        action: 'scoring.override',
        resource_type: 'org_evaluation',
        resource_id: evaluationId,
        after_state: { overrides, reason, changed_keys: changed },
      });
      onSaved();
    } catch (caughtErr) {
      setError((caughtErr as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Override sub-scores</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-xs text-text-muted">
          Each override is recorded in the audit trail. Original automated score is preserved.
        </div>
        <div className="space-y-3">
          {scores.map((s) => {
            const id = s.criterion_key as CriterionId;
            const c = CRITERIA[id];
            const newVal = overrides[s.criterion_key] ?? s.score;
            return (
              <div key={s.id} className="border border-bg-hover rounded-md p-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">{s.criterion_key}</span>
                  <span className="text-sm text-text-secondary">{c?.name ?? s.criterion_label}</span>
                  <span className="ml-auto text-xs text-text-muted">
                    orig: <span className="font-mono">{s.score}</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={newVal}
                  onChange={(e) => setOverrides({ ...overrides, [s.criterion_key]: parseInt(e.target.value, 10) })}
                  className="w-full mt-2"
                />
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={newVal}
                    onChange={(e) => setOverrides({ ...overrides, [s.criterion_key]: Math.max(0, Math.min(20, parseInt(e.target.value || '0', 10))) })}
                    className="w-16 border border-bg-hover rounded px-2 py-0.5 text-sm"
                  />
                  <span className="text-xs text-text-muted">/ 20</span>
                  {overrides[s.criterion_key] != null && overrides[s.criterion_key] !== s.score && (
                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                      → {overrides[s.criterion_key]}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Override reason (required, ≥{OVERRIDE_MIN_REASON_LENGTH} chars)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full border border-bg-hover rounded-md px-2 py-1.5 text-sm"
            placeholder="Explain why these sub-scores need manual adjustment…"
          />
          <div className="text-xs text-text-muted mt-1">
            {reason.length} / {OVERRIDE_MIN_REASON_LENGTH}+ characters
            {reason.length < OVERRIDE_MIN_REASON_LENGTH && reason.length > 0 && (
              <span className="text-amber-700 ml-2">({OVERRIDE_MIN_REASON_LENGTH - reason.length} more needed)</span>
            )}
          </div>
        </div>
        {error && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-2">
            <AlertTriangle className="w-4 h-4 inline mr-1" /> {error}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm border border-bg-hover rounded-md">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={submitting || changed.length === 0 || reason.length < OVERRIDE_MIN_REASON_LENGTH}
            className="px-3 py-1.5 text-sm bg-accent text-white rounded-md hover:bg-accent-light disabled:opacity-50 flex items-center gap-1"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Save {changed.length > 0 && `(${changed.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyHint({ title, note }: { title: string; note?: string }) {
  return (
    <div className="border-2 border-dashed border-bg-hover rounded-lg p-8 text-center">
      <ClipboardCheck className="w-6 h-6 text-text-muted mx-auto mb-2" />
      <p className="text-text-primary font-medium">{title}</p>
      {note && <p className="text-text-muted text-sm mt-1">{note}</p>}
    </div>
  );
}
