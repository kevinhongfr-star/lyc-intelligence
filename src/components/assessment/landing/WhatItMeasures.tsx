import React from 'react';
import {
  INK, G100, G200, G600, WHITE,
  containerStyle, makeSectionLabel,
  makeCardHoverHandlers,
  type AssessmentLandingConfig,
} from './shared';

interface Props {
  config: AssessmentLandingConfig;
}

export function WhatItMeasures({ config }: Props) {
  const { dimensions, accent, prefix } = config;
  const sectionLabel = makeSectionLabel(accent);
  const hoverHandlers = makeCardHoverHandlers(accent);

  return (
    <section style={{ padding: '100px 0', background: G100 }} className="section-padding">
      <div style={containerStyle}>
        <div className={`${prefix}-reveal`} style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>What it measures</span>
          <h2 className="section-heading" style={{
            fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif", fontWeight: 700,
            fontSize: 36, lineHeight: 1.2, color: INK, marginBottom: 20,
          }}>
            Five dimensions, <em style={{ fontWeight: 400 }}>one picture</em>
          </h2>
          <p style={{ fontSize: 17, color: G600, lineHeight: 1.6 }}>
            Each dimension is scientifically measured and benchmarked against real executive populations.
          </p>
        </div>
        <div className={`${prefix}-reveal`} style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1,
          background: G200, border: `1px solid ${G200}`,
        }}>
          {dimensions.map((d) => (
            <div key={d.id} style={{
              background: WHITE, padding: '32px 24px',
              display: 'flex', flexDirection: 'column',
              transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1), border-color 200ms ease',
              border: '1px solid transparent',
            }}
            {...hoverHandlers}>
              <div style={{
                fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
                color: accent, fontWeight: 500, marginBottom: 16,
              }}>
                {d.name}
              </div>
              <p style={{ color: G600, fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                {d.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
