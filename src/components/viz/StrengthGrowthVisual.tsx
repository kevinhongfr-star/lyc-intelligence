import * as React from 'react';

export interface StrengthGrowthVisualProps {
  strengths: string[];
  growthAreas: string[];
  accentColor?: string;
  className?: string;
  ariaLabel?: string;
}

export const StrengthGrowthVisual: React.FC<StrengthGrowthVisualProps> = ({
  strengths,
  growthAreas,
  accentColor,
  className,
  ariaLabel,
}) => {
  const accent = accentColor ?? 'var(--report-accent, #111)';
  const strengthsBg = 'var(--report-bg, #FFFFFF)';
  const ink = 'var(--report-ink, #0B0B0B)';
  const inkMuted = 'var(--report-ink-muted, #6B7280)';
  const border = 'var(--report-viz-track, #E5E7EB)';

  const Column: React.FC<{
    title: string;
    subhead: string;
    items: string[];
    badgeBg: string;
    headerAccent: string;
  }> = ({ title, subhead, items, badgeBg, headerAccent }) => (
    <div
      style={{
        border: `1px solid ${border}`,
        borderTop: `4px solid ${headerAccent}`,
        background: strengthsBg,
        padding: 20,
        minWidth: 0,
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: ink,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 12,
            color: inkMuted,
            marginTop: 2,
          }}
        >
          {subhead}
        </div>
      </div>
      <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {items.map((item, i) => (
          <li
            key={`${item}-${i}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr',
              gap: 12,
              padding: '12px 0',
              borderTop: i === 0 ? 'none' : `1px dashed ${border}`,
              alignItems: 'flex-start',
            }}
          >
            <div
              aria-hidden
              style={{
                width: 32,
                height: 32,
                background: badgeBg,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: 14,
                lineHeight: 1.55,
                color: ink,
              }}
            >
              {item}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );

  return (
    <div
      role="group"
      aria-label={ariaLabel ?? 'Strengths and growth areas'}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 20,
      }}
      className={className}
    >
      <Column
        title="Strengths"
        subhead="What's working well today"
        items={strengths}
        badgeBg="#0B0B0B"
        headerAccent="#0B0B0B"
      />
      <Column
        title="Growth areas"
        subhead="Highest-leverage actions ahead"
        items={growthAreas}
        badgeBg={accent}
        headerAccent={accent}
      />
    </div>
  );
};
