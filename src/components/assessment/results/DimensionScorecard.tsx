import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Lightbulb, Target } from 'lucide-react';
import {
  INK, G200, G400, G600, WHITE,
  monoStyle, containerStyle, makeSectionLabel,
} from '../landing/shared';
import { Card, CardContent } from '@/components/ui';
import type { AssessmentResultsConfig } from './types';

interface Props {
  config: AssessmentResultsConfig;
}

function scoreColor(score: number, accent: string): string {
  if (score >= 75) return '#2D7A3E';
  if (score >= 50) return accent;
  if (score >= 35) return '#C97824';
  return '#9CA3AF';
}

/** Animated bar that fills when scrolled into view */
function AnimatedBar({ score, color }: { score: number; color: string }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => setWidth(score), 100);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [score]);

  return (
    <div ref={ref} style={{
      height: 8, background: G200, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: `${width}%`, background: color,
        transition: 'width 350ms cubic-bezier(0.16,1,0.3,1)',
      }} />
    </div>
  );
}

export function DimensionScorecard({ config }: Props) {
  const { dimensions, accent, prefix } = config;
  const sectionLabel = makeSectionLabel(accent);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section style={{ padding: '100px 0' }}>
      <div style={containerStyle}>
        <div className={`${prefix}-reveal`} style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>Dimension scorecard</span>
          <h2 className="section-heading" style={{
            fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 700,
            fontSize: 36, lineHeight: 1.2, color: INK, marginBottom: 20,
          }}>
            Your dimensions, <em style={{ fontWeight: 400 }}>at a glance</em>
          </h2>
          <p style={{ fontSize: 17, color: G600, lineHeight: 1.6 }}>
            Each dimension is scored 0–100 against executive benchmarks. Open a dimension for why it matters and what to do next.
          </p>
        </div>

        <div className={`${prefix}-reveal`} style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {dimensions.map((d, i) => {
            const color = scoreColor(d.score, accent);
            const isOpen = expandedId === d.id;
            const hasDeepDive = Boolean(d.whyItMatters || d.actionSuggestion);
            return (
              <Card
                key={d.id}
                style={{
                  background: WHITE,
                  borderColor: isOpen ? accent : G200,
                  transition: 'border-color 200ms ease',
                }}
              >
                <CardContent style={{ padding: '28px 28px' }}>
                  {/* Header row — name + score */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    gap: 16, marginBottom: 18,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, minWidth: 0 }}>
                      <span style={{
                        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                        fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
                        color: G400, fontWeight: 500,
                      }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span style={{
                        fontFamily: "'Crimson Pro', Georgia, serif",
                        fontSize: 21, fontWeight: 700, color: INK,
                      }}>
                        {d.name}
                      </span>
                    </div>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                      fontSize: 22, fontWeight: 500, color, flexShrink: 0,
                    }}>
                      {d.score}
                    </span>
                  </div>

                  {/* Score bar + low/high labels */}
                  <AnimatedBar score={d.score} color={color} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: G400 }}>{d.lowLabel}</span>
                    <span style={{ fontSize: 11, color: G400 }}>{d.highLabel}</span>
                  </div>

                  {/* One-line interpretation — always visible */}
                  {d.description && (
                    <p style={{
                      fontSize: 15, color: G600, lineHeight: 1.6, margin: '18px 0 0',
                    }}>
                      {d.description}
                    </p>
                  )}

                  {/* Progressive reveal — why it matters + action */}
                  {hasDeepDive && (
                    <div style={{ marginTop: 18 }}>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isOpen ? null : d.id)}
                        aria-expanded={isOpen}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          padding: 0,
                          fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                          fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em',
                          color: G600, fontWeight: 500,
                        }}
                      >
                        {isOpen ? 'Hide detail' : 'Why it matters & next step'}
                        <ChevronDown style={{
                          width: 14, height: 14, color: G400,
                          transition: 'transform 200ms ease',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        }} />
                      </button>

                      {isOpen && (
                        <div style={{
                          marginTop: 18,
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                          gap: 16,
                          animation: 'dimensionReveal 300ms cubic-bezier(0.16,1,0.3,1)',
                        }}>
                          {d.whyItMatters && (
                            <div style={{
                              padding: '18px', background: '#FAFAFA', border: `1px solid ${G200}`,
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                <Lightbulb style={{ width: 14, height: 14, color: accent }} />
                                <span style={{ ...monoStyle, color: '#9CA3AF', fontSize: 9 }}>
                                  Why it matters
                                </span>
                              </div>
                              <p style={{ fontSize: 14, color: G600, lineHeight: 1.6, margin: 0 }}>
                                {d.whyItMatters}
                              </p>
                            </div>
                          )}
                          {d.actionSuggestion && (
                            <div style={{
                              padding: '18px', background: '#FAFAFA', border: `1px solid ${G200}`,
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                <Target style={{ width: 14, height: 14, color: '#2D7A3E' }} />
                                <span style={{ ...monoStyle, color: '#9CA3AF', fontSize: 9 }}>
                                  What to do next
                                </span>
                              </div>
                              <p style={{ fontSize: 14, color: G600, lineHeight: 1.6, margin: 0 }}>
                                {d.actionSuggestion}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes dimensionReveal {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
