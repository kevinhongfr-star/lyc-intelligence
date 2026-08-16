import React, { useEffect, useRef, useState } from 'react';
import {
  INK, G100, G200, G300, G400, G600, WHITE,
  monoStyle, containerStyle,
} from '../landing/shared';
import type { AssessmentResultsConfig } from './types';

interface Props {
  config: AssessmentResultsConfig;
}

/** Animated number counter: counts from 0 to target over ~1200ms */
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

function getScoreColor(score: number, accent: string): string {
  if (score >= 75) return '#2D7A3E';   // green
  if (score >= 50) return accent;       // accent
  if (score >= 35) return '#C97824';    // amber
  return '#9CA3AF';                      // gray
}

export function ResultsHero({ config }: Props) {
  const { assessmentName, accent, prefix, overallScore, archetype } = config;
  const animatedScore = useCountUp(overallScore);
  const scoreColor = getScoreColor(overallScore, accent);

  return (
    <section style={{
      padding: '160px 0 100px', textAlign: 'center', position: 'relative',
      background: `linear-gradient(to bottom, ${G100} 0%, ${'#F5F5F3'} 100%)`,
    }}>
      {/* M4 — Hero accent line */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 120, left: '50%', transform: 'translateX(-50%)',
        width: 2, height: 160,
        background: `linear-gradient(to bottom, ${accent} 0%, transparent 100%)`,
        pointerEvents: 'none',
      }} />
      <div style={containerStyle} className={`${prefix}-reveal`}>
        <span style={{ ...monoStyle, color: accent, marginBottom: 24, display: 'inline-block' }}>
          {assessmentName} Results
        </span>

        {/* Overall score — large, prominent */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
            fontSize: 96, fontWeight: 700, lineHeight: 1, color: scoreColor,
          }}>
            {animatedScore}
          </div>
          <div style={{
            ...monoStyle, color: G400, marginTop: 8,
          }}>
            Overall score / 100
          </div>
        </div>

        {/* Archetype badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          padding: '12px 24px',
          border: `1px solid ${accent}`,
          marginBottom: 24,
        }}>
          <span style={{ ...monoStyle, color: accent, fontSize: 10 }}>Archetype</span>
          <span style={{
            fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
            fontSize: 20, fontWeight: 700, color: INK,
          }}>
            {archetype.canonName ?? archetype.name}
          </span>
        </div>

        <p style={{
          fontSize: 17, color: G600, lineHeight: 1.6,
          maxWidth: 520, margin: '0 auto',
        }}>
          {archetype.description}
        </p>
      </div>
    </section>
  );
}
