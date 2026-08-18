import React from 'react';
import { Check } from 'lucide-react';
import {
  INK, G100, G200, G600, WHITE,
  containerStyle, makeSectionLabel,
  type AssessmentLandingConfig,
} from './shared';

interface Props {
  config: AssessmentLandingConfig;
}

export function WhatYouGet({ config }: Props) {
  const { deliverables, accent, prefix, sampleResult } = config;
  const sectionLabel = makeSectionLabel(accent);

  return (
    <section style={{ padding: '100px 0', background: G100 }} className="section-padding">
      <div style={containerStyle}>
        <div className={`${prefix}-reveal`} style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>What you get</span>
          <h2 className="section-heading" style={{
            fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif", fontWeight: 700,
            fontSize: 36, lineHeight: 1.2, color: INK, marginBottom: 20,
          }}>
            A clear picture, <em style={{ fontWeight: 400 }}>not a generic report</em>
          </h2>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: sampleResult ? '1fr 1fr' : '1fr', gap: 1,
          background: G200, border: `1px solid ${G200}`,
        }}>
          {/* Deliverables list */}
          <div className={`${prefix}-reveal`} style={{ background: WHITE, padding: '40px 36px' }}>
            <h3 style={{
              fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif", fontWeight: 700,
              fontSize: 20, marginBottom: 24, color: INK,
            }}>
              Your deliverables
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {deliverables.map((d) => (
                <li key={d.title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 20, height: 20, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: accent, marginTop: 2,
                  }}>
                    <Check style={{ width: 12, height: 12, color: WHITE }} />
                  </div>
                  <div>
                    <div style={{
                      fontSize: 15, fontWeight: 600, color: INK, marginBottom: 4,
                    }}>{d.title}</div>
                    <div style={{
                      fontSize: 14, color: G600, lineHeight: 1.5,
                    }}>{d.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {/* Sample result preview */}
          {sampleResult && (
            <div className={`${prefix}-reveal`} style={{
              background: INK, padding: '40px 36px', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{
                fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em',
                color: accent, fontWeight: 500, marginBottom: 24,
              }}>
                Sample result preview
              </div>
              <div style={{
                fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
                fontSize: 24, fontWeight: 400, fontStyle: 'italic',
                color: WHITE, lineHeight: 1.5, marginBottom: 32,
              }}>
                "{sampleResult}"
              </div>
              <div style={{
                marginTop: 'auto', display: 'flex', gap: 1, background: 'rgba(255,255,255,0.1)',
              }}>
                {['V', 'R', 'I', 'S', 'M'].map((label, i) => (
                  <div key={i} style={{
                    flex: 1, padding: '16px 8px', background: INK,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{
                      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                      fontSize: 10, color: G600, textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>{label}</div>
                    <div style={{
                      width: '100%', height: 4, background: 'rgba(255,255,255,0.1)',
                    }}>
                      <div style={{
                        width: `${[78, 62, 91, 45, 83][i]}%`, height: '100%', background: accent,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
