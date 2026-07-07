import React from 'react';
import { Calendar } from 'lucide-react';

export type EventType = 'Interview' | 'Assessment' | 'Match';

export interface EventItem {
  id: string;
  type: EventType;
  title: string;
  date: string;
}

const MOCK_EVENTS: EventItem[] = [
  { id: '1', type: 'Interview', title: 'VP Eng — TechCorp', date: 'Jul 7, 10:00 AM' },
  { id: '2', type: 'Assessment', title: 'Technical Review', date: 'Jul 10' },
  { id: '3', type: 'Match', title: 'NeoBank CTO — 92% fit', date: 'New' },
];

const TYPE_STYLE: Record<EventType, string> = {
  Interview: 'bg-accent text-white',
  Assessment: 'bg-warning text-white',
  Match: 'bg-teal text-white',
};

interface UpcomingEventsProps {
  events?: EventItem[];
}

export function UpcomingEvents({ events = MOCK_EVENTS }: UpcomingEventsProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-accent" />
        <h2 className="font-serif text-lg font-bold text-text-primary">Upcoming</h2>
      </div>

      <div className="divide-y divide-bg-tertiary">
        {events.map((ev) => (
          <div key={ev.id} className="flex items-center justify-between py-3 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`px-2 py-1 text-xs font-medium ${TYPE_STYLE[ev.type]}`}>
                {ev.type}
              </span>
              <span className="text-sm text-text-primary truncate">{ev.title}</span>
            </div>
            <span className="text-xs text-text-muted whitespace-nowrap">{ev.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
