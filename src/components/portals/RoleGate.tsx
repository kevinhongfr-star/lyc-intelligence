/**
 * Portal layout system — RoleGate.
 *
 * Renders its children only when the supplied user passes the configured
 * role / user-type checks. While `loading` is true and the user is null it
 * shows a `loadingFallback` (default: a Skeleton bar); when unauthorized it
 * shows `fallback` (default: an EmptyState with a "back to home" action).
 *
 * RoleGate intentionally avoids router primitives so it can be used (and
 * tested) without a Router context — navigation in the default fallback
 * uses `window.location`.
 */
import React from 'react';
import { EmptyState, Skeleton } from '@/components/ui';
import type { RoleGateProps } from './types';
import {
  hasAnyRole,
  hasAnyUserType,
  hasRole,
  hasUserType,
} from './roleUtils';

/**
 * Evaluate all configured gates. Returns true only when every supplied
 * constraint is satisfied. An empty gate set (no role/roles/userType/userTypes)
 * is treated as "allow" — useful for public-but-authed sections.
 */
function isAuthorized(
  user: NonNullable<RoleGateProps['user']>,
  props: Pick<
    RoleGateProps,
    'role' | 'roles' | 'userType' | 'userTypes'
  >,
): boolean {
  if (props.role !== undefined && !hasRole(user, props.role)) return false;
  if (props.roles !== undefined && props.roles.length > 0 && !hasAnyRole(user, props.roles))
    return false;
  if (props.userType !== undefined && !hasUserType(user, props.userType))
    return false;
  if (
    props.userTypes !== undefined &&
    props.userTypes.length > 0 &&
    !hasAnyUserType(user, props.userTypes)
  )
    return false;
  return true;
}

const DEFAULT_LOADING_FALLBACK: React.ReactNode = (
  <Skeleton className="h-8 w-48" />
);

function DefaultFallback(): React.ReactElement {
  return (
    <EmptyState
      title="Access restricted"
      description="You don't have permission to view this area."
      actionLabel="Back to home"
      onAction={() => {
        window.location.assign('/');
      }}
    />
  );
}

export function RoleGate({
  user,
  loading,
  role,
  roles,
  userType,
  userTypes,
  loadingFallback,
  fallback,
  children,
}: RoleGateProps): React.ReactElement {
  // Loading + no user yet → show the loading state, do not flash the
  // unauthorized fallback while the profile is still in flight.
  if (loading && !user) {
    return <>{loadingFallback ?? DEFAULT_LOADING_FALLBACK}</>;
  }

  if (!user || !isAuthorized(user, { role, roles, userType, userTypes })) {
    return <>{fallback ?? <DefaultFallback />}</>;
  }

  return <>{children}</>;
}

export default RoleGate;
