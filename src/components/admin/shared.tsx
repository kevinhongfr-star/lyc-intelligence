/**
 * Shared B2C admin UI primitives: shell, card, badges, inputs, buttons.
 * Keeps the 5 admin pages consistent with report tokens.
 * Zero radius, Crimson Pro headings, DM Sans body, IBM Plex Mono for numerics/IDs.
 */
import React from 'react';
import { useAuthStore } from '@/stores/authStore';

export const MONO = '"IBM Plex Mono", ui-monospace, "Courier New", monospace';
export const BODY = '"DM Sans", system-ui, -apple-system, sans-serif';
export const HEADING = '"Crimson Pro", Georgia, serif';

export const B2C_ADMIN = {
  MONO,
  BODY,
  HEADING,

  shellTitle: (t: string) => t,

  shellStyle(): React.CSSProperties {
    return { fontFamily: BODY, color: '#0B0B0B', width: '100%' };
  },

  cardStyle(): React.CSSProperties {
    return {
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      padding: 16,
    };
  },

  inputStyle(withIcon = false): React.CSSProperties {
    return {
      width: '100%',
      padding: withIcon ? '8px 12px 8px 32px' : '8px 12px',
      background: '#FFFFFF',
      border: '1px solid #D1D5DB',
      color: '#0B0B0B',
      fontFamily: BODY,
      fontSize: 13,
      outline: 'none',
    };
  },

  btnPrimary(): React.CSSProperties {
    return {
      padding: '8px 14px',
      background: '#0B0B0B',
      color: '#FFFFFF',
      border: '1px solid #0B0B0B',
      fontFamily: BODY,
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: '0.02em',
      cursor: 'pointer',
    };
  },

  btnAccent(accent = '#C108AB'): React.CSSProperties {
    return {
      padding: '8px 14px',
      background: accent,
      color: '#FFFFFF',
      border: `1px solid ${accent}`,
      fontFamily: BODY,
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
    };
  },

  btnGhost(): React.CSSProperties {
    return {
      padding: '6px 12px',
      background: '#FFFFFF',
      color: '#0B0B0B',
      border: '1px solid #D1D5DB',
      fontFamily: BODY,
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
    };
  },

  btnDanger(): React.CSSProperties {
    return {
      padding: '6px 12px',
      background: '#FFFFFF',
      color: '#B91C1C',
      border: '1px solid #B91C1C',
      fontFamily: BODY,
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
    };
  },

  TierBadge(tier?: string | null): React.ReactElement {
    const t = tier ?? 'executive_introduction';
    const label =
      t === 'executive_introduction' ? 'Executive Introduction' :
      t === 'professional' ? 'Professional' :
      t === 'executive' ? 'Executive' :
      t === 'council' ? 'Council' :
      t === 'enterprise' ? 'Enterprise' :
      t === 'explorer' ? 'Explorer' : t;
    const monoBg =
      t === 'executive_introduction' || t === 'explorer' ? '#F9FAFB' :
      t === 'professional' ? '#ECFDF5' :
      t === 'executive' ? '#EFF6FF' :
      t === 'council' ? '#FAF5FF' :
      t === 'enterprise' ? '#FFF7ED' : '#F3F4F6';
    const monoFg =
      t === 'executive_introduction' || t === 'explorer' ? '#111827' :
      t === 'professional' ? '#065F46' :
      t === 'executive' ? '#1E40AF' :
      t === 'council' ? '#6D28D9' :
      t === 'enterprise' ? '#9A3412' : '#111827';
    return (
      <span style={{
        display: 'inline-flex',
        padding: '2px 8px',
        background: monoBg,
        color: monoFg,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontFamily: BODY,
      }}>
        {label}
      </span>
    );
  },

  StatusBadge(status: string): React.ReactElement {
    const s = String(status).toLowerCase();
    const palette: Record<string, [string, string]> = {
      pending:    ['#FEF3C7', '#92400E'],
      completed:  ['#D1FAE5', '#065F46'],
      processing: ['#DBEAFE', '#1E40AF'],
      claimed:    ['#DBEAFE', '#1E40AF'],
      queued:     ['#E5E7EB', '#111827'],
      sent:       ['#DBEAFE', '#1E3A8A'],
      delivered:  ['#D1FAE5', '#065F46'],
      opened:     ['#E0E7FF', '#3730A3'],
      clicked:    ['#EDE9FE', '#5B21B6'],
      failed:     ['#FEE2E2', '#B91C1C'],
      hard_bounce:['#FEE2E2', '#B91C1C'],
      soft_bounce:['#FECACA', '#991B1B'],
      skipped:    ['#E5E7EB', '#4B5563'],
      complaint:  ['#FCE7F3', '#9D174D'],
    };
    const [bg, fg] = palette[s] ?? ['#F3F4F6', '#111827'];
    return (
      <span style={{
        display: 'inline-flex',
        padding: '2px 8px',
        background: bg,
        color: fg,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontFamily: BODY,
      }}>
        {status}
      </span>
    );
  },

  Shell(props: { title: string; subtitle?: string; children: React.ReactNode }): React.ReactElement {
    const user = useAuthStore.getState();
    const email = user.profile?.email ?? user.user?.email ?? '';
    const logout = () => { try { useAuthStore.getState().logout?.(); } catch { /* ignore */ } };
    return (
      <div style={B2C_ADMIN.shellStyle()}>
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '4px 2px 20px 2px', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <div style={{
              width: 32, height: 32, background: '#C108AB', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: HEADING, fontWeight: 700, fontSize: 14,
              userSelect: 'none',
            }} aria-hidden="true">LYC</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{
                  margin: 0, fontFamily: HEADING, fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em',
                }}>{props.title}</h1>
                <span style={{
                  fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 800,
                  color: '#6B7280', background: '#F3F4F6', padding: '3px 8px',
                }}>Admin</span>
              </div>
              {props.subtitle ? (
                <p style={{ margin: '4px 0 0 0', color: '#6B7280', fontSize: 13 }}>{props.subtitle}</p>
              ) : null}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: '#4B5563' }}>{email || '—'}</span>
            <button onClick={logout} style={B2C_ADMIN.btnGhost()}>Sign out</button>
          </div>
        </header>
        {props.children}
      </div>
    );
  },

  Loading({ label }: { label: string }) {
    return (
      <B2C_ADMIN.Shell title={label} subtitle="Loading results…">
        <div style={B2C_ADMIN.cardStyle()}>
          <div style={{ color: '#6B7280', fontSize: 13, fontFamily: BODY }}>Loading…</div>
        </div>
      </B2C_ADMIN.Shell>
    );
  },

  Denied() {
    return (
      <B2C_ADMIN.Shell title="403 — Admin access required" subtitle="You do not have the admin role. Contact the platform owner.">
        <div style={B2C_ADMIN.cardStyle()}>
          <div style={{ color: '#B91C1C', fontSize: 13 }}>Access denied.</div>
        </div>
      </B2C_ADMIN.Shell>
    );
  },
};
