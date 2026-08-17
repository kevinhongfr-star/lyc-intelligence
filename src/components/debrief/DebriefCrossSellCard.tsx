import React, { useMemo, useState } from 'react';
import {
  SESSION_TYPES,
  type SessionType,
  type SessionSlug,
  calculateSessionPrice,
  formatSessionPrice,
} from '@/config/sessions';
import { tierDisplayName, type TierKey } from '@/config/tiers';
import { DS } from '@/tokens';

export type AssessmentDepth = 'cpi' | 'standard' | 'light';

export interface DebriefCrossSellCardProps {
  depth?: AssessmentDepth;
  userTier?: TierKey | string | null;
  billingCycle?: 'monthly' | 'annual';
  currency?: 'USD' | 'CNY';
  onBookClick?: (sessionSlug: string) => void;
  onDismiss?: () => void;
}

const MOCK_USER = {
  tier: 'executive' as TierKey,
  billingCycle: 'annual' as const,
  currency: 'USD' as const,
};

function getRecommendedSession(depth: AssessmentDepth): SessionSlug {
  switch (depth) {
    case 'cpi':
      return 'cpi-deepdive-90';
    case 'standard':
      return 'executive-45';
    case 'light':
    default:
      return 'career-30';
  }
}

const ALTERNATIVES_BY_DEPTH: Record<AssessmentDepth, SessionSlug[]> = {
  cpi:      ['cpi-deepdive-90', 'leadership-60', 'executive-45'],
  standard: ['executive-45', 'leadership-60', 'career-30'],
  light:    ['career-30', 'executive-45', 'leadership-60'],
};

function getRationaleForDepth(depth: AssessmentDepth): string {
  switch (depth) {
    case 'cpi':
      return 'NEXUS recommends a 90-minute CPI specialist debrief to unpack your full pipeline diagnostic, China leadership context, and personalised action plan.';
    case 'standard':
      return 'NEXUS recommends a 45-minute executive session to translate your assessment insights into concrete next-step strategy with a certified coach.';
    case 'light':
    default:
      return 'NEXUS recommends a quick 30-minute career check-in to validate your positioning and refine your next-move strategy.';
  }
}

const SUCCESS = '#16A34A';

