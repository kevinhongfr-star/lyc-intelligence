/**
 * W4-T11 — Debrief Cross-Sell Card (in-chat booking flow integration).
 *
 * Shown in NEXUS chat after a strong assessment result debrief. Recommends
 * a human debrief session based on the assessment's depth tier, then lets
 * the member quick-book or dismiss.
 *
 * Recommendation logic:
 *   CPI / flagship   → cpi-deepdive-90  (90min CPI Deep-Dive)
 *   signature (3mi)  → leadership-60    (60min Leadership Strategy)
 *   standard  (2mi)  → executive-45     (45min Executive Deep-Dive)
 *   light     (1mi)  → career-30        (30min Career Check-In)
 *
 * Rules:
 *   - NEXUS naming: always "NEXUS suggests", NEVER "the AI" or "the coach"
 *   - Soft sell, not pushy. Suggests once, no pressure.
 *   - Session chips show "Recommended" badge on logic-selected session.
 *   - Prices computed via calculateSessionPrice() — tier='explorer' default.
 *   - Zero border radius. Inline styles only. Serif head, sans body, mono labels.
 */
import React, { useMemo, useState } from 'react';
import { Calendar, Clock, X, Zap, ShieldCheck, ChevronRight } from 'lucide-react';
import { DS, ACCENT, ACCENT_DARK } from '@/tokens';
import {
  SESSION_TYPES,
  type SessionSlug,
  calculateSessionPrice,
  formatSessionPrice,
} from '@/config/sessions';

// ── TYPES ───────────────────────────────────────────────────────────

export type AssessmentDepth = 'light' | 'standard' | 'signature' | 'flagship';

export interface DebriefCrossSellCardProps {
  assessmentCode: string;
  assessmentName: string;
  assessmentDepth: AssessmentDepth;
  onBookClick: (sessionSlug: string) => void;
  onDismiss: () => void;
}

// ── RECOMMENDATION LOGIC ────────────────────────────────────────────

function getRecommendedSlug(
  assessmentCode: string,
  assessmentDepth: AssessmentDepth
): SessionSlug {
  const upper = assessmentCode.toUpperCase();

  if (upper === 'CPI' || assessmentDepth === 'flagship') {
    return 'cpi-deepdive-90';
  }
  if (assessmentDepth === 'signature') {
    return 'leadership-60';
  }
  if (assessmentDepth === 'standard') {
    return 'executive-45';
  }
  return 'career-30';
}

const SESSION_CHIP_ORDER: SessionSlug[] = [
  'career-30',
  'executive-45',
  'leadership-60',
  'cpi-deepdive-90',
];

function chipLabel(slug: SessionSlug): string {
  const s = SESSION_TYPES[slug];
  if (slug === 'cpi-deepdive-90') return `CPI ${s.durationMinutes}min`;
  return `${s.durationMinutes}min`;
}

// ── CARD ────────────────────────────────────────────────────────────

