/**
 * Phase 16 — AdminLayout (internal LYC admin staff, /admin/*).
 *
 * Auth required + admin role (admin / lyc_admin / super_admin).
 * Chrome: AdminNav (dark sidebar, dense data layout).
 * Visual: functional, data-dense, no marketing chrome. Dark sidebar gives
 * immediate visual distinction from consultant portal.
 * Zero radius, font trio, accent #C108AB.
 */
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { isAdminRole } from '@/services/portalClassification';
import AdminNav from '@/components/navigation/AdminNav';

const DS = {
  bodyFont: "'DM Sans', system-ui, sans-serif",
  pageBg: '#F3F3F3',
  border: '#E5E5E5',
  muted: '#666666',
};

function Loading() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', fontFamily: DS.bodyFont, color: DS.muted, fontSize: 14, gap: 10,
    }}>
      <Loader2 className="w-5 h-5 animate-spin" />
      Loading…
    </div>
  );
}

function AccessDenied() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', fontFamily: DS.bodyFont, gap: 16, padding: 32,
    }}>
      <div style={{
        width: 56, height: 56, background: '#FEE2E2', color: '#B91C1C',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Lock size={24} />
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Admin access required</h2>
      <p style={{ fontSize: 14, color: DS.muted, maxWidth: 420, textAlign: 'center', margin: 0 }}>
        This area is restricted to LYC administrators. Contact the platform owner if you need elevated permissions.
      </p>
    </div>
  );
}

export function AdminLayout(): React.ReactElement {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;

  const role = profile?.role;
  if (!isAdminRole(role)) {
    return <AccessDenied />;
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: DS.pageBg, fontFamily: DS.bodyFont,
    }} data-portal-kind="admin">
      <AdminNav />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <main
          id="admin-main"
          aria-label="Main content"
          style={{
            flex: 1, overflowY: 'auto',
            padding: '20px 24px',
            minWidth: 0,
          }}
        >
          <div style={{ maxWidth: 1500, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
