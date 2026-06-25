/**
 * AdminRoute — wraps a route in auth + admin role check.
 *
 * Behavior:
 *   - Unauthenticated -> redirect to /login
 *   - Authenticated but role !== 'lyc_admin' -> redirect to /dashboard
 *     (avoids leaking admin paths to non-admins via 404 vs 403 signal noise)
 *   - Admin -> render children
 *
 * Use inside a ProtectedRoute path; can be used standalone too (it checks
 * isLoading + user itself, no need to nest in ProtectedRoute).
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, ShieldOff } from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );
}

interface AdminRouteProps {
  children: React.ReactNode;
  /** Where to send non-admins. Default /dashboard. */
  fallbackPath?: string;
}

export function AdminRoute({ children, fallbackPath = '/dashboard' }: AdminRouteProps) {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  // Profile is the source of truth for role; fall back to user metadata
  const role = profile?.role ?? (user as any)?.app_metadata?.role ?? null;
  // Allow both super_admin and lyc_admin roles
  const isAdmin = role === 'super_admin' || role === 'lyc_admin';
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3 text-center px-6">
        <ShieldOff className="w-12 h-12 text-text-muted" />
        <h1 className="text-2xl font-serif">Admin access required</h1>
        <p className="text-text-muted max-w-md">
          This page is restricted to LYC platform administrators. You are signed in as
          <span className="font-mono text-text-primary ml-1">{user.email}</span>.
        </p>
        <a
          href={fallbackPath}
          className="mt-2 text-accent hover:underline"
        >
          Return to dashboard
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
