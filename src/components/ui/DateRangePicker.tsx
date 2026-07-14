import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(d1: Date | null, d2: Date | null): boolean {
  if (!d1 || !d2) return false;
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function formatDate(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Select date range',
  disabled = false,
  className = '',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(viewDate.year, viewDate.month, day);

    if (!value.from || (value.from && value.to)) {
      onChange({ from: clickedDate, to: null });
    } else {
      if (clickedDate < value.from) {
        onChange({ from: clickedDate, to: value.from });
      } else {
        onChange({ from: value.from, to: clickedDate });
      }
      setIsOpen(false);
    }
  };

  const prevMonth = () => {
    setViewDate(prev => {
      const month = prev.month - 1;
      if (month < 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month };
    });
  };

  const nextMonth = () => {
    setViewDate(prev => {
      const month = prev.month + 1;
      if (month > 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { ...prev, month };
    });
  };

  const clearRange = () => {
    onChange({ from: null, to: null });
  };

  const isInRange = (day: number): boolean => {
    const date = new Date(viewDate.year, viewDate.month, day);
    if (!value.from) return false;
    if (value.to) {
      return date >= value.from && date <= value.to;
    }
    if (hoveredDate) {
      const start = value.from < hoveredDate ? value.from : hoveredDate;
      const end = value.from < hoveredDate ? hoveredDate : value.from;
      return date >= start && date <= end;
    }
    return isSameDay(date, value.from);
  };

  const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
  const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month);
  const days: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const displayValue = value.from || value.to
    ? `${formatDate(value.from)} – ${formatDate(value.to)}`
    : '';

  const presets = [
    { label: 'Today', getRange: () => { const d = new Date(); return { from: d, to: d }; } },
    { label: 'Last 7 days', getRange: () => { const to = new Date(); const from = new Date(); from.setDate(from.getDate() - 7); return { from, to }; } },
    { label: 'Last 30 days', getRange: () => { const to = new Date(); const from = new Date(); from.setDate(from.getDate() - 30); return { from, to }; } },
    { label: 'This month', getRange: () => { const now = new Date(); const from = new Date(now.getFullYear(), now.getMonth(), 1); const to = new Date(now.getFullYear(), now.getMonth() + 1, 0); return { from, to }; } },
    { label: 'Last month', getRange: () => { const now = new Date(); const from = new Date(now.getFullYear(), now.getMonth() - 1, 1); const to = new Date(now.getFullYear(), now.getMonth(), 0); return { from, to }; } },
    { label: 'This quarter', getRange: () => { const now = new Date(); const quarter = Math.floor(now.getMonth() / 3); const from = new Date(now.getFullYear(), quarter * 3, 1); const to = new Date(now.getFullYear(), quarter * 3 + 3, 0); return { from, to }; } },
    { label: 'This year', getRange: () => { const now = new Date(); const from = new Date(now.getFullYear(), 0, 1); const to = new Date(now.getFullYear(), 11, 31); return { from, to }; } },
  ];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5 text-left text-sm
          bg-white border border-border rounded-none
          flex items-center gap-2
          transition-colors
          ${disabled ? 'opacity-60 cursor-not-allowed bg-bg-alt' : 'hover:border-primary/40 focus:outline-none focus:border-primary/40 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)]'}
        `}
      >
        <Calendar className="w-4 h-4 text-text-muted flex-shrink-0" />
        <span className={displayValue ? 'text-text-primary' : 'text-text-muted'}>
          {displayValue || placeholder}
        </span>
        {displayValue && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); clearRange(); }}
            className="ml-auto p-0.5 hover:bg-bg-alt rounded-full text-text-muted hover:text-text-secondary"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-border shadow-lg z-50 w-auto">
          <div className="flex">
            <div className="p-3 border-r border-border w-40 space-y-1">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Quick Select</p>
              {presets.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    onChange(preset.getRange());
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 text-sm text-text-primary hover:bg-bg-alt rounded-none transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 hover:bg-bg-alt text-text-muted hover:text-text-primary transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-text-primary">
                  {MONTH_NAMES[viewDate.month]} {viewDate.year}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 hover:bg-bg-alt text-text-muted hover:text-text-primary transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {DAY_NAMES.map(day => (
                  <div key={day} className="w-8 h-7 flex items-center justify-center text-xxs text-text-muted font-medium">
                    {day.charAt(0)}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {days.map((day, i) => {
                  if (day === null) {
                    return <div key={`empty-${i}`} className="w-8 h-8" />;
                  }
                  const date = new Date(viewDate.year, viewDate.month, day);
                  const isStart = isSameDay(date, value.from);
                  const isEnd = isSameDay(date, value.to);
                  const inRange = isInRange(day);
                  const isHoverStart = value.from && !value.to && hoveredDate && isSameDay(date, hoveredDate);

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayClick(day)}
                      onMouseEnter={() => setHoveredDate(date)}
                      onMouseLeave={() => setHoveredDate(null)}
                      className={`
                        w-8 h-8 text-sm flex items-center justify-center
                        transition-colors rounded-none
                        ${isStart || isEnd
                          ? 'bg-primary text-white font-medium'
                          : inRange || (isHoverStart && value.from && !value.to)
                          ? 'bg-primary/10 text-text-primary'
                          : 'text-text-primary hover:bg-bg-alt'
                        }
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DateRangePicker;
