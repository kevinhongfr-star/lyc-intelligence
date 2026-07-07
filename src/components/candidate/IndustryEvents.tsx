import React from 'react';
import { Calendar, MapPin } from 'lucide-react';

interface IndustryEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  format: 'In-person' | 'Online';
}

const MOCK_EVENTS: IndustryEvent[] = [
  { id: '1', title: 'Tech Leadership Summit', date: 'Jul 20', location: 'Singapore', format: 'In-person' },
  { id: '2', title: 'VP/C-Level Networking', date: 'Aug 3', location: 'Shanghai', format: 'In-person' },
  { id: '3', title: 'AI in Enterprise Conference', date: 'Aug 15', location: 'Virtual', format: 'Online' },
];

export function IndustryEvents() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">INDUSTRY EVENTS</h3>
      </div>

      <div className="space-y-3">
        {MOCK_EVENTS.map((event) => (
          <div
            key={event.id}
            className="flex items-center justify-between gap-4 p-4 bg-bg-secondary border border-bg-tertiary"
          >
            <div className="min-w-0">
              <div className="font-medium text-text-primary">{event.title}</div>
              <div className="flex items-center gap-4 mt-1 text-sm text-text-muted">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {event.date}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </span>
              </div>
              <div className="mt-2">
                <span
                  className={`text-xs px-2 py-0.5 ${
                    event.format === 'In-person' ? 'bg-accent-10 text-accent' : 'text-teal'
                  }`}
                  style={
                    event.format === 'Online'
                      ? { backgroundColor: 'rgba(0,137,123,0.1)' }
                      : undefined
                  }
                >
                  {event.format}
                </span>
              </div>
            </div>
            <button className="text-accent text-sm border border-accent px-3 py-1 hover:bg-accent hover:text-white transition-colors flex-shrink-0">
              Register
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
