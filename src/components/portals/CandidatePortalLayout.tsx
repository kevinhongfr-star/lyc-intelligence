/**
 * Portal layout system — Candidate portal layout.
 *
 * Gates the shell behind `userType="candidate"`.
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Briefcase, Home, MessageSquare, User } from 'lucide-react';
import { useAuth } from '@/hooks/v1';
import { PortalShell } from './PortalShell';
import { RoleGate } from './RoleGate';
import type { NavItem } from './types';

const NAV: NavItem[] = [
  { path: '/candidate', label: 'Dashboard', icon: Home, end: true },
  { path: '/candidate/mandates', label: 'Mandates', icon: Briefcase },
  { path: '/candidate/profile', label: 'Profile', icon: User },
  { path: '/candidate/messages', label: 'Messages', icon: MessageSquare },
];

export default function CandidatePortalLayout(): React.ReactElement {
  const { user, loading, logout } = useAuth();

  return (
    <RoleGate user={user} loading={loading} userType="candidate">
      <PortalShell
        kind="candidate"
        brand="Candidate Portal"
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
