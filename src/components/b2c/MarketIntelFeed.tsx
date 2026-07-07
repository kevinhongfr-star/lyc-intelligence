import React from 'react';
import { TrendingUp, Newspaper, Briefcase, Bell } from 'lucide-react';

export interface MarketSignal {
  id: string;
  title: string;
  source: string;
  timestamp: string;
  type: 'trend' | 'news' | 'role' | 'alert';
}

interface MarketIntelFeedProps {
  signals?: MarketSignal[];
}

const DEFAULT_SIGNALS: MarketSignal[] = [
  {
    id: '1',
    title: 'VP Engineering demand up 18% in fintech across APAC',
    source: 'LinkedIn Talent Index',
    timestamp: '2h ago',
    type: 'trend',
  },
  {
    id: '2',
    title: 'TechCorp announced $40M Series C — likely leadership expansion',
    source: 'TechCrunch',
    timestamp: '6h ago',
    type: 'news',
  },
  {
    id: '3',
    title: '3 new VP Eng roles opened matching your profile',
    source: 'LYC Signal Match',
    timestamp: '1d ago',
    type: 'role',
  },
  {
    id: '4',
    title: 'Compensation benchmark for VP Eng shifted +6% this quarter',
    source: 'LYC Comp Index',
    timestamp: '2d ago',
    type: 'alert',
  },
];

const TYPE_META: Record<
  MarketSignal['type'],
  { icon: typeof TrendingUp; color: string; label: string }
> = {
  trend: { icon: TrendingUp, color: 'text-accent', label: 'Trend' },
  news: { icon: Newspaper, color: 'text-ocean-deep', label: 'News' },
  role: { icon: Briefcase, color: 'text-teal', label: 'Role' },
  alert: { icon: Bell, color: 'text-warning', label: 'Alert' },
};

export function MarketIntelFeed({ signals = DEFAULT_SIGNALS }: MarketIntelFeedProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg font-bold text-text-primary">
          Market Intelligence Feed
        </h3>
        <span className="text-xs text-text-muted">Personalized</span>
      </div>
      <div className="divide-y divide-bg-tertiary">
        {signals.map((signal) => {
          const meta = TYPE_META[signal.type];
          const Icon = meta.icon;
          return (
            <div key={signal.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-bg-secondary border border-bg-tertiary flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs uppercase tracking-wider font-semibold ${meta.color}`}>
                      {meta.label}
                    </span>
                    <span className="text-xs text-text-muted">·</span>
                    <span className="text-xs text-text-muted">{signal.timestamp}</span>
                  </div>
                  <p className="text-sm text-text-primary leading-snug">{signal.title}</p>
                  <span className="text-xs text-text-muted">{signal.source}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
