/**
 * Portal layout system — Client portal layout.
 *
 * Gates the shell behind `userType="client"`.
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Briefcase, FileText, Home, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/v1';
import { PortalShell } from './PortalShell';
import { RoleGate } from './RoleGate';
import type { NavItem } from './types';

const NAV: NavItem[] = [
  { path: '/client', label: 'Dashboard', icon: Home, end: true },
  { path: '/client/mandates', label: 'Mandates', icon: Briefcase },
  { path: '/client/reports', label: 'Reports', icon: FileText },
  { path: '/client/messages', label: 'Messages', icon: MessageSquare },
];

export default function ClientPortalLayout(): React.ReactElement {
  const { user, loading, logout } = useAuth();

  return (
    <RoleGate user={user} loading={loading} userType="client">
      <PortalShell
        kind="client"
        brand="Client Portal"
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