export function DebriefCrossSellCard(props: DebriefCrossSellCardProps) {
  const { assessmentCode, assessmentName, assessmentDepth, onBookClick, onDismiss } = props;

  const recommendedSlug = useMemo(
    () => getRecommendedSlug(assessmentCode, assessmentDepth),
    [assessmentCode, assessmentDepth]
  );

  const [selectedSlug, setSelectedSlug] = useState<SessionSlug>(recommendedSlug);

  const selectedSession = SESSION_TYPES[selectedSlug];

  const priceBreakdown = useMemo(
    () =>
      calculateSessionPrice({
        session: selectedSession,
        userTier: 'explorer',
        billingCycle: 'monthly',
        currency: 'USD',
      }),
    [selectedSession]
  );

  return (
    <div
      data-debrief-cross-sell
      style={{
        background: DS.card,
        border: `1px solid ${DS.border}`,
        maxWidth: 480,
        width: '100%',
        position: 'relative',
        fontFamily: DS.bodyFont,
      }}
    >
      {/* Accent strip */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: ACCENT,
        }}
      />

      {/* Dismiss button */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss suggestion"
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          width: 28,
          height: 28,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: DS.muted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          transition: DS.transition,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = DS.text)}
        onMouseLeave={(e) => (e.currentTarget.style.color = DS.muted)}
      >
        <X size={16} />
      </button>

      <div style={{ padding: '28px 24px 24px' }}>
        {/* Eyebrow */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: DS.monoFont,
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: ACCENT,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          <Zap size={12} />
          NEXUS suggests
        </div>

        {/* Header */}
        <h3
          style={{
            fontFamily: DS.headingFont,
            fontSize: 22,
            fontWeight: 700,
            color: DS.text,
            margin: 0,
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
          }}
        >
          Go deeper with a live debrief
        </h3>

        {/* Subtext */}
        <p
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 14,
            lineHeight: 1.55,
            color: DS.textSecondary,
            margin: '10px 0 20px',
          }}
        >
          [NEXUS voice copy placeholder — soft sell, not pushy: Your {assessmentName} results show
          strong signals. A live debrief can turn this into a concrete action plan.]
        </p>

        {/* Recommended session highlight */}
        <div
          style={{
            background: `${ACCENT}0A`,
            border: `1px solid ${ACCENT}26`,
            padding: '16px 18px',
            marginBottom: 20,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 14,
              background: ACCENT,
              color: DS.bg,
              fontFamily: DS.monoFont,
              fontSize: 9,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              padding: '3px 8px',
              fontWeight: 600,
            }}
          >
            Recommended
          </div>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: 10,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: DS.muted,
              marginBottom: 6,
              paddingRight: 110,
            }}
          >
            Selected session
          </div>
          <div
            style={{
              fontFamily: DS.headingFont,
              fontSize: 18,
              fontWeight: 600,
              color: DS.text,
              lineHeight: 1.3,
              marginBottom: 4,
            }}
          >
            {selectedSession.displayName}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              fontFamily: DS.bodyFont,
              fontSize: 13,
              color: DS.textSecondary,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Clock size={13} />
              {selectedSession.durationMinutes} min
            </span>
            <span style={{ color: DS.borderStrong }}>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={13} />
              {selectedSession.coachType.replace('_', ' ')}
            </span>
            <span style={{ color: DS.borderStrong }}>·</span>
            <span
              style={{
                fontFamily: DS.headingFont,
                fontSize: 18,
                fontWeight: 700,
                color: ACCENT,
              }}
            >
              {formatSessionPrice(priceBreakdown.finalPrice, 'USD')}
            </span>
          </div>
        </div>

        {/* Session selector chips */}
        <div
          style={{
            fontFamily: DS.monoFont,
            fontSize: 10,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: DS.muted,
            marginBottom: 10,
            fontWeight: 500,
          }}
        >
          Choose session length
        </div>
        <div
          className="debrief-chip-row"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            marginBottom: 20,
          }}
        >
          {SESSION_CHIP_ORDER.map((slug) => {
            const session = SESSION_TYPES[slug];
            const isSelected = selectedSlug === slug;
            const isRecommended = slug === recommendedSlug;

            return (
              <button
                key={slug}
                type="button"
                onClick={() => setSelectedSlug(slug)}
                style={{
                  position: 'relative',
                  background: isSelected ? DS.bgDark : DS.bg,
                  color: isSelected ? DS.bg : DS.text,
                  border: isSelected
                    ? `1px solid ${DS.bgDark}`
                    : `1px solid ${isRecommended ? ACCENT : DS.border}`,
                  padding: '12px 4px 14px',
                  cursor: 'pointer',
                  fontFamily: DS.bodyFont,
                  fontSize: 12,
                  fontWeight: 600,
                  textAlign: 'center',
                  transition: DS.transition,
                  lineHeight: 1.3,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = ACCENT;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = isRecommended ? ACCENT : DS.border;
                  }
                }}
              >
                <div
                  style={{
                    fontFamily: DS.monoFont,
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    marginBottom: 4,
                  }}
                >
                  {chipLabel(slug)}
                </div>
                <div
                  style={{
                    fontFamily: DS.headingFont,
                    fontSize: 13,
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  {formatSessionPrice(
                    calculateSessionPrice({
                      session,
                      userTier: 'explorer',
                      billingCycle: 'monthly',
                      currency: 'USD',
                    }).finalPrice,
                    'USD'
                  )}
                </div>
                {isRecommended && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -1,
                      left: '50%',
                      transform: 'translateX(-50%) translateY(100%)',
                      fontFamily: DS.monoFont,
                      fontSize: 8,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: isSelected ? DS.bg : ACCENT,
                      background: isSelected ? ACCENT : 'transparent',
                      padding: '1px 6px',
                      border: isSelected ? 'none' : `1px solid ${ACCENT}50`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Rec
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* CTA buttons */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <button
            type="button"
            onClick={() => onBookClick(selectedSlug)}
            style={{
              flex: 1,
              minHeight: 44,
              background: ACCENT,
              color: DS.bg,
              border: `1px solid ${ACCENT}`,
              fontFamily: DS.bodyFont,
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: DS.transition,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_DARK)}
            onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
          >
            Quick book
            <ChevronRight size={14} />
          </button>
          <button
            type="button"
            onClick={onDismiss}
            style={{
              minHeight: 44,
              background: DS.bg,
              color: DS.textSecondary,
              border: `1px solid ${DS.border}`,
              fontFamily: DS.bodyFont,
              fontSize: 13,
              fontWeight: 600,
              padding: '12px 18px',
              cursor: 'pointer',
              transition: DS.transition,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = DS.bgAlt;
              e.currentTarget.style.color = DS.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = DS.bg;
              e.currentTarget.style.color = DS.textSecondary;
            }}
          >
            Maybe later
          </button>
        </div>

        {/* Small print */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            fontFamily: DS.bodyFont,
            fontSize: 12,
            lineHeight: 1.45,
            color: DS.muted,
          }}
        >
          <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 1, color: DS.mutedDim }} />
          <span>
            NEXUS suggests once — no pressure. Reschedule or cancel anytime up to 24h before.
          </span>
        </div>
      </div>

      <style>{`
        @media (max-width: 420px) {
          [data-debrief-cross-sell] .debrief-chip-row { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

export default DebriefCrossSellCard;
