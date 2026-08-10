/**
 * SurfaceTabs — role-filtered surface tab bar
 * 
 * Only shows surfaces the user has access to based on their role.
 * Role hierarchy (lowest → highest):
 *   candidate < member < council < client_viewer < client_admin <
 *   lyc_consultant < team_lead < admin < lyc_admin < super_admin
 */
import React from 'react';
import { Briefcase, Building2, GraduationCap, User, Grid3x3 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export type Surface = 'internal' | 'client' | 'coaching' | 'candidate' | 'grid';

interface SurfaceTab {
  id: Surface;
  label: string;
  icon: React.ReactNode;
  minRole?: string;
  roles?: string[];
  alwaysShow?: boolean;
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

function hasMinRole(role: string | null | undefined, minRole: string): boolean {
  if (!role) return false;
  const userLevel = ROLE_LEVEL[role] ?? -1;
  const requiredLevel = ROLE_LEVEL[minRole] ?? -1;
  return userLevel >= requiredLevel;
}

const SURFACE_TABS: SurfaceTab[] = [
  { id: 'internal', label: 'Internal Ops', icon: <Briefcase className="w-4 h-4" />, minRole: 'lyc_consultant' },
  { id: 'client', label: 'B2B Client', icon: <Building2 className="w-4 h-4" />, roles: ['client_viewer', 'client_admin', 'lyc_consultant', 'team_lead', 'admin', 'lyc_admin', 'super_admin'] },
  { id: 'coaching', label: 'B2C Coaching', icon: <GraduationCap className="w-4 h-4" />, alwaysShow: true },
  { id: 'candidate', label: 'Candidate', icon: <User className="w-4 h-4" />, roles: ['candidate', 'lyc_consultant', 'team_lead', 'admin', 'lyc_admin', 'super_admin'] },
  { id: 'grid', label: 'Market Intelligence', icon: <Grid3x3 className="w-4 h-4" />, minRole: 'lyc_consultant' },
];

interface SurfaceTabsProps {
  active: Surface;
  onChange: (surface: Surface) => void;
}

export function SurfaceTabs({ active, onChange }: SurfaceTabsProps) {
  const { profile } = useAuthStore();
  const userRole = profile?.role || null;

  const visibleTabs = SURFACE_TABS.filter((tab) => {
    if (tab.alwaysShow) return true;
    if (tab.minRole && hasMinRole(userRole, tab.minRole)) return true;
    if (tab.roles && userRole && tab.roles.includes(userRole)) return true;
    return false;
  });

  if (visibleTabs.length === 0) return null;

  return (
    <div className="bg-white border-b border-border px-6">
      <div className="flex gap-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${active === tab.id
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
