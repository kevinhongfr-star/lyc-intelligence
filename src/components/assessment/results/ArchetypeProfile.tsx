import React from 'react';
import {
  INK, G100, G200, G600, WHITE,
  monoStyle, containerStyle, makeSectionLabel,
} from '../landing/shared';
import type { AssessmentResultsConfig } from './types';

interface Props {
  config: AssessmentResultsConfig;
}

export function ArchetypeProfile({ config }: Props) {
  const { archetype, accent, prefix } = config;
  const sectionLabel = makeSectionLabel(accent);

  return (
    <section style={{ padding: '100px 0', background: G100 }}>
      <div style={containerStyle}>
        <div className={`${prefix}-reveal`} style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>Your archetype</span>
          <h2 className="section-heading" style={{
            fontFamily: "'Libre Baskerville', Georgia, serif", fontWeight: 700,
            fontSize: 36, lineHeight: 1.2, color: INK, marginBottom: 20,
          }}>
            The <em style={{ fontWeight: 400 }}>{archetype.name}</em>
          </h2>
        </div>

        <div className={`${prefix}-reveal`} style={{
          maxWidth: 720, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
          background: G200, border: `1px solid ${G200}`,
        }}>
          {/* Description card */}
          <div style={{ background: WHITE, padding: '40px 36px' }}>
            <div style={{
              width: 48, height: 3, background: accent, marginBottom: 24,
            }} />
            <h3 style={{
              fontFamily: "'Libre Baskerville', Georgia, serif",
              fontSize: 22, fontWeight: 700, color: INK, marginBottom: 16, lineHeight: 1.25,
            }}>
              What this means
            </h3>
            <p style={{ fontSize: 15, color: G600, lineHeight: 1.7, margin: 0 }}>
              {archetype.description}
            </p>
          </div>

          {/* Traits card */}
          <div style={{ background: WHITE, padding: '40px 36px' }}>
            <div style={{
              ...monoStyle, color: G400, marginBottom: 24,
            }}>Defining traits</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {archetype.traits.map((trait, i) => (
                <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                    fontSize: 11, color: accent, fontWeight: 500, flexShrink: 0, marginTop: 2,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: 15, color: INK, lineHeight: 1.5 }}>
                    {trait}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
