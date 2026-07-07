import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

type Status = 'overdue' | 'due' | 'ontrack';

interface Stat {
  label: string;
  count: number;
  status: Status;
}

const STATS: Stat[] = [
  { label: 'Overdue', count: 3, status: 'overdue' },
  { label: 'Due This Week', count: 5, status: 'due' },
  { label: 'On Track', count: 12, status: 'ontrack' },
];

const STATUS_CLASSES: Record<Status, string> = {
  overdue: 'text-error',
  due: 'text-warning',
  ontrack: 'text-teal',
};

interface OverdueItem {
  id: string;
  title: string;
  mandate: string;
  days: number;
}

const OVERDUE_ITEMS: OverdueItem[] = [
  { id: 's1', title: 'Schedule David T. interview', mandate: 'M-028', days: 3 },
  { id: 's2', title: 'Submit shortlist M-31', mandate: 'M-31', days: 1 },
];

export function SLATracker() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">SLA TRACKER</h3>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-bg-secondary border border-bg-tertiary p-3 text-center">
            <p className={`font-serif text-2xl font-bold ${STATUS_CLASSES[s.status]}`}>
              {s.count}
            </p>
            <p className="text-xs text-text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
          Overdue Items
        </p>
        <ul className="space-y-2">
          {OVERDUE_ITEMS.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 bg-bg-secondary border border-bg-tertiary px-3 py-2"
            >
              <AlertTriangle className="w-4 h-4 text-error flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary">{item.title}</p>
                <p className="text-xs text-text-muted">{item.mandate}</p>
              </div>
              <span className="text-xs text-error font-medium whitespace-nowrap">
                {item.days}d overdue
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
