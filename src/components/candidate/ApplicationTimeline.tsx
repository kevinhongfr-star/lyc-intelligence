import React from 'react';
import { Clock } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  date: string;
  event: string;
}

const TIMELINES: Record<string, TimelineEvent[]> = {
  '1': [
    { id: '1', date: 'Jul 1', event: 'Application submitted' },
    { id: '2', date: 'Jul 2', event: 'Screening call with consultant' },
    { id: '3', date: 'Jul 4', event: 'Advanced to interview stage' },
    { id: '4', date: 'Jul 7', event: 'Technical interview scheduled — 10:00 AM' },
  ],
  '2': [
    { id: '1', date: 'Jul 3', event: 'Application submitted' },
    { id: '2', date: 'Jul 5', event: 'Profile reviewed by consultant' },
    { id: '3', date: 'Jul 6', event: 'Advanced to screening' },
  ],
  '3': [
    { id: '1', date: 'Jun 10', event: 'Application submitted' },
    { id: '2', date: 'Jun 14', event: 'Screening completed' },
    { id: '3', date: 'Jun 20', event: 'Interviews completed' },
    { id: '4', date: 'Jun 28', event: 'Offer extended' },
    { id: '5', date: 'Jul 1', event: 'Offer accepted — placed' },
  ],
};

const DEFAULT_TIMELINE: TimelineEvent[] = TIMELINES['1'];

interface ApplicationTimelineProps {
  applicationId?: string;
}

export function ApplicationTimeline({ applicationId }: ApplicationTimelineProps) {
  const events = (applicationId && TIMELINES[applicationId]) || DEFAULT_TIMELINE;

  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-accent" />
        <h2 className="font-serif text-lg font-bold text-text-primary">Timeline</h2>
      </div>
      <div className="relative">
        <div className="absolute left-2 top-0 bottom-0 w-px bg-bg-tertiary" />
        <div className="space-y-5">
          {events.map((ev) => (
            <div key={ev.id} className="flex items-start gap-4 relative">
              <div className="z-10 mt-1 w-3 h-3 bg-accent shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-text-primary">{ev.event}</p>
                <p className="text-xs text-text-muted mt-0.5">{ev.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
