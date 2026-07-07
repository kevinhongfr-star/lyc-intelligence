import React from 'react';
import { ChevronRight, AlertTriangle } from 'lucide-react';

interface OrgNode {
  role: string;
  name: string;
  risk: 'low' | 'medium' | 'high';
  candidates?: number;
}

interface OrgChartData {
  company: string;
  nodes: OrgNode[];
}

interface ClientOrgChartProps {
  orgChart: OrgChartData;
}

const RISK_COLORS: Record<string, string> = {
  low: 'text-teal',
  medium: 'text-warning',
  high: 'text-error',
};

export function ClientOrgChart({ orgChart }: ClientOrgChartProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-6">
      <h2 className="font-serif text-lg font-bold text-text-primary mb-4">
        Your Organization — {orgChart.company}
      </h2>
      
      <div className="space-y-2">
        {orgChart.nodes.map((node, index) => (
          <div
            key={node.role}
            className="flex items-center gap-3 p-3 bg-bg-primary border border-bg-tertiary"
          >
            <ChevronRight className="w-4 h-4 text-text-muted" />
            <div className="flex-1">
              <p className="font-medium text-text-primary">{node.role}</p>
              <p className="text-sm text-text-muted">{node.name}</p>
            </div>
            <div className="flex items-center gap-2">
              {node.risk !== 'low' && (
                <AlertTriangle className={`w-4 h-4 ${RISK_COLORS[node.risk]}`} />
              )}
              {node.candidates && (
                <span className="text-xs text-accent font-medium">{node.candidates} candidates presented</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}