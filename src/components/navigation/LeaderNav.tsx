/**
 * Phase 16 — LeaderNav (B2C executive / individual identity).
 *
 * Auth required. Identity: premium, focused, tool-like but still premium.
 * IA: NEXUS Chat · Assessments · Results · Profile.
 * Miles badge visible (core loop is miles).
 * Zero radius, font trio, accent #C108AB.
 */
import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  MessageSquare, ClipboardList, TrendingUp, User, Menu, X, LogOut,
  Settings, CreditCard, ChevronDown, FileText, LayoutDashboard,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { MilesBadge } from '@/components/nexus/MilesBadge';
import { fetchMilesBalance } from '@/services/monetizationService';

const DS = {
  headingFont: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  accentHover: '#A00790',
  bg: '#FFFFFF',
  sidebar: '#FAFAFA',
  border: '#E5E5E5',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
  hover: '#F3F3F3',
};

interface LeaderNavProps {
  variant?: 'sidebar' | 'topbar';
}

export function LeaderNav({ variant = 'sidebar' }: LeaderNavProps): React.ReactElement {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [milesBalance, setMilesBalance] = useState<number>(0);

  useEffect(() => {
    if (!user?.id) return;
    fetchMilesBalance()
      .then((r) => setMilesBalance(r.balance))
      .catch((e) => console.warn('[LeaderNav] Miles balance fetch failed:', e));
  }, [user?.id]);

  const items = [
    { path: '/app/nexus', label: 'NEXUS Chat', icon: MessageSquare, end: true },
    { path: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/assessments', label: 'Assessments', icon: ClipboardList },
    { path: '/app/results', label: 'My Results', icon: TrendingUp },
    { path: '/app/documents', label: 'Documents', icon: FileText },
    { path: '/app/profile', label: 'Profile', icon: User },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const initials = (profile?.name || profile?.email || 'U').split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
  const displayName = profile?.name || profile?.email || 'Leader';

  const sidebarContent = (
    <>
      {/* Brand */}
      <div style={{ padding: '20px 16px 16px', borderBottom: `1px solid ${DS.border}` }}>
        <Link to="/app/nexus" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <span style={{
            width: 28, height: 28, background: DS.accent, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: DS.headingFont, fontWeight: 700, fontSize: 13,
          }}>L</span>
          <span style={{ fontFamily: DS.headingFont, fontSize: 15, fontWeight: 700, color: DS.text }}>
            NEXUS
          </span>
        </Link>
      </div>

      {/* Miles card */}
      <div style={{ padding: 16 }}>
        <MilesBadge balance={milesBalance} size="md" />
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', padding: 8, gap: 2 }}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', fontSize: 14, fontWeight: isActive ? 600 : 500,
                color: isActive ? DS.accent : DS.textSecondary,
                background: isActive ? `${DS.accent}12` : 'transparent',
                textDecoration: 'none', border: 'none', cursor: 'pointer',
                fontFamily: DS.bodyFont,
              })}
              onMouseOver={(e) => {
                const el = e.currentTarget as HTMLElement;
                if (!el.style.background.includes(DS.accent)) el.style.background = DS.hover;
              }}
              onMouseOut={(e) => {
                const el = e.currentTarget as HTMLElement;
                if (!el.style.background.includes(DS.accent)) el.style.background = 'transparent';
              }}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Footer: user card */}
      <div style={{ padding: 12, borderTop: `1px solid ${DS.border}`, position: 'relative' }}>
        <button onClick={() => setUserMenuOpen((v) => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px', background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 13, color: DS.text, textAlign: 'left',
          }}>
          <div style={{
            width: 34, height: 34, background: DS.accent, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600,
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 11, color: DS.muted }}>Executive Introduction</div>
          </div>
          <ChevronDown size={14} style={{ color: DS.muted }} />
        </button>
        {userMenuOpen && (
          <div style={{
            position: 'absolute', left: 8, right: 8, bottom: '100%',
            marginBottom: 4, background: DS.bg, border: `1px solid ${DS.border}`,
            zIndex: 50, padding: 4,
          }}>
            <Link to="/app/profile" onClick={() => setUserMenuOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', fontSize: 13, color: DS.text, textDecoration: 'none' }}
              onMouseOver={(e) => { e.currentTarget.style.background = DS.hover; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <User size={15} /> Profile
            </Link>
            <Link to="/app/billing" onClick={() => setUserMenuOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', fontSize: 13, color: DS.text, textDecoration: 'none' }}
              onMouseOver={(e) => { e.currentTarget.style.background = DS.hover; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <CreditCard size={15} /> Billing & Miles
            </Link>
            <Link to="/app/profile" onClick={() => setUserMenuOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', fontSize: 13, color: DS.text, textDecoration: 'none' }}
              onMouseOver={(e) => { e.currentTarget.style.background = DS.hover; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Settings size={15} /> Settings
            </Link>
            <button onClick={handleSignOut}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', fontSize: 13, color: DS.text, width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
              onMouseOver={(e) => { e.currentTarget.style.background = DS.hover; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );

  if (variant === 'sidebar') {
    return (
      <>
        {/* Desktop sidebar */}
        <aside className="hidden md:flex" style={{
          width: 260, flexShrink: 0, background: DS.sidebar,
          borderRight: `1px solid ${DS.border}`, height: '100vh',
          position: 'sticky', top: 0, fontFamily: DS.bodyFont,
          display: 'flex', flexDirection: 'column',
        }} data-portal-kind="leader">
          {sidebarContent}
        </aside>

        {/* Mobile topbar */}
        <div className="md:hidden" style={{
          background: DS.bg, borderBottom: `1px solid ${DS.border}`,
          padding: '12px 16px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link to="/app/nexus" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{
              width: 26, height: 26, background: DS.accent, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: DS.headingFont, fontWeight: 700, fontSize: 12,
            }}>L</span>
            <span style={{ fontFamily: DS.headingFont, fontSize: 15, fontWeight: 700, color: DS.text }}>NEXUS</span>
          </Link>
          <button onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', color: DS.text }}>
            <Menu size={20} />
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden" style={{
            position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.4)',
          }} onClick={() => setMobileOpen(false)}>
            <aside onClick={(e) => e.stopPropagation()} style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 280,
              background: DS.sidebar, display: 'flex', flexDirection: 'column',
              borderRight: `1px solid ${DS.border}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottom: `1px solid ${DS.border}` }}>
                <span style={{ fontFamily: DS.headingFont, fontSize: 15, fontWeight: 700 }}>NEXUS</span>
                <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              {sidebarContent}
            </aside>
          </div>
        )}
      </>
    );
  }

  // topbar variant (not used for leader, but keep for reuse)
  return <nav style={{ display: 'none' }} />;
}

export default LeaderNav;
