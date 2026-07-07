import React, { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';

export interface InterviewTimerProps {
  totalSeconds: number;
  onExpire?: () => void;
  running?: boolean;
}

function formatMMSS(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function InterviewTimer({ totalSeconds, onExpire, running = true }: InterviewTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Reset whenever totalSeconds changes
  useEffect(() => {
    setRemaining(totalSeconds);
    expiredRef.current = false;
  }, [totalSeconds]);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) return;

    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpireRef.current?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [running, remaining]);

  const ratio = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const colorClass =
    ratio > 0.5 ? 'text-teal' : ratio >= 0.25 ? 'text-warning' : 'text-error';
  const barColorClass =
    ratio > 0.5 ? 'bg-teal' : ratio >= 0.25 ? 'bg-warning' : 'bg-error';
  const progressPct = Math.max(0, Math.min(100, ratio * 100));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Clock className={`w-5 h-5 ${colorClass}`} />
        <span className={`font-serif text-3xl font-bold tabular-nums ${colorClass}`}>
          {formatMMSS(remaining)}
        </span>
      </div>
      <div className="h-1 w-full bg-bg-tertiary">
        <div
          className={`h-full ${barColorClass} transition-all duration-500`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
