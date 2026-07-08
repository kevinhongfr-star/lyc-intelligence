import React, { useState } from 'react';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { MOCK_EVENTS, type CommunityEvent } from '@/mocks/advancedFeatures';
import { Button, Badge } from '@/components/ui';

const TYPE_LABELS: Record<string, string> = {
  job_fair: 'Job Fair',
  networking: 'Networking',
};

const TYPE_VARIANTS: Record<string, 'default' | 'success'> = {
  job_fair: 'default',
  networking: 'success',
};

export default function CandidateEvents() {
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(
    new Set(MOCK_EVENTS.filter((e) => e.isRegistered).map((e) => e.id))
  );

  const filteredEvents = MOCK_EVENTS.filter(
    (e) => e.type === 'job_fair' || e.type === 'networking'
  );

  const handleRegister = (eventId: string) => {
    setRegisteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {filteredEvents.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          No events available at this time.
        </div>
      )}

      {filteredEvents.map((event) => {
        const isRegistered = registeredIds.has(event.id);
        return (
          <div
            key={event.id}
            className="bg-bg-primary border border-bg-tertiary p-5"
            style={{ borderRadius: 0 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={TYPE_VARIANTS[event.type] || 'default'}>
                    {TYPE_LABELS[event.type] || event.type}
                  </Badge>
                  {isRegistered && (
                    <Badge variant="success">Registered</Badge>
                  )}
                </div>
                <h3 className="font-serif font-semibold text-text-primary text-lg mb-1">
                  {event.title}
                </h3>
                <p className="text-sm text-text-muted mb-3">{event.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {event.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {event.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {event.attendees}/{event.maxAttendees} attendees
                  </span>
                </div>
              </div>
              <Button
                variant={isRegistered ? 'outline' : 'default'}
                size="sm"
                onClick={() => handleRegister(event.id)}
                style={{ borderRadius: 0 }}
              >
                {isRegistered ? 'Registered' : 'Register'}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
