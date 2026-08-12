import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  INK, G100, G200, G600, WHITE,
  containerStyle, makeSectionLabel,
  useExpandable,
  type AssessmentLandingConfig,
} from './shared';

interface Props {
  config: AssessmentLandingConfig;
}

export function DimensionsDetail({ config }: Props) {
  const { dimensions, accent, prefix } = config;
  const sectionLabel = makeSectionLabel(accent);
  const { openIndex, toggle } = useExpandable();

  return (
    <section style={{ padding: '100px 0', background: G100 }} className="section-padding">
      <div style={containerStyle}>
        <div className={`${prefix}-reveal`} style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>Dimension detail</span>
          <h2 className="section-heading" style={{
            fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 700,
            fontSize: 36, lineHeight: 1.2, color: INK, marginBottom: 20,
          }}>
            What each dimension <em style={{ fontWeight: 400 }}>really means</em>
          </h2>
          <p style={{ fontSize: 17, color: G600, lineHeight: 1.6 }}>
            Expand any dimension to see the spectrum — from low to high.
          </p>
        </div>
        <div className={`${prefix}-reveal`} style={{ border: `1px solid ${G200}` }}>
          {dimensions.map((d, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={d.id} style={{
                borderBottom: i < dimensions.length - 1 ? `1px solid ${G200}` : 'none',
                background: WHITE,
              }}>
                <button
                  onClick={() => toggle(i)}
                  style={{
                    width: '100%', padding: '28px 32px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                      fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
                      color: accent, fontWeight: 500, minWidth: 28,
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span style={{
                      fontFamily: "'Crimson Pro', Georgia, serif",
                      fontSize: 20, fontWeight: 700, color: INK,
                    }}>
                      {d.name}
                    </span>
                  </div>
                  <ChevronDown style={{
                    width: 20, height: 20, color: G600,
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </button>
                {isOpen && (
                  <div style={{
                    padding: '0 32px 32px 84px',
                    animation: 'fadeIn 200ms cubic-bezier(0.16,1,0.3,1)',
                  }}>
                    <p style={{
                      fontSize: 16, lineHeight: 1.7, color: G600, margin: '0 0 24px',
                    }}>
                      {d.description}
                    </p>
                    <div style={{
                      display: 'flex', gap: 32,
                      padding: '16px 0', borderTop: `1px solid ${G200}`,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                          fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em',
                          color: G600, marginBottom: 4,
                        }}>Low</div>
                        <div style={{
                          fontSize: 15, color: INK, fontWeight: 500,
                        }}>{d.lowLabel}</div>
                      </div>
                      <div style={{
                        width: 1, background: G200, flexShrink: 0,
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                          fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em',
                          color: accent, marginBottom: 4,
                        }}>High</div>
                        <div style={{
                          fontSize: 15, color: INK, fontWeight: 500,
                        }}>{d.highLabel}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </section>
  );
}
