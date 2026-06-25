import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { ConsultantDashboard } from '@/components/dashboard/ConsultantDashboard';
import { TL_Dashboard } from '@/components/team-lead/TL_Dashboard';

export function DashboardRouter() {
  const { profile } = useAuthStore();
  const icp = profile?.icp;
  const role = profile?.role;
  const subtype = profile?.subtype;

  if (!profile) return null;

  // Admin users see ConsultantDashboard (full access)
  if (role === 'super_admin' || role === 'lyc_admin') {
    return <ConsultantDashboard />;
  }

  // Route by ICP (persona type), not role
  if (icp === 'leader' || subtype === 'leader') {
    return <TL_Dashboard />;
  }

  // Default: consultant dashboard
  return <ConsultantDashboard />;
}
