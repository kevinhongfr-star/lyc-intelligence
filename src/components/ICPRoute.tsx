import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';
import type { ICP } from '@/types';

interface ICPRouteProps {
  allowedICP: ICP | ICP[];
  children: React.ReactNode;
}

export function ICPRoute({ allowedICP, children }: ICPRouteProps) {
  const { profile, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const userICP = profile?.icp as ICP;
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'lyc_admin';

  if (isAdmin) {
    return <>{children}</>;
  }

  const allowed = Array.isArray(allowedICP) ? allowedICP : [allowedICP];
  if (!userICP || !allowed.includes(userICP)) {
    const targetRoute = getPortalRoute(userICP);
    return <Navigate to={targetRoute} replace />;
  }

  return <>{children}</>;
}

export function getPortalRoute(icp: ICP | null): string {
  switch (icp) {
    case 'client':
      return '/client';
    case 'candidate':
      return '/candidate';
    case 'leader':
      return '/team';
    case 'consultant':
    default:
      return '/platform';
  }
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );
}
