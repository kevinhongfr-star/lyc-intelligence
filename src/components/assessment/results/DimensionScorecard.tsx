import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Lightbulb, Target } from 'lucide-react';
import {
  INK, G100, G200, G300, G400, G600, WHITE,
  monoStyle, containerStyle, makeSectionLabel,
} from '../landing/shared';
import { AskNexusButton } from './AskNexusButton';
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
        transition: 'width 350ms cubic-bezier(0.16,1,0.3,1)',
      }} />
    </div>
  );
}

export function DimensionScorecard({ config }: Props) {
  const { dimensions, accent, prefix, assessmentCode, assessmentName } = config;
  const sectionLabel = makeSectionLabel(accent);
  const [expandedId, setExpandedId] = useState<string | null>(dimensions[0]?.id ?? null);

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
            Select a dimension to reveal what it means, why it matters, and what to do next.
          </p>
        </div>

        <div className={`${prefix}-reveal`} style={{ maxWidth: 760, margin: '0 auto' }}>
          {dimensions.map((d, i) => {
            const color = d.score >= 75 ? '#2D7A3E' : d.score >= 50 ? accent : d.score >= 35 ? '#C97824' : '#9CA3AF';
            const isOpen = expandedId === d.id;
            const hasDeepDive = Boolean(d.description || d.whyItMatters || d.actionSuggestion);
            return (
              <div key={d.id} style={{
                borderBottom: `1px solid ${G200}`,
                background: isOpen ? G100 : 'transparent',
                transition: 'background 200ms ease',
              }}>
                {/* Collapsed row — always visible (the "score first" layer) */}
                <button
                  onClick={() => hasDeepDive && setExpandedId(isOpen ? null : d.id)}
                  disabled={!hasDeepDive}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%', padding: '24px 8px', textAlign: 'left',
                    background: 'transparent', border: 'none', cursor: hasDeepDive ? 'pointer' : 'default',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flex: 1, minWidth: 0 }}>
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
                    {hasDeepDive && (
                      <ChevronDown style={{
                        width: 16, height: 16, color: G400,
                        transition: 'transform 200ms ease',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        flexShrink: 0,
                      }} />
                    )}
                  </div>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                    fontSize: 18, fontWeight: 500, color: color,
                    flexShrink: 0,
                  }}>
                    {d.score}
                  </span>
                </button>
                <div style={{ padding: '0 8px 24px' }}>
                  <AnimatedBar score={d.score} accent={accent} />
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', marginTop: 8,
                  }}>
                    <span style={{ fontSize: 11, color: G400 }}>{d.lowLabel}</span>
                    <span style={{ fontSize: 11, color: G400 }}>{d.highLabel}</span>
                  </div>
                </div>

                {/* Progressive reveal — interpretation + why it matters + action */}
                {isOpen && hasDeepDive && (
                  <div style={{
                    padding: '0 8px 32px',
                    animation: 'dimensionReveal 300ms cubic-bezier(0.16,1,0.3,1)',
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: 16,
                      marginTop: 4,
                    }}>
                      {/* What it means */}
                      {d.description && (
                        <div style={{
                          padding: '20px', background: WHITE, border: `1px solid ${G200}`,
                        }}>
                          <span style={{ ...monoStyle, color: accent, fontSize: 9, marginBottom: 10, display: 'block' }}>
                            What this means
                          </span>
                          <p style={{ fontSize: 14, color: G600, lineHeight: 1.6, margin: 0 }}>
                            {d.description}
                          </p>
                        </div>
                      )}
                      {/* Why it matters */}
                      {d.whyItMatters && (
                        <div style={{
                          padding: '20px', background: WHITE, border: `1px solid ${G200}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <Lightbulb style={{ width: 14, height: 14, color: accent }} />
                            <span style={{ ...monoStyle, color: accent, fontSize: 9 }}>
                              Why it matters
                            </span>
                          </div>
                          <p style={{ fontSize: 14, color: G600, lineHeight: 1.6, margin: 0 }}>
                            {d.whyItMatters}
                          </p>
                        </div>
                      )}
                      {/* What to do */}
                      {d.actionSuggestion && (
                        <div style={{
                          padding: '20px', background: WHITE, border: `1px solid ${G200}`,
                          gridColumn: '1 / -1',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <Target style={{ width: 14, height: 14, color: '#2D7A3E' }} />
                            <span style={{ ...monoStyle, color: '#2D7A3E', fontSize: 9 }}>
                              What to do next
                            </span>
                          </div>
                          <p style={{ fontSize: 14, color: G600, lineHeight: 1.6, margin: 0 }}>
                            {d.actionSuggestion}
                          </p>
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <AskNexusButton
                        dimension={d.name}
                        assessmentCode={assessmentCode}
                        accent={accent}
                        question={`On my ${assessmentName} results, my "${d.name}" dimension scored ${d.score} out of 100. What does this score mean, and how should I develop this dimension?`}
                      />
                    </div>
                  </div>
                )}
              </div>
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
