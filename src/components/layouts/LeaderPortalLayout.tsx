/**
 * V5.1 — LeaderPortalLayout (B2C identity, /app/*).
 *
 * Auth required. Chrome: LeaderNavV5 canonical sidebar (220px).
 * 3-column shell: LeaderNavV5 (sidebar) + main content + optional right rail.
 * DEX pages (/app/dex/*) live inside the same shell.
 * Zero radius, V1 tokens, no lucide icons.
 */
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { isConsultantRole } from '@/services/portalClassification';
import LeaderNavV5 from '@/components/navigation/LeaderNavV5';
import { SkipToContent } from '@/components/a11y/SkipToContent';
import { V1 } from '@/styles/v1-tokens';

function Loading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      fontFamily: V1.monoFont,
      color: V1.textDim,
      fontSize: V1.textBodySm,
      letterSpacing: V1.trackingMono,
      textTransform: 'uppercase',
    }}>
      Loading…
    </div>
  );
}

export function LeaderPortalLayout(): React.ReactElement {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;

  const role = profile?.role;
  if (role && isConsultantRole(role)) {
    return <Navigate to="/portal/dashboard" replace />;
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: V1.bg,
    }} data-portal-kind="leader-v5">
      <SkipToContent targetId="leader-main" />
      <LeaderNavV5 />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <main
          id="leader-main"
          aria-label="Main content"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'clamp(16px,3vw,32px)',
            minWidth: 0,
          }}
        >
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default LeaderPortalLayout;
