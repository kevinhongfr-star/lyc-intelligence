/**
 * W1-T2 — SessionCard.tsx
 *
 * Reusable session card component for the debrief booking system.
 * 4 instances for 4 session types in SESSION_CATALOG.
 *
 * Follows TierCard.tsx patterns:
 *  - Inline style objects, no Tailwind
 *  - Radius = 0 always (brand rule)
 *  - Font trio: serif headings, sans body, mono labels
 *  - DS/ACCENT tokens from @/tokens
 *  - ALL pricing math via calculateSessionPrice() from sessions.ts
 *  - All copy/data from sessions.ts config — no hardcoded descriptions
 *
 * Fields:
 *  - Session name, duration, coach type label
 *  - Base price (strikethrough when userTier + discount apply)
 *  - Tier-discounted price with "% off" badge (when userTier provided)
 *  - Annual stacking indicator: "Extra 10% off with annual plan"
 *  - Free session indicator: "You have X free session(s) this month"
 *  - "Best for" bullets (3) from session.bestForPlaceholders
 *  - "What you get" collapsed section from session.whatYouGetPlaceholders
 *  - CPI deep-dive = flagship badge + border accent
 *  - Council-only soft gate: "Council-only" + upgrade CTA
 */
import React, { useState } from 'react';
import { DS, ACCENT } from '@/tokens';
import {
  type SessionType,
  type BillingCycle,
  type PricingCurrency,
  calculateSessionPrice,
  formatSessionPrice,
  COACH_TYPES,
  getComplimentaryAllocation,
  allocationCoversSession,
} from '@/config/sessions';
import { tierMeets, tierDisplayName, type TierKey } from '@/config/tiers';

export interface SessionCardProps {
  session: SessionType;
  userTier?: TierKey | string | null | undefined;
  billingCycle?: BillingCycle;
  currency?: PricingCurrency;
  showCta?: boolean;
  onBookClick?: (session: SessionType) => void;
  complimentaryRemaining?: number;
}

