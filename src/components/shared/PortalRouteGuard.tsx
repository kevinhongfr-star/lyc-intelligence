import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

type UserRole = 'admin' | 'consultant' | 'client' | 'candidate' | 'leader';

interface PortalRouteGuardProps {
  requiredRole: UserRole;
  children: React.ReactNode;
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );
}

export function PortalRouteGuard({ requiredRole, children }: PortalRouteGuardProps) {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  const role = profile?.role as UserRole || 'consultant';

  if (role === 'admin') return <>{children}</>;

  if (role !== requiredRole) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3 text-center px-6">
        <h1 className="text-2xl font-serif">Access denied</h1>
        <p className="text-text-muted max-w-md">
          This portal is restricted to {requiredRole} users. You are signed in as {user.email}.
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-2 text-accent hover:underline"
        >
          Return to previous page
        </button>
      </div>
    );
  }

  return <>{children}</>;
}