import React from 'react';
import { Link } from 'react-router-dom';
import {
  INK, G600, G300, WHITE,
  monoStyle, containerStyle,
  makeBtnPrimary, makeBtnSecondary, makeSectionLabel,
  ctaCompressHandlers,
  type AssessmentLandingConfig,
} from './shared';

interface Props {
  config: AssessmentLandingConfig;
}

export function AssessmentHero({ config }: Props) {
  const { name, tagline, heroDescription, accent, prefix, ctaLabel, ctaHref, ctaSecondaryLabel, ctaSecondaryHref } = config;
  const btnPrimary = makeBtnPrimary(accent);
  const btnSecondary = makeBtnSecondary(accent);
  const sectionLabel = makeSectionLabel(accent);

  return (
    <section style={{ padding: '180px 0 120px', textAlign: 'center', position: 'relative' }} className="hero-padding">
      {/* M4 — Static hero accent line (2px vertical gradient, accent → transparent, ~200px tall) */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 140, left: '50%', transform: 'translateX(-50%)',
        width: 2, height: 200,
        background: `linear-gradient(to bottom, ${accent} 0%, transparent 100%)`,
        pointerEvents: 'none',
      }} />
      <div style={containerStyle} className={`${prefix}-reveal`}>
        <span style={{ ...monoStyle, color: accent, marginBottom: 28, display: 'inline-block' }}>{tagline}</span>
        <h1 className="hero-heading" style={{
          fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 700,
          lineHeight: 1.15, color: INK, fontSize: 48,
          maxWidth: 760, margin: '0 auto 24px',
        }}>
          {name}
        </h1>
        <p className="hero-sub" style={{
          fontSize: 18, maxWidth: 600, margin: '0 auto 40px',
          color: G600, lineHeight: 1.6,
        }}>
          {heroDescription}
        </p>
        <div className="cta-row" style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 60, flexWrap: 'wrap' }}>
          <Link to={ctaHref} style={btnPrimary} {...ctaCompressHandlers}
            onMouseEnter={(e) => { e.currentTarget.style.background = INK; e.currentTarget.style.borderColor = INK; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = accent; e.currentTarget.style.borderColor = accent; }}>
            {ctaLabel}
          </Link>
          {ctaSecondaryLabel && ctaSecondaryHref && (
            <Link to={ctaSecondaryHref} style={btnSecondary} {...ctaCompressHandlers}
              onMouseEnter={(e) => { e.currentTarget.style.background = INK; e.currentTarget.style.color = WHITE; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = INK; }}>
              {ctaSecondaryLabel}
            </Link>
          )}
        </div>
        <div style={{ width: 1, height: 60, background: G300, margin: '0 auto' }} />
      </div>
    </section>
  );
}
