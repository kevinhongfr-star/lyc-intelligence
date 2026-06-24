import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { ConsultantDashboard } from '@/components/dashboard/ConsultantDashboard';
import { ClientDashboard } from '@/components/client/ClientDashboard';
import { CandidateDashboard } from '@/components/candidate/CandidateDashboard';
import { BDDashboard } from '@/components/bd/BDDashboard';
import { TL_Dashboard } from '@/components/team-lead/TL_Dashboard';

export function DashboardRouter() {
  const { profile } = useAuthStore();
  const role = profile?.role;
  const subtype = profile?.subtype;

  if (!profile) return null;

  if (role === 'client') {
    return <ClientDashboard />;
  }

  if (role === 'candidate') {
    return <CandidateDashboard />;
  }

  if (role === 'bd') {
    return <BDDashboard />;
  }

  if (role === 'consultant' && subtype === 'leader') {
    return <TL_Dashboard />;
  }

  if (role === 'admin') {
    return <ConsultantDashboard />;
  }

  return <ConsultantDashboard />;
}
