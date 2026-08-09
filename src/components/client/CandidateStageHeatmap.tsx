/**
 * CandidateStageHeatmap — Mandate × Stage candidate count matrix (S1-T12)
 *
 * Visualizes how many candidates each mandate currently has at each pipeline
 * stage using an intensity-graded heatmap. Color intensity for each cell =
 * (count / max_cell) mapped to the fuchsia gradient. Rows are mandates
 * (ordered by total candidates desc), columns are the standard 8 stages.
 *
 * Totals are shown:
 *   - Right-hand column: total candidates per mandate
 *   - Bottom row: total candidates per stage
 *   - Bottom-right: grand total
 *
 * Props data comes from clientPortalService.fetchHeatmap() → backend
 * /api/client/heatmap (handleClientHeatmap in clientHandler.ts).
 */
import React, { useMemo } from 'react';
import type { HeatmapData } from '@/services/clientPortalService';
import { Grid3x3 as HeatmapIcon, AlertCircle } from 'lucide-react';

interface Props {
  data: HeatmapData | null;
  loading?: boolean;
  error?: string | null;
}

const STAGE_SHORT: Record<string, string> = {
  New: 'New',
  Sourcing: 'Src',
  Screening: 'Scr',
  Shortlisted: 'SL',
  Presented: 'Pres',
  Interview: 'Int',
  Offer: 'Off',
  Hired: 'Hir',
};

// Map 0..1 intensity → rgb() color (transparent → deep fuchsia).
function intensityColor(value: number): string {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  // Base color fuchsia = rgb(193, 8, 171). Light via alpha on white bg.
  const alpha = 0.05 + clamped * 0.85;
  return `rgba(193, 8, 171, ${alpha.toFixed(3)})`;
}
function textColorForIntensity(value: number): string {
  return value > 0.45 ? '#ffffff' : '#334155';
}

export function CandidateStageHeatmap({ data, loading, error }: Props) {
  const cellLookup = useMemo(() => {
    const map = new Map<string, number>();
    if (!data) return map;
    for (const r of data.rows) map.set(`${r.mandate_id}|${r.stage}`, r.count);
    return map;
  }, [data]);

  if (loading) {
    return (
      <div className="py-12 text-center text-text-muted text-sm">Loading heatmap…</div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50">
        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
      </div>
    );
  }
  if (!data || data.mandates.length === 0) {
    return (
      <div className="py-12 text-center text-text-muted text-sm">
        No candidate data available for the Heatmap yet.
      </div>
    );
  }

  const maxCell = Math.max(1, data.max_cell);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <HeatmapIcon className="w-3.5 h-3.5" />
          Color intensity = candidate count relative to max ({maxCell}).
        </div>
        <div className="flex items-center gap-2 text-[10px] text-text-muted">
          <span>Low</span>
          <div className="flex h-3 w-40 border border-bg-tertiary" style={{ }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-white/30 last:border-r-0"
                style={{ backgroundColor: intensityColor((i + 1) / 10) }}
              />
            ))}
          </div>
          <span>High</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-[11px]"
          style={{ minWidth: 640 }}
        >
          <thead>
            <tr>
              <th className="text-left p-2 font-semibold text-text-secondary whitespace-nowrap bg-bg-warm border border-bg-tertiary sticky left-0 z-10"
                  style={{ minWidth: 200, maxWidth: 260 }}>
                Mandate
              </th>
              {data.stages.map(stage => (
                <th
                  key={stage}
                  className="text-center p-2 font-semibold text-text-secondary bg-bg-warm border border-bg-tertiary"
                  title={stage}
                >
                  {STAGE_SHORT[stage] ?? stage}
                </th>
              ))}
              <th className="text-right p-2 font-semibold text-text-secondary bg-bg-warm border border-bg-tertiary whitespace-nowrap">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.mandates.map((m, rowIdx) => {
              const rowTotal = data.totals_by_mandate[m.id] ?? 0;
              return (
                <tr key={m.id}>
                  <td
                    className="p-2 bg-bg-primary border border-bg-tertiary sticky left-0 z-10"
                  >
                    <div className="font-medium text-text-primary truncate" title={m.title}>
                      {m.title}
                    </div>
                    <div className="text-[10px] text-text-muted truncate" title={m.company_name ?? ''}>
                      {m.company_name ?? '—'}
                    </div>
                  </td>
                  {data.stages.map(stage => {
                    const count = cellLookup.get(`${m.id}|${stage}`) ?? 0;
                    const intensity = count / maxCell;
                    return (
                      <td
                        key={stage}
                        className="text-center p-1 border border-bg-tertiary"
                        style={{
                          backgroundColor: intensityColor(intensity),
                          color: textColorForIntensity(intensity),
                          fontWeight: count > 0 ? 600 : 400,
                        }}
                        title={`${m.title} · ${stage}: ${count}`}
                      >
                        {count > 0 ? count : '·'}
                      </td>
                    );
                  })}
                  <td className="text-right p-2 font-semibold text-text-primary bg-bg-warm border border-bg-tertiary whitespace-nowrap">
                    {rowTotal}
                  </td>
                </tr>
              );
            })}

            {/* Totals row */}
            <tr>
              <td className="p-2 font-semibold text-text-secondary bg-bg-warm border border-bg-tertiary sticky left-0 z-10">
                Stage totals
              </td>
              {data.stages.map(stage => {
                const count = data.totals_by_stage[stage] ?? 0;
                const intensity = count / maxCell;
                return (
                  <td
                    key={stage}
                    className="text-center p-1 font-semibold border border-bg-tertiary"
                    style={{
                      backgroundColor: intensityColor(intensity * 0.85),
                      color: textColorForIntensity(intensity * 0.85),
                    }}
                  >
                    {count}
                  </td>
                );
              })}
              <td className="text-right p-2 font-bold text-fuchsia bg-bg-warm border border-bg-tertiary">
                {data.total_candidates}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="text-[10px] text-text-muted">
        Stages: {data.stages.join('·')}. {data.mandates.length} mandates.
      </div>
    </div>
  );
}

export default CandidateStageHeatmap;
