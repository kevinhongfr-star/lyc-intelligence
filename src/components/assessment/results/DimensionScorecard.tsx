import React, { useEffect, useRef, useState } from 'react';
import {
  INK, G100, G200, G300, G400, G600, WHITE,
  monoStyle, containerStyle, makeSectionLabel,
} from '../landing/shared';
import type { AssessmentResultsConfig } from './types';

interface Props {
  config: AssessmentResultsConfig;
}

/** Animated bar that fills when scrolled into view */
function AnimatedBar({ score, accent }: { score: number; accent: string }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Stagger via slight delay
          setTimeout(() => setWidth(score), 100);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [score]);

  const color = score >= 75 ? '#2D7A3E' : score >= 50 ? accent : score >= 35 ? '#C97824' : '#9CA3AF';

  return (
    <div ref={ref} style={{
      height: 8, background: G200, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: `${width}%`, background: color,
        transition: 'width 800ms cubic-bezier(0.16,1,0.3,1)',
      }} />
    </div>
  );
}

export function DimensionScorecard({ config }: Props) {
  const { dimensions, accent, prefix } = config;
  const sectionLabel = makeSectionLabel(accent);

  return (
    <section style={{ padding: '100px 0' }}>
      <div style={containerStyle}>
        <div className={`${prefix}-reveal`} style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>Dimension scorecard</span>
          <h2 className="section-heading" style={{
            fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 700,
            fontSize: 36, lineHeight: 1.2, color: INK, marginBottom: 20,
          }}>
            Your five dimensions, <em style={{ fontWeight: 400 }}>at a glance</em>
          </h2>
          <p style={{ fontSize: 17, color: G600, lineHeight: 1.6 }}>
            Each dimension is scored 0–100, benchmarked against executive populations.
          </p>
        </div>

        <div className={`${prefix}-reveal`} style={{ maxWidth: 720, margin: '0 auto' }}>
          {dimensions.map((d, i) => {
            const color = d.score >= 75 ? '#2D7A3E' : d.score >= 50 ? accent : d.score >= 35 ? '#C97824' : '#9CA3AF';
            return (
              <div key={d.id} style={{
                padding: '24px 0',
                borderBottom: i < dimensions.length - 1 ? `1px solid ${G200}` : 'none',
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                      fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
                      color: G400, fontWeight: 500,
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
                  <span style={{
                    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                    fontSize: 18, fontWeight: 500, color: color,
                  }}>
                    {d.score}
                  </span>
                </div>
                <AnimatedBar score={d.score} accent={accent} />
                <div style={{
                  display: 'flex', justifyContent: 'space-between', marginTop: 8,
                }}>
                  <span style={{ fontSize: 11, color: G400 }}>{d.lowLabel}</span>
                  <span style={{ fontSize: 11, color: G400 }}>{d.highLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
