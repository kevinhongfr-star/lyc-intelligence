import React from 'react';
import { CalendarClock, Check } from 'lucide-react';

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
  isToday?: boolean;
  isDeadline?: boolean;
  countdown?: string;
}

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'received',
    date: 'Jul 8',
    title: 'Offers received',
    description: 'Both NeoBank and TechCorp extended offers.',
  },
  {
    id: 'today',
    date: 'Jul 10',
    title: 'Today',
    description: 'Review and compare your offers.',
    isToday: true,
  },
  {
    id: 'deadline-a',
    date: 'Jul 15',
    title: 'Decision deadline — Offer A',
    description: 'NeoBank CTO offer expires.',
    isDeadline: true,
    countdown: '5 days to Offer A deadline',
  },
  {
    id: 'deadline-b',
    date: 'Jul 20',
    title: 'Decision deadline — Offer B',
    description: 'TechCorp VP Engineering offer expires.',
    isDeadline: true,
    countdown: '10 days to Offer B deadline',
  },
];

interface DecisionTimelineProps {
  events?: TimelineEvent[];
}

export function DecisionTimeline({ events = TIMELINE_EVENTS }: DecisionTimelineProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock className="w-4 h-4 text-accent" />
        <h2 className="font-serif text-lg font-bold text-text-primary">
          DECISION TIMELINE
        </h2>
      </div>

      <div className="relative pl-6">
        <div className="absolute left-2 top-1 bottom-1 w-px bg-bg-tertiary" />

        <ul className="space-y-5">
          {events.map((event) => (
            <li key={event.id} className="relative">
              <span
                className={`absolute -left-[18px] top-1 w-3 h-3 ${
                  event.isToday ? 'bg-accent' : 'bg-bg-tertiary border border-text-muted'
                }`}
              />

              <div
                className={`p-3 ${
                  event.isToday ? 'bg-accent text-white' : 'bg-bg-secondary'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {event.isToday && <Check className="w-3.5 h-3.5" />}
                      <h3
                        className={`font-serif text-sm font-bold ${
                          event.isToday ? 'text-white' : 'text-text-primary'
                        }`}
                      >
                        {event.title}
                      </h3>
                    </div>
                    {event.description && (
                      <p
                        className={`text-xs mt-1 ${
                          event.isToday ? 'text-white' : 'text-text-muted'
                        }`}
                      >
                        {event.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs whitespace-nowrap ${
                      event.isToday ? 'text-white' : 'text-text-muted'
                    }`}
                  >
                    {event.date}
                  </span>
                </div>

                {event.countdown && (
                  <p
                    className={`text-xs mt-2 font-medium ${
                      event.isToday ? 'text-white' : 'text-accent'
                    }`}
                  >
                    {event.countdown}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
