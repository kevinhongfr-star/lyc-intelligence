import React from 'react';
import { AlertTriangle } from 'lucide-react';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface OrgNode {
  name: string;
  role: string;
  risk: RiskLevel;
  children?: OrgNode[];
}

export interface OrgRiskOverlayProps {
  root?: OrgNode;
}

const RISK_CLASSES: Record<RiskLevel, string> = {
  low: 'bg-teal text-white',
  medium: 'bg-warning text-white',
  high: 'bg-error text-white',
};

const DEFAULT_TREE: OrgNode = {
  name: 'Alex Lim',
  role: 'CEO',
  risk: 'low',
  children: [
    {
      name: 'David Tan',
      role: 'VP Engineering',
      risk: 'medium',
      children: [
        { name: 'Priya N.', role: 'Director, Platform', risk: 'low' },
        { name: 'Marc L.', role: 'Director, Data', risk: 'high' },
      ],
    },
    {
      name: 'Sarah Wong',
      role: 'VP Product',
      risk: 'high',
      children: [
        { name: 'Jin Y.', role: 'PM Lead, Core', risk: 'medium' },
        { name: 'Reza K.', role: 'PM Lead, Growth', risk: 'low' },
      ],
    },
    {
      name: 'Hassan B.',
      role: 'VP Sales',
      risk: 'medium',
      children: [
        { name: 'Lena T.', role: 'Head, Enterprise', risk: 'low' },
        { name: 'Omar F.', role: 'Head, SMB', risk: 'medium' },
      ],
    },
  ],
};

function Node({ node }: { node: OrgNode }) {
  const hasChildren = node.children && node.children.length > 0;
  return (
    <li className="relative pl-8">
      {/* vertical connector up to parent */}
      <span className="absolute left-0 top-0 bottom-0 w-px bg-bg-tertiary" aria-hidden />
      {/* horizontal connector from vertical to node */}
      <span className="absolute left-0 top-5 w-8 h-px bg-bg-tertiary" aria-hidden />
      <div
        className={`inline-flex flex-col px-3 py-2 border border-bg-tertiary ${RISK_CLASSES[node.risk]}`}
      >
        <span className="text-sm font-medium">{node.name}</span>
        <span className="text-xs opacity-90">{node.role}</span>
      </div>
      {hasChildren && (
        <ul className="mt-4 space-y-4">
          {node.children!.map((child) => (
            <Node key={`${child.role}-${child.name}`} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function OrgRiskOverlay({ root = DEFAULT_TREE }: OrgRiskOverlayProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-5">
        <AlertTriangle className="w-4 h-4 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">Org Risk Overlay</h3>
      </div>

      <ul className="space-y-4">
        {/* Root node — no connectors */}
        <li className="relative">
          <div
            className={`inline-flex flex-col px-3 py-2 border border-bg-tertiary ${RISK_CLASSES[root.risk]}`}
          >
            <span className="text-sm font-medium">{root.name}</span>
            <span className="text-xs opacity-90">{root.role}</span>
          </div>
          {root.children && root.children.length > 0 && (
            <ul className="mt-4 space-y-4">
              {root.children.map((child) => (
                <Node key={`${child.role}-${child.name}`} node={child} />
              ))}
            </ul>
          )}
        </li>
      </ul>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-bg-tertiary flex flex-wrap items-center gap-4">
        <span className="text-xs uppercase tracking-wider text-text-muted font-semibold">Legend</span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-teal" />
          <span className="text-xs text-text-secondary">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-warning" />
          <span className="text-xs text-text-secondary">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-error" />
          <span className="text-xs text-text-secondary">High</span>
        </div>
      </div>
    </div>
  );
}
