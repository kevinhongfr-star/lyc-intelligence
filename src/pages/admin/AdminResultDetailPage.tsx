/**
 * B2C Admin: Result Detail / Moderation (/admin/results/:id).
 *
 * Shows: scores, dimensions, AI insights, archetype, delivery history.
 * Actions: regenerate AI insights, adjust tier on result, soft delete, view raw JSON.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/lib/supabase';
import { B2C_ADMIN } from '@/components/admin/shared';

interface SharesRow { share_id: string; share_token: string | null; recipient_email?: string | null; created_at?: string | null; }
interface DeliveryRow { log_id?: string | number | null; template_code?: string | null; to_addresses?: any; status: string; last_status?: string | null; subject?: string | null; created_at?: string | null; provider_message_id?: string | null; }

export default function AdminResultDetailPage(): React.ReactElement {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { isAdmin, isLoading } = useAdminRole();
  const [result, setResult] = useState<any>(null);
  const [raw, setRaw] = useState<any>(null);
  const [shares, setShares] = useState<SharesRow[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [showRaw, setShowRaw] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [err, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<string>('');

  useEffect(() => {
    if (!id || !isAdmin) return;
    let cancelled = false;
    void (async () => {
      try {
        const r1 = await supabase.from('assessment_results').select('*').eq('result_id', id).maybeSingle();
        if (cancelled) return;
        if (r1.error) throw r1.error;
        setResult(r1.data ?? null);
        setRaw(r1.data ?? null);
        setTier(r1.data?.tier ?? 'executive_introduction');
        const r2 = await supabase.from('assessment_shares').select('share_id, share_token, recipient_email, created_at').eq('result_id', id).order('created_at', { ascending: false });
        if (!r2.error) setShares(r2.data ?? []);
        const r3 = await supabase.from('email_delivery_log').select('*').eq('context_json->>result_id', id).order('created_at', { ascending: false });
        if (!r3.error) setDeliveries(r3.data ?? []);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [id, isAdmin, isLoading]);

  const regenerate = async () => {
    setMessage(null); setError(null);
    try {
      // Enqueue a manual AI job so the worker regenerates (keep flow idempotent)
      const { error: e } = await supabase.rpc('enqueue_ai_job_if_admin', {
        in_kind: 'ai:generate_insight',
        in_result_id: id,
      });
      if (e) throw e;
      setMessage('Insight regeneration queued — refresh for updated insights when worker completes.');
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  };

  const adjustTier = async () => {
    setMessage(null); setError(null);
    try {
      const { error: e } = await supabase.from('assessment_results').update({ tier }).eq('result_id', id);
      if (e) throw e;
      setResult((prev: any) => prev ? { ...prev, tier } : prev);
      setMessage(`Tier updated to ${tier}.`);
    } catch (e: any) { setError(e?.message ?? String(e)); }
  };

  const softDelete = async () => {
    if (!confirm('Soft delete this result? It will hide it from user views.')) return;
    setMessage(null); setError(null);
    try {
      const { error: e } = await supabase.from('assessment_results').update({ deleted_at: new Date().toISOString() }).eq('result_id', id);
      if (e) throw e;
      setMessage('Result soft deleted.');
      setTimeout(() => nav('/admin/results'), 1200);
    } catch (e: any) { setError(e?.message ?? String(e)); }
  };

  if (isLoading || !isAdmin) return B2C_ADMIN.Loading({ label: 'Result detail' });
  if (!result && !err) {
    return (
      <B2C_ADMIN.Shell title="Result not found" subtitle={`result_id=${id}`}>
        <div style={B2C_ADMIN.cardStyle()}>No rows matched that result_id.</div>
      </B2C_ADMIN.Shell>
    );
  }

  const score = typeof result?.overall_score === 'number' ? Math.round(result.overall_score) : null;
  const status = result?.status ?? (result?.completed_at ? 'completed' : 'pending');

  return (
    <B2C_ADMIN.Shell title={`Result · ${id.slice(0, 12)}…`} subtitle={`${result?.assessment_id ?? ''} · ${result?.tenant_user_id ?? 'anon'}`}>
      {message ? <div style={{ ...B2C_ADMIN.cardStyle(), marginBottom: 16, color: '#065F46' }}>{message}</div> : null}
      {err ? <div style={{ ...B2C_ADMIN.cardStyle(), marginBottom: 16, color: '#B91C1C' }}>{err}</div> : null}

      {/* Actions + summary */}
      <div style={{ ...B2C_ADMIN.cardStyle(), marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, alignItems: 'start' }}>
          <Metric label="Result ID" mono value={id} />
          <Metric label="Diagnostic" value={<span style={{ letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>{result?.assessment_id ?? '—'}</span>} />
          <Metric label="Score" mono value={score ?? '—'} />
          <Metric label="Status" value={B2C_ADMIN.StatusBadge(status)} />
          <Metric label="Current tier" value={B2C_ADMIN.TierBadge(tier)} />
          <Metric label="Created at" mono value={fmt(result?.created_at)} />
          <Metric label="Completed at" mono value={fmt(result?.completed_at)} />
          <Metric label="Deleted at" mono value={result?.deleted_at ? fmt(result.deleted_at) : '—'} />
        </div>

        <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700 }}>Adjust tier</span>
            <select value={tier} onChange={(e) => setTier(e.target.value)} style={B2C_ADMIN.inputStyle()}>
              <option value="executive_introduction">Executive Introduction</option>
              <option value="professional">Professional</option>
              <option value="executive">Executive</option>
              <option value="council">Council</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </label>
          <button onClick={adjustTier} style={B2C_ADMIN.btnPrimary()}>Save tier</button>
          <button onClick={regenerate} style={B2C_ADMIN.btnAccent()}>Regenerate AI insights</button>
          <button onClick={() => setShowRaw((s) => !s)} style={B2C_ADMIN.btnGhost()}>{showRaw ? 'Hide raw JSON' : 'View raw JSON'}</button>
          <button onClick={softDelete} style={B2C_ADMIN.btnDanger()}>Soft delete</button>
        </div>
      </div>

      {/* Raw JSON */}
      {showRaw ? (
        <pre style={{
          ...B2C_ADMIN.cardStyle(), marginBottom: 16, fontFamily: B2C_ADMIN.MONO, fontSize: 12,
          color: '#111827', background: '#F9FAFB', maxHeight: 360, overflow: 'auto',
        }}>{JSON.stringify(raw, null, 2)}</pre>
      ) : null}

      {/* Score / dimension summary, insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div style={B2C_ADMIN.cardStyle()}>
          <SectionTitle>Dimension scores</SectionTitle>
          <DimensionScores raw={raw} />
        </div>
        <div style={B2C_ADMIN.cardStyle()}>
          <SectionTitle>AI insights / archetype</SectionTitle>
          <Insights raw={raw} />
        </div>
      </div>

      {/* Share tokens + delivery history */}
      <div style={B2C_ADMIN.cardStyle()}>
        <SectionTitle>Delivery &amp; share history</SectionTitle>
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ ...h4Style, margin: '0 0 8px 0' }}>Shares (share tokens)</h4>
          <MiniTable
            cols={['share_id', 'token', 'recipient_email', 'created_at']}
            rows={shares.map((s) => ({
              share_id: s.share_id?.slice(0, 12) + '…' || '—',
              token: s.share_token ? s.share_token.slice(0, 14) + '…' : '—',
              recipient_email: s.recipient_email || '—',
              created_at: fmt(s.created_at),
            }))}
          />
        </div>
        <div>
          <h4 style={{ ...h4Style, margin: '0 0 8px 0' }}>Email delivery log</h4>
          <MiniTable
            cols={['log_id', 'template_code', 'to', 'status', 'last_status', 'provider_message_id', 'created_at']}
            rows={deliveries.map((d) => ({
              log_id: String(d.log_id ?? '—'),
              template_code: d.template_code ?? '—',
              to: Array.isArray(d.to_addresses) ? d.to_addresses.join(', ') : '—',
              status: d.status,
              last_status: d.last_status ?? '—',
              provider_message_id: d.provider_message_id ? String(d.provider_message_id).slice(0, 16) + '…' : '—',
              created_at: fmt(d.created_at),
            }))}
          />
        </div>
      </div>
    </B2C_ADMIN.Shell>
  );
}

