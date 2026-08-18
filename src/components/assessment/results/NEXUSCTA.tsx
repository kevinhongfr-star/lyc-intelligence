import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare } from 'lucide-react';
import {
  INK, WHITE, G600,
  containerStyle, makeBtnPrimary,
  ctaCompressHandlers,
} from '../landing/shared';
import type { AssessmentResultsConfig } from './types';

interface Props {
  config: AssessmentResultsConfig;
}

export function NEXUSCTA({ config }: Props) {
  const { assessmentName, accent, prefix, nexusPath } = config;
  const btnPrimary = makeBtnPrimary(accent);

  return (
    <section style={{ padding: '120px 0', background: INK }}>
      <div style={containerStyle} className={`${prefix}-reveal`}>
        {/* M4 — Accent line */}
        <div style={{
          width: 48, height: 3, background: accent, margin: '0 auto 24px',
        }} />
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            marginBottom: 24,
          }}>
            <MessageSquare style={{ width: 20, height: 20, color: accent }} />
            <span style={{
              fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
              fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em',
              color: accent, fontWeight: 500,
            }}>
              NEXUS AI Coach
            </span>
          </div>
          <h2 style={{
            fontFamily: "'Libre Baskerville', Georgia, serif", fontWeight: 700,
            fontSize: 36, lineHeight: 1.2, color: WHITE, marginBottom: 20,
          }}>
            Keep the momentum <em style={{ fontWeight: 400 }}>going</em>
          </h2>
          <p style={{
            fontSize: 17, color: G600, lineHeight: 1.6, marginBottom: 40,
          }}>
            Your {assessmentName} results are now synced with NEXUS. Start a conversation with your AI coach to build a personalized 90-day development plan.
          </p>
          <Link to={nexusPath} style={btnPrimary} {...ctaCompressHandlers}
            onMouseEnter={(e) => { e.currentTarget.style.background = WHITE; e.currentTarget.style.color = INK; e.currentTarget.style.borderColor = WHITE; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = accent; e.currentTarget.style.color = WHITE; e.currentTarget.style.borderColor = accent; }}>
            Continue in NEXUS <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </div>
    </section>
  );
}
