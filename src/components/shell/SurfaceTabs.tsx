/**
 * SurfaceTabs — 4-surface tab bar (Internal / B2B / B2C / Candidate)
 * Mockup v14 style: horizontal tabs with fuchsia accent on active
 */
import React from 'react';
import { Briefcase, Building2, GraduationCap, User } from 'lucide-react';

export type Surface = 'internal' | 'client' | 'coaching' | 'candidate';

interface SurfaceTab {
  id: Surface;
  label: string;
  icon: React.ReactNode;
}

const SURFACE_TABS: SurfaceTab[] = [
  { id: 'internal', label: 'Internal Ops', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'client', label: 'B2B Client', icon: <Building2 className="w-4 h-4" /> },
  { id: 'coaching', label: 'B2C Coaching', icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'candidate', label: 'Candidate', icon: <User className="w-4 h-4" /> },
];

interface SurfaceTabsProps {
  active: Surface;
  onChange: (surface: Surface) => void;
}

export function SurfaceTabs({ active, onChange }: SurfaceTabsProps) {
  return (
    <div className="bg-white border-b border-border px-6">
      <div className="flex gap-1">
        {SURFACE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
              ${active === tab.id
                ? 'text-fuchsia border-b-2 border-fuchsia bg-fuchsia-light'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-warm'
              }
            `}
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