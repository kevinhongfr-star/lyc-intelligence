/**
 * PortalRouteGuard — Role-based access control for portal surfaces
 * 
 * Roles: admin | consultant | client | candidate | leader
 * - admin: Can access ANY portal (impersonation)
 * - consultant: Internal Portal only
 * - client: B2B Client Portal
 * - candidate: Candidate Portal
 * - leader: B2C Leader Portal
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

type PortalRole = 'admin' | 'consultant' | 'client' | 'candidate' | 'leader';

interface PortalRouteGuardProps {
  requiredRole: PortalRole;
  children: React.ReactNode;
}

export function PortalRouteGuard({ requiredRole, children }: PortalRouteGuardProps) {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-[#C108AB] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = profile?.role ?? (user as any)?.app_metadata?.role ?? 'leader';

  // Admin can access any portal
  if (role === 'admin') {
    return <>{children}</>;
  }

  // Check if user has the required role
  if (role !== requiredRole) {
    // Redirect to their own portal
    const redirectMap: Record<string, string> = {
      consultant: '/platform',
      client: '/client-portal/overview',
      candidate: '/candidate/dashboard',
      leader: '/leader-portal/coach',
    };
    return <Navigate to={redirectMap[role] || '/'} replace />;
  }

  return <>{children}</>;
}

/**
 * ImpersonationBanner — shown when admin views non-internal portal
 */
export function ImpersonationBanner({ portalName }: { portalName: string }) {
  const { profile } = useAuthStore();
  const role = profile?.role;

  // Only show for admin users viewing non-internal portals
  if (role !== 'admin') return null;

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 9999,
      background: '#C108AB',
      color: '#FFFFFF',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      fontSize: '13px',
    }}>
      <span style={{ fontWeight: 500 }}>
        Admin View — Viewing as {portalName}
      </span>
      <a
        href="/platform"
        style={{
          color: '#FFFFFF',
          textDecoration: 'underline',
          fontWeight: 600,
          fontSize: '12px',
        }}
      >
        Return to Internal Portal
      </a>
    </div>
  );
}
