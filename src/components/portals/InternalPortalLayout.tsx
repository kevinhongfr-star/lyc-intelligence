/**
 * Portal layout system — Internal portal layout.
 *
 * Gates the shell behind `role="team_lead"` (internal staff at team lead
 * level or above). Renders an access-restricted message otherwise.
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  Briefcase,
  Contact,
  Home,
  Megaphone,
  Settings,
  Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/v1';
import { EmptyState } from '@/components/ui';
import { PortalShell } from './PortalShell';
import { RoleGate } from './RoleGate';
import type { NavItem } from './types';

const NAV: NavItem[] = [
  { path: '/internal', label: 'Dashboard', icon: Home, end: true },
  { path: '/internal/pipeline', label: 'Pipeline', icon: Users },
  { path: '/internal/mandates', label: 'Mandates', icon: Briefcase },
  { path: '/internal/campaigns', label: 'Campaigns', icon: Megaphone },
  { path: '/internal/contacts', label: 'Contacts', icon: Contact },
  {
    path: '/internal/settings',
    label: 'Settings',
    icon: Settings,
    roles: ['admin', 'lyc_admin', 'super_admin'],
  },
];

function InternalFallback(): React.ReactElement {
  return (
    <EmptyState
      title="Access restricted"
      description="The internal portal requires team lead or higher permissions."
      actionLabel="Back to home"
      onAction={() => {
        window.location.assign('/');
      }}
    />
  );
}

export default function InternalPortalLayout(): React.ReactElement {
  const { user, loading, logout } = useAuth();

  return (
    <RoleGate
      user={user}
      loading={loading}
      role="team_lead"
      fallback={<InternalFallback />}
    >
      <PortalShell
        kind="internal"
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
