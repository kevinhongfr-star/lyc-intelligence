import * as React from 'react';

export type InsightCardVariant = 'strength' | 'growth';

export interface InsightCardProps {
  /** Number shown in the monochrome badge (1-based ordering inside its group). */
  number: number;
  title: string;
  body: string;
  accentColor?: string;
  variant?: InsightCardVariant;
  className?: string;
  ariaLabel?: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  number,
  title,
  body,
  accentColor,
  variant = 'strength',
  className,
  ariaLabel,
}) => {
  const accent = accentColor ?? 'var(--report-accent, #111)';
  const badgeBg = variant === 'strength' ? '#0B0B0B' : accent;
  const badgeInk = '#FFFFFF';
  const ink = 'var(--report-ink, #0B0B0B)';
  const inkMuted = 'var(--report-ink-muted, #6B7280)';
  const cardBg = 'var(--report-bg, #FFFFFF)';
  const subtleBorder = 'var(--report-viz-track, #E5E7EB)';

  return (
    <article
      role={ariaLabel ? 'group' : undefined}
      aria-label={ariaLabel}
      style={{
        background: cardBg,
        border: `1px solid ${subtleBorder}`,
        borderTop: `4px solid ${accent}`,
        padding: '20px 20px 18px 20px',
        display: 'flex',
        gap: 16,
      }}
      className={className}
    >
      <div
        aria-hidden
        style={{
          flexShrink: 0,
          width: 32,
          height: 32,
          background: badgeBg,
          color: badgeInk,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
          fontWeight: 700,
          fontSize: 13,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {String(number).padStart(2, '0')}
      </div>
      <div style={{ minWidth: 0 }}>
        <h4
          style={{
            margin: 0,
            marginBottom: 8,
            fontFamily: '"DejaVu Serif", "Georgia", "Times New Roman", Times, serif',
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1.2,
            color: ink,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h4>
        <p
          style={{
            margin: 0,
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 14,
            lineHeight: 1.6,
            color: inkMuted,
          }}
        >
          {body}
        </p>
      </div>
    </article>
  );
};
