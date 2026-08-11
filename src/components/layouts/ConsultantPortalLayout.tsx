/**
 * Phase 16 — ConsultantPortalLayout (LYC consultants + B2B client users).
 *
 * Auth required + consultant role. Routes: /portal/* (consultants),
 * /client/* (client users). ConsultantNav shows different nav items per
 * role (client subset for pure client users, full nav for internal staff).
 * Visual: higher information density, professional services platform feel.
 * Zero radius, font trio, accent #C108AB.
 *
 * #1325 upgrades:
 *   - Premium tier badge + seat/invite quotas (visible in ConsultantNav sidebar)
 *   - InviteClientModal mounted at layout root so "Invite Client" is one click
 *   - Upgrade → redirects to /pricing (consultant tier comparison table)
 */
import React, { useState } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { isConsultantRole, isClientRole, isInternalStaff } from '@/services/portalClassification';
import ConsultantNav from '@/components/navigation/ConsultantNav';
import { InviteClientModal } from '@/components/portals/InviteClientModal';

const DS = {
  bodyFont: "'DM Sans', system-ui, sans-serif",
  bg: '#FFFFFF',
  pageBg: '#F3F3F3',
  border: '#E5E5E5',
  text: '#000000',
  muted: '#666666',
  cardBg: '#FFFFFF',
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
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Consultant access required</h2>
      <p style={{ fontSize: 14, color: DS.muted, maxWidth: 420, textAlign: 'center', margin: 0 }}>
        This area is for LYC consultants and client organizations. If you should have access, contact your account administrator.
      </p>
    </div>
  );
}

/**
 * Layout used for both /portal/* (internal consultants + admins)
 * and /client/* (client viewer/admin). ConsultantNav adapts its IA
 * automatically based on the profile.role (client-only subset vs full).
 */
export function ConsultantPortalLayout(): React.ReactElement {
  const navigate = useNavigate();
  const { user, profile, isLoading } = useAuthStore();
  const [inviteOpen, setInviteOpen] = useState(false);

  if (isLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;

  const role = profile?.role;
  if (!isConsultantRole(role) && !isClientRole(role)) {
    return <AccessDenied />;
  }

  const tier = (profile as any)?.consultant_tier || (profile as any)?.tier;

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: DS.pageBg, fontFamily: DS.bodyFont,
    }} data-portal-kind="consultant">
      <ConsultantNav
        onOpenInvite={() => setInviteOpen(true)}
        onUpgrade={() => navigate('/pricing', { state: { from: 'consultant-portal' } })}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <main
          id="consultant-main"
          aria-label="Main content"
          style={{
            flex: 1, overflowY: 'auto',
            padding: '20px 24px',
            minWidth: 0,
          }}
        >
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>

      <InviteClientModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        issuedBy={user.id}
        issuerTier={tier}
      />
    </div>
  );
}

/**
 * Dedicated /client/* layout variant for pure client users.
 * Reuses ConsultantNav (which already adapts to client-only role) and
 * ConsultantPortalLayout structure — but redirects pure internal staff
 * to /portal/ instead of client portal.
 */
export function ClientPortalLayout(): React.ReactElement {
  const navigate = useNavigate();
  const { user, profile, isLoading } = useAuthStore();
  const [inviteOpen, setInviteOpen] = useState(false);

  if (isLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;

  const role = profile?.role;
  // Client users go here. Internal staff also see client pages if they
  // explicitly navigate to them (admin override for troubleshooting),
  // but pure B2C leaders get denied.
  if (!isClientRole(role) && !isInternalStaff(role) && !isConsultantRole(role)) {
    return <AccessDenied />;
  }

  const tier = (profile as any)?.consultant_tier || (profile as any)?.tier;

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: DS.pageBg, fontFamily: DS.bodyFont,
    }} data-portal-kind="client">
      <ConsultantNav
        onOpenInvite={() => setInviteOpen(true)}
        onUpgrade={() => navigate('/pricing', { state: { from: 'client-portal' } })}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <main
          id="client-main"
          aria-label="Main content"
          style={{
            flex: 1, overflowY: 'auto',
            padding: '20px 24px',
            minWidth: 0,
          }}
        >
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>

      <InviteClientModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        issuedBy={user.id}
        issuerTier={tier}
        defaultRole="client_viewer"
      />
    </div>
  );
}

export default ConsultantPortalLayout;
