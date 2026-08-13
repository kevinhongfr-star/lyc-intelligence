import React from 'react';
import {
  INK, G100, G200, G600, WHITE,
  containerStyle, makeSectionLabel,
  type AssessmentLandingConfig,
} from './shared';

interface Props {
  config: AssessmentLandingConfig;
}

export function HowItWorks({ config }: Props) {
  const { howItWorks, accent, prefix } = config;
  const sectionLabel = makeSectionLabel(accent);

  return (
    <section style={{ padding: '100px 0' }} className="section-padding">
      <div style={containerStyle}>
        <div className={`${prefix}-reveal`} style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>How it works</span>
          <h2 className="section-heading" style={{
            fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif", fontWeight: 700,
            fontSize: 36, lineHeight: 1.2, color: INK, marginBottom: 20,
          }}>
            Three steps, <em style={{ fontWeight: 400 }}>fifteen minutes</em>
          </h2>
        </div>
        <div className={`${prefix}-reveal`} style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1,
          background: G200, border: `1px solid ${G200}`,
        }}>
          {howItWorks.map((s, i) => (
            <div key={s.step} style={{ background: WHITE, padding: '40px 32px' }}>
              {/* M3 — Staggered number reveal: 80ms stagger */}
              <div className={`${prefix}-reveal`} style={{
                width: 40, height: 40, marginBottom: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: G100,
                fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                fontSize: 14, color: accent, fontWeight: 500,
                transitionDelay: `${i * 80}ms`,
              }}>
                {s.step}
              </div>
              <h3 style={{
                fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif", fontWeight: 700,
                fontSize: 22, marginBottom: 12, lineHeight: 1.25, color: INK,
              }}>
                {s.title}
              </h3>
              <p style={{ color: G600, fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
