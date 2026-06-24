import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';
import type { ICP } from '@/types';
import { getPortalRoute } from '@/components/ICPRoute';

interface RoleRouteProps {
  allowedICP?: ICP[];
  allowedRoles?: string[];
  children: React.ReactNode;
}

export function RoleRoute({ allowedICP, allowedRoles, children }: RoleRouteProps) {
  const { profile, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const userICP = profile?.icp as ICP;
  const userRole = profile?.role;

  if (userRole === 'admin') {
    return <>{children}</>;
  }

  if (allowedICP && (!userICP || !allowedICP.includes(userICP))) {
    return <Navigate to={getPortalRoute(userICP)} replace />;
  }

  if (allowedRoles && (!userRole || !allowedRoles.some(r => userRole.includes(r)))) {
    return <Navigate to="/platform" replace />;
  }

  return <>{children}</>;
}
