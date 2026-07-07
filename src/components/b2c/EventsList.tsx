import React from 'react';
import { Calendar } from 'lucide-react';

export interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  type: 'webinar' | 'roundtable' | 'workshop';
}

interface EventsListProps {
  events?: Event[];
}

const DEFAULT_EVENTS: Event[] = [
  {
    id: '1',
    title: 'AI in Executive Search',
    date: 'Jul 15',
    time: '14:00',
    location: 'Virtual',
    type: 'webinar',
  },
  {
    id: '2',
    title: 'C-suite Career Transitions',
    date: 'Jul 22',
    location: 'Singapore (in-person)',
    type: 'roundtable',
  },
  {
    id: '3',
    title: 'Board Readiness',
    date: 'Aug 5',
    location: 'Virtual',
    type: 'workshop',
  },
];

const TYPE_LABELS: Record<Event['type'], string> = {
  webinar: 'Webinar',
  roundtable: 'Roundtable',
  workshop: 'Workshop',
};

export function EventsList({ events = DEFAULT_EVENTS }: EventsListProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">
          UPCOMING EVENTS
        </h3>
      </div>
      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="border border-bg-tertiary p-4 bg-bg-secondary"
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider text-text-muted mb-1">
                  {TYPE_LABELS[event.type]}
                </p>
                <h4 className="font-medium text-text-primary">{event.title}</h4>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-sm text-text-secondary">
                {event.date}
                {event.time ? `, ${event.time}` : ''}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">{event.location}</span>
              <button className="border border-accent text-accent px-3 py-1 text-sm hover:bg-accent hover:text-white transition-colors">
                RSVP
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
