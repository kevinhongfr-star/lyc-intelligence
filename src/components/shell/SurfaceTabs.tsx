/**
 * SurfaceTabs — Dynamically filtered surface navigation
 *
 * Phase 15.3 (C3): Filters to surfaces with ≥1 WORKING sub-page.
 * Admin/developer roles (admin, lyc_admin, super_admin, and when
 * VITE_ENABLE_ADMIN_PREVIEW = "true") see everything for dev/QA.
 *
 * Role hierarchy (lowest → highest):
 *   candidate < member < council < client_viewer < client_admin <
 *   lyc_consultant < team_lead < admin < lyc_admin < super_admin
 */
import React from 'react';
import { Briefcase, Building2, GraduationCap, User, Grid3x3 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export type Surface = 'internal' | 'client' | 'coaching' | 'candidate' | 'grid';

export interface SubTabConfig {
  path: string;
  label: string;
  /** When true, this sub-tab has a real implementation behind it (not Placeholder). */
  working: boolean;
}

export interface SurfaceConfig {
  id: Surface;
  label: string;
  icon: React.ReactNode;
  minRole?: string;
  roles?: string[];
  alwaysShow?: boolean;
  /** Minimum working sub-tabs for this surface to appear for regular users (default = 1) */
  minWorking?: number;
  subTabs: SubTabConfig[];
}

const ROLE_LEVEL: Record<string, number> = {
  candidate: 0,
  member: 1,
  council: 2,
  client_viewer: 3,
  client_admin: 4,
  lyc_consultant: 5,
  team_lead: 6,
  admin: 7,
  lyc_admin: 8,
  super_admin: 9,
};

export const ADMIN_ROLES: Array<keyof typeof ROLE_LEVEL> = ['admin', 'lyc_admin', 'super_admin'];

function hasMinRole(role: string | null | undefined, minRole: string): boolean {
  if (!role) return false;
  const userLevel = ROLE_LEVEL[role] ?? -1;
  const requiredLevel = ROLE_LEVEL[minRole] ?? -1;
  return userLevel >= requiredLevel;
}

export function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return ADMIN_ROLES.includes(role as any);
}

/** Admin preview feature flag — allows QA/dev to see all surfaces even as non-admin. */
export const ENABLE_ADMIN_PREVIEW = (import.meta as any).env?.VITE_ENABLE_ADMIN_PREVIEW === 'true';

export function userSeesAllSurfaces(role: string | null | undefined): boolean {
  return isAdminRole(role) || ENABLE_ADMIN_PREVIEW;
}

/**
 * Single source of truth for surface/sub-tab definitions including working flags.
 * Both SurfaceTabs and AppShell should consume this (or derive from it) so they
 * never disagree on what's working vs placeholder-only.
 */
