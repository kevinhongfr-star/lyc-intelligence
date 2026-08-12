/**
 * Phase 16 — AdminNav (internal LYC admin staff, role >= admin).
 *
 * IA: Dashboard · Users · Organizations · Analytics · Config · Compliance ·
 *     Revenue · Oversight · Consultants · Advanced Ops.
 * Visual: functional, data-dense, no marketing chrome. Darker sidebar for
 * quick visual distinction from consultant portal.
 * Zero radius, font trio, accent #C108AB.
 */
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, BarChart3, Settings as SettingsIcon,
  Shield, DollarSign, Eye, UserCheck, Zap, Menu, X, LogOut, ChevronDown,
  Gauge, Sliders, Network, Trophy, Lock, Workflow, FileBarChart,
  FileText, Bot, Mail,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const DS = {
  headingFont: "'Crimson Pro', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  accentHover: '#A00790',
  bg: '#FFFFFF',
  sidebar: '#1A1A1A',
  sidebarText: '#E8E8E8',
  sidebarMuted: '#9A9A9A',
  sidebarHover: '#2A2A2A',
  sidebarActive: '#C108AB',
  sidebarActiveBg: 'rgba(193,8,171,0.15)',
  border: '#333333',
  text: '#000000',
};

export function AdminNav(): React.ReactElement {
  const navigate = useNavigate();
  const { profile, signOut } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const items = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: Gauge, section: 'Overview' },

    // Phase 9 Batch 5 — B2C assessment admin
    { path: '/admin/results', label: 'Results', icon: FileText, section: 'Assessment B2C' },
    { path: '/admin/users', label: 'Users / Tiers', icon: Users, section: 'Assessment B2C' },
    { path: '/admin/ai-ops', label: 'AI Operations', icon: Bot, section: 'Assessment B2C' },
    { path: '/admin/email-ops', label: 'Email Operations', icon: Mail, section: 'Assessment B2C' },

    { path: '/admin/organizations', label: 'Organizations', icon: Building2, section: 'Management' },
    { path: '/admin/consultants', label: 'Consultants', icon: UserCheck, section: 'Management' },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3, section: 'Insights' },
    { path: '/admin/revenue', label: 'Revenue', icon: DollarSign, section: 'Insights' },
    { path: '/admin/rankings', label: 'Rankings', icon: Trophy, section: 'Insights' },
    { path: '/admin/compliance', label: 'Compliance', icon: Shield, section: 'Governance' },
    { path: '/admin/config', label: 'Platform Config', icon: Sliders, section: 'Platform' },
    { path: '/admin/platform-settings', label: 'Settings', icon: SettingsIcon, section: 'Platform' },
    { path: '/admin/scoring', label: 'Scoring', icon: Workflow, section: 'Platform' },
    { path: '/admin/nexus-engine', label: 'NEXUS Engine', icon: Network, section: 'Platform' },
    { path: '/admin/advanced-ops', label: 'Advanced Ops', icon: Zap, section: 'Operations' },
    { path: '/admin/scheduling-plus', label: 'Scheduling', icon: FileBarChart, section: 'Operations' },
    { path: '/admin/intelligence-plus', label: 'Intelligence', icon: Eye, section: 'Operations' },
    { path: '/admin/team', label: 'Team', icon: Users, section: 'Operations' },
    { path: '/admin/tasks', label: 'Tasks', icon: LayoutDashboard, section: 'Operations' },
    { path: '/admin/oversight', label: 'Oversight', icon: Eye, section: 'Operations' },
    { path: '/admin/billing', label: 'Billing', icon: Lock, section: 'Operations' },
  ];

  const sections: Record<string, typeof items> = {};
  items.forEach((it) => {
    if (!sections[it.section]) sections[it.section] = [];
    sections[it.section].push(it);
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const initials = (profile?.name || profile?.email || 'A').split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
  const displayName = profile?.name || profile?.email || 'Admin';

  const sidebar = (
    <>
      <div style={{
        padding: '16px', borderBottom: `1px solid ${DS.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{
          width: 28, height: 28, background: DS.accent, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: DS.headingFont, fontWeight: 700, fontSize: 12,
        }}>⌘</span>
        <div>
          <div style={{
            fontFamily: DS.headingFont, fontSize: 13, fontWeight: 700,
            color: DS.sidebarText,
          }}>LYC Admin</div>
          <div style={{ fontSize: 10.5, color: DS.sidebarMuted }}>Internal Console</div>
        </div>
      </div>

      <div style={{
        margin: '12px 12px 0', padding: '6px 10px', fontSize: 10.5,
        color: DS.sidebarMuted, textTransform: 'uppercase', letterSpacing: 1,
        border: `1px solid ${DS.border}`, background: 'rgba(255,255,255,0.03)',
      }}>
        Restricted access
      </div>

      <div style={{ flex: 1, padding: '12px 6px', overflowY: 'auto' }}>
        {Object.keys(sections).map((section, idx) => {
          const sectionItems = sections[section];
          return (
            <div key={section} style={{ marginTop: idx === 0 ? 0 : 16, padding: '0 8px' }}>
              <div style={{
                fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase',
                color: DS.sidebarMuted, padding: '0 8px 6px', fontWeight: 600,
              }}>
                {section}
              </div>
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
                        padding: '7px 10px', fontSize: 12.5,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? DS.sidebarActive : DS.sidebarText,
                        background: isActive ? DS.sidebarActiveBg : 'transparent',
                        textDecoration: 'none', fontFamily: DS.bodyFont,
                      })}
                      onMouseOver={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        if (!el.style.background.includes(DS.accent)) el.style.background = DS.sidebarHover;
                      }}
                      onMouseOut={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        if (!el.style.background.includes(DS.accent)) el.style.background = 'transparent';
                      }}
                    >
                      <Icon size={14} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* User footer */}
      <div style={{ padding: 12, borderTop: `1px solid ${DS.border}`, position: 'relative' }}>
        <button onClick={() => setUserMenuOpen((v) => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 12.5, color: DS.sidebarText, textAlign: 'left',
          }}>
          <div style={{
            width: 30, height: 30, background: DS.accent, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600,
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 10.5, color: DS.sidebarMuted, textTransform: 'capitalize' }}>
              {(profile?.role || 'admin').replace(/_/g, ' ')}
            </div>
          </div>
          <ChevronDown size={13} style={{ color: DS.sidebarMuted }} />
        </button>
        {userMenuOpen && (
          <div style={{
            position: 'absolute', left: 8, right: 8, bottom: '100%',
            marginBottom: 4, background: '#222', border: `1px solid ${DS.border}`,
            zIndex: 50, padding: 4,
          }}>
            <button onClick={handleSignOut}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', fontSize: 12.5, color: DS.sidebarText, width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
              onMouseOver={(e) => { e.currentTarget.style.background = DS.sidebarHover; }}
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
        borderRight: `1px solid #222`, height: '100vh',
        position: 'sticky', top: 0, display: 'flex', flexDirection: 'column',
        fontFamily: DS.bodyFont,
      }} data-portal-kind="admin">
        {sidebar}
      </aside>

      {/* Mobile */}
      <div className="md:hidden" style={{
        background: DS.sidebar, borderBottom: `1px solid #222`,
        padding: '10px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', color: DS.sidebarText,
      }}>
        <span style={{ fontFamily: DS.headingFont, fontSize: 14, fontWeight: 700 }}>LYC Admin</span>
        <button onClick={() => setMobileOpen(true)}
          style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', color: DS.sidebarText }}>
          <Menu size={20} />
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden" style={{
          position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)',
        }} onClick={() => setMobileOpen(false)}>
          <aside onClick={(e) => e.stopPropagation()} style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 280,
            background: DS.sidebar, display: 'flex', flexDirection: 'column',
            borderRight: `1px solid #222`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottom: `1px solid ${DS.border}`, color: DS.sidebarText }}>
              <span style={{ fontFamily: DS.headingFont, fontSize: 14, fontWeight: 700 }}>LYC Admin</span>
              <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: DS.sidebarText }}>
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

export default AdminNav;
