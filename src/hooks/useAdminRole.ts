/**
 * useAdminRole — client-side guard hook: returns { isAdmin, isLoading, userEmail, role }.
 * Admin role check matches AdminLayout's server-side guard above (isAdminRole).
 */
import { useAuthStore } from '@/stores/authStore';
import { isAdminRole } from '@/services/portalClassification';

export function useAdminRole() {
  const { user, profile, isLoading } = useAuthStore();
  const role = profile?.role;
  return {
    isLoading,
    isAdmin: Boolean(user) && isAdminRole(role),
    role: role ?? null,
    userEmail: user?.email ?? profile?.email ?? null,
    userId: user?.id ?? profile?.id ?? null,
  };
}
