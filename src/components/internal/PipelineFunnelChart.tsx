import { Filter } from 'lucide-react';

interface FunnelStage {
  label: string;
  count: number;
}

const STAGES: FunnelStage[] = [
  { label: 'Sourced', count: 247 },
  { label: 'SWEEP', count: 89 },
  { label: 'CANVA', count: 45 },
  { label: 'GRID', count: 23 },
  { label: 'LENS', count: 12 },
  { label: 'PLACED', count: 8 },
];

const MAX_COUNT = STAGES[0].count;

export function PipelineFunnelChart() {
  const overallConversion = ((STAGES[STAGES.length - 1].count / STAGES[0].count) * 100).toFixed(1);

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-accent" />
          <h3 className="font-serif text-lg font-bold text-text-primary">
            PIPELINE FUNNEL (All Mandates YTD)
          </h3>
        </div>
        <span className="text-xs text-text-muted">
          Overall conversion: <span className="text-accent font-semibold">{overallConversion}%</span>
        </span>
      </div>

      <div className="space-y-1">
        {STAGES.map((stage, idx) => {
          const widthPct = (stage.count / MAX_COUNT) * 100;
          const prevCount = idx > 0 ? STAGES[idx - 1].count : null;
          const convPct =
            prevCount !== null ? Math.round((stage.count / prevCount) * 100) : null;

          return (
            <div key={stage.label}>
              {convPct !== null && (
                <div className="text-[11px] text-text-muted py-1 pl-1">
                  ↓ {convPct}% conv
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-20 text-sm text-text-secondary font-medium">{stage.label}</div>
                <div className="flex-1 h-8 bg-bg-tertiary relative">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <div className="w-12 text-sm text-text-primary font-semibold text-right">
                  {stage.count}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
