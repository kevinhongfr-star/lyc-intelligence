/**
 * V-App 1/7 — App Shell layout.
 *
 * Layout spec (§ 2 / § 6):
 *   272px sidebar (ink-900, cream text, wordmark NEXUS. with fuchsia dot)
 *     - Logo / brand row (24px pad 16x/20y + 1px divider dark)
 *     - Primary nav: Chat (default active) · Lenses · Milestones · Documents
 *       Active state: Ocean-600 left 3px bar + cream bg 6% + cream text (bold)
 *     - Secondary nav: Profile · Settings · Coaching (120px from bottom rule)
 *     - Tier status block (footer 32px pad, 1px top divider dark):
 *         Tier badge · Miles balance · Upgrade arrow
 *         Tier pill background variants: pro ocean-50, executive teal-50, council ink-900 cream
 *   64px topbar (white): breadcrumb / search / notifications / avatar
 *   Main: 960px content max, bg cream (#FAFAFA), pad 48y/0x under header
 *   320px Info panel (hidden by default, toggle via info icon)
 *
 * Mobile: sidebar collapses to off-canvas drawer (max-width: 768px).
 *   Hamburger icon (3 lines) in topbar-left → toggles drawer overlay 50% ink.
 *
 * Wires: useAuthStore() for user + profile + tier + miles.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { V3 } from '@/styles/v3-tokens';
import { normalizeTier, tierDisplayName, TIER_META, type TierKey } from '@/config/tierConfig';
import {
  Badge,
  Avatar,
  Breadcrumb,
  IconButton,
  MonoLabel,
  Wordmark,
} from '@/components/app-v3/ui';

/* ── Sidebar nav item spec → NavLink ─────────────────────────────────── */
function SidebarNavItem({
  to, label, end = false, badge, iconSvg,
}: {
  to: string;
  label: string;
  end?: boolean;
  badge?: { count: number; variant?: 'count' | 'count-active' };
  iconSvg: React.ReactNode;
}): React.ReactElement {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => {
        const base: React.CSSProperties = {
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          height: 40,
          padding: '0 24px 0 21px',
          borderLeft: `3px solid ${isActive ? V3.ocean600 : 'transparent'}`,
          background: isActive ? 'rgba(250,250,250,0.06)' : 'transparent',
          color: isActive ? V3.cream : V3.onDarkMuted,
          fontFamily: V3.bodyFont,
          fontSize: '14px',
          fontWeight: isActive ? V3.fwSemibold : V3.fwRegular,
          lineHeight: 1,
          textDecoration: 'none',
          cursor: 'pointer',
          transition: `background ${V3.durFast}ms ${V3.ease}, color ${V3.durFast}ms ${V3.ease}`,
          textDecorationLine: 'none',
        };
        return base;
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLLinkElement;
        if (el.style.background === 'transparent' || !el.style.background) {
          el.style.background = 'rgba(250,250,250,0.03)';
          el.style.color = V3.cream;
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLLinkElement;
        if (el.style.borderLeft.includes('transparent')) {
          el.style.background = 'transparent';
          el.style.color = '';
        }
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'inherit',
        }}
      >
        {iconSvg}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
      {badge && badge.count > 0 && (
        <Badge variant={badge.variant || 'count'} size="small" style={{ background: 'rgba(250,250,250,0.08)', color: V3.onDarkMuted }}>
          {badge.count}
        </Badge>
      )}
    </NavLink>
  );
}

