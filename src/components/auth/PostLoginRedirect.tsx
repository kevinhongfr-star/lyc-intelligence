import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

/**
 * PostLoginRedirect — routes users to the right portal based on their role.
 * 
 * Role → default destination:
 *   super_admin / lyc_admin / admin / team_lead / lyc_consultant → /app/dashboard (internal)
 *   client_admin / client_viewer → /client/overview
 *   candidate → /candidate/dashboard
 *   member / council / default → /coaching/coach (B2C)
 */
export function getDefaultRoute(role: string | null | undefined): string {
  switch (role) {
    case 'super_admin':
    case 'lyc_admin':
    case 'admin':
    case 'team_lead':
    case 'lyc_consultant':
      return '/app/dashboard';
    case 'client_admin':
    case 'client_viewer':
      return '/client/overview';
    case 'candidate':
      return '/candidate/dashboard';
    case 'member':
    case 'council':
    default:
      return '/coaching/coach';
  }
}

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
