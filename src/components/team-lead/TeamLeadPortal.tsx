import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardCheck,
  Briefcase,
  Clock,
  DollarSign,
  Users,
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { COLORS, SPACING } from '@/styles/tokens';
import {
  Card,
  Heading,
  Paragraph,
  Button,
  Flex,
  Grid,
} from '@/components/design-system';

interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', to: '/app/team-lead', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'approvals', label: 'Approvals', to: '/app/team-lead/approvals', icon: <ClipboardCheck className="w-5 h-5" /> },
  { id: 'mandates', label: 'Mandates', to: '/app/team-lead/mandates', icon: <Briefcase className="w-5 h-5" /> },
  { id: 'sla', label: 'SLA', to: '/app/team-lead/sla', icon: <Clock className="w-5 h-5" /> },
  { id: 'revenue', label: 'Revenue', to: '/app/team-lead/revenue', icon: <DollarSign className="w-5 h-5" /> },
  { id: 'team', label: 'Team', to: '/app/team-lead/team', icon: <Users className="w-5 h-5" /> },
  { id: 'clients', label: 'Clients', to: '/app/team-lead/clients', icon: <Building2 className="w-5 h-5" /> },
  { id: 'nexus', label: 'Nexus', to: '/app/team-lead/chat', icon: <MessageSquare className="w-5 h-5" /> },
];

export const TeamLeadPortal: React.FC = () => {
  const { profile, signOut } = useAuthStore();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (to: string) =>
    to === '/app/team-lead'
      ? location.pathname === '/app/team-lead'
      : location.pathname.startsWith(to);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: COLORS.bg }}>
      {/* Sidebar */}
      <aside
        style={{
          width: collapsed ? 64 : 240,
          flexShrink: 0,
          backgroundColor: COLORS.white,
          borderRight: `1px solid ${COLORS.border}`,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 200ms ease-out',
        }}
      >
        <div
          style={{
            ...sidebarHeaderStyle,
            justifyContent: collapsed ? 'center' : 'space-between',
          }}
        >
          {!collapsed && <Heading level={5}>Team Lead</Heading>}
          <button
            onClick={() => setCollapsed((c) => !c)}
            style={iconBtnStyle}
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav style={{ flex: 1, padding: `${SPACING[4]}px ${SPACING[2]}px` }}>
          <Grid columns={1} gap="1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING[3],
                    padding: `${SPACING[3]}px`,
                    borderRadius: 8,
                    textDecoration: 'none',
                    backgroundColor: active ? COLORS.primaryLight : 'transparent',
                    color: active ? COLORS.primary : COLORS.textSecondary,
                    fontWeight: active ? 600 : 500,
                    fontSize: SPACING[3],
                  }}
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </Grid>
        </nav>

        {/* User footer */}
        <div style={{ padding: SPACING[4], borderTop: `1px solid ${COLORS.border}` }}>
          {!collapsed ? (
            <Card padding="3">
              <Flex align="center" gap="2">
                <div style={avatarStyle}>
                  {(profile?.name || '?').slice(0, 1).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={userNameStyle}>{profile?.name || 'Team Lead'}</div>
                  <div style={userEmailStyle}>{profile?.email || ''}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </Flex>
            </Card>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={avatarStyle}>
                {(profile?.name || '?').slice(0, 1).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={topBarStyle}>
          <Grid columns={1} gap="0">
            <Heading level={4}>Team Lead Console</Heading>
            <Paragraph color="textMuted">
              Team overview, approvals, SLA and revenue
            </Paragraph>
          </Grid>
        </header>
        <main style={{ flex: 1, padding: SPACING[8], overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const sidebarHeaderStyle: React.CSSProperties = {
  height: 64,
  display: 'flex',
  alignItems: 'center',
  padding: `0 ${SPACING[4]}px`,
  borderBottom: `1px solid ${COLORS.border}`,
};

const topBarStyle: React.CSSProperties = {
  height: 80,
  padding: `0 ${SPACING[8]}px`,
  display: 'flex',
  alignItems: 'center',
  borderBottom: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.white,
};

const iconBtnStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  color: COLORS.textSecondary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const avatarStyle: React.CSSProperties = {
  width: SPACING[8],
  height: SPACING[8],
  borderRadius: '50%',
  backgroundColor: COLORS.primaryLight,
  color: COLORS.primary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 600,
  fontSize: SPACING[4],
  flexShrink: 0,
};

const userNameStyle: React.CSSProperties = {
  fontSize: SPACING[3],
  fontWeight: 600,
  color: COLORS.text,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const userEmailStyle: React.CSSProperties = {
  fontSize: SPACING[2],
  color: COLORS.textMuted,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