export function DebriefCrossSellCard({
  depth = 'standard',
  userTier = MOCK_USER.tier,
  billingCycle = MOCK_USER.billingCycle,
  currency = MOCK_USER.currency,
  onBookClick,
  onDismiss,
}: DebriefCrossSellCardProps) {
  const alternatives = ALTERNATIVES_BY_DEPTH[depth] ?? ALTERNATIVES_BY_DEPTH.standard;
  const [selectedSlug, setSelectedSlug] = useState<SessionSlug>(getRecommendedSession(depth));
  const [dismissed, setDismissed] = useState(false);

  const selectedSession: SessionType | undefined = useMemo(
    () => SESSION_TYPES[selectedSlug],
    [selectedSlug],
  );

  const breakdown = useMemo(() => {
    if (!selectedSession) return null;
    return calculateSessionPrice({
      session: selectedSession,
      userTier,
      billingCycle,
      currency,
    });
  }, [selectedSession, userTier, billingCycle, currency]);

  if (dismissed || !selectedSession || !breakdown) return null;

  return (
    <div
      style={{
        position: 'relative',
        background: DS.card,
        border: `1px solid ${DS.accent}33`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${DS.accent}, ${DS.accentLight})`,
        }}
      />

      {onDismiss && (
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss();
          }}
          aria-label="Dismiss suggestion"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: DS.muted,
            fontFamily: DS.bodyFont,
            fontSize: 16,
            transition: DS.transition,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = DS.text;
            e.currentTarget.style.background = DS.bgAlt;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = DS.muted;
            e.currentTarget.style.background = 'transparent';
          }}
        >
          ✕
        </button>
      )}

      <div style={{ padding: '20px 20px 16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontFamily: DS.monoFont,
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '3px 8px',
              background: `${DS.accent}12`,
              color: DS.accent,
              fontWeight: 600,
            }}
          >
            NEXUS Suggests
          </span>
          {depth === 'cpi' && (
            <span
              style={{
                fontFamily: DS.monoFont,
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '3px 8px',
                background: DS.bgDark,
                color: DS.bg,
                fontWeight: 600,
              }}
            >
              CPI Flagship
            </span>
          )}
        </div>

        <h3
          style={{
            fontFamily: DS.headingFont,
            fontSize: 18,
            fontWeight: 600,
            color: DS.text,
            margin: '0 0 8px',
            lineHeight: 1.3,
          }}
        >
          Go deeper with a live debrief
        </h3>

        <p
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 13,
            lineHeight: 1.55,
            color: DS.textSecondary,
            margin: '0 0 16px',
          }}
        >
          {getRationaleForDepth(depth)}
        </p>

        <div
          style={{
            border: `1px solid ${DS.border}`,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              borderBottom: `1px solid ${DS.border}`,
              background: DS.bgAlt,
            }}
          >
            {alternatives.map((slug, idx) => {
              const sess = SESSION_TYPES[slug];
              if (!sess) return null;
              const isActive = slug === selectedSlug;
              return (
                <button
                  key={slug}
                  onClick={() => setSelectedSlug(slug)}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    background: isActive ? DS.card : 'transparent',
                    border: 'none',
                    borderRight: idx < alternatives.length - 1 ? `1px solid ${DS.border}` : 'none',
                    borderBottom: isActive ? '2px solid transparent' : 'none',
                    fontFamily: DS.monoFont,
                    fontSize: 11,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? DS.text : DS.muted,
                    cursor: 'pointer',
                    transition: DS.transition,
                    position: 'relative',
                    textAlign: 'center',
                    lineHeight: 1.3,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = DS.cardHover;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: -1,
                        left: 0,
                        right: 0,
                        height: 2,
                        background: DS.accent,
                      }}
                    />
                  )}
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>
                    {sess.durationMinutes}min
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 400,
                      color: DS.muted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {sess.coachType.replace('_', ' ')}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ padding: 14 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 6,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: DS.bodyFont,
                    fontSize: 14,
                    fontWeight: 600,
                    color: DS.text,
                    marginBottom: 2,
                  }}
                >
                  {selectedSession.displayName}
                </div>
                <div
                  style={{
                    fontFamily: DS.bodyFont,
                    fontSize: 12,
                    color: DS.muted,
                    lineHeight: 1.4,
                  }}
                >
                  {selectedSession.shortDescriptor}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {breakdown.hasAnyDiscount ? (
                  <>
                    <div
                      style={{
                        fontFamily: DS.bodyFont,
                        fontSize: 11,
                        color: DS.muted,
                        textDecoration: 'line-through',
                      }}
                    >
                      {formatSessionPrice(breakdown.basePrice, currency)}
                    </div>
                    <div
                      style={{
                        fontFamily: DS.headingFont,
                        fontSize: 18,
                        fontWeight: 600,
                        color: DS.text,
                      }}
                    >
                      {formatSessionPrice(breakdown.finalPrice, currency)}
                    </div>
                    <div
                      style={{
                        fontFamily: DS.monoFont,
                        fontSize: 10,
                        color: SUCCESS,
                        marginTop: 1,
                      }}
                    >
                      Save {breakdown.totalSavingsPercent}%
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      fontFamily: DS.headingFont,
                      fontSize: 18,
                      fontWeight: 600,
                      color: DS.text,
                    }}
                  >
                    {formatSessionPrice(breakdown.finalPrice, currency)}
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
                marginTop: 8,
              }}
            >
              <span
                style={{
                  fontFamily: DS.monoFont,
                  fontSize: 10,
                  padding: '2px 7px',
                  background: DS.bgAlt,
                  color: DS.textSecondary,
                }}
              >
                {selectedSession.durationMinutes} min
              </span>
              {breakdown.tierDiscountPercent > 0 && (
                <span
                  style={{
                    fontFamily: DS.monoFont,
                    fontSize: 10,
                    padding: '2px 7px',
                    background: `${SUCCESS}10`,
                    color: SUCCESS,
                  }}
                >
                  {tierDisplayName(userTier)} {breakdown.tierDiscountLabel}
                </span>
              )}
              {breakdown.annualDiscountPercent > 0 && (
                <span
                  style={{
                    fontFamily: DS.monoFont,
                    fontSize: 10,
                    padding: '2px 7px',
                    background: `${SUCCESS}10`,
                    color: SUCCESS,
                  }}
                >
                  Annual +{breakdown.annualDiscountPercent}%
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => onBookClick?.(selectedSession.slug)}
          style={{
            width: '100%',
            fontFamily: DS.bodyFont,
            fontSize: 15,
            fontWeight: 600,
            color: DS.bg,
            background: DS.accent,
            border: 'none',
            padding: '13px 20px',
            cursor: 'pointer',
            transition: DS.transition,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = DS.accentDark;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = DS.accent;
          }}
        >
          Quick book
          <span
            style={{
              display: 'inline-block',
              transform: 'translateY(-1px)',
            }}
          >
            →
          </span>
        </button>

        <p
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 11,
            color: DS.muted,
            textAlign: 'center',
            margin: '12px 0 0',
            lineHeight: 1.4,
          }}
        >
          NEXUS suggests once — no pressure. Your conversation continues uninterrupted.
        </p>
      </div>
    </div>
  );
}
