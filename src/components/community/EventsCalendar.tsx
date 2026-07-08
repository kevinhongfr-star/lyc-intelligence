import React, { useState } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { MOCK_EVENTS, CommunityEvent } from '@/mocks/advancedFeatures';

const EVENT_TYPE_COLORS: Record<string, string> = {
  webinar: '#C108AB',
  networking: '#2563EB',
  workshop: '#D97706',
  job_fair: '#16A34A',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  webinar: 'Webinar',
  networking: 'Networking',
  workshop: 'Workshop',
  job_fair: 'Job Fair',
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function EventsCalendar() {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(0); // January = 0
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);

  // Map events to their day-of-month for the current month
  const eventsByDay: Record<number, CommunityEvent[]> = {};
  MOCK_EVENTS.forEach((event) => {
    const d = new Date(event.date);
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(event);
    }
  });

  const selectedEvents = selectedDate ? (eventsByDay[selectedDate] || []) : [];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <h3 className="font-serif font-semibold text-lg text-text-primary">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (currentMonth === 0) {
                setCurrentMonth(11);
                setCurrentYear(currentYear - 1);
              } else {
                setCurrentMonth(currentMonth - 1);
              }
              setSelectedDate(null);
            }}
            className="px-3 py-1 text-sm border border-bg-tertiary text-text-muted hover:bg-bg-tertiary"
            style={{ borderRadius: 0, background: 'none', cursor: 'pointer' }}
          >
            Prev
          </button>
          <button
            onClick={() => {
              if (currentMonth === 11) {
                setCurrentMonth(0);
                setCurrentYear(currentYear + 1);
              } else {
                setCurrentMonth(currentMonth + 1);
              }
              setSelectedDate(null);
            }}
            className="px-3 py-1 text-sm border border-bg-tertiary text-text-muted hover:bg-bg-tertiary"
            style={{ borderRadius: 0, background: 'none', cursor: 'pointer' }}
          >
            Next
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="border border-bg-tertiary bg-bg-secondary" style={{ borderRadius: 0 }}>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-bg-tertiary">
          {weekDays.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-medium text-text-muted"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[64px] border-b border-r border-bg-tertiary" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = eventsByDay[day] || [];
            const isSelected = selectedDate === day;

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(day === selectedDate ? null : day)}
                className="min-h-[64px] p-1.5 text-left border-b border-r border-bg-tertiary transition-colors"
                style={{
                  borderRadius: 0,
                  background: isSelected ? '#C108AB10' : 'transparent',
                  border: isSelected ? '1px solid #C108AB' : undefined,
                  cursor: 'pointer',
                }}
              >
                <span
                  className="text-xs font-medium"
                  style={{ color: isSelected ? '#C108AB' : '#666666' }}
                >
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {dayEvents.map((ev) => (
                      <span
                        key={ev.id}
                        className="w-2 h-2 inline-block"
                        style={{ borderRadius: 0, background: EVENT_TYPE_COLORS[ev.type] }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-text-muted">
        {Object.entries(EVENT_TYPE_LABELS).map(([type, label]) => (
          <span key={type} className="inline-flex items-center gap-1.5">
            <span
              className="w-3 h-3 inline-block"
              style={{ borderRadius: 0, background: EVENT_TYPE_COLORS[type] }}
            />
            {label}
          </span>
        ))}
      </div>

      {/* Selected date event details */}
      {selectedDate && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-text-primary">
            Events on {monthNames[currentMonth]} {selectedDate}
          </h4>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-text-muted">No events on this date.</p>
          ) : (
            selectedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: CommunityEvent }) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-4" style={{ borderRadius: 0 }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-serif font-semibold text-sm text-text-primary">{event.title}</h4>
            <span
              className="px-1.5 py-0.5 text-[10px] font-semibold text-white"
              style={{ borderRadius: 0, background: EVENT_TYPE_COLORS[event.type] }}
            >
              {EVENT_TYPE_LABELS[event.type]}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1">
              <Calendar style={{ width: 12, height: 12 }} />
              {event.date} at {event.time}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin style={{ width: 12, height: 12 }} />
              {event.location}
            </span>
          </div>
          <p className="mt-2 text-xs text-text-muted leading-relaxed">{event.description}</p>
          <p className="mt-1 text-xs text-text-muted">
            {event.attendees}/{event.maxAttendees} attendees
          </p>
        </div>
        <button
          className="shrink-0 px-3 py-1.5 text-xs font-medium"
          style={{
            borderRadius: 0,
            background: event.isRegistered ? '#E5E5E5' : '#C108AB',
            color: event.isRegistered ? '#666666' : '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {event.isRegistered ? 'Registered' : 'Register'}
        </button>
      </div>
    </div>
  );
}

export default EventsCalendar;
