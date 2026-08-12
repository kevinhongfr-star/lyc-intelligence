/**
 * B2C Admin: User / Tier management (/admin/users).
 *
 * Columns: email, tier, role, miles balance, created_at, last_active, disabled flag.
 * Actions per row: change tier, set admin role, adjust miles (+/−), disable account (soft ban).
 * Filters: tier, role, active status.
 */
import React, { useEffect, useState } from 'react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/lib/supabase';
import { B2C_ADMIN } from '@/components/admin/shared';

interface UserRow {
  user_id: string;
  email?: string | null;
  tier?: string | null;
  role?: string | null;
  miles_balance?: number | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  disabled_at?: string | null;
}

export default function AdminUsersPage(): React.ReactElement {
  const { isAdmin, isLoading } = useAdminRole();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [err, setError] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [showDisabled, setShowDisabled] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => {
    if (!isAdmin) return;
    void (async () => {
      try {
        setError(null);
        let q = supabase.from('profiles').select(
          'user_id:id, email, tier, role, miles_balance, created_at, last_sign_in_at, disabled_at'
        ).order('created_at', { ascending: false }).limit(500);
        if (tierFilter) q = q.eq('tier', tierFilter);
        if (roleFilter) q = q.eq('role', roleFilter);
        if (!showDisabled) q = q.is('disabled_at', null);
        const { data, error } = await q;
        if (error) throw error;
        setRows((data ?? []) as UserRow[]);
      } catch (e: any) { setError(e?.message ?? String(e)); }
    })();
  };

  useEffect(() => { reload(); }, [isAdmin, tierFilter, roleFilter, showDisabled]);

  const mutate = async (label: string, user_id: string, patch: Record<string, any>) => {
    try {
      const { error } = await supabase.from('profiles').update(patch).eq('id', user_id);
      if (error) throw error;
      setToast(`${label} applied.`);
      setTimeout(() => setToast(null), 2000);
      reload();
    } catch (e: any) { setError(e?.message ?? String(e)); }
  };

  if (isLoading || !isAdmin) return B2C_ADMIN.Loading({ label: 'Users' });

  return (
    <B2C_ADMIN.Shell title="Users and tier management" subtitle="500 most recent profiles. Adjust tier, role, miles, and disabled status per user.">
      {toast ? <div style={{ ...B2C_ADMIN.cardStyle(), marginBottom: 16, color: '#065F46' }}>{toast}</div> : null}
      {err ? <div style={{ ...B2C_ADMIN.cardStyle(), marginBottom: 16, color: '#B91C1C' }}>{err}</div> : null}
      <section style={B2C_ADMIN.cardStyle()}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <LabelBox label="Tier">
            <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} style={B2C_ADMIN.inputStyle()}>
              <option value="">All</option>
              <option value="executive_introduction">Executive Introduction</option>
              <option value="professional">Professional</option>
              <option value="executive">Executive</option>
              <option value="council">Council</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </LabelBox>
          <LabelBox label="Role">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={B2C_ADMIN.inputStyle()}>
              <option value="">All</option>
              <option value="user">user</option>
              <option value="admin">admin</option>
              <option value="lyc_admin">lyc_admin</option>
              <option value="super_admin">super_admin</option>
              <option value="consultant">consultant</option>
            </select>
          </LabelBox>
          <LabelBox label="Disabled users">
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: B2C_ADMIN.BODY, fontSize: 13 }}>
              <input type="checkbox" checked={showDisabled} onChange={(e) => setShowDisabled(e.target.checked)} /> Include disabled
            </label>
          </LabelBox>
        </div>
      </section>

      <section style={{ marginTop: 20, ...B2C_ADMIN.cardStyle(), padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              <Sh>Email</Sh><Sh>Tier</Sh><Sh>Role</Sh><Sh>Miles</Sh><Sh>Created</Sh><Sh>Last active</Sh><Sh>Status</Sh><Sh style={{ textAlign: 'right' }}>Actions</Sh>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 24, color: '#6B7280', textAlign: 'center' }}>No rows.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.user_id} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                <Td mono>{r.email || '—'}</Td>
                <Td>{B2C_ADMIN.TierBadge(r.tier)}</Td>
                <Td mono>{r.role || 'user'}</Td>
                <Td mono>{typeof r.miles_balance === 'number' ? r.miles_balance : '—'}</Td>
                <Td mono>{fmt(r.created_at)}</Td>
                <Td mono>{fmt(r.last_sign_in_at)}</Td>
                <Td>{r.disabled_at ? B2C_ADMIN.StatusBadge('disabled') : B2C_ADMIN.StatusBadge('active')}</Td>
                <Td style={{ textAlign: 'right' }}>
                  <RowActions r={r} onChange={mutate} />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </B2C_ADMIN.Shell>
  );
}

function LabelBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700 }}>{label}</span>
      {children}
    </label>
  );
}

function RowActions({ r, onChange }: { r: UserRow; onChange: (label: string, user_id: string, patch: Record<string, any>) => void }) {
  const [tier, setTier] = useState<string>(r.tier ?? 'executive_introduction');
  const [role, setRole] = useState<string>(r.role ?? 'user');
  const [delta, setDelta] = useState<number>(10);
  useEffect(() => { setTier(r.tier ?? 'executive_introduction'); setRole(r.role ?? 'user'); }, [r.user_id]);
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      <select value={tier} onChange={(e) => setTier(e.target.value)} style={{ ...B2C_ADMIN.inputStyle(), width: 160 }}>
        <option value="executive_introduction">Executive Introduction</option>
        <option value="professional">Professional</option>
        <option value="executive">Executive</option>
        <option value="council">Council</option>
        <option value="enterprise">Enterprise</option>
      </select>
      <button onClick={() => onChange('Set tier', r.user_id, { tier })} style={B2C_ADMIN.btnPrimary()}>Save tier</button>
      <select value={role} onChange={(e) => setRole(e.target.value)} style={{ ...B2C_ADMIN.inputStyle(), width: 130 }}>
        <option value="user">user</option>
        <option value="admin">admin</option>
        <option value="lyc_admin">lyc_admin</option>
        <option value="super_admin">super_admin</option>
        <option value="consultant">consultant</option>
      </select>
      <button onClick={() => onChange('Set role', r.user_id, { role })} style={B2C_ADMIN.btnGhost()}>Set role</button>
      <div style={{ display: 'inline-flex', alignItems: 'stretch' }}>
        <input type="number" value={delta} onChange={(e) => setDelta(Number(e.target.value) || 0)}
          style={{ ...B2C_ADMIN.inputStyle(true), width: 80, fontFamily: B2C_ADMIN.MONO, padding: '6px 10px' }} />
      </div>
      <button onClick={() => onChange(`Adjust miles ${delta > 0 ? '+' : ''}${delta}`, r.user_id, { miles_balance: (r.miles_balance ?? 0) + delta })} style={B2C_ADMIN.btnGhost()}>Adjust miles</button>
      {r.disabled_at ? (
        <button onClick={() => onChange('Re-enable user', r.user_id, { disabled_at: null })} style={B2C_ADMIN.btnGhost()}>Re-enable</button>
      ) : (
        <button onClick={() => onChange('Disable user', r.user_id, { disabled_at: new Date().toISOString() })} style={B2C_ADMIN.btnDanger()}>Disable</button>
      )}
    </div>
  );
}

function Sh(props: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <th style={{
      textAlign: 'left', padding: '10px 16px',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280',
      borderBottom: '1px solid #E5E7EB',
      ...(props.style ?? {}),
    }}>{props.children}</th>
  );
}
function Td(props: { children: React.ReactNode; mono?: boolean; style?: React.CSSProperties }) {
  return (
    <td style={{
      padding: '10px 16px', borderBottom: '1px solid #F3F4F6',
      fontFamily: props.mono ? B2C_ADMIN.MONO : B2C_ADMIN.BODY, fontSize: 13,
      color: '#0B0B0B', verticalAlign: 'middle',
      ...(props.style ?? {}),
    }}>{props.children}</td>
  );
}

function fmt(s: any): string {
  if (!s) return '—';
  try { return new Date(s).toISOString().replace('T', ' ').slice(0, 16); } catch { return String(s); }
}