/* ── SVG icons (line-art 18×18, stroke currentColor 1.2, fill none) ── */
const icon = {
  chat: (
    <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 4.5h12v7.2H6.75L3 15V4.5z"/>
    </svg>
  ),
  lenses: (
    <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="5.5" cy="9" r="3.25"/>
      <circle cx="12.5" cy="9" r="3.25"/>
      <path d="M8.25 6.75h1.5"/>
    </svg>
  ),
  milestones: (
    <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2.5 3v12"/>
      <path d="M2.5 5h11.5l1.5 2-1.5 2H2.5"/>
      <path d="M2.5 12h7l1.5 2-1.5 2H2.5"/>
    </svg>
  ),
  documents: (
    <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 2h6l3 3v10H5z"/>
      <path d="M11 2v3h3"/>
      <path d="M7 8.5h4M7 10.5h4M7 12.5h2.5"/>
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="9" cy="5.5" r="2.75"/>
      <path d="M3.5 15.5c0-2.76 2.46-5 5.5-5s5.5 2.24 5.5 5"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="9" cy="9" r="1.5"/>
      <path d="M8.1 2.25h1.8L10.4 4.1a2.5 2.5 0 0 1 1.4.8l1.83-.63 1.27 1.27-.63 1.83a2.5 2.5 0 0 1 .8 1.4l1.85.5v1.8l-1.85.5a2.5 2.5 0 0 1-.8 1.4l.63 1.83-1.27 1.27-1.83-.63a2.5 2.5 0 0 1-1.4.8l-.5 1.85h-1.8l-.5-1.85a2.5 2.5 0 0 1-1.4-.8l-1.83.63L2.9 14.3l.63-1.83a2.5 2.5 0 0 1-.8-1.4l-1.85-.5V10.1l1.85-.5a2.5 2.5 0 0 1 .8-1.4L2.9 6.37 4.17 5.1l1.83.63a2.5 2.5 0 0 1 1.4-.8l.5-1.85h.5"/>
    </svg>
  ),
  coaching: (
    <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="6" cy="7" r="2"/>
      <circle cx="12.5" cy="7" r="2"/>
      <path d="M3.5 13c.6-1.2 1.9-2 2.5-2s1.9.8 2.5 2"/>
      <path d="M10.5 12c.4-.8 1.3-1.5 2-1.5s1.6.7 2 1.5"/>
      <path d="M9 3.2v.6"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="7" cy="7" r="4.25"/>
      <path d="M10 10l2.5 2.5"/>
    </svg>
  ),
  notifications: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2.5 10.5V7a5.5 5.5 0 1 1 11 0v3.5l1 1h-13l1-1z"/>
      <path d="M5.75 13.25a2.25 2.25 0 0 0 4.5 0"/>
    </svg>
  ),
  info: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="8" cy="8" r="6"/>
      <path d="M8 5.5V5.501"/>
      <path d="M8 7.5v4"/>
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden>
      <path d="M2.5 4.75h11M2.5 8h11M2.5 11.25h11"/>
    </svg>
  ),
  close: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden>
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/>
    </svg>
  ),
  arrowRight: (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4.5 2.5l4.5 4.5-4.5 4.5"/>
    </svg>
  ),
};

/* ── Tier badge (sidebar footer) ──────────────────────────────────────── */
function TierBadge({ tier }: { tier: TierKey | null }): React.ReactElement {
  if (tier === 'council') {
    return <Badge variant="tier-council">{tierDisplayName(tier)}</Badge>;
  }
  if (tier === 'executive' || tier === 'enterprise') {
    return <Badge variant="tier-executive">{tierDisplayName(tier)}</Badge>;
  }
  if (tier === 'professional') {
    return <Badge variant="tier-pro">{tierDisplayName(tier)}</Badge>;
  }
  return <Badge variant="status-draft">{tierDisplayName(tier)}</Badge>;
}

/* ── Route → breadcrumb items (simple rule-based) ───────────────────── */
function routeBreadcrumb(pathname: string): Array<{ label: string; to?: string; active?: boolean }> {
  const v3Prefix = '/app/v3';
  const rel = pathname.startsWith(v3Prefix) ? pathname.slice(v3Prefix.length) : '';
  const parts = rel.split('/').filter(Boolean);
  const home = { label: 'Chat', to: '/app/v3' };
  if (parts.length === 0) return [{ ...home, active: true }];

  const labels: Record<string, string> = {
    lenses: 'Lenses',
    milestones: 'Milestones',
    documents: 'Documents',
    profile: 'Profile',
    settings: 'Settings',
    coaching: 'Coaching',
  };
  const out = [home];
  parts.forEach((p, i) => {
    const atEnd = i === parts.length - 1;
    const label = labels[p] ?? (p.length > 24 ? p.slice(0, 22) + '…' : p);
    out.push({
      label,
      to: atEnd ? undefined : `${v3Prefix}/${parts.slice(0, i + 1).join('/')}`,
      active: atEnd,
    });
  });
  return out;
}