export function SessionCard({
  session,
  userTier = null,
  billingCycle = 'monthly',
  currency = 'USD',
  showCta = true,
  onBookClick,
  complimentaryRemaining,
}: SessionCardProps) {
  const [whatYouGetOpen, setWhatYouGetOpen] = useState(false);

  const pricing = calculateSessionPrice({
    session,
    userTier,
    billingCycle,
    currency,
  });

  const coachMeta = COACH_TYPES[session.coachType];
  const userMeetsTier = tierMeets(userTier, session.requiredTier);

  const alloc = getComplimentaryAllocation(userTier);
  const coverageStatus = alloc ? allocationCoversSession(alloc, session) : 'none';
  const isEligibleComplimentary =
    session.eligibleForComplimentary && coverageStatus !== 'none';
  const showFreeIndicator =
    isEligibleComplimentary &&
    complimentaryRemaining !== undefined &&
    complimentaryRemaining > 0;

  const isCpiFlagship = session.isCpiFlagship;

  return (
    <div
      style={{
        background: DS.card,
        border: isCpiFlagship
          ? `2px solid ${ACCENT}`
          : `1px solid ${DS.border}`,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: DS.transition,
        boxShadow: isCpiFlagship ? DS.shadowLg : DS.shadow,
      }}
    >
      {isCpiFlagship && (
        <div
          style={{
            position: 'absolute',
            top: -1,
            left: -1,
            right: -1,
            background: ACCENT,
            color: DS.bg,
            fontFamily: DS.monoFont,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textAlign: 'center',
            padding: '6px 0',
            fontWeight: 600,
          }}
        >
          Flagship
        </div>
      )}

      <div
        style={{
          padding: isCpiFlagship ? '40px 24px 24px' : '24px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        {/* Session name */}
        <div
          style={{
            fontFamily: DS.headingFont,
            fontSize: 22,
            fontWeight: 600,
            color: DS.text,
            marginBottom: 4,
            lineHeight: 1.25,
          }}
        >
          {session.displayName}
        </div>

        {/* Short descriptor */}
        <p
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 14,
            lineHeight: 1.5,
            color: DS.textSecondary,
            margin: '0 0 16px',
          }}
        >
          {session.shortDescriptor}
        </p>

        {/* Duration + Coach type meta row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: DS.muted,
              padding: '4px 10px',
              background: DS.bgAlt,
              border: `1px solid ${DS.border}`,
            }}
          >
            {session.durationMinutes} MIN
          </div>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: ACCENT,
              padding: '4px 10px',
              background: `${ACCENT}14`,
              border: `1px solid ${ACCENT}40`,
            }}
          >
            {coachMeta.displayName}
          </div>
        </div>

        {/* Pricing block */}
        <div style={{ marginBottom: 20 }}>
          {pricing.isFullyComplimentary ? (
            <div
              style={{
                fontFamily: DS.headingFont,
                fontSize: 32,
                fontWeight: 600,
                color: DS.text,
              }}
            >
              Complimentary
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                {/* Base price (strikethrough if any discount applies) */}
                {pricing.hasAnyDiscount && (
                  <span
                    style={{
                      fontFamily: DS.bodyFont,
                      fontSize: 16,
                      color: DS.mutedDim,
                      textDecoration: 'line-through',
                    }}
                  >
                    {formatSessionPrice(pricing.basePrice, currency)}
                  </span>
                )}

                {/* Final price */}
                <span
                  style={{
                    fontFamily: DS.headingFont,
                    fontSize: 32,
                    fontWeight: 600,
                    color: DS.text,
                  }}
                >
                  {formatSessionPrice(pricing.finalPrice, currency)}
                </span>

                {/* Tier discount badge */}
                {pricing.tierDiscountPercent > 0 && (
                  <span
                    style={{
                      fontFamily: DS.monoFont,
                      fontSize: 11,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: DS.bg,
                      background: ACCENT,
                      padding: '4px 10px',
                      fontWeight: 600,
                    }}
                  >
                    {pricing.tierDiscountLabel}
                  </span>
                )}
              </div>

              {/* No-discount base price display */}
              {!pricing.hasAnyDiscount && (
                <div
                  style={{
                    fontFamily: DS.monoFont,
                    fontSize: 12,
                    color: DS.muted,
                    marginTop: 4,
                  }}
                >
                  Base price
                </div>
              )}

              {/* Annual stacking note */}
              {billingCycle === 'annual' && pricing.annualDiscountPercent > 0 && (
                <div
                  style={{
                    fontFamily: DS.monoFont,
                    fontSize: 12,
                    color: ACCENT,
                    marginTop: 6,
                  }}
                >
                  Extra {pricing.annualDiscountPercent}% off with annual plan
                </div>
              )}

              {/* Tier discount breakdown note */}
              {pricing.tierDiscountPercent > 0 && userTier && (
                <div
                  style={{
                    fontFamily: DS.monoFont,
                    fontSize: 12,
                    color: DS.muted,
                    marginTop: 4,
                  }}
                >
                  {tierDisplayName(userTier)} member pricing
                </div>
              )}
            </>
          )}

          {/* Complimentary sessions remaining */}
          {showFreeIndicator && (
            <div
              style={{
                marginTop: 12,
                padding: '10px 14px',
                background: `${ACCENT}14`,
                border: `1px solid ${ACCENT}40`,
                fontFamily: DS.bodyFont,
                fontSize: 13,
                color: DS.text,
              }}
            >
              You have{' '}
              <span style={{ fontWeight: 600, color: ACCENT }}>
                {complimentaryRemaining}
              </span>{' '}
              free session{complimentaryRemaining > 1 ? 's' : ''} this month
            </div>
          )}
        </div>

        {/* Council-only soft gate OR Book CTA */}
        {showCta && (
          <div style={{ marginBottom: 20 }}>
            {!userMeetsTier ? (
              <div
                style={{
                  padding: '16px',
                  background: DS.bgAlt,
                  border: `1px solid ${DS.border}`,
                }}
              >
                <div
                  style={{
                    fontFamily: DS.monoFont,
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: DS.muted,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {tierDisplayName(session.requiredTier)}-only
                </div>
                <div
                  style={{
                    fontFamily: DS.bodyFont,
                    fontSize: 14,
                    color: DS.textSecondary,
                    lineHeight: 1.5,
                    marginBottom: 12,
                  }}
                >
                  This session is available exclusively to{' '}
                  <span style={{ fontWeight: 600, color: DS.text }}>
                    {tierDisplayName(session.requiredTier)}
                  </span>{' '}
                  members.
                </div>
                <a
                  href="/pricing"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: DS.bodyFont,
                    fontSize: 13,
                    fontWeight: 600,
                    color: DS.bg,
                    background: DS.bgDark,
                    border: `1px solid ${DS.bgDark}`,
                    padding: '10px 20px',
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    cursor: 'pointer',
                    transition: DS.transition,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = DS.text)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = DS.bgDark)}
                >
                  Upgrade to {tierDisplayName(session.requiredTier)} →
                </a>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onBookClick?.(session)}
                style={{
                  width: '100%',
                  fontFamily: DS.bodyFont,
                  fontSize: 14,
                  fontWeight: 600,
                  color: DS.bg,
                  background: isCpiFlagship ? ACCENT : DS.bgDark,
                  border: `1px solid ${isCpiFlagship ? ACCENT : DS.bgDark}`,
                  padding: '14px 24px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  transition: DS.transition,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isCpiFlagship ? DS.accentHover : DS.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isCpiFlagship ? ACCENT : DS.bgDark;
                }}
              >
                Book {session.durationMinutes}-Min Session
              </button>
            )}
          </div>
        )}

        {/* "Best for" bullets */}
        <div
          style={{
            borderTop: `1px solid ${DS.border}`,
            paddingTop: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: DS.muted,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            Best For
          </div>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {session.bestForPlaceholders.slice(0, 3).map((bullet, i) => (
              <li
                key={i}
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: DS.textSecondary,
                  display: 'flex',
                  gap: 10,
                }}
              >
                <span style={{ color: ACCENT, flexShrink: 0 }}>✓</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* "What you get" collapsible section */}
        <div style={{ marginTop: 'auto', borderTop: `1px solid ${DS.border}` }}>
          <button
            type="button"
            onClick={() => setWhatYouGetOpen(!whatYouGetOpen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 0',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: DS.transition,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = DS.bgAlt)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span
              style={{
                fontFamily: DS.monoFont,
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: DS.text,
                fontWeight: 600,
              }}
            >
              What You Get
            </span>
            <span
              style={{
                fontFamily: DS.monoFont,
                fontSize: 11,
                color: DS.muted,
                transition: `transform ${DS.transition}`,
                transform: whatYouGetOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                display: 'inline-block',
              }}
            >
              ▾
            </span>
          </button>
          <div
            style={{
              maxHeight: whatYouGetOpen ? 400 : 0,
              overflow: 'hidden',
              transition: `max-height ${DS.transition}`,
              paddingBottom: whatYouGetOpen ? 4 : 0,
            }}
          >
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {session.whatYouGetPlaceholders.map((item, i) => (
                <li
                  key={i}
                  style={{
                    fontFamily: DS.bodyFont,
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: DS.textSecondary,
                    display: 'flex',
                    gap: 10,
                  }}
                >
                  <span style={{ color: ACCENT, flexShrink: 0 }}>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionCard;
