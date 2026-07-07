import React from 'react';
import { GitBranch } from 'lucide-react';

export interface SuccessionRole {
  role: string;
  ready: number;
  /** Candidates expected to be ready within 12 months. */
  inPipeline: number;
}

export interface SuccessionGapProps {
  roles?: SuccessionRole[];
}

const DEFAULT_ROLES: SuccessionRole[] = [
  { role: 'VP Engineering', ready: 1, inPipeline: 2 },
  { role: 'VP Product', ready: 0, inPipeline: 1 },
  { role: 'VP Sales', ready: 0, inPipeline: 0 },
  { role: 'CTO', ready: 2, inPipeline: 1 },
];

function dotClass(role: SuccessionRole): string {
  if (role.ready >= 1) return 'bg-teal';
  if (role.inPipeline >= 1) return 'bg-warning';
  return 'bg-error';
}

function statusLabel(role: SuccessionRole): string {
  if (role.ready >= 1) return 'Covered';
  if (role.inPipeline >= 1) return 'Gap — 12mo candidate';
  return 'Critical gap';
}

export function SuccessionGap({ roles = DEFAULT_ROLES }: SuccessionGapProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-5">
        <GitBranch className="w-4 h-4 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">Succession Gaps</h3>
      </div>

      <ul className="divide-y divide-bg-tertiary">
        {roles.map((r) => (
          <li
            key={r.role}
            className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className={`w-3 h-3 shrink-0 ${dotClass(r)}`} />
              <div className="min-w-0">
                <div className="font-serif text-text-primary font-medium truncate">{r.role}</div>
                <div className="text-xs text-text-muted">{statusLabel(r)}</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-bold text-text-primary tabular-nums">
                {r.ready} ready / {r.inPipeline} in pipeline
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
