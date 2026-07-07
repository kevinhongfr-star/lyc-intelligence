import React from 'react';

export interface PeerMetric {
  dimension: string;
  user: number | string;
  peer: number | string;
  unit?: string;
}

interface PeerComparisonProps {
  metrics?: PeerMetric[];
}

const DEFAULT_METRICS: PeerMetric[] = [
  { dimension: 'Compensation', user: '$280K', peer: '$265K' },
  { dimension: 'Team Size', user: 24, peer: 31 },
  { dimension: 'Budget Authority', user: '$4.2M', peer: '$5.1M' },
  { dimension: 'Span of Control', user: 6, peer: 8 },
];

export function PeerComparison({ metrics = DEFAULT_METRICS }: PeerComparisonProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg font-bold text-text-primary">Peer Comparison</h3>
        <span className="text-xs text-text-muted">Anonymized · VP Eng cohort</span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bg-tertiary">
            <th className="text-left py-2 text-xs uppercase tracking-wider text-text-muted font-medium">
              Dimension
            </th>
            <th className="text-right py-2 text-xs uppercase tracking-wider text-text-muted font-medium">
              You
            </th>
            <th className="text-right py-2 text-xs uppercase tracking-wider text-text-muted font-medium">
              Peer Avg
            </th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => {
            const isNumeric = typeof m.user === 'number' && typeof m.peer === 'number';
            const userHigher =
              isNumeric && (m.user as number) > (m.peer as number);
            const userLower =
              isNumeric && (m.user as number) < (m.peer as number);
            return (
              <tr key={m.dimension} className="border-b border-bg-tertiary last:border-b-0">
                <td className="py-2.5 text-text-primary font-medium">{m.dimension}</td>
                <td
                  className={`py-2.5 text-right font-semibold ${
                    userHigher ? 'text-teal' : userLower ? 'text-warning' : 'text-text-primary'
                  }`}
                >
                  {m.user}
                </td>
                <td className="py-2.5 text-right text-text-secondary">{m.peer}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
