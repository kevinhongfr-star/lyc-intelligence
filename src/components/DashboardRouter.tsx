import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { ConsultantDashboard } from '@/components/dashboard/ConsultantDashboard';

export function DashboardRouter() {
  const { profile } = useAuthStore();
  const icp = profile?.icp;
  const role = profile?.role;

  if (role === 'admin' || icp === 'consultant') {
    return <ConsultantDashboard />;
  }

  if (icp === 'leader') {
    return <ConsultantDashboard />;
  }

  return <ConsultantDashboard />;
}
