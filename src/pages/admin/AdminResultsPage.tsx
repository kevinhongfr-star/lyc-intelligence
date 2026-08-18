/**
 * B2C Admin: Assessment Results Dashboard (/admin/results).
 *
 * Columns: ID, Diagnostic, User email, Tier, Score, Status, Created at, Completed at.
 * Filters: diagnostic slug, tier, status, date range. Search: user email / result id.
 * Click a row → navigate to /admin/results/:id.
 * Pagination: 25 / page via limit/offset + total via count API or local chunked view.
 * RLS: Supabase reads via the user's role — AdminLayout already blocked non-admins.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/lib/supabase';
import { B2C_ADMIN } from '@/components/admin/shared';

type Status = 'pending' | 'completed' | 'failed' | string;

interface ResultRow {
  result_id: string;
  assessment_id: string;
  tenant_user_id?: string | null;
  user_email?: string | null;
  tier?: string | null;
  overall_score?: number | null;
  status?: Status;
  created_at?: string | null;
  completed_at?: string | null;
  deleted_at?: string | null;
}

const PAGE_SIZE = 25;

export default function AdminResultsPage(): React.ReactElement {
  const nav = useNavigate();
  const { isLoading, isAdmin } = useAdminRole();
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [diagnostic, setDiagnostic] = useState<string>('');
  const [tier, setTier] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  useEffect(() => {
    if (!isAdmin && !isLoading) return;
    let cancelled = false;
    void (async () => {
      try {
        setError(null);
        let q = supabase
          .from('assessment_results')
          .select(
            'result_id, assessment_id, tenant_user_id, overall_score, status, created_at, completed_at, deleted_at, ' +
            'user_email:tenant_user_id(email), tier:tenant_user_id(tier)',
            { count: 'exact' }
          )
          .is('deleted_at', null)
          .order('created_at', { ascending: false });
        if (diagnostic) q = q.eq('assessment_id', diagnostic);
        if (status) q = q.eq('status', status);
        if (from) q = q.gte('created_at', from + 'T00:00:00Z');
        if (to)   q = q.lte('created_at', to + 'T23:59:59Z');
        if (tier) q = q.eq('tenant_user_id.tier', tier);
        if (search.trim()) {
          const s = search.trim().toLowerCase();
          if (/^[0-9a-f-]{6,}$/i.test(s)) {
            q = q.ilike('result_id', `${s}%`);
          } else if (s.includes('@')) {
            q = q.ilike('tenant_user_id.email', `%${s}%`);
          }
        }
        const { data, error: e } = await q;
        if (cancelled) return;
        if (e) throw e;
        const flat: ResultRow[] = (data ?? []).map((r: any) => ({
          result_id: r.result_id,
          assessment_id: r.assessment_id,
          tenant_user_id: r.tenant_user_id?.user_id ?? r.tenant_user_id?.id ?? r.tenant_user_id ?? null,
          user_email: typeof r.user_email === 'string' ? r.user_email : (r as any).tenant_user_id?.email ?? null,
          tier: typeof r.tier === 'string' ? r.tier : (r as any).tenant_user_id?.tier ?? null,
          overall_score: r.overall_score ?? null,
          status: r.status ?? (r.completed_at ? 'completed' : 'pending'),
          created_at: r.created_at ?? null,
          completed_at: r.completed_at ?? null,
          deleted_at: r.deleted_at ?? null,
        }));
        setRows(flat);
        setLoaded(true);
      } catch (e: any) {
        setError(e?.message ?? String(e));
        setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [isAdmin, isLoading, diagnostic, status, tier, from, to, search]);

  const filtered = useMemo(() => rows, [rows]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  if (isLoading || !isAdmin) return B2C_ADMIN.Loading({ label: 'Assessment results' });
  if (!isAdmin) return B2C_ADMIN.Denied();

  return (
    <B2C_ADMIN.Shell
      title="Assessment results"
      subtitle="All B2C assessment completions across every diagnostic."
    >
      {/* Filters */}
      <section style={B2C_ADMIN.cardStyle()}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <Field label="Search">
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#6B7280' }} />
              <input value={search} onChange={(e) => { setPage(0); setSearch(e.target.value); }} placeholder="Email or result ID…" style={B2C_ADMIN.inputStyle(true)} />
            </div>
          </Field>
          <Field label="Diagnostic">
            <select value={diagnostic} onChange={(e) => { setPage(0); setDiagnostic(e.target.value); }} style={B2C_ADMIN.inputStyle()}>
              <option value="">All</option>
              {['prism','spark','forge','bridge','mosaic','drive','cpi','shift','leap','quest','impact','coach'].map((d) => (
                <option key={d} value={d}>{d.toUpperCase()}</option>
              ))}
            </select>
          </Field>
          <Field label="Tier">
            <select value={tier} onChange={(e) => { setPage(0); setTier(e.target.value); }} style={B2C_ADMIN.inputStyle()}>
              <option value="">All</option>
              <option value="executive_introduction">Executive Introduction</option>
              <option value="professional">Professional</option>
              <option value="executive">Executive</option>
              <option value="council">Council</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => { setPage(0); setStatus(e.target.value); }} style={B2C_ADMIN.inputStyle()}>
              <option value="">All</option>
              <option value="pending">pending</option>
              <option value="completed">completed</option>
              <option value="failed">failed</option>
            </select>
          </Field>
          <Field label="Created from (UTC YYYY-MM-DD)">
            <input type="date" value={from} onChange={(e) => { setPage(0); setFrom(e.target.value); }} style={B2C_ADMIN.inputStyle()} />
          </Field>
          <Field label="Created to (UTC)">
            <input type="date" value={to} onChange={(e) => { setPage(0); setTo(e.target.value); }} style={B2C_ADMIN.inputStyle()} />
          </Field>
        </div>
      </section>

      {/* Table */}
      <section style={{ marginTop: 20, ...B2C_ADMIN.cardStyle(), padding: 0 }}>
        {error ? <div style={{ padding: 16, color: '#B91C1C' }}>{error}</div> :
          !loaded ? <div style={{ padding: 24, color: '#6B7280' }}>Loading…</div> :
          <>
            <ResultsTable
              rows={slice}
              onRowClick={(r) => nav(`/admin/results/${r.result_id}`)}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 12, color: '#6B7280', fontFamily: B2C_ADMIN.MONO }}>
                Page {page + 1} / {pages} · total {filtered.length}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} style={B2C_ADMIN.btnGhost()}>Prev</button>
                <button disabled={page + 1 >= pages} onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} style={B2C_ADMIN.btnGhost()}>Next</button>
              </div>
            </div>
          </>
        }
      </section>
    </B2C_ADMIN.Shell>
  );
}

