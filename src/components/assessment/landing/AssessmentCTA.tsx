import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  INK, WHITE, G600,
  containerStyle,
  makeBtnPrimary,
  ctaCompressHandlers,
  type AssessmentLandingConfig,
} from './shared';

interface Props {
  config: AssessmentLandingConfig;
}

export function AssessmentCTA({ config }: Props) {
  const { name, accent, prefix, ctaLabel, ctaHref } = config;
  const btnPrimary = makeBtnPrimary(accent);

  return (
    <section style={{ padding: '120px 0', background: INK }} className="section-padding">
      <div style={containerStyle} className={`${prefix}-reveal`}>
        {/* M4 — Accent line before heading */}
        <div style={{
          width: 48, height: 3, background: accent, margin: '0 auto 24px',
        }} />
        <h2 className="section-heading" style={{
          fontFamily: "'Libre Baskerville', Georgia, serif", fontWeight: 700,
          fontSize: 36, lineHeight: 1.2, color: WHITE, textAlign: 'center',
          maxWidth: 600, margin: '0 auto 16px',
        }}>
          Ready to discover your <em style={{ fontWeight: 400 }}>{name} profile?</em>
        </h2>
        <p style={{
          fontSize: 17, color: G600, textAlign: 'center',
          maxWidth: 500, margin: '0 auto 40px', lineHeight: 1.6,
        }}>
          Fifteen minutes. Scientific results. Actionable insights.
        </p>
        <div style={{ textAlign: 'center' }}>
          <Link to={ctaHref} style={btnPrimary} {...ctaCompressHandlers}
            onMouseEnter={(e) => { e.currentTarget.style.background = INK; e.currentTarget.style.borderColor = INK; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = accent; e.currentTarget.style.borderColor = accent; }}>
            {ctaLabel} <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </div>
    </section>
  );
}
