import React from 'react';
import { Shield, Check, Minus } from 'lucide-react';

const ROLES = [
  'admin',
  'consultant',
  'manager',
  'analyst',
  'client',
  'candidate',
  'leader',
  'viewer',
] as const;

const PERMISSIONS = [
  'View Dashboard',
  'Manage Mandates',
  'Score Candidates',
  'View Reports',
  'Manage Team',
  'Admin Settings',
] as const;

// Rows = roles, cols = permissions (order matches PERMISSIONS).
// admin = all checks; viewer = mostly dashes; others mixed.
const MATRIX: Record<string, boolean[]> = {
  admin: [true, true, true, true, true, true],
  consultant: [true, true, true, true, false, false],
  manager: [true, true, false, true, true, false],
  analyst: [true, false, true, true, false, false],
  client: [true, false, false, true, false, false],
  candidate: [true, false, false, false, false, false],
  leader: [true, true, false, true, true, false],
  viewer: [true, false, false, false, false, false],
};

export function RBACManagement() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-5">
        <Shield className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">ROLE-BASED ACCESS CONTROL</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-bg-tertiary">
              <th className="text-left py-3 px-3 font-medium text-text-muted">Role</th>
              {PERMISSIONS.map((p) => (
                <th key={p} className="text-center py-3 px-3 font-medium text-text-muted">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLES.map((role) => (
              <tr key={role} className="border-b border-bg-tertiary last:border-b-0">
                <td className="py-3 px-3 font-medium text-text-primary capitalize">{role}</td>
                {MATRIX[role].map((allowed, i) => (
                  <td key={i} className="py-3 px-3 text-center">
                    {allowed ? (
                      <Check className="w-4 h-4 text-teal inline-block" />
                    ) : (
                      <Minus className="w-4 h-4 text-text-muted inline-block" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