/* ── Layout export ────────────────────────────────────────────────────── */
export function AppShellV3Layout(): React.ReactElement {
  const { user, profile, isLoading } = useAuthStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const tier = normalizeTier(profile?.tier);
  const tierMeta = tier ? TIER_META[tier] : null;
  const miles = (profile as any)?.miles_balance as number | undefined ?? 0;

  const closeDrawer = useCallback(() => setSidebarOpen(false), []);

  // Close drawer on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (sidebarOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [sidebarOpen]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: V3.bg,
      }}>
        <MonoLabel color={V3.ink400}>LOADING…</MonoLabel>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  const bc = routeBreadcrumb(location.pathname);

  const renderSidebar = (onDark = true) => (
    <aside
      style={{
        width: V3.appSidebarWidth,
        background: onDark ? V3.ink900 : V3.white,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
        minHeight: 0,
      }}
      aria-label="Sidebar navigation"
    >
      {/* Brand */}
      <div
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: `1px solid ${onDark ? V3.dividerDark : V3.dividerSurface}`,
        }}
      >
        <Wordmark size="sidebar" onDark={onDark} tagline />
      </div>

      {/* Primary nav */}
      <nav aria-label="Primary" style={{ padding: '16px 0', flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ padding: '0 24px 8px' }}>
          <MonoLabel size="sm" color={onDark ? V3.onDarkDim : V3.ink400}>WORKSPACE</MonoLabel>
        </div>
        <SidebarNavItem to="/app/v3" end label="Chat" iconSvg={icon.chat} />
        <SidebarNavItem to="/app/v3/lenses" label="Lenses" iconSvg={icon.lenses} />
        <SidebarNavItem to="/app/v3/milestones" label="Milestones" iconSvg={icon.milestones} />
        <SidebarNavItem to="/app/v3/documents" label="Documents" iconSvg={icon.documents} />

        <div style={{ padding: '24px 24px 8px' }}>
          <MonoLabel size="sm" color={onDark ? V3.onDarkDim : V3.ink400}>ACCOUNT</MonoLabel>
        </div>
        <SidebarNavItem to="/app/v3/profile" label="Profile" iconSvg={icon.profile} />
        <SidebarNavItem to="/app/v3/settings" label="Settings" iconSvg={icon.settings} />
        <SidebarNavItem to="/app/v3/coaching" label="Coaching" iconSvg={icon.coaching} />
      </nav>

      {/* Tier status block */}
      <div
        style={{
          borderTop: `1px solid ${onDark ? V3.dividerDark : V3.dividerSurface}`,
          padding: 20,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <TierBadge tier={tier} />
          <NavLink
            to="/app/v3/settings?section=billing"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: V3.bodyFont,
              fontSize: '11px',
              fontWeight: V3.fwMedium,
              color: onDark ? V3.onDarkMuted : V3.ink400,
              textDecoration: 'none',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLLinkElement).style.color = onDark ? V3.cream : V3.ink700; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLLinkElement).style.color = ''; }}
          >
            {tierMeta?.isInviteOnly ? 'Manage' : 'Upgrade'}
            {icon.arrowRight}
          </NavLink>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{
            fontFamily: V3.bodyFont,
            fontSize: '12.5px',
            color: onDark ? V3.onDarkMuted : V3.ink500,
          }}>
            Miles balance
          </span>
        </div>
        <div style={{
          marginTop: 2,
          fontFamily: V3.displayFont,
          fontSize: '16px',
          fontWeight: V3.fwSemibold,
          color: onDark ? V3.cream : V3.ink900,
          lineHeight: 1.2,
        }}>
          {miles.toLocaleString()}
        </div>
      </div>
    </aside>
  );

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: V3.bg,
        color: V3.ink900,
        fontFamily: V3.bodyFont,
      }}
      data-shell="v3-app"
    >
      {/* Desktop sidebar */}
      <div className="v3-app-hide-mobile" style={{ display: 'flex', position: 'sticky', top: 0, height: '100vh', zIndex: 10 }}>
        {renderSidebar(true)}
      </div>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="v3-app-hide-desktop" style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div
            role="presentation"
            onClick={closeDrawer}
            style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.5)' }}
            aria-hidden
          />
          <div
            role="dialog"
            aria-label="Sidebar"
            style={{
              position: 'absolute',
              top: 0, left: 0, bottom: 0,
              width: Math.min(272, window.innerWidth - 48),
              boxShadow: 'none',
              display: 'flex',
            }}
          >
            {renderSidebar(true)}
            <IconButton
              label="Close sidebar"
              onDark
              onClick={closeDrawer}
              style={{ position: 'absolute', top: 12, right: 12 }}
            >
              {icon.close}
            </IconButton>
          </div>
        </div>
      )}

      {/* Main column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar — 64px */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 5,
            height: V3.appTopbarHeight,
            background: V3.white,
            borderBottom: `1px solid ${V3.border}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: 12,
            minWidth: 0,
          }}
        >
          <div className="v3-app-hide-desktop v3-app-hide-tablet">
            <IconButton label="Open sidebar" onClick={() => setSidebarOpen(true)}>
              {icon.menu}
            </IconButton>
          </div>
          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
            <Breadcrumb items={bc} />
          </div>
          <div className="v3-app-hide-mobile" style={{ display: 'flex', gap: 4 }}>
            <IconButton label="Search">
              {icon.search}
            </IconButton>
            <IconButton label="Notifications">
              {icon.notifications}
            </IconButton>
            <IconButton label="Toggle info panel" onClick={() => setInfoOpen((s) => !s)}>
              {icon.info}
            </IconButton>
          </div>
          <div style={{ flexShrink: 0 }}>
            <NavLink
              to="/app/v3/profile"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
            >
              <Avatar name={profile?.name || user.email} size="md" />
            </NavLink>
          </div>
        </header>

        {/* Main content + optional info panel */}
        <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>
          <main
            id="v3-app-main"
            aria-label="Main content"
            style={{
              flex: 1,
              minWidth: 0,
              overflowX: 'hidden',
              padding: `${V3.appPageHeaderPad}px 24px 96px`,
            }}
          >
            <div style={{ maxWidth: V3.appContentMax, margin: '0 auto', minWidth: 0 }}>
              <Outlet />
            </div>
          </main>

          {/* Info panel — 320px, only shown if toggle active */}
          {infoOpen && (
            <aside
              aria-label="Information panel"
              style={{
                width: V3.appInfoPanelWidth,
                flexShrink: 0,
                background: V3.white,
                borderLeft: `1px solid ${V3.border}`,
                position: 'sticky',
                top: V3.appTopbarHeight,
                height: `calc(100vh - ${V3.appTopbarHeight}px)`,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: `1px solid ${V3.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <MonoLabel color={V3.ink500}>CONTEXT</MonoLabel>
                <IconButton label="Close info panel" onClick={() => setInfoOpen(false)}>
                  {icon.close}
                </IconButton>
              </div>
              <div style={{ padding: 20, overflowY: 'auto' }}>
                <Outlet name="info" />
                <div style={{
                  fontFamily: V3.bodyFont, fontSize: '12.5px',
                  color: V3.ink400, lineHeight: 1.6,
                }}>
                  Context panel for the current view. Each V-App page populates
                  this with its relevant view-specific information, shortcuts,
                  and help references.
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppShellV3Layout;
