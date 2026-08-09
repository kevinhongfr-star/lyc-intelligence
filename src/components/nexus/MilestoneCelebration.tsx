import React, { useEffect, useState } from 'react';
import { PartyPopper, Sparkles, Trophy, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MilestoneCelebrationProps {
  /** Whether the celebration is active */
  show: boolean;
  /** Milestone title */
  title: string;
  /** Milestone description */
  message?: string;
  /** Miles awarded */
  milesAwarded?: number;
  /** Icon variant */
  variant?: 'default' | 'trophy' | 'star' | 'sparkles';
  /** Auto-dismiss duration in ms (0 = no auto-dismiss) */
  duration?: number;
  /** Dismiss handler */
  onDismiss: () => void;
  /** Additional className */
  className?: string;
}

const ACCENT = '#C108AB';

const ICON_MAP = {
  default: PartyPopper,
  trophy: Trophy,
  star: Star,
  sparkles: Sparkles,
};

/**
 * MilestoneCelebration — celebratory toast for milestones.
 * Shows when user reaches a earning or achievement milestone.
 * Zero border-radius, crimson #C108AB accent.
 * Auto-dismisses after configurable duration.
 */
export function MilestoneCelebration({
  show,
  title,
  message,
  milesAwarded,
  variant = 'default',
  duration = 4000,
  onDismiss,
  className,
}: MilestoneCelebrationProps) {
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });

      if (duration > 0) {
        const timer = setTimeout(() => {
          setEntered(false);
          setTimeout(() => {
            setVisible(false);
            onDismiss();
          }, 300);
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setEntered(false);
      setTimeout(() => setVisible(false), 300);
    }
  }, [show, duration, onDismiss]);

  if (!visible) return null;

  const Icon = ICON_MAP[variant];

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 max-w-sm',
        entered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        'transition-all duration-300 ease-out',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div
        className="relative px-5 py-4 shadow-xl overflow-hidden"
        style={{
          background: 'white',
          borderLeft: `4px solid ${ACCENT}`,
        }}
      >
        {/* Decorative sparkle */}
        <div
          className="absolute -top-2 -right-2 opacity-10"
          style={{ color: ACCENT }}
        >
          <Sparkles className="w-12 h-12" />
        </div>

        <div className="flex items-start gap-4 relative z-10">
          <div
            className="w-12 h-12 flex items-center justify-center flex-shrink-0"
            style={{
              background: `${ACCENT}15`,
              color: ACCENT,
            }}
          >
            <Icon className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-sm" style={{ color: '#000' }}>
                {title}
              </h4>
              <button
                onClick={() => {
                  setEntered(false);
                  setTimeout(() => {
                    setVisible(false);
                    onDismiss();
                  }, 300);
                }}
                className="p-1 hover:opacity-70 transition-opacity flex-shrink-0"
                aria-label="Dismiss celebration"
              >
                <X className="w-4 h-4 opacity-50" />
              </button>
            </div>

            {message && (
              <p className="text-xs mt-1" style={{ color: '#333' }}>
                {message}
              </p>
            )}

            {milesAwarded !== undefined && milesAwarded > 0 && (
              <div
                className="flex items-center gap-2 mt-2 text-sm font-semibold"
                style={{ color: ACCENT }}
              >
                <Sparkles className="w-4 h-4" />
                +{milesAwarded} miles earned
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