const h4Style: React.CSSProperties = {
  fontFamily: B2C_ADMIN.HEADING, fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em',
};

function SectionTitle(props: { children: React.ReactNode }) {
  return <h4 style={{ margin: '0 0 12px 0', ...h4Style }}>{props.children}</h4>;
}

function Metric(props: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, marginBottom: 4 }}>{props.label}</div>
      <div style={{ fontFamily: props.mono ? B2C_ADMIN.MONO : B2C_ADMIN.BODY, fontSize: 15, fontWeight: props.mono ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {props.value}
      </div>
    </div>
  );
}

function DimensionScores({ raw }: { raw: any }) {
  const arr: Array<{ name: string; score: number | null }> = [];
  const dims = raw?.dimension_scores ?? raw?.dimensions ?? raw?.ai_bundle?.dimensions ?? null;
  if (Array.isArray(dims)) {
    for (const d of dims) {
      arr.push({ name: d.name ?? d.label ?? d.id ?? '—', score: typeof d.score === 'number' ? d.score : null });
    }
  } else if (dims && typeof dims === 'object') {
    for (const [k, v] of Object.entries<any>(dims)) {
      arr.push({ name: k, score: typeof v?.score === 'number' ? v.score : typeof v === 'number' ? v : null });
    }
  }
  if (arr.length === 0) return <div style={{ color: '#6B7280', fontSize: 13 }}>No dimension scores captured.</div>;
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {arr.map((d, i) => (
        <li key={`${d.name}-${i}`} style={{ padding: '8px 0', borderTop: i === 0 ? 'none' : '1px dashed #E5E7EB', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontFamily: B2C_ADMIN.BODY, fontSize: 13 }}>{d.name}</span>
          <span style={{ fontFamily: B2C_ADMIN.MONO, fontSize: 13, fontWeight: 600 }}>{d.score ?? '—'}</span>
        </li>
      ))}
    </ul>
  );
}

