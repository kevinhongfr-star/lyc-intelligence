import React from 'react';
import { History, CheckCircle2 } from 'lucide-react';

interface HistoryItem {
  id: string;
  serviceName: string;
  dateRange: string;
  provider: string;
  status: string;
}

const HISTORY_ITEMS: HistoryItem[] = [
  {
    id: '1',
    serviceName: 'Executive Coaching #1–4',
    dateRange: 'Jan – Mar 2026',
    provider: 'Emily Zhang',
    status: 'Completed',
  },
  {
    id: '2',
    serviceName: 'LinkedIn Optimization',
    dateRange: 'Dec 2025',
    provider: 'Raj Patel',
    status: 'Completed',
  },
  {
    id: '3',
    serviceName: 'CV Review',
    dateRange: 'Nov 2025',
    provider: 'Sarah Chen',
    status: 'Completed',
  },
];

export function ServiceHistory() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-3 mb-4">
        <History className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">SERVICE HISTORY</h3>
      </div>

      <div className="divide-y divide-bg-tertiary">
        {HISTORY_ITEMS.map((item) => (
          <div key={item.id} className="flex justify-between items-center p-4 first:pt-0 last:pb-0">
            <div className="flex-1 min-w-0">
              <h4 className="font-serif font-medium text-text-primary">{item.serviceName}</h4>
              <p className="text-sm text-text-muted">{item.dateRange}</p>
              <p className="text-xs text-text-muted">with {item.provider}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-teal" />
              <span className="text-teal text-sm">{item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
