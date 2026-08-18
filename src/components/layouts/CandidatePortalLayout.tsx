/**
 * Phase 16 — CandidatePortalLayout (/candidate/*).
 *
 * Lightweight layout for the candidate sub-portal. Candidates are classified
 * as "leader" in the role system so they can also access /app/* if desired,
 * but the /candidate/* routes have their own dedicated IA (applications,
 * opportunities, interview prep, community, assessments, dashboard) that
 * live in a specialized workspace.
 *
 * Reuses LeaderNav for visual consistency with B2C leader portal.
 * Zero radius, font trio, accent #C108AB.
 */
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { isConsultantRole } from '@/services/portalClassification';
import LeaderNav from '@/components/navigation/LeaderNav';
import { SkipToContent } from '@/components/a11y/SkipToContent';

const DS = {
  bodyFont: "'DM Sans', system-ui, sans-serif",
  pageBg: '#FAFAFA',
};

function Loading() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', fontFamily: DS.bodyFont, color: '#666', fontSize: 14, gap: 10,
    }}>
      <Loader2 className="w-5 h-5 animate-spin" />
      Loading…
    </div>
  );
}

export function CandidatePortalLayout(): React.ReactElement {
  const { user, profile, isLoading } = useAuthStore();

  if (isLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;

  const role = profile?.role;
  // Consultants shouldn't land in candidate portal.
  if (role && isConsultantRole(role)) {
    return <Navigate to="/portal/dashboard" replace />;
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: DS.pageBg, fontFamily: DS.bodyFont,
    }} data-portal-kind="candidate">
      <SkipToContent targetId="candidate-main" />
      <LeaderNav variant="sidebar" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <main
          id="candidate-main"
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

export default CandidatePortalLayout;
