/**
 * Portal layout system — shared types.
 *
 * These types are the contract between the portal shell primitives
 * (Sidebar, TopBar, Breadcrumbs, PortalShell) and the four concrete
 * portal layouts (Internal / Client / Candidate / B2C).
 */
import type React from 'react';
import type { UserRole } from '@/types';
import type { UserType, V1AuthUser } from '@/hooks/v1/types';

/** A single navigation entry rendered in a portal sidebar. */
export interface NavItem {
  /** Route path. Used as the NavLink `to`. */
  path: string;
  /** Human-readable label shown next to the icon. */
  label: string;
  /** Optional lucide icon component. `size` mirrors lucide's `string | number`. */
  icon?: React.ComponentType<{ className?: string; size?: number | string }>;
  /** Restrict visibility to these roles. Omit to show to everyone. */
  roles?: UserRole[];
  /** Restrict visibility to these user types. Omit to show to everyone. */
  userTypes?: UserType[];
  /** Optional numeric badge (e.g. unread count) rendered as a red pill. */
  badge?: number;
  /** When true, NavLink uses `end` (active only on exact match). */
  end?: boolean;
}

/** A single breadcrumb crumb. */
export interface BreadcrumbItem {
  label: string;
  /** When present, renders as a link; otherwise renders as current page. */
  to?: string;
}

/** The four portal kinds, one per audience. */
export type PortalKind = 'internal' | 'client' | 'candidate' | 'b2c';

/** Props for the composite PortalShell layout. */
export interface PortalShellProps {
  kind: PortalKind;
  brand: string;
  nav: NavItem[];
  user: V1AuthUser | null;
  onLogout: () => void | Promise<void>;
  loading?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  /** Optional actions rendered in the TopBar's right slot. */
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

/** Props for the RoleGate access-control wrapper. */
export interface RoleGateProps {
  user: V1AuthUser | null;
  loading?: boolean;
  /** Require role at or above this level. */
  role?: UserRole;
  /** Require ANY of these roles. */
  roles?: UserRole[];
  /** Require this user_type. */
  userType?: UserType;
  /** Require ANY of these user_types. */
  userTypes?: UserType[];
  /** Shown while loading and user is null. */
  loadingFallback?: React.ReactNode;
  /** Shown when unauthorized. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}
