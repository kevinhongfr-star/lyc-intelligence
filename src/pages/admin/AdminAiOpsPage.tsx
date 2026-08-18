/**
 * B2C Admin: AI Operations Dashboard (/admin/ai-ops).
 *
 * Stats (last 24h): pending, processing, completed, failed.
 * Recent jobs: type, result_id, status, duration, miles debited, error.
 * Failed-job retry buttons: re-queue into ai_job_queue by ID with status = queued.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/lib/supabase';
import { B2C_ADMIN } from '@/components/admin/shared';

interface AiJobRow {
  job_id: string; kind: string; status: string; result_id?: string | null;
  duration_ms?: number | null; miles_debited?: number | null;
  error?: string | null; created_at?: string | null; updated_at?: string | null;
  payload?: any;
}

export default function AdminAiOpsPage(): React.ReactElement {
  const { isAdmin, isLoading } = useAdminRole();
  const [rows, setRows] = useState<AiJobRow[]>([]);
  const [err, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const reload = () => {
    if (!isAdmin) return;
    void (async () => {
      try {
        setError(null);
        let q = supabase.from('ai_job_queue').select('*').order('created_at', { ascending: false }).limit(200);
        if (filter !== 'all') q = q.eq('status', filter);
        const { data, error } = await q;
        if (error) throw error;
        setRows((data ?? []) as AiJobRow[]);
      } catch (e: any) { setError(e?.message ?? String(e)); }
    })();
  };
  useEffect(() => { reload(); }, [isAdmin, filter]);

  const counts = useMemo(() => {
    const since = Date.now() - 24 * 3600 * 1000;
    const recent = rows.filter((r) => r.created_at && new Date(r.created_at).getTime() > since);
    const c: Record<string, number> = { pending: 0, processing: 0, claimed: 0, completed: 0, failed: 0 };
    for (const r of recent) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const retry = async (job_id: string) => {
    try {
      setMsg(null); setError(null);
      const { error } = await supabase.from('ai_job_queue').update({
        status: 'queued', claimed_by: null, claimed_until: null, attempts: 0, last_error: null,
      }).eq('job_id', job_id);
      if (error) throw error;
      setMsg(`Job ${job_id.slice(0, 12)}… requeued.`);
      reload();
    } catch (e: any) { setError(e?.message ?? String(e)); }
  };

  if (isLoading || !isAdmin) return B2C_ADMIN.Loading({ label: 'AI Operations' });

  return (
    <B2C_ADMIN.Shell title="AI operations" subtitle="24-hour job queue stats + recent AI job runs + failed-job retry.">
      {msg ? <div style={{ ...B2C_ADMIN.cardStyle(), marginBottom: 16, color: '#065F46' }}>{msg}</div> : null}
      {err ? <div style={{ ...B2C_ADMIN.cardStyle(), marginBottom: 16, color: '#B91C1C' }}>{err}</div> : null}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 20 }}>
        <StatCard label="Pending (24h)" value={counts.pending ?? 0} />
        <StatCard label="Processing / claimed" value={(counts.processing ?? 0) + (counts.claimed ?? 0)} />
        <StatCard label="Completed (24h)" value={counts.completed ?? 0} accent />
        <StatCard label="Failed (24h)" value={counts.failed ?? 0} danger />
      </div>

      {/* Filter + table */}
      <div style={B2C_ADMIN.cardStyle()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700 }}>Status filter</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} style={B2C_ADMIN.inputStyle()}>
              <option value="all">All</option>
              <option value="queued">queued</option>
              <option value="claimed">claimed</option>
              <option value="processing">processing</option>
              <option value="completed">completed</option>
              <option value="failed">failed</option>
            </select>
          </label>
          <button onClick={reload} style={B2C_ADMIN.btnGhost()}>Refresh</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                <Th>Job ID</Th><Th>Kind</Th><Th>Status</Th><Th>Result ID</Th>
                <Th>Duration (ms)</Th><Th>Miles</Th><Th>Created</Th><Th>Error</Th><Th></Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#6B7280' }}>No jobs.</td></tr>
              ) : rows.map((r, i) => (
                <tr key={r.job_id} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                  <Td mono>{r.job_id.slice(0, 14)}…</Td>
                  <Td mono>{r.kind}</Td>
                  <Td>{B2C_ADMIN.StatusBadge(r.status)}</Td>
                  <Td mono>{r.result_id ? r.result_id.slice(0, 12) + '…' : '—'}</Td>
                  <Td mono>{typeof r.duration_ms === 'number' ? r.duration_ms : '—'}</Td>
                  <Td mono>{typeof r.miles_debited === 'number' ? r.miles_debited : '—'}</Td>
                  <Td mono>{fmt(r.created_at)}</Td>
                  <Td style={{ maxWidth: 260 }}>
                    <div style={{
                      fontFamily: B2C_ADMIN.MONO, fontSize: 12, color: r.error ? '#B91C1C' : '#6B7280',
                      whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden',
                    }}>{r.error ?? '—'}</div>
                  </Td>
                  <Td style={{ textAlign: 'right' }}>
                    {r.status === 'failed' ? (
                      <button onClick={() => retry(r.job_id)} style={B2C_ADMIN.btnAccent()}>Retry</button>
                    ) : null}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </B2C_ADMIN.Shell>
  );
}

function StatCard(props: { label: string; value: React.ReactNode; accent?: boolean; danger?: boolean }) {
  const bg = props.danger ? '#FEF2F2' : props.accent ? '#ECFDF5' : '#FFFFFF';
  const fg = props.danger ? '#B91C1C' : props.accent ? '#065F46' : '#111827';
  return (
    <div style={{ ...B2C_ADMIN.cardStyle(), background: bg }}>
      <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, color: '#6B7280' }}>{props.label}</div>
      <div style={{ fontFamily: B2C_ADMIN.MONO, fontSize: 36, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: fg, marginTop: 6 }}>{props.value}</div>
    </div>
  );
}

function Th(props: { children: React.ReactNode }) {
  return (
    <th style={{
      textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid #E5E7EB',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280',
    }}>{props.children}</th>
  );
}
function Td(props: { children: React.ReactNode; mono?: boolean; style?: React.CSSProperties }) {
  return (
    <td style={{
      padding: '8px 14px', borderBottom: '1px solid #F3F4F6',
      fontFamily: props.mono ? B2C_ADMIN.MONO : B2C_ADMIN.BODY, fontSize: 13, color: '#111827',
      ...(props.style ?? {}),
    }}>{props.children}</td>
  );
}
function fmt(s: any): string {
  if (!s) return '—';
  try { return new Date(s).toISOString().replace('T', ' ').slice(0, 16); } catch { return String(s); }
}
