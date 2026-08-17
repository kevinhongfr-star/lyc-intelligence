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
  const { assessmentName, assessmentCode, accent, prefix, nexusPath, archetype, overallScore, dimensions } = config;
  const btnPrimary = makeBtnPrimary(accent);

  // Build a contextual entry question grounded in this user's actual results
  // so the NEXUS conversation starts from their data, not a generic prompt.
  const lowest = dimensions.length
    ? [...dimensions].sort((a, b) => a.score - b.score)[0]
    : null;
  const contextualQuestion =
    `I just completed my ${assessmentName} assessment. My archetype is "${archetype.canonName ?? archetype.name}" ` +
    `and my overall score is ${overallScore}.` +
    (lowest ? ` My lowest dimension is "${lowest.name}" at ${lowest.score}.` : '') +
    ` Help me understand what to prioritise and build a 90-day development plan.`;
  const nexusEntryPath = `${nexusPath}?q=${encodeURIComponent(contextualQuestion)}&code=${encodeURIComponent(assessmentCode)}`;

  return (
    <section style={{ padding: '120px 0', background: INK }}>
      <div style={containerStyle} className={`${prefix}-reveal`}>
        {/* Accent line */}
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
              NEXUS
            </span>
          </div>
          <h2 style={{
            fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif", fontWeight: 700,
            fontSize: 36, lineHeight: 1.2, color: WHITE, marginBottom: 20,
          }}>
            Talk through your <em style={{ fontWeight: 400 }}>{assessmentName}</em> results
          </h2>
          <p style={{
            fontSize: 17, color: G600, lineHeight: 1.6, marginBottom: 12,
          }}>
            Your results are now synced with NEXUS. Start from your {(archetype.canonName ?? archetype.name).toLowerCase()} profile{lowest ? <> and your <em style={{ color: WHITE, fontStyle: 'normal' }}>{lowest.name}</em> dimension</> : null}, and NEXUS will help you turn the diagnostic into a development plan you can act on this quarter.
          </p>
          <p style={{
            fontSize: 13, color: G600, lineHeight: 1.6, marginBottom: 40, fontStyle: 'italic',
          }}>
            NEXUS carries your assessment context into every reply — no need to re-explain your scores.
          </p>
          <Link to={nexusEntryPath} style={btnPrimary} {...ctaCompressHandlers}
            onMouseEnter={(e) => { e.currentTarget.style.background = WHITE; e.currentTarget.style.color = INK; e.currentTarget.style.borderColor = WHITE; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = accent; e.currentTarget.style.color = WHITE; e.currentTarget.style.borderColor = accent; }}>
            Continue in NEXUS <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </div>
    </section>
  );
}
