// Phase 3.12: SLA Countdown Component
'use client';

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface SLACountdownProps {
  targetDate: string;
  label?: string;
  size?: 'small' | 'medium' | 'large';
}

export function SLACountdown({ targetDate, label = 'Target Date', size = 'medium' }: SLACountdownProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = new Date(targetDate).getTime() - new Date().getTime();

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, overdue: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      overdue: false,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const isUrgent = !timeLeft.overdue && timeLeft.days <= 3;
  const isCritical = !timeLeft.overdue && timeLeft.days <= 1;

  const sizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  const digitSizeClasses = {
    small: 'text-2xl',
    medium: 'text-4xl',
    large: 'text-5xl',
  };

  return (
    <div className={`${sizeClasses[size]} p-4 rounded-xl ${
      timeLeft.overdue ? 'bg-red-50 border border-red-200' :
      isCritical ? 'bg-amber-50 border border-amber-200' :
      isUrgent ? 'bg-yellow-50 border border-yellow-200' :
      'bg-bg-alt border border-border'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        {timeLeft.overdue || isCritical ? (
          <AlertTriangle className={`w-5 h-5 ${timeLeft.overdue ? 'text-red-500' : 'text-amber-500'}`} />
        ) : (
          <Clock className="w-5 h-5 text-text-muted" />
        )}
        <span className="font-medium text-text-primary">{label}</span>
      </div>

      {timeLeft.overdue ? (
        <div className="flex items-center gap-2">
          <span className="text-red-500 font-bold text-lg">OVERDUE</span>
          <span className="text-red-400">
            {Math.abs(timeLeft.days)}d {formatNumber(timeLeft.hours)}h {formatNumber(timeLeft.minutes)}m
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="text-center">
            <div className={`font-bold ${digitSizeClasses[size]} text-text-primary`}>
              {formatNumber(timeLeft.days)}
            </div>
            <div className="text-xs text-text-muted mt-1">Days</div>
          </div>
          <span className="text-text-muted">:</span>
          <div className="text-center">
            <div className={`font-bold ${digitSizeClasses[size]} text-text-primary`}>
              {formatNumber(timeLeft.hours)}
            </div>
            <div className="text-xs text-text-muted mt-1">Hours</div>
          </div>
          <span className="text-text-muted">:</span>
          <div className="text-center">
            <div className={`font-bold ${digitSizeClasses[size]} text-text-primary`}>
              {formatNumber(timeLeft.minutes)}
            </div>
            <div className="text-xs text-text-muted mt-1">Mins</div>
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-text-muted">
        Target: {new Date(targetDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </div>
  );
}

export default SLACountdown;