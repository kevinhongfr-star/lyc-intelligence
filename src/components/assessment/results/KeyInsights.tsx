import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {
  INK, G200, G600, WHITE,
  monoStyle, containerStyle, makeSectionLabel,
} from '../landing/shared';
import { Card, CardContent } from '@/components/ui';
import type { AssessmentResultsConfig } from './types';

interface Props {
  config: AssessmentResultsConfig;
}

export function KeyInsights({ config }: Props) {
  const { insights, accent, prefix } = config;
  const sectionLabel = makeSectionLabel(accent);

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
          <p style={{ fontSize: 17, color: G600, lineHeight: 1.6 }}>
            The headline findings worth carrying into your next quarter.
          </p>
        </div>

        <div className={`${prefix}-reveal`} style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(insights.length, 2)}, 1fr)`,
          gap: 24,
        }}>
          {insights.map((insight, i) => {
            const isStrength = insight.type === 'strength';
            const indicatorColor = isStrength ? '#2D7A3E' : '#C97824';
            return (
              <Card
                key={i}
                style={{
                  background: WHITE,
                  borderColor: G200,
                  transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1), border-color 200ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = G200;
                }}
              >
                <CardContent style={{ padding: '32px 28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                    {isStrength ? (
                      <TrendingUp style={{ width: 16, height: 16, color: indicatorColor }} />
                    ) : (
                      <TrendingDown style={{ width: 16, height: 16, color: indicatorColor }} />
                    )}
                    <span style={{
                      ...monoStyle, fontSize: 10,
                      color: indicatorColor,
                    }}>
                      {isStrength ? 'Strength' : 'Growth area'}
                    </span>
                  </div>
                  <h3 style={{
                    fontFamily: "'Crimson Pro', Georgia, serif",
                    fontSize: 21, fontWeight: 700, color: INK, marginBottom: 12, lineHeight: 1.25,
                  }}>
                    {insight.title}
                  </h3>
                  <p style={{ fontSize: 15, color: G600, lineHeight: 1.65, margin: 0 }}>
                    {insight.text}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
