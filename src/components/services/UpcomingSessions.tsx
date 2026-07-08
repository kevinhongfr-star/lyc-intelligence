import React, { useState, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { MOCK_UPCOMING_SESSIONS } from '@/mocks/advancedFeatures';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function UpcomingSessions() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Use the month of the first upcoming session, or current month
  const referenceDate = useMemo(() => {
    if (MOCK_UPCOMING_SESSIONS.length > 0) {
      return new Date(MOCK_UPCOMING_SESSIONS[0].date);
    }
    return new Date();
  }, []);

  const [viewYear, setViewYear] = useState(referenceDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(referenceDate.getMonth());

  const sessionDates = useMemo(() => {
    const map = new Map<string, typeof MOCK_UPCOMING_SESSIONS>();
    for (const s of MOCK_UPCOMING_SESSIONS) {
      const key = s.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, []);

  // Calendar grid calculation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [viewYear, viewMonth]);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  function pad(n: number) {
    return n < 10 ? `0${n}` : `${n}`;
  }

  function dateKey(day: number) {
    return `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
  }

  const selectedSessions = selectedDate ? sessionDates.get(selectedDate) ?? [] : [];

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="px-2 py-1 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          &#8249;
        </button>
        <h3 className="font-serif font-semibold text-base text-text-primary">{monthLabel}</h3>
        <button
          onClick={nextMonth}
          className="px-2 py-1 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          &#8250;
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-xs font-medium text-text-muted py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />;
          }
          const key = dateKey(day);
          const hasSession = sessionDates.has(key);
          const isSelected = selectedDate === key;

          return (
            <button
              key={key}
              onClick={() => setSelectedDate(isSelected ? null : key)}
              className={`relative p-2 text-sm transition-colors ${
                isSelected
                  ? 'bg-[#C108AB] text-white'
                  : hasSession
                    ? 'bg-accent-10 text-text-primary font-medium'
                    : 'text-text-secondary hover:bg-bg-secondary'
              }`}
              style={{ borderRadius: 0 }}
            >
              {day}
              {hasSession && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#C108AB]" style={{ borderRadius: 0 }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day details */}
      {selectedDate && (
        <div className="border-t border-bg-tertiary pt-4 space-y-2">
          <h4 className="text-sm font-medium text-text-primary flex items-center gap-2">
            <Calendar className="w-4 h-4 text-text-muted" />
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h4>
          {selectedSessions.length > 0 ? (
            selectedSessions.map((s) => (
              <div
                key={s.id}
                className="p-3 bg-bg-secondary flex items-center justify-between"
                style={{ borderRadius: 0 }}
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">{s.serviceName}</p>
                  <p className="text-xs text-text-muted">
                    {s.time} with {s.providerName}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 text-xs font-medium ${
                    s.status === 'confirmed'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  {s.status}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-text-muted">No sessions on this day.</p>
          )}
        </div>
      )}
    </div>
  );
}