function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700 }}>{props.label}</span>
      {props.children}
    </label>
  );
}

function ResultsTable({ rows, onRowClick }: { rows: ResultRow[]; onRowClick: (r: ResultRow) => void }) {
  const mono = B2C_ADMIN.MONO;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }} role="grid">
        <thead>
          <tr style={{ background: '#F9FAFB' }}>
            <Th>ID <ArrowUpDown size={12} /></Th>
            <Th>Diagnostic</Th>
            <Th>User email</Th>
            <Th>Tier</Th>
            <Th>Score</Th>
            <Th>Status</Th>
            <Th>Created at</Th>
            <Th>Completed at</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#6B7280' }}>
                No rows match the current filters.
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr
              key={r.result_id}
              onClick={() => onRowClick(r)}
              style={{
                background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                cursor: 'pointer',
                transition: 'background 120ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? '#FFFFFF' : '#FAFAFA')}
            >
              <Td mono>{r.result_id.slice(0, 12)}…</Td>
              <Td bold><span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{r.assessment_id}</span></Td>
              <Td mono>{r.user_email || '—'}</Td>
              <Td>{B2C_ADMIN.TierBadge(r.tier)}</Td>
              <Td mono>{typeof r.overall_score === 'number' ? Math.round(r.overall_score) : '—'}</Td>
              <Td>{B2C_ADMIN.StatusBadge(r.status || (r.completed_at ? 'completed' : 'pending'))}</Td>
              <Td mono>{fmt(r.created_at)}</Td>
              <Td mono>{fmt(r.completed_at)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th(props: { children: React.ReactNode }) {
  return (
    <th style={{
      padding: '10px 16px',
      textAlign: 'left',
      fontFamily: '"DM Sans", sans-serif',
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: '#6B7280',
      borderBottom: '1px solid #E5E7EB',
      whiteSpace: 'nowrap',
      display: 'flex', alignItems: 'center', gap: 4,
    }}>{props.children}</th>
  );
}

function Td(props: { children: React.ReactNode; mono?: boolean; bold?: boolean }) {
  return (
    <td style={{
      padding: '10px 16px',
      borderBottom: '1px solid #F3F4F6',
      fontSize: 13,
      color: '#0B0B0B',
      verticalAlign: 'middle',
      whiteSpace: 'nowrap',
      fontFamily: props.mono ? B2C_ADMIN.MONO : '"DM Sans", sans-serif',
      fontVariantNumeric: props.mono ? 'tabular-nums' : undefined,
      fontWeight: props.bold ? 600 : 400,
    }}>{props.children}</td>
  );
}

function fmt(s: string | null | undefined): string {
  if (!s) return '—';
  try { return new Date(s).toISOString().replace('T', ' ').slice(0, 16); } catch { return s; }
}
