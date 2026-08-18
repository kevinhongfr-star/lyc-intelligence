/**
 * B2C Admin: Email Operations Dashboard (/admin/email-ops).
 *
 * Recent sends: template, recipient, status, delivery time (from email_delivery_log).
 * Delivery stats: sent, delivered, opened, clicked, bounced, failed (7d).
 * Template list with preview: fires template-render worker and shows HTML/preview in modal.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/lib/supabase';
import { B2C_ADMIN } from '@/components/admin/shared';
import { B2C_EMAIL_KINDS, TEMPLATE_REGISTRY, type EmailKind } from '@/services/emailEngine';

interface DeliveryRow {
  id: string;
  template_code?: string | null;
  to_addresses?: any;
  status: string;
  last_status?: string | null;
  subject?: string | null;
  provider?: string | null;
  provider_message_id?: string | null;
  opens?: number | null;
  clicks?: number | null;
  delivered_at?: string | null;
  created_at?: string | null;
  bounce_reason?: string | null;
}

export default function AdminEmailOpsPage(): React.ReactElement {
  const { isAdmin, isLoading } = useAdminRole();
  const [rows, setRows] = useState<DeliveryRow[]>([]);
  const [err, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<EmailKind | null>(null);
  const [previewPayload, setPreviewPayload] = useState<{ subject?: string; preheader?: string; html?: string; text?: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const reload = () => {
    if (!isAdmin) return;
    void (async () => {
      try {
        setError(null);
        const { data, error } = await supabase
          .from('email_delivery_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        setRows((data ?? []).map((r: any) => ({ ...r, id: String(r.id ?? r.log_id ?? '') })));
      } catch (e: any) { setError(e?.message ?? String(e)); }
    })();
  };
  useEffect(() => { reload(); }, [isAdmin]);

  const { stats, windowLabel } = useMemo(() => {
    const since = Date.now() - 7 * 24 * 3600 * 1000;
    const recent = rows.filter((r) => r.created_at && new Date(r.created_at).getTime() > since);
    const c = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, failed: 0 };
    for (const r of recent) {
      const s = (r.last_status ?? r.status ?? '').toLowerCase();
      c.sent++;
      if (s === 'delivered') c.delivered++;
      if (s === 'opened' || (typeof r.opens === 'number' && r.opens > 0)) c.opened++;
      if (s === 'clicked' || (typeof r.clicks === 'number' && r.clicks > 0)) c.clicked++;
      if (s === 'soft_bounce' || s === 'hard_bounce') c.bounced++;
      if (s === 'failed' || r.status === 'failed') c.failed++;
    }
    return { stats: c, windowLabel: `Last 7 days (n=${recent.length})` };
  }, [rows]);

  const openPreview = async (kind: EmailKind) => {
    setPreviewKind(kind); setShowPreview(true); setMsg(null); setError(null); setPreviewPayload(null);
    try {
      const r = await fetch(`/api/workers/template-render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_kind: kind,
          variables: previewVariablesFor(kind),
          to: ['preview@lyc.partners'],
          options: { diagnosticSlug: 'prism', tier: 'professional' },
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? `HTTP ${r.status}`);
      setPreviewPayload({ subject: j.subject, preheader: j.preheader, html: j.html, text: j.text });
    } catch (e: any) { setError(e?.message ?? String(e)); }
  };

  if (isLoading || !isAdmin) return B2C_ADMIN.Loading({ label: 'Email operations' });

  return (
    <B2C_ADMIN.Shell title="Email operations" subtitle="7-day delivery funnel plus per-template HTML preview.">
      {msg ? <div style={{ ...B2C_ADMIN.cardStyle(), marginBottom: 16, color: '#065F46' }}>{msg}</div> : null}
      {err ? <div style={{ ...B2C_ADMIN.cardStyle(), marginBottom: 16, color: '#B91C1C' }}>{err}</div> : null}

      {/* 7-day stats */}
      <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700 }}>{windowLabel}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 20 }}>
        <Stat label="Sent" value={stats.sent} />
        <Stat label="Delivered" value={stats.delivered} accent />
        <Stat label="Opened" value={stats.opened} />
        <Stat label="Clicked" value={stats.clicked} />
        <Stat label="Bounced" value={stats.bounced} />
        <Stat label="Failed" value={stats.failed} danger />
      </div>

      {/* Template list */}
      <section style={{ ...B2C_ADMIN.cardStyle(), marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <h4 style={{ margin: 0, fontFamily: B2C_ADMIN.HEADING, fontSize: 20, fontWeight: 700 }}>Email template library</h4>
          <span style={{ fontSize: 12, color: '#6B7280' }}>Click any template to preview server-side HTML output.</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {B2C_EMAIL_KINDS.map((k) => (
            <button key={k} onClick={() => void openPreview(k)} style={{
              background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '12px 14px', cursor: 'pointer',
              textAlign: 'left', fontFamily: B2C_ADMIN.BODY, fontSize: 13, color: '#111827',
            }}>
              <div style={{ fontFamily: B2C_ADMIN.MONO, fontSize: 12, color: '#6B7280' }}>template</div>
              <div style={{ fontWeight: 700, marginTop: 2 }}>{k}</div>
              <div style={{ marginTop: 4, fontSize: 11, color: '#6B7280' }}>
                Default subject: {(TEMPLATE_REGISTRY as any)[k]?.defaultSubject?.slice(0, 64) ?? ''}…
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Recent sends */}
      <section style={{ ...B2C_ADMIN.cardStyle(), padding: 0, overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>
          <h4 style={{ margin: 0, fontFamily: B2C_ADMIN.HEADING, fontSize: 20, fontWeight: 700 }}>Recent sends</h4>
          <button onClick={reload} style={B2C_ADMIN.btnGhost()}>Refresh</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              <Th>ID</Th><Th>Template</Th><Th>Recipient</Th><Th>Status</Th>
              <Th>Last status</Th><Th>Opens</Th><Th>Clicks</Th><Th>Provider</Th><Th>Created</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#6B7280' }}>No rows yet.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id + '-' + i} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                <Td mono>{r.id}</Td>
                <Td mono>{r.template_code ?? '—'}</Td>
                <Td mono>{String(Array.isArray(r.to_addresses) ? r.to_addresses.join(', ') : '—').slice(0, 40)}</Td>
                <Td>{B2C_ADMIN.StatusBadge(r.status)}</Td>
                <Td>{r.last_status ? B2C_ADMIN.StatusBadge(r.last_status) : '—'}</Td>
                <Td mono>{r.opens ?? 0}</Td>
                <Td mono>{r.clicks ?? 0}</Td>
                <Td mono>{r.provider ?? '—'}</Td>
                <Td mono>{fmt(r.created_at)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Preview modal */}
      {showPreview ? (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 9999,
        }} onClick={() => setShowPreview(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#FFFFFF', maxWidth: 900, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', borderBottom: '1px solid #E5E7EB',
            }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: B2C_ADMIN.HEADING, fontSize: 22, fontWeight: 700 }}>
                  Template preview · <span style={{ fontFamily: B2C_ADMIN.MONO, fontSize: 14 }}>{previewKind}</span>
                </h3>
                {previewPayload?.subject ? <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Subject: {previewPayload.subject}</div> : null}
                {previewPayload?.preheader ? <div style={{ fontSize: 12, color: '#6B7280' }}>Preheader: {previewPayload.preheader}</div> : null}
              </div>
              <button onClick={() => setShowPreview(false)} style={B2C_ADMIN.btnGhost()}>Close</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', background: '#F3F4F6', padding: 16 }}>
              {!previewPayload?.html ? (
                <div style={{ color: '#6B7280', fontSize: 13 }}>Rendering preview…</div>
              ) : (
                <div style={{ background: '#FFFFFF', padding: 24 }} dangerouslySetInnerHTML={{ __html: previewPayload.html }} />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </B2C_ADMIN.Shell>
  );
}

function Stat(props: { label: string; value: React.ReactNode; accent?: boolean; danger?: boolean }) {
  const bg = props.danger ? '#FEF2F2' : props.accent ? '#ECFDF5' : '#FFFFFF';
  const fg = props.danger ? '#B91C1C' : props.accent ? '#065F46' : '#111827';
  return (
    <div style={{ ...B2C_ADMIN.cardStyle(), background: bg }}>
      <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, color: '#6B7280' }}>{props.label}</div>
      <div style={{ fontFamily: B2C_ADMIN.MONO, fontSize: 30, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: fg, marginTop: 6 }}>{props.value}</div>
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
function Td(props: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td style={{
      padding: '8px 14px', borderBottom: '1px solid #F3F4F6',
      fontFamily: props.mono ? B2C_ADMIN.MONO : B2C_ADMIN.BODY, fontSize: 13, color: '#111827',
    }}>{props.children}</td>
  );
}
function fmt(s: any): string {
  if (!s) return '—';
  try { return new Date(s).toISOString().replace('T', ' ').slice(0, 16); } catch { return String(s); }
}

function previewVariablesFor(kind: EmailKind): Record<string, any> {
  const baseUser = {
    recipient_name: 'Preview User', recipient_email: 'preview@lyc.partners',
    user_tier: 'professional', share_url: 'https://lyc.partners/s/abcd1234',
    sender_name: 'Alex Sender', sender_email: 'alex@example.com',
    sender_note: 'Hi — I thought this assessment would be relevant to your current priorities.',
    dashboard_url: 'https://lyc.partners/app/dashboard',
    result_id: 'demo-result-id',
    assessment_title: 'PRISM Executive Diagnostic',
  };
  switch (kind) {
    case 'weekly_digest':
      return {
        ...baseUser,
        week_label: 'Week of Aug 10',
        summary_counts: { assessments_completed: 2, nexus_sessions: 5, shares_sent: 1, insights_generated: 6 },
        results: [
          { title: 'PRISM Executive Diagnostic', diagnostic: 'prism', completed_at: new Date().toISOString(), score: 72, one_line: 'Strategic thinker — strong on systems' },
          { title: 'FORGE Executive Diagnostic', diagnostic: 'forge', completed_at: new Date().toISOString(), score: 68, one_line: 'Highly executional' },
        ],
        nexus: [
          { topic: '2026 career milestones', turns: 23, last_message: 'We drafted the 3-month plan.', continue_url: '/nexus?sid=123' },
        ],
      };
    case 'share_result':
      return { ...baseUser, assessment_title: 'PRISM Executive Diagnostic' };
    case 'assessment_complete':
      return { ...baseUser, assessment_title: 'PRISM Executive Diagnostic', overall_score: 72, result_score: 72, composite_interpretation: 'Strategic thinker' };
    case 'upgrade_confirmation':
      return { ...baseUser, tier: 'professional', next_billing_date: '2026-09-01' };
    case 'password_reset':
      return { ...baseUser, reset_url: 'https://lyc.partners/reset?token=xyz' };
    case 'email_verification':
      return { ...baseUser, verify_url: 'https://lyc.partners/verify?token=xyz' };
    case 'welcome':
      return { ...baseUser, getting_started_url: 'https://lyc.partners/app/dashboard' };
    case 'nexus_conversation_summary':
      return { ...baseUser, conversation_title: '2026 Q3 planning', summary: 'Draft 3 key priorities', continue_url: '/nexus?sid=abc' };
    default:
      return baseUser;
  }
}
