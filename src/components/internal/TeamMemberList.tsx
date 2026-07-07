import React from 'react';
import { Users } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  activeMandates: number | string;
  placedYTD: number | string;
}

const MOCK_MEMBERS: TeamMember[] = [
  { name: 'Kevin Hong', role: 'Partner', activeMandates: 5, placedYTD: 12 },
  { name: 'Claire Jin', role: 'Sr. Consultant', activeMandates: 4, placedYTD: 8 },
  { name: 'Marcus/AI', role: 'Consultant', activeMandates: 8, placedYTD: 3 },
  { name: 'Alessio/AI', role: 'Researcher', activeMandates: 6, placedYTD: '—' },
];

export function TeamMemberList() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-5">
        <Users className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">TEAM MEMBERS</h3>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bg-tertiary text-text-muted text-xs uppercase tracking-wider">
            <th className="text-left py-2 pr-3 font-medium">Name</th>
            <th className="text-left py-2 px-3 font-medium">Role</th>
            <th className="text-right py-2 px-3 font-medium">Active Mandates</th>
            <th className="text-right py-2 pl-3 font-medium">Placed YTD</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_MEMBERS.map((m) => (
            <tr key={m.name} className="border-b border-bg-tertiary">
              <td className="py-3 pr-3 text-text-primary font-medium">{m.name}</td>
              <td className="py-3 px-3 text-text-secondary">{m.role}</td>
              <td className="py-3 px-3 text-right text-text-secondary">{m.activeMandates}</td>
              <td className="py-3 pl-3 text-right text-text-secondary">{m.placedYTD}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
