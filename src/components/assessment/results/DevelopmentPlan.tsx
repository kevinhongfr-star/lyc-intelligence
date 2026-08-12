import React from 'react';
import {
  INK, G100, G200, G600, WHITE,
  monoStyle, containerStyle, makeSectionLabel,
} from '../landing/shared';
import type { AssessmentResultsConfig } from './types';

interface Props {
  config: AssessmentResultsConfig;
}

export function DevelopmentPlan({ config }: Props) {
  const { developmentActions, accent, prefix } = config;
  const sectionLabel = makeSectionLabel(accent);
  const sorted = [...developmentActions].sort((a, b) => a.priority - b.priority);

  return (
    <section style={{ padding: '100px 0', background: G100 }}>
      <div style={containerStyle}>
        <div className={`${prefix}-reveal`} style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>Development plan</span>
          <h2 className="section-heading" style={{
            fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 700,
            fontSize: 36, lineHeight: 1.2, color: INK, marginBottom: 20,
          }}>
            Your prioritized <em style={{ fontWeight: 400 }}>action items</em>
          </h2>
          <p style={{ fontSize: 17, color: G600, lineHeight: 1.6 }}>
            Focused on your lowest-scoring dimensions. Start at the top.
          </p>
        </div>

        <div className={`${prefix}-reveal`} style={{ maxWidth: 720, margin: '0 auto' }}>
          {sorted.map((action, i) => (
            <div key={i} style={{
              display: 'flex', gap: 24, padding: '28px 0',
              borderBottom: i < sorted.length - 1 ? `1px solid ${G200}` : 'none',
            }}>
              {/* Priority number */}
              <div style={{
                width: 40, height: 40, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i === 0 ? accent : G100,
                fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                fontSize: 14, fontWeight: 500,
                color: i === 0 ? WHITE : accent,
              }}>
                {action.priority}
              </div>
              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  marginBottom: 8,
                }}>
                  <span style={{
                    ...monoStyle, fontSize: 9, color: accent,
                  }}>
                    {action.dimension}
                  </span>
                  <span style={{
                    ...monoStyle, fontSize: 9, color: G400,
                  }}>
                    {action.timeline}
                  </span>
                </div>
                <p style={{
                  fontSize: 16, color: INK, lineHeight: 1.6, margin: 0, fontWeight: 500,
                }}>
                  {action.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
