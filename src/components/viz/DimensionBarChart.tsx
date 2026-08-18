import * as React from 'react';

export interface DimensionBar {
  name: string;
  score: number; // 0..100
  accentColor?: string;
  summary?: string;
}

export interface DimensionBarChartProps {
  dimensions: DimensionBar[];
  /** Max displayed height for the list. Scrolls if content exceeds. */
  maxHeight?: number | string;
  className?: string;
  /** Bar height in px. Default 14. */
  barHeight?: number;
  /** Gap between bars in px. Default 24. */
  gapPx?: number;
  ariaLabel?: string;
}

export const DimensionBarChart: React.FC<DimensionBarChartProps> = ({
  dimensions,
  maxHeight,
  className,
  barHeight = 14,
  gapPx = 24,
  ariaLabel,
}) => {
  const accent = 'var(--report-accent, #111)';
  const ink = 'var(--report-ink, #0B0B0B)';
  const inkMuted = 'var(--report-ink-muted, #6B7280)';
  const track = 'var(--report-viz-track, #E5E7EB)';
  const rowBg = 'var(--report-bg, #FFFFFF)';

  return (
    <div
      role="img"
      aria-label={ariaLabel ?? `Dimension bar chart with ${dimensions.length} dimensions`}
      style={{
        maxHeight,
        overflowY: maxHeight ? 'auto' : undefined,
        background: rowBg,
        padding: '8px 0',
      }}
      className={className}
    >
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {dimensions.map((d, idx) => {
          const s = Math.max(0, Math.min(100, d.score));
          const c = d.accentColor ?? accent;
          return (
            <li
              key={`${d.name}-${idx}`}
              style={{
                display: 'block',
                marginTop: idx === 0 ? 0 : gapPx,
                borderLeft: `3px solid ${c}`,
                paddingLeft: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    fontFamily: '"DM Sans", system-ui, sans-serif',
                    fontSize: 15,
                    fontWeight: 600,
                    color: ink,
                    textAlign: 'left',
                  }}
                >
                  {d.name}
                </div>
                <div
                  style={{
                    fontFamily: '"IBM Plex Mono", ui-monospace, "Courier New", monospace',
                    fontSize: 13,
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    color: inkMuted,
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s}
                </div>
              </div>
              <div
                style={{
                  width: '100%',
                  height: barHeight,
                  background: track,
                  position: 'relative',
                }}
              >
                <div
                  aria-hidden
                  style={{
                    width: `${s}%`,
                    height: '100%',
                    background: c,
                    transition: 'width 420ms ease',
                  }}
                />
              </div>
              {d.summary ? (
                <div
                  style={{
                    marginTop: 6,
                    fontFamily: '"DM Sans", system-ui, sans-serif',
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: inkMuted,
                  }}
                >
                  {d.summary}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
