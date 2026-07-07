import React, { useState } from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_IN_MONTH = 31;
const START_DAY_INDEX = 2;
const TODAY = 10;

const TIME_SLOTS = ['9:00 AM', '10:30 AM', '2:00 PM', '3:30 PM'];

function isAvailableDay(day: number): boolean {
  const dayOfWeek = (START_DAY_INDEX + day - 1) % 7;
  return dayOfWeek === 0 || dayOfWeek === 2 || dayOfWeek === 4;
}

function isWeekend(day: number): boolean {
  const dayOfWeek = (START_DAY_INDEX + day - 1) % 7;
  return dayOfWeek === 5 || dayOfWeek === 6;
}

export function BookingCalendar() {
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const totalCells = START_DAY_INDEX + DAYS_IN_MONTH;
  const rows = Math.ceil(totalCells / 7);

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      setConfirmed(true);
    }
  };

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-3 mb-1">
        <Calendar className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">BOOKING CALENDAR</h3>
      </div>
      <p className="text-sm text-text-muted mb-4 ml-8">Select a date and time for your session</p>

      {confirmed ? (
        <div className="flex items-center gap-3 p-4 bg-accent-10">
          <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
          <p className="text-sm text-text-primary">
            Booking confirmed! Check your email for details.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="h-8 flex items-center justify-center text-xs text-text-muted"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {Array.from({ length: rows * 7 }, (_, i) => {
              const day = i - START_DAY_INDEX + 1;
              const isEmpty = day < 1 || day > DAYS_IN_MONTH;
              const weekend = !isEmpty && isWeekend(day);
              const available = !isEmpty && isAvailableDay(day);
              const isToday = day === TODAY;
              const isSelected = day === selectedDate;

              return (
                <div
                  key={i}
                  className={`h-10 w-full flex items-center justify-center text-sm ${
                    isEmpty
                      ? ''
                      : weekend
                      ? 'text-text-muted opacity-50'
                      : available
                      ? 'hover:bg-accent-10 cursor-pointer'
                      : 'text-text-muted'
                  } ${isToday ? 'bg-accent text-white' : ''} ${
                    isSelected && !isToday ? 'bg-accent text-white' : ''
                  }`}
                  onClick={() => {
                    if (!isEmpty && available) {
                      setSelectedDate(day);
                      setConfirmed(false);
                    }
                  }}
                >
                  {isEmpty ? '' : day}
                </div>
              );
            })}
          </div>

          <div className="mb-3">
            <div className="text-xs text-text-muted mb-2">Available time slots</div>
            <div className="flex flex-wrap gap-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  className={`px-3 py-1.5 text-sm border transition-colors ${
                    selectedTime === slot
                      ? 'bg-accent text-white border-accent'
                      : 'bg-bg-primary border-bg-tertiary text-text-secondary hover:border-accent hover:text-accent'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime}
            className="bg-accent text-white w-full py-2 text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Booking
          </button>
        </>
      )}
    </div>
  );
}
