/**
 * Portal layout system — B2C portal layout.
 *
 * Gates the authed B2C area behind `userType="b2c"`. Public B2C pages live
 * outside this layout (not this component's concern).
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import { BarChart3, ClipboardList, Home, User } from 'lucide-react';
import { useAuth } from '@/hooks/v1';
import { PortalShell } from './PortalShell';
import { RoleGate } from './RoleGate';
import type { NavItem } from './types';

const NAV: NavItem[] = [
  { path: '/b2c', label: 'Dashboard', icon: Home, end: true },
  // `/assessment` redirects to the canonical catalog anchor on the landing page.
  // The previous `/b2c/assessments` target was never routed and 404'd.
  { path: '/assessment', label: 'Assessments', icon: ClipboardList },
  { path: '/b2c/results', label: 'Results', icon: BarChart3 },
  { path: '/b2c/account', label: 'Account', icon: User },
];

export default function B2cPortalLayout(): React.ReactElement {
  const { user, loading, logout } = useAuth();

  return (
    <RoleGate user={user} loading={loading} userType="b2c">
      <PortalShell
        kind="b2c"
        brand="LYC Intelligence"
        nav={NAV}
        user={user}
        onLogout={logout}
        loading={loading}
        breadcrumbs={[]}
      >
        <Outlet />
      </PortalShell>
    </RoleGate>
  );
}
