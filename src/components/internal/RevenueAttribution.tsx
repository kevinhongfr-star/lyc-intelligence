import { DollarSign } from 'lucide-react';

interface RevenueRow {
  consultant: string;
  revenue: number;
}

const CONSULTANTS: RevenueRow[] = [
  { consultant: 'Kevin Hong', revenue: 840 },
  { consultant: 'Claire Jin', revenue: 520 },
  { consultant: 'Marcus / AI', revenue: 210 },
];

const MANDATE_TYPES: { label: string; pct: number }[] = [
  { label: 'Executive Search', pct: 65 },
  { label: 'Advisory', pct: 20 },
  { label: 'Interim', pct: 15 },
];

const MAX_REVENUE = Math.max(...CONSULTANTS.map((c) => c.revenue));

export function RevenueAttribution() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">REVENUE ATTRIBUTION</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by consultant */}
        <div className="lg:col-span-2">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            By Consultant
          </p>
          <div className="space-y-3">
            {CONSULTANTS.map((c) => {
              const widthPct = (c.revenue / MAX_REVENUE) * 100;
              return (
                <div key={c.consultant} className="flex items-center gap-3">
                  <div className="w-28 text-sm text-text-secondary">{c.consultant}</div>
                  <div className="flex-1 h-8 bg-bg-tertiary relative">
                    <div
                      className="h-full bg-accent flex items-center justify-end pr-2"
                      style={{ width: `${widthPct}%` }}
                    >
                      {widthPct > 18 && (
                        <span className="text-[11px] font-semibold text-white">${c.revenue}K</span>
                      )}
                    </div>
                    {widthPct <= 18 && (
                      <span className="absolute top-1/2 -translate-y-1/2 right-2 text-[11px] font-semibold text-text-primary">
                        ${c.revenue}K
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By mandate type */}
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            By Mandate Type
          </p>
          <div className="space-y-3">
            {MANDATE_TYPES.map((m) => (
              <div key={m.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-text-secondary">{m.label}</span>
                  <span className="text-text-primary font-semibold">{m.pct}%</span>
                </div>
                <div className="h-2 bg-bg-tertiary">
                  <div className="h-full bg-accent" style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
