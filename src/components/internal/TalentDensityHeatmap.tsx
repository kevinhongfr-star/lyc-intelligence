import React from 'react';
import { Flame } from 'lucide-react';

const REGIONS = ['SG', 'SH', 'JK', 'BK', 'MN'];
const SENIORITY = ['IC', 'Senior', 'Manager', 'Director', 'VP+'];

// Deterministic intensity matrix (0.2–0.9) — region × seniority.
const MATRIX: number[][] = [
  [0.9, 0.8, 0.7, 0.5, 0.3],
  [0.8, 0.7, 0.6, 0.4, 0.3],
  [0.7, 0.6, 0.5, 0.4, 0.2],
  [0.5, 0.4, 0.4, 0.3, 0.2],
  [0.4, 0.3, 0.3, 0.2, 0.2],
];

const LEGEND = [0.2, 0.4, 0.6, 0.8, 0.9];

export function TalentDensityHeatmap() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">TALENT DENSITY HEATMAP</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="w-12" />
              {SENIORITY.map((s) => (
                <th
                  key={s}
                  className="text-xs font-medium text-text-muted uppercase tracking-wide px-2 pb-2 text-center"
                >
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REGIONS.map((region, rIdx) => (
              <tr key={region}>
                <td className="text-xs font-semibold text-text-secondary uppercase tracking-wide pr-3 py-1 text-right">
                  {region}
                </td>
                {MATRIX[rIdx].map((intensity, cIdx) => (
                  <td key={cIdx} className="p-0.5">
                    <div
                      className="w-14 h-10 flex items-center justify-center"
                      style={{ backgroundColor: `rgba(193, 8, 171, ${intensity})` }}
                      title={`${region} / ${SENIORITY[cIdx]} — ${Math.round(intensity * 100)}`}
                    >
                      <span className="text-[10px] font-semibold text-white">
                        {Math.round(intensity * 100)}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <span className="text-xs text-text-muted">low</span>
        {LEGEND.map((v) => (
          <div
            key={v}
            className="w-6 h-4"
            style={{ backgroundColor: `rgba(193, 8, 171, ${v})` }}
          />
        ))}
        <span className="text-xs text-text-muted">high</span>
      </div>
    </div>
  );
}