function Insights({ raw }: { raw: any }) {
  const bundle = raw?.ai_bundle ?? raw?.ai_insights ?? null;
  if (!bundle) return <div style={{ color: '#6B7280', fontSize: 13 }}>No AI bundle — user still has template-only insights (or generation pending).</div>;
  const keys = Object.keys(bundle);
  return (
    <div style={{ fontSize: 13, fontFamily: B2C_ADMIN.BODY, color: '#111827' }}>
      <div style={{ color: '#6B7280', fontFamily: B2C_ADMIN.MONO, fontSize: 11, marginBottom: 8 }}>
        AI bundle keys: {keys.join(', ')}
      </div>
      <pre style={{
        background: '#F9FAFB', padding: 12, fontFamily: B2C_ADMIN.MONO, fontSize: 12,
        maxHeight: 240, overflow: 'auto', margin: 0,
      }}>{JSON.stringify(bundle, null, 2).slice(0, 4000)}</pre>
    </div>
  );
}

function MiniTable(props: { cols: string[]; rows: Record<string, any>[] }) {
  if (props.rows.length === 0) return <div style={{ color: '#6B7280', fontSize: 13 }}>No rows.</div>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr style={{ background: '#F9FAFB' }}>
            {props.cols.map((c) => (
              <th key={c} style={{
                textAlign: 'left', padding: '8px 12px',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280',
                borderBottom: '1px solid #E5E7EB',
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
              {props.cols.map((c) => (
                <td key={c} style={{
                  padding: '6px 12px', fontSize: 12, color: '#111827',
                  fontFamily: c.includes('id') || c.includes('at') || c === 'provider_message_id' || c === 'status' || c === 'last_status' ? B2C_ADMIN.MONO : B2C_ADMIN.BODY,
                  borderBottom: '1px solid #F3F4F6',
                }}>
                  {String(r[c] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function fmt(s: any): string {
  if (!s) return '—';
  try { return new Date(s).toISOString().replace('T', ' ').slice(0, 16); } catch { return String(s); }
}
