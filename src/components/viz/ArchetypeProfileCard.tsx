import * as React from 'react';

export interface ArchetypeProfileCardProps {
  /** Large leading letter (e.g. archetype initial). */
  letter: string;
  /** Archetype display name. */
  name: string;
  /** Short description paragraph. */
  description: string;
  /** List of key trait chips. */
  traits: string[];
  accentColor?: string;
  className?: string;
  ariaLabel?: string;
}

export const ArchetypeProfileCard: React.FC<ArchetypeProfileCardProps> = ({
  letter,
  name,
  description,
  traits,
  accentColor,
  className,
  ariaLabel,
}) => {
  const accent = accentColor ?? 'var(--report-accent, #111)';
  const ink = 'var(--report-ink, #0B0B0B)';
  const inkMuted = 'var(--report-ink-muted, #6B7280)';
  const cardBg = 'var(--report-bg, #FFFFFF)';
  const border = 'var(--report-viz-track, #E5E7EB)';
  const letterForDisplay = (letter ?? '?').slice(0, 1).toUpperCase();

  return (
    <section
      role={ariaLabel ? 'group' : undefined}
      aria-label={ariaLabel ?? `Archetype ${name}`}
      style={{
        background: cardBg,
        border: `1px solid ${border}`,
        display: 'grid',
        gridTemplateColumns: '140px 1fr',
        gap: 24,
        padding: 24,
      }}
      className={className}
    >
      <div
        aria-hidden
        style={{
          background: accent,
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 140,
          fontFamily: '"DejaVu Serif", "Georgia", "Times New Roman", Times, serif',
          fontSize: 120,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        {letterForDisplay}
      </div>
      <div style={{ minWidth: 0 }}>
        <h3
          style={{
            margin: 0,
            marginBottom: 10,
            fontFamily: '"DejaVu Serif", "Georgia", "Times New Roman", Times, serif',
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            color: ink,
          }}
        >
          {name}
        </h3>
        <p
          style={{
            margin: 0,
            marginBottom: 18,
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 14,
            lineHeight: 1.65,
            color: inkMuted,
          }}
        >
          {description}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {traits.map((t, i) => (
            <span
              key={`${t}-${i}`}
              style={{
                border: `1px solid ${accent}`,
                color: ink,
                padding: '6px 10px',
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
