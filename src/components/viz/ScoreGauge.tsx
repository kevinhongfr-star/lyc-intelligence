import * as React from 'react';

/**
 * ScoreGauge — circular progress gauge (220px diameter, 16px stroke default).
 * All report visuals live in CSS vars so page-level CSS drives the whole theme.
 *
 *   --report-accent: the accent color (e.g. PRISM magenta). Falls back to
 *                    `accentColor` prop if set, otherwise var(--report-accent).
 */
export interface ScoreGaugeProps {
  /** Score 0..100 */
  score: number;
  /** Optional accent override if --report-accent isn't set. */
  accentColor?: string;
  /** Show the tier label below the number (e.g. "Developing", "Leading"). */
  tierLabel?: string;
  /** Pixel diameter. Default 220. */
  size?: number;
  /** Stroke width. Default 16. */
  strokeWidth?: number;
  /** Accessible label. */
  ariaLabel?: string;
  className?: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  accentColor,
  tierLabel,
  size = 220,
  strokeWidth = 16,
  ariaLabel,
  className,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  const center = size / 2;
  const accent = accentColor ?? 'var(--report-accent, #111)';
  const track = 'var(--report-viz-track, #E5E7EB)';
  const ink = 'var(--report-ink, #0B0B0B)';
  const inkMuted = 'var(--report-ink-muted, #6B7280)';
  return (
    <svg
      role="img"
      aria-label={ariaLabel ?? `Score gauge ${clamped}${tierLabel ? ' — ' + tierLabel : ''}`}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
    >
      <defs>
        <style>{`
          @keyframes vizFadeIn { from { opacity: 0; transform: translateY(4px);} to { opacity: 1; transform: none;} }
        `}</style>
      </defs>
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={track}
        strokeWidth={strokeWidth}
      />
      {/* Progress arc. Start at top (rotate -90deg). */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={accent}
        strokeWidth={strokeWidth}
        strokeLinecap="butt"
        strokeDasharray={`${dash} ${circumference - dash}`}
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: 'stroke-dasharray 500ms ease' }}
      />
      {/* Center number. Use foreignObject to inherit site font tokens. */}
      <foreignObject x={0} y={0} width={size} height={size}>
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: ink,
            animation: 'vizFadeIn 220ms ease-out both',
          }}
        >
          <div
            style={{
              fontFamily: '"DejaVu Serif", "Georgia", "Times New Roman", Times, serif',
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            {clamped}
          </div>
          {tierLabel ? (
            <div
              style={{
                marginTop: 8,
                fontFamily: '"DM Sans", system-ui, -apple-system, Segoe UI, sans-serif',
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: inkMuted,
              }}
            >
              {tierLabel}
            </div>
          ) : null}
        </div>
      </foreignObject>
    </svg>
  );
};
