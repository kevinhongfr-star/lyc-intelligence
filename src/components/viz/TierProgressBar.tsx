import * as React from 'react';

export interface TierEntry {
  /** Stable tier_key, e.g. 'executive_introduction' */
  key: string;
  /** Display label, e.g. 'Executive Introduction' */
  label: string;
}

export interface TierProgressBarProps {
  currentTierKey: string;
  allTiers: TierEntry[];
  accentColor?: string;
  className?: string;
  ariaLabel?: string;
  /** Hide the introductory tier from the marker if it has no access cost — visual only. */
  hideIntro?: boolean;
}

export const TierProgressBar: React.FC<TierProgressBarProps> = ({
  currentTierKey,
  allTiers,
  accentColor,
  className,
  ariaLabel,
  hideIntro,
}) => {
  const tiers = hideIntro ? allTiers.filter((t) => t.key !== 'executive_introduction') : allTiers;
  const accent = accentColor ?? 'var(--report-accent, #111)';
  const track = 'var(--report-viz-track, #E5E7EB)';
  const ink = 'var(--report-ink, #0B0B0B)';
  const inkMuted = 'var(--report-ink-muted, #6B7280)';

  const currentIndex = tiers.findIndex((t) => t.key === currentTierKey);
  const N = tiers.length;
  const progressPct = N <= 1 ? 0 : (currentIndex / (N - 1)) * 100;

  return (
    <div
      role="img"
      aria-label={ariaLabel ?? `Current tier: ${tiers[currentIndex]?.label ?? 'Unknown'}`}
      style={{ padding: '8px 0 0 0' }}
      className={className}
    >
      {/* Track + fill */}
      <div
        style={{
          position: 'relative',
          height: 8,
          width: '100%',
          background: track,
        }}
      >
        <div
          aria-hidden
          style={{
            height: '100%',
            width: `${Math.max(0, Math.min(100, progressPct))}%`,
            background: accent,
            transition: 'width 520ms ease',
          }}
        />
        {/* Tier markers along the bar */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 0',
            pointerEvents: 'none',
          }}
        >
          {tiers.map((t, i) => {
            const isCurrent = i === currentIndex;
            const isPast = i < currentIndex;
            const size = isCurrent ? 16 : 10;
            const bg = isCurrent ? accent : isPast ? '#0B0B0B' : '#FFFFFF';
            const border = isCurrent ? accent : isPast ? '#0B0B0B' : track;
            return (
              <div
                key={t.key}
                style={{
                  width: size,
                  height: size,
                  background: bg,
                  border: `2px solid ${border}`,
                  transform: isCurrent ? `translateX(0px)` : undefined,
                  marginLeft: 0,
                  marginRight: 0,
                  // Outermost markers sit flush at track edges (not bleed)
                  marginInlineStart: i === 0 ? 0 : undefined,
                  marginInlineEnd: i === N - 1 ? 0 : undefined,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Tier labels */}
      <div
        style={{
          marginTop: 10,
          display: 'grid',
          gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`,
          columnGap: 8,
        }}
      >
        {tiers.map((t, i) => {
          const isCurrent = i === currentIndex;
          const isPast = i < currentIndex;
          const color = isCurrent ? accent : isPast ? ink : inkMuted;
          const weight: React.CSSProperties['fontWeight'] = isCurrent ? 700 : 500;
          const align: React.CSSProperties['textAlign'] = i === 0 ? 'left' : i === N - 1 ? 'right' : 'center';
          return (
            <div key={t.key} style={{ textAlign: align }}>
              <div
                style={{
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  fontSize: 12,
                  fontWeight: weight,
                  color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {t.label}
              </div>
              {isCurrent ? (
                <div
                  style={{
                    marginTop: 4,
                    fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
                    fontSize: 11,
                    color: inkMuted,
                  }}
                >
                  {t.key}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
