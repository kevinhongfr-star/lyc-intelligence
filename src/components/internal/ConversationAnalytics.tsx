import { MessageSquare } from 'lucide-react';

const STATS: { label: string; value: string }[] = [
  { label: 'Total Conversations', value: '847' },
  { label: 'Avg Messages / Session', value: '12.4' },
  { label: 'Satisfaction', value: '4.3/5' },
];

const TOPICS: { label: string; pct: number }[] = [
  { label: 'Career advice', pct: 32 },
  { label: 'Interview prep', pct: 24 },
  { label: 'Salary negotiation', pct: 18 },
  { label: 'Market intel', pct: 14 },
  { label: 'Other', pct: 12 },
];

export function ConversationAnalytics() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">
          CONVERSATION ANALYTICS (Last 30 days)
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {STATS.map((s) => (
          <div key={s.label} className="border border-bg-tertiary p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{s.label}</p>
            <p className="font-serif text-2xl font-bold text-text-primary">{s.value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          Top Topics
        </p>
        <div className="space-y-2">
          {TOPICS.map((t) => (
            <div key={t.label} className="flex items-center gap-3">
              <div className="w-40 text-sm text-text-secondary">{t.label}</div>
              <div className="flex-1 h-6 bg-bg-tertiary">
                <div
                  className="h-full bg-accent flex items-center justify-end pr-2"
                  style={{ width: `${t.pct}%` }}
                >
                  {t.pct >= 15 && (
                    <span className="text-[10px] font-semibold text-white">{t.pct}%</span>
                  )}
                </div>
              </div>
              {t.pct < 15 && (
                <div className="w-10 text-sm text-text-primary font-semibold text-right">
                  {t.pct}%
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
