/**
 * Phase 16 — ConsultantNav (LYC consultants + B2B client users).
 *
 * IA: Dashboard · Mandates · Candidates · Pipeline · Clients ·
 *     Intelligence · TRIDENT · GRID · CANVAS · Reports · Settings.
 * Visual: higher information density, professional services platform feel.
 * Zero radius, font trio, accent #C108AB.
 */
import React, { useState, useMemo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, Users, GitBranch, Building2,
  BarChart3, Target, Grid3x3, Palette, FileText, Settings,
  Menu, X, LogOut, ChevronDown, Bell, CreditCard, Search,
  Crown, UserPlus, ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { isClientRole, isInternalStaff } from '@/services/portalClassification';
import {
  CONSULTANT_TIER_META,
  type ConsultantTierKey,
} from '@/services/consultantInviteService';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  accentHover: '#A00790',
  bg: '#FFFFFF',
  sidebar: '#F7F7F7',
  border: '#E5E5E5',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
  hover: '#EFEFEF',
};

export interface ConsultantNavProps {
  /** Callback — opens the invite modal from the parent layout. */
  onOpenInvite?: () => void;
  /** Callback — opens upgrade modal or navigates to pricing. */
  onUpgrade?: () => void;
}

export function ConsultantNav({ onOpenInvite, onUpgrade }: ConsultantNavProps): React.ReactElement {
  const navigate = useNavigate();
  const { profile, signOut } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const role = profile?.role;

  // #1325: Normalize consultant tier from profile.tier (or role fallback).
  // Never display the word "free" — entry tier label = "Starter Seat".
  const tier: ConsultantTierKey = useMemo<ConsultantTierKey>(() => {
    const rawTier = (profile as any)?.consultant_tier || (profile as any)?.tier || '';
    const t = String(rawTier).toLowerCase();
    if (t.includes('council')) return 'council_seat';
    if (t.includes('executive')) return 'executive_seat';
    if (t.includes('pro')) return 'pro_seat';
    return 'starter_seat';
  }, [profile]);
  const tierMeta = CONSULTANT_TIER_META[tier];

  const clientItems = [
    { path: '/client/overview', label: 'Overview', icon: LayoutDashboard, section: 'Client' },
    { path: '/client/mandates', label: 'Mandates', icon: Briefcase, section: 'Client' },
    { path: '/client/pipeline-analytics', label: 'Pipeline Analytics', icon: BarChart3, section: 'Client' },
    { path: '/client/documents', label: 'Documents', icon: FileText, section: 'Client' },
  ];

  const consultantItems = [
    { path: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Work' },
    { path: '/portal/mandates', label: 'Mandates', icon: Briefcase, section: 'Work' },
    { path: '/portal/pipeline', label: 'Pipeline', icon: GitBranch, section: 'Work' },
    { path: '/portal/candidates', label: 'Candidates', icon: Users, section: 'Work' },
    { path: '/portal/companies', label: 'Companies', icon: Building2, section: 'Work' },
    { path: '/portal/clients', label: 'Clients', icon: Building2, section: 'Work' },
    { path: '/portal/intelligence', label: 'Intelligence', icon: BarChart3, section: 'Tools' },
    { path: '/portal/trident', label: 'TRIDENT', icon: Target, section: 'Tools' },
    { path: '/portal/grid', label: 'GRID', icon: Grid3x3, section: 'Tools' },
    { path: '/portal/canvas', label: 'CANVAS', icon: Palette, section: 'Tools' },
    { path: '/portal/metrix', label: 'Metrix', icon: BarChart3, section: 'Tools' },
    { path: '/portal/batch-scoring', label: 'Batch Scoring', icon: Target, section: 'Tools' },
    { path: '/portal/scoring-runs', label: 'Scoring Runs', icon: FileText, section: 'Tools' },
    { path: '/portal/reports', label: 'Reports', icon: FileText, section: 'Deliverables' },
    { path: '/portal/scheduler', label: 'Scheduler', icon: Bell, section: 'Deliverables' },
    { path: '/portal/team', label: 'Team & Invites', icon: Users, section: 'Account' },
    { path: '/portal/billing', label: 'Plan & Billing', icon: CreditCard, section: 'Account' },
    { path: '/portal/notifications', label: 'Notifications', icon: Bell, section: 'Account' },
    { path: '/portal/settings', label: 'Settings', icon: Settings, section: 'Account' },
  ];

  // Select appropriate nav based on role
  const isClientOnly = role && isClientRole(role) && !isInternalStaff(role);
  const items = isClientOnly ? clientItems : consultantItems;

  // Group by section
  const sections: Record<string, typeof items> = {};
  items.forEach((it) => {
    const s = it.section;
    if (!sections[s]) sections[s] = [];
    sections[s].push(it);
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const initials = (profile?.name || profile?.email || 'C').split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
  const displayName = profile?.name || profile?.email || 'Consultant';

  const renderNav = (dense = false) => {
    let firstSection = true;
    return Object.keys(sections).map((section) => {
      const sectionItems = sections[section];
      const showHeader = !dense;
      const wasFirst = firstSection;
      firstSection = false;
      return (
        <div key={section} style={{ marginTop: wasFirst ? 0 : 16, padding: dense ? '0 6px' : '0 10px' }}>
          {showHeader && (
            <div style={{
              fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase',
              color: DS.muted, padding: '0 8px 6px', fontWeight: 600,
            }}>
              {section}
            </div>
          )}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {sectionItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: dense ? '7px 8px' : '8px 10px',
                    fontSize: dense ? 12.5 : 13.5,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? DS.accent : DS.textSecondary,
                    background: isActive ? `${DS.accent}14` : 'transparent',
                    textDecoration: 'none', fontFamily: DS.bodyFont,
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
                  <Icon size={15} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      );
    });
  };

  const sidebar = (
    <>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to={isClientOnly ? '/client/overview' : '/portal/dashboard'}
          style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{
            width: 26, height: 26, background: '#000', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: DS.headingFont, fontWeight: 700, fontSize: 12,
          }}>L</span>
          <span style={{
            fontFamily: DS.headingFont, fontSize: 14, fontWeight: 700, color: DS.text,
          }}>
            {isClientOnly ? 'Client Portal' : 'LYC Consult'}
          </span>
        </Link>
      </div>

      {/* Quick search */}
      <div style={{ padding: 12, borderBottom: `1px solid ${DS.border}` }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
          background: DS.bg, border: `1px solid ${DS.border}`, fontSize: 12, color: DS.muted,
        }}>
          <Search size={13} />
          <span>Quick search…</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 5px', border: `1px solid ${DS.border}`, color: DS.muted }}>⌘K</span>
        </div>
      </div>

      {/* #1325: Premium tier card + Invite button (internal consultants only) */}
      {!isClientOnly && (
        <div style={{ padding: 12, borderBottom: `1px solid ${DS.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Tier badge card */}
          <div style={{
            padding: '10px 12px',
            background: `${tierMeta.accent}0C`,
            border: `1px solid ${tierMeta.accent}30`,
            borderLeft: `3px solid ${tierMeta.accent}`,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Crown style={{ width: 12, height: 12, color: tierMeta.accent }} />
                <span style={{
                  fontFamily: DS.monoFont, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: tierMeta.accent,
                }}>
                  {tierMeta.label}
                </span>
              </div>
              {tier !== 'council_seat' && onUpgrade && (
                <button
                  type="button"
                  onClick={onUpgrade}
                  aria-label="Upgrade consultant tier"
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontFamily: DS.monoFont, fontSize: 9.5,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: tierMeta.accent, fontWeight: 600,
                  }}
                >
                  Upgrade <ArrowRight style={{ width: 10, height: 10 }} />
                </button>
              )}
            </div>
            <div style={{
              marginTop: 6, fontSize: 11, color: DS.muted, lineHeight: 1.45,
              fontFamily: DS.bodyFont,
            }}>
              {tierMeta.clientSeatLimit < 999
                ? `${tierMeta.clientSeatLimit} client seat${tierMeta.clientSeatLimit === 1 ? '' : 's'} · ${tierMeta.inviteQuota} invites/mo`
                : 'Unlimited seats · Unlimited invites'}
            </div>
          </div>

          {/* Invite CTA button */}
          {onOpenInvite && (
            <button
              type="button"
              onClick={onOpenInvite}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '9px 12px',
                background: DS.accent, color: '#FFF', border: 'none',
                cursor: 'pointer',
                fontFamily: DS.bodyFont, fontSize: 12, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                borderRadius: DS.radius,
              }}
            >
              <UserPlus style={{ width: 13, height: 13 }} /> Invite Client
            </button>
          )}
        </div>
      )}

      <div style={{ flex: 1, padding: '12px 6px', overflowY: 'auto' }}>
        {renderNav()}
      </div>

      {/* User footer */}
      <div style={{ padding: 12, borderTop: `1px solid ${DS.border}`, position: 'relative' }}>
        <button onClick={() => setUserMenuOpen((v) => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 12.5, color: DS.text, textAlign: 'left',
          }}>
          <div style={{
            width: 30, height: 30, background: '#000', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600,
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 10.5, color: DS.muted, textTransform: 'capitalize' }}>
              {(role || 'consultant').replace(/_/g, ' ')}
            </div>
          </div>
          <ChevronDown size={13} style={{ color: DS.muted }} />
        </button>
        {userMenuOpen && (
          <div style={{
            position: 'absolute', left: 8, right: 8, bottom: '100%',
            marginBottom: 4, background: DS.bg, border: `1px solid ${DS.border}`,
            zIndex: 50, padding: 4,
          }}>
            <Link to={isClientOnly ? '/client/overview' : '/portal/settings'}
              onClick={() => setUserMenuOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', fontSize: 12.5, color: DS.text, textDecoration: 'none' }}
              onMouseOver={(e) => { e.currentTarget.style.background = DS.hover; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Settings size={14} /> Settings
            </Link>
            <button onClick={handleSignOut}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', fontSize: 12.5, color: DS.text, width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
              onMouseOver={(e) => { e.currentTarget.style.background = DS.hover; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden md:flex" style={{
        width: 248, flexShrink: 0, background: DS.sidebar,
        borderRight: `1px solid ${DS.border}`, height: '100vh',
        position: 'sticky', top: 0, display: 'flex', flexDirection: 'column',
        fontFamily: DS.bodyFont,
      }} data-portal-kind="consultant">
        {sidebar}
      </aside>

      {/* Mobile topbar */}
      <div className="md:hidden" style={{
        background: DS.bg, borderBottom: `1px solid ${DS.border}`,
        padding: '10px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: DS.headingFont, fontSize: 14, fontWeight: 700 }}>
          {isClientOnly ? 'Client Portal' : 'LYC Consult'}
        </span>
        <button onClick={() => setMobileOpen(true)}
          style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', color: DS.text }}>
          <Menu size={20} />
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden" style={{
          position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.4)',
        }} onClick={() => setMobileOpen(false)}>
          <aside onClick={(e) => e.stopPropagation()} style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 280,
            background: DS.sidebar, display: 'flex', flexDirection: 'column',
            borderRight: `1px solid ${DS.border}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottom: `1px solid ${DS.border}` }}>
              <span style={{ fontFamily: DS.headingFont, fontSize: 14, fontWeight: 700 }}>
                {isClientOnly ? 'Client Portal' : 'LYC Consult'}
              </span>
              <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}
    </>
  );
}

export default ConsultantNav;
