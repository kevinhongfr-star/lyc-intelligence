import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {
  INK, G200, G600, WHITE,
  monoStyle, containerStyle, makeSectionLabel,
  makeCardHoverHandlers,
} from '../landing/shared';
import { AskNexusButton } from './AskNexusButton';
import type { AssessmentResultsConfig } from './types';

interface Props {
  config: AssessmentResultsConfig;
}

export function KeyInsights({ config }: Props) {
  const { insights, accent, prefix, assessmentCode, assessmentName } = config;
  const sectionLabel = makeSectionLabel(accent);
  const hoverHandlers = makeCardHoverHandlers(accent);

  return (
    <section style={{ padding: '100px 0' }}>
      <div style={containerStyle}>
        <div className={`${prefix}-reveal`} style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>Key insights</span>
          <h2 className="section-heading" style={{
            fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 700,
            fontSize: 36, lineHeight: 1.2, color: INK, marginBottom: 20,
          }}>
            What you should <em style={{ fontWeight: 400 }}>pay attention to</em>
          </h2>
        </div>

        <div className={`${prefix}-reveal`} style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(insights.length, 2)}, 1fr)`,
          gap: 1, background: G200, border: `1px solid ${G200}`,
        }}>
          {insights.map((insight, i) => {
            const isStrength = insight.type === 'strength';
            const iconColor = isStrength ? '#2D7A3E' : '#C97824';
            return (
              <div key={i} style={{
                background: WHITE, padding: '36px 32px',
                transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1), border-color 200ms ease',
                border: '1px solid transparent',
              }}
              {...hoverHandlers}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  {isStrength ? (
                    <TrendingUp style={{ width: 20, height: 20, color: iconColor }} />
                  ) : (
                    <TrendingDown style={{ width: 20, height: 20, color: iconColor }} />
                  )}
                  <span style={{
                    ...monoStyle, fontSize: 10,
                    color: isStrength ? '#2D7A3E' : '#C97824',
                  }}>
                    {isStrength ? 'Strength' : 'Growth area'}
                  </span>
                </div>
                <h3 style={{
                  fontFamily: "'Crimson Pro', Georgia, serif",
                  fontSize: 20, fontWeight: 700, color: INK, marginBottom: 12, lineHeight: 1.25,
                }}>
                  {insight.title}
                </h3>
                <p style={{ fontSize: 15, color: G600, lineHeight: 1.6, margin: 0 }}>
                  {insight.text}
                </p>
                <div style={{ marginTop: 20 }}>
                  <AskNexusButton
                    dimension={insight.title}
                    assessmentCode={assessmentCode}
                    accent={accent}
                    question={`On my ${assessmentName} results, you flagged "${insight.title}" as a ${isStrength ? 'strength' : 'growth area'}. Can you explain this finding and how I should act on it?`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
