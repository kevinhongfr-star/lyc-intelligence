import * as React from 'react';

export type TimelineStepStatus = 'complete' | 'current' | 'pending';

export interface TimelineStep {
  label: string;
  status: TimelineStepStatus;
  at?: string;
}

export interface ProgressTimelineProps {
  steps: TimelineStep[];
  accentColor?: string;
  className?: string;
  ariaLabel?: string;
}

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({
  steps,
  accentColor,
  className,
  ariaLabel,
}) => {
  const accent = accentColor ?? 'var(--report-accent, #111)';
  const ink = 'var(--report-ink, #0B0B0B)';
  const inkMuted = 'var(--report-ink-muted, #6B7280)';
  const track = 'var(--report-viz-track, #E5E7EB)';

  const dotFor = (s: TimelineStepStatus) => {
    if (s === 'complete') {
      return {
        background: '#0B0B0B',
        border: '2px solid #0B0B0B',
        color: '#FFFFFF',
      };
    }
    if (s === 'current') {
      return {
        background: accent,
        border: `2px solid ${accent}`,
        color: '#FFFFFF',
      };
    }
    return {
      background: 'transparent',
      border: `2px solid ${track}`,
      color: 'transparent',
    };
  };

  const lineStyleBetween = (a: TimelineStepStatus) => {
    if (a === 'complete') return { background: '#0B0B0B' };
    return { background: track };
  };

  return (
    <ol
      role="list"
      aria-label={ariaLabel ?? 'Progress timeline'}
      style={{
        position: 'relative',
        padding: 0,
        margin: 0,
        listStyle: 'none',
      }}
      className={className}
    >
      {steps.map((s, i) => {
        const dot = dotFor(s.status);
        const textColor = s.status === 'pending' ? inkMuted : ink;
        const weight: React.CSSProperties['fontWeight'] = s.status === 'current' ? 700 : s.status === 'complete' ? 600 : 500;
        const isLast = i === steps.length - 1;
        const line = lineStyleBetween(s.status);
        return (
          <li
            key={`${s.label}-${i}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr',
              gap: 16,
              minHeight: 52,
              position: 'relative',
            }}
          >
            {/* Spine behind the dot */}
            {!isLast ? (
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  left: 15,
                  top: 32,
                  bottom: -12,
                  width: 2,
                  ...line,
                }}
              />
            ) : null}
            {/* Dot */}
            <div
              aria-hidden
              style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  ...dot,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 200ms ease',
                }}
              >
                {s.status === 'complete' ? (
                  <svg viewBox="0 0 20 20" width="11" height="11" aria-hidden>
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.4}
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      d="M4 10 l4 4 l8 -9"
                    />
                  </svg>
                ) : null}
              </div>
            </div>
            <div style={{ paddingTop: 2, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  fontSize: 14,
                  fontWeight: weight,
                  color: textColor,
                  letterSpacing: s.status === 'current' ? '0.02em' : undefined,
                }}
              >
                {s.label}
                {s.status === 'current' ? (
                  <span
                    style={{
                      display: 'inline-block',
                      marginLeft: 8,
                      padding: '2px 6px',
                      background: accent,
                      color: '#FFFFFF',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Now
                  </span>
                ) : null}
              </div>
              {s.at ? (
                <div
                  style={{
                    marginTop: 2,
                    fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
                    fontSize: 12,
                    color: inkMuted,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {s.at}
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
