import React, { useEffect, useState } from 'react';
import { containerStyle, G200, G400 } from '../landing/shared';

interface Props {
  /** Unique section id used for anchor navigation (e.g. '#dimensions') */
  sectionId: string;
  /** Section label (mono uppercase) */
  label: string;
  /** Section title (h2 / serif) */
  title: string;
  revealClass: string;
  accent: string;
  children: React.ReactNode;
  /** If true, show a "Spoiler / tap to reveal" gate (progressive reveal) — dimensions, insights, dev-plan */
  gated?: boolean;
  /** If provided, gates with CTA button copy */
  gateCopy?: string;
}

/**
 * #1322 Progressive Reveal section.
 *
 * The root problem was "full report dumped all at once" = no story. We now:
 *   1. Label + Title (small reveal-on-scroll section header)
 *   2. If gated: user sees a "Reveal [topic]" CTA card that teases the content
 *      instead of immediate detail. Once tapped, the section unfolds.
 *   3. If not gated (hero, exec summary): direct reveal, still on-scroll fade.
 * This gives the reader a narrative arc, a "wow" moment per section, and a
 * clear journey through the report.
 */
export function Section({
  sectionId,
  label,
  title,
  revealClass,
  accent,
  children,
  gated,
  gateCopy,
}: Props) {
  const [revealed, setRevealed] = useState(!gated);

  // Auto-scroll hash navigation (e.g. `#dimensions`) → auto-unfold that section.
  useEffect(() => {
    if (!gated || !sectionId) return;
    const hash = window.location.hash.slice(1);
    if (hash === sectionId) setRevealed(true);
  }, [gated, sectionId]);

  if (!revealed && gated) {
    return (
      <section id={sectionId} style={{
        padding: '72px 0',
        borderTop: `1px solid ${G200}`,
      }}>
        <div style={containerStyle}>
          <div className={revealClass} style={{
            border: `1px dashed ${G400}`,
            padding: '48px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 32,
            flexWrap: 'wrap',
          }}>
            <div>
              <div style={{
                fontSize: 11,
                color: accent,
                letterSpacing: '0.08em',
                fontWeight: 500,
                textTransform: 'uppercase',
                marginBottom: 8,
                fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
              }}>
                {label}
              </div>
              <h3 style={{
                fontFamily: "'Libre Baskerville', Georgia, serif",
                fontSize: 24,
                color: '#0F1115',
                margin: 0,
                fontWeight: 700,
                lineHeight: 1.25,
              }}>
                {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setRevealed(true)}
              style={{
                border: `1px solid ${accent}`,
                background: '#fff',
                color: accent,
                fontSize: 14,
                fontWeight: 600,
                padding: '14px 24px',
                cursor: 'pointer',
                letterSpacing: '0.01em',
                minWidth: 180,
                transition: 'background 120ms ease',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = accent;
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.color = accent;
              }}
            >
              {gateCopy ?? 'Reveal'} →
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id={sectionId}>
      {label || title ? (
        <div style={containerStyle}>
          <div className={revealClass} style={{ paddingTop: 72, paddingBottom: 24 }}>
            {label ? (
              <div style={{
                fontSize: 11,
                color: accent,
                letterSpacing: '0.08em',
                fontWeight: 500,
                textTransform: 'uppercase',
                marginBottom: 10,
                fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
              }}>
                {label}
              </div>
            ) : null}
            {title ? (
              <h2 style={{
                fontFamily: "'Libre Baskerville', Georgia, serif",
                fontSize: 32,
                color: '#0F1115',
                margin: 0,
                fontWeight: 700,
                lineHeight: 1.2,
              }}>
                {title}
              </h2>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className={revealClass}>{children}</div>
    </section>
  );
}
