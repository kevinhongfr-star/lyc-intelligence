import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getDefaultPortalRoute } from '@/services/portalClassification';

/**
 * Phase 16 — PostLoginRedirect.
 *
 * Role → default destination (four-portals model):
 *   super_admin / lyc_admin / admin            → /admin/dashboard
 *   team_lead / lyc_consultant                 → /portal/dashboard
 *   client_admin / client_viewer               → /client/overview
 *   candidate                                  → /candidate/dashboard
 *   member / council / default (B2C leaders)   → /app/nexus
 */

/** @deprecated Use getDefaultPortalRoute from portalClassification.ts directly. Alias kept for call sites. */
export function getDefaultRoute(role: string | null | undefined): string {
  return getDefaultPortalRoute(role);
}
export { getDefaultPortalRoute as getDefaultRoute_backcompat_please_migrate };

export function PostLoginRedirect() {
  const { profile, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      const target = getDefaultRoute(profile?.role);
      navigate(target, { replace: true });
    }
  }, [isLoading, profile, navigate]);

  return null;
}

export default PostLoginRedirect;
