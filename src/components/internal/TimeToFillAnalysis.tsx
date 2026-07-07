import { Clock } from 'lucide-react';

interface TimeBreakdown {
  label: string;
  days: number;
}

const SENIORITY: TimeBreakdown[] = [
  { label: 'C-suite', days: 62 },
  { label: 'VP', days: 45 },
  { label: 'Director', days: 38 },
];

const INDUSTRY: TimeBreakdown[] = [
  { label: 'Fintech', days: 52 },
  { label: 'SaaS', days: 41 },
  { label: 'Other', days: 44 },
];

function BarRow({ item, max }: { item: TimeBreakdown; max: number }) {
  const widthPct = (item.days / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-sm text-text-secondary">{item.label}</div>
      <div className="flex-1 h-6 bg-bg-tertiary relative">
        <div className="h-full bg-accent" style={{ width: `${widthPct}%` }} />
      </div>
      <div className="w-14 text-sm text-text-primary font-semibold text-right">{item.days}d</div>
    </div>
  );
}

export function TimeToFillAnalysis() {
  const seniorityMax = Math.max(...SENIORITY.map((s) => s.days));
  const industryMax = Math.max(...INDUSTRY.map((s) => s.days));

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">TIME TO FILL</h3>
      </div>

      <div className="flex items-baseline gap-2 mb-6 pb-4 border-b border-bg-tertiary">
        <span className="font-serif text-4xl font-bold text-text-primary">47</span>
        <span className="text-sm text-text-muted">days average time to fill</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            By Seniority
          </p>
          <div className="space-y-2">
            {SENIORITY.map((s) => (
              <BarRow key={s.label} item={s} max={seniorityMax} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            By Industry
          </p>
          <div className="space-y-2">
            {INDUSTRY.map((s) => (
              <BarRow key={s.label} item={s} max={industryMax} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
