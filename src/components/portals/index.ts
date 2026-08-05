/**
 * Portal layout system — public barrel.
 *
 *   import {
 *     RoleGate, Sidebar, Breadcrumbs, TopBar, PortalShell,
 *     InternalPortalLayout, ClientPortalLayout,
 *     CandidatePortalLayout, B2cPortalLayout,
 *     roleUtils, types,
 *   } from '@/components/portals';
 */
export { RoleGate } from './RoleGate';
export { Sidebar } from './Sidebar';
export type { SidebarProps } from './Sidebar';
export { Breadcrumbs } from './Breadcrumbs';
export type { BreadcrumbsProps } from './Breadcrumbs';
export { TopBar } from './TopBar';
export type { TopBarProps } from './TopBar';
export { PortalShell } from './PortalShell';

// Portal layouts (named + default re-export).
export { default as InternalPortalLayout } from './InternalPortalLayout';
export { default as ClientPortalLayout } from './ClientPortalLayout';
export { default as CandidatePortalLayout } from './CandidatePortalLayout';
export { default as B2cPortalLayout } from './B2cPortalLayout';
export { default } from './InternalPortalLayout';

// Utilities + shared types.
export * as roleUtils from './roleUtils';
export * from './types';
