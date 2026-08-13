import React from 'react';
import {
  INK, G200, G600, WHITE,
  containerStyle, makeSectionLabel,
  makeCardHoverHandlers,
  type AssessmentLandingConfig,
} from './shared';

interface Props {
  config: AssessmentLandingConfig;
}

export function WhoItsFor({ config }: Props) {
  const { personas, accent, prefix } = config;
  const sectionLabel = makeSectionLabel(accent);
  const hoverHandlers = makeCardHoverHandlers(accent);

  return (
    <section style={{ padding: '100px 0' }} className="section-padding">
      <div style={containerStyle}>
        <div className={`${prefix}-reveal`} style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>Who it's for</span>
          <h2 className="section-heading" style={{
            fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif", fontWeight: 700,
            fontSize: 36, lineHeight: 1.2, color: INK, marginBottom: 20,
          }}>
            Built for leaders <em style={{ fontWeight: 400 }}>at every stage</em>
          </h2>
        </div>
        <div className={`${prefix}-reveal`} style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${personas.length}, 1fr)`,
          gap: 1, background: G200, border: `1px solid ${G200}`,
        }}>
          {personas.map((p) => (
            <div key={p.title} style={{
              background: WHITE, padding: '40px 32px',
              display: 'flex', flexDirection: 'column',
              transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1), border-color 200ms ease',
              border: '1px solid transparent',
            }}
            {...hoverHandlers}>
              <div style={{
                width: 48, height: 3, background: accent, marginBottom: 24,
              }} />
              <h3 style={{
                fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif", fontWeight: 700,
                fontSize: 22, marginBottom: 12, lineHeight: 1.25, color: INK,
              }}>
                {p.title}
              </h3>
              <p style={{ color: G600, fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
