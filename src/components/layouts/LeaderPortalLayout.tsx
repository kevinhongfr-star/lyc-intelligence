/**
 * Phase 16 — LeaderPortalLayout (B2C identity, /app/*).
 *
 * Auth required. Chrome: LeaderNav sidebar (NEXUS Chat / Assessments /
 * Results / Profile / Dashboard / Documents / Billing).
 * Visual: clean, focused, tool-like but still premium. Miles badge prominent.
 * Zero radius, font trio, accent #C108AB.
 */
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { isConsultantRole } from '@/services/portalClassification';
import LeaderNav from '@/components/navigation/LeaderNav';
// #1321: Adopt shared design-system barrel. pageBg = portal-specific background
//        token (the subtle surface behind leader-portlet cards).
import { LYC_SHARED_DS } from '@/styles/ds';
const DS = { ...LYC_SHARED_DS, pageBg: '#FAFAFA' };

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

export function LeaderPortalLayout(): React.ReactElement {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;

  // Role check: block pure B2B consultants. Leader + internal staff are fine
  // (internal staff can still access leader portal as a "view B2C as user" mode,
  // but pure client/consultant roles bounce to their portal).
  const role = profile?.role;
  if (role && isConsultantRole(role)) {
    // Consultants get their own portal. Redirect.
    return <Navigate to="/portal/dashboard" replace />;
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: DS.pageBg, fontFamily: DS.bodyFont,
    }} data-portal-kind="leader">
      <LeaderNav variant="sidebar" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top spacer for mobile */}
        <main
          id="leader-main"
          aria-label="Main content"
          style={{
            flex: 1, overflowY: 'auto',
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