export const SURFACE_CONFIG: SurfaceConfig[] = [
  {
    id: 'internal',
    label: 'Internal Ops',
    icon: <Briefcase className="w-4 h-4" />,
    minRole: 'lyc_consultant',
    subTabs: [
      { path: '/app/dashboard', label: 'Dashboard', working: true },
      { path: '/app/pipeline', label: 'Pipeline', working: true },
      { path: '/app/mandates', label: 'Mandates', working: true },
      { path: '/app/candidates', label: 'Candidates', working: true },
      { path: '/app/trident', label: 'Match Analysis', working: false },
      { path: '/app/canvas', label: 'Scorecard Builder', working: false },
      { path: '/app/shift', label: 'SHIFT Suite', working: false },
      { path: '/app/scheduler', label: 'Scheduler', working: true },
      { path: '/app/reports', label: 'Reports', working: false },
      { path: '/app/intelligence', label: 'Intelligence', working: false },
      { path: '/app/team', label: 'Team', working: true },
      { path: '/app/tasks', label: 'Tasks', working: true },
      { path: '/app/analytics', label: 'Analytics', working: true },
      { path: '/app/compliance', label: 'Compliance', working: true },
      { path: '/app/nexus-engine', label: 'NEXUS Engine', working: true },
      { path: '/app/advanced-ops', label: 'Advanced Ops', working: true },
      { path: '/app/scheduling-plus', label: 'Scheduling+', working: true },
      { path: '/app/intelligence-plus', label: 'Intelligence+', working: true },
      { path: '/app/platform-settings', label: 'Platform Settings', working: true },
    ],
  },
  {
    id: 'client',
    label: 'B2B Client',
    icon: <Building2 className="w-4 h-4" />,
    roles: ['client_viewer', 'client_admin', 'lyc_consultant', 'team_lead', 'admin', 'lyc_admin', 'super_admin'],
    subTabs: [
      { path: '/client/overview', label: 'Overview', working: true },
      { path: '/client/pipeline-analytics', label: 'Pipeline Analytics', working: true },
      { path: '/client/talent-intel', label: 'Talent Intelligence', working: false },
      { path: '/client/mandates', label: 'Mandates & Pipeline', working: true },
      { path: '/client/candidates', label: 'Candidates', working: false },
      { path: '/client/nexus-assistant', label: 'NEXUS Assistant', working: false },
      { path: '/client/documents', label: 'Documents & Billing', working: true },
      { path: '/client/admin', label: 'Admin & Security', working: false },
      { path: '/client/collaboration', label: 'Collaboration', working: false },
      { path: '/client/onboarding', label: 'Onboarding', working: false },
    ],
  },
  {
    id: 'coaching',
    label: 'B2C Coaching',
    icon: <GraduationCap className="w-4 h-4" />,
    /**
     * Phase 15.3 (C1, B2C simplified to 4 nav sections):
     *  NEXUS Chat · Assessments (11) · My Results / Reports · Profile / Settings
     * All other Placeholder sub-tabs are hidden from regular users but remain
     * visible for admins / QA preview.
     */
    alwaysShow: true,
    minWorking: 1,
    subTabs: [
      { path: '/coaching/nexus-chat', label: 'NEXUS Chat', working: true },
      { path: '/coaching/assessments', label: 'Assessments', working: true },
      { path: '/coaching/results', label: 'My Results', working: true },
      { path: '/coaching/profile', label: 'Profile & Settings', working: true },
      { path: '/coaching/credits', label: 'Miles & Subscription', working: false },
      { path: '/coaching/intelligence', label: 'Intelligence', working: false },
      { path: '/coaching/career-intel', label: 'Career Intelligence', working: false },
      { path: '/coaching/chat-features', label: 'Chat Features', working: false },
      { path: '/coaching/career-services', label: 'Career Services', working: false },
      { path: '/coaching/engagement', label: 'Engagement', working: false },
      { path: '/coaching/growth', label: 'Growth', working: false },
    ],
  },
  {
    id: 'candidate',
    label: 'Candidate',
    icon: <User className="w-4 h-4" />,
    roles: ['candidate', 'lyc_consultant', 'team_lead', 'admin', 'lyc_admin', 'super_admin'],
    subTabs: [
      { path: '/candidate/dashboard', label: 'Dashboard', working: true },
      { path: '/candidate/applications', label: 'Applications', working: true },
      { path: '/candidate/offers', label: 'Offers & Decisions', working: false },
      { path: '/candidate/opportunities', label: 'My Opportunities', working: true },
      { path: '/candidate/interview-prep', label: 'Interview Prep', working: true },
      { path: '/candidate/assessments', label: 'Assessments', working: true },
      { path: '/candidate/career-dev', label: 'Career Development', working: false },
      { path: '/candidate/community', label: 'Community', working: true },
      { path: '/candidate/nexus-coach', label: 'NEXUS Coach', working: false },
      { path: '/candidate/profile', label: 'Candidate Profile', working: false },
      { path: '/candidate/advanced-assessments', label: 'Advanced Assessments', working: false },
      { path: '/candidate/settings-plus', label: 'Settings+', working: false },
    ],
  },
  {
    id: 'grid',
    label: 'Market Intelligence',
    icon: <Grid3x3 className="w-4 h-4" />,
    minRole: 'lyc_consultant',
    subTabs: [
      { path: '/grid', label: 'Market Mapping', working: false },
      { path: '/grid/review', label: 'Review Dashboard', working: false },
    ],
  },
];

interface SurfaceTabsProps {
  active: Surface;
  onChange: (surface: Surface) => void;
}

export function SurfaceTabs({ active, onChange }: SurfaceTabsProps) {
  const { profile } = useAuthStore();
  const userRole = profile?.role || null;
  const adminPreview = userSeesAllSurfaces(userRole);

  const visibleTabs = SURFACE_CONFIG.filter((surface) => {
    // Role gating first
    if (!surface.alwaysShow) {
      const roleOk =
        (surface.minRole && hasMinRole(userRole, surface.minRole)) ||
        (surface.roles && userRole && surface.roles.includes(userRole)) ||
        false;
      if (!roleOk && !adminPreview) return false;
    }

    // Working-page count gating (Phase 15.3 — hide surfaces with < minWorking real pages)
    const minWorking = surface.minWorking ?? 1;
    const workingCount = surface.subTabs.filter((t) => t.working).length;
    if (workingCount < minWorking && !adminPreview) return false;

    return true;
  });

  if (visibleTabs.length === 0) return null;

  return (
    <div className="bg-white border-b border-border px-6">
      <div className="flex gap-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              active === tab.id
                ? 'text-fuchsia border-b-2 border-fuchsia bg-fuchsia-light'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-warm'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default SurfaceTabs;
