import React from 'react';
import { Users } from 'lucide-react';

export interface Panelist {
  name: string;
  role: string;
  yearsExperience: number;
  previousCompany: string;
}

const MOCK_PANELISTS: Panelist[] = [
  { name: 'Robert Tan', role: 'CTO', yearsExperience: 15, previousCompany: 'Grab' },
  { name: 'Lisa Chen', role: 'VP Product', yearsExperience: 10, previousCompany: 'Shopee' },
  { name: 'Mark Davis', role: 'Head HR', yearsExperience: 8, previousCompany: 'SEA' },
];

export interface PanelProfilesProps {
  panelists?: Panelist[];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function PanelProfiles({ panelists = MOCK_PANELISTS }: PanelProfilesProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">PANEL PROFILES</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {panelists.map((p) => (
          <div
            key={p.name}
            className="bg-bg-secondary border border-bg-tertiary p-4 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-10 flex items-center justify-center">
                <span className="text-sm font-bold text-accent">{getInitials(p.name)}</span>
              </div>
              <div className="min-w-0">
                <p className="font-serif font-bold text-text-primary truncate">{p.name}</p>
                <p className="text-xs text-text-muted truncate">{p.role}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1 text-xs text-text-secondary">
              <span>
                <span className="text-text-muted">Experience:</span> {p.yearsExperience}yr
              </span>
              <span>
                <span className="text-text-muted">Previously:</span> ex-{p.previousCompany}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
