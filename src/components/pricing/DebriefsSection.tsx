/**
 * DebriefsSection.tsx — Human debriefs section (Batch 3 / Ticket 8).
 *
 * 4 session types: 30min $149, 45min $249, 60min $349, 90min CPI $599.
 * Tier session discount display (10/15/20/25% by tier). Annual +10%
 * stacking note (sessions only, not mile packs). Executive free session
 * (1×30min/mo) + Council free sessions (2×60min/mo) highlights.
 *
 * All pricing from DEBRIEF_SESSIONS + computeDebriefPrice — no hardcoded numbers.
 */
import React from 'react';
import { DS } from '@/tokens';
import {
  DEBRIEF_SESSIONS,
  TIER_SESSION_DISCOUNT_PCT,
  TIER_FREE_SESSIONS,
  ANNUAL_SESSION_STACKING_BONUS_PCT,
  computeDebriefPrice,
  PRICING_TIERS,
  type DebriefSessionType,
} from '@/config/pricingData';
import type { BillingCycle, PricingCurrency } from '@/config/tiers';

export interface DebriefsSectionProps {
  cycle: BillingCycle;
  currency: PricingCurrency;
}

export function DebriefsSection({ cycle, currency }: DebriefsSectionProps) {
  return (
    <section
      style={{
        background: DS.bgAlt,
        padding: '64px 24px',
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        {/* Section heading */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: DS.eyebrow,
              marginBottom: 16,
            }}
          >
            [Emily: debriefs eyebrow]
          </div>
          <h2
            style={{
              fontFamily: DS.headingFont,
              fontSize: 36,
              lineHeight: 1.2,
              color: DS.text,
              margin: 0,
              fontWeight: 600,
            }}
          >
            [Emily: debriefs headline]
          </h2>
          <p
            style={{
              fontFamily: DS.bodyFont,
              fontSize: 16,
              lineHeight: 1.5,
              color: DS.textSecondary,
              marginTop: 16,
              maxWidth: 640,
            }}
          >
            [Emily: debriefs subhead — human coach debrief sessions, what to expect.
            Mapped to positioning doc §debriefs.]
          </p>
        </div>

        {/* Session cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24,
            marginTop: 48,
          }}
        >
          {DEBRIEF_SESSIONS.map((session) => (
            <DebriefSessionCard
              key={session.id}
              session={session}
              cycle={cycle}
              currency={currency}
            />
          ))}
        </div>

        {/* Tier discount + annual stacking note */}
        <div
          style={{
            marginTop: 48,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}
        >
          {/* Tier session discounts */}
          <div
            style={{
              padding: '24px 32px',
              background: DS.card,
              border: `1px solid ${DS.border}`,
            }}
          >
            <h3
              style={{
                fontFamily: DS.headingFont,
                fontSize: 18,
                fontWeight: 600,
                color: DS.text,
                margin: '0 0 16px',
              }}
            >
              [Emily: tier discount heading]
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PRICING_TIERS.filter((t) => !t.isEntryTier).map((tier) => (
                <div
                  key={tier.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: DS.bodyFont,
                    fontSize: 14,
                    color: DS.textSecondary,
                  }}
                >
                  <span>{tier.displayName}</span>
                  <span style={{ fontWeight: 600, color: DS.text }}>
                    {tier.sessionDiscountPct}% off
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Annual stacking bonus */}
          <div
            style={{
              padding: '24px 32px',
              background: DS.card,
              border: `1px solid ${DS.border}`,
            }}
          >
            <h3
              style={{
                fontFamily: DS.headingFont,
                fontSize: 18,
                fontWeight: 600,
                color: DS.text,
                margin: '0 0 16px',
              }}
            >
              [Emily: annual stacking heading]
            </h3>
            <p
              style={{
                fontFamily: DS.bodyFont,
                fontSize: 14,
                lineHeight: 1.6,
                color: DS.textSecondary,
                margin: '0 0 12px',
              }}
            >
              [Emily: annual stacking explainer — +{ANNUAL_SESSION_STACKING_BONUS_PCT}% value
              on debrief sessions with annual billing. Sessions only — does not apply to mile packs.]
            </p>
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: 12,
                color: DS.accent,
              }}
            >
              {cycle === 'annual'
                ? `Active: +${ANNUAL_SESSION_STACKING_BONUS_PCT}% session value`
                : 'Switch to annual to activate'}
            </div>
          </div>
        </div>

        {/* Free session highlights */}
        <div
          style={{
            marginTop: 32,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}
        >
          {PRICING_TIERS.filter((t) => t.freeSessions !== null).map((tier) => (
            <FreeSessionHighlight
              key={tier.key}
              tierName={tier.displayName}
              freeSessions={tier.freeSessions!}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DebriefSessionCard({
  session,
  cycle,
  currency,
}: {
  session: DebriefSessionType;
  cycle: BillingCycle;
  currency: PricingCurrency;
}) {
  // Show the Council-tier price (max discount) as the headline, with list price struck through.
  const councilPrice = computeDebriefPrice(session, 'council', cycle, currency);
  const isCpi = session.isCpi;

  return (
    <div
      style={{
        background: DS.card,
        border: isCpi ? `2px solid ${DS.accent}` : `1px solid ${DS.border}`,
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {isCpi && (
        <div
          style={{
            position: 'absolute',
            top: -1,
            left: -1,
            right: -1,
            background: DS.accent,
            color: DS.bg,
            fontFamily: DS.monoFont,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textAlign: 'center',
            padding: '6px 0',
          }}
        >
          CPI Debrief
        </div>
      )}

      <div style={{ paddingTop: isCpi ? 28 : 0 }}>
        {/* Duration */}
        <div
          style={{
            fontFamily: DS.headingFont,
            fontSize: 22,
            fontWeight: 600,
            color: DS.text,
            marginBottom: 4,
          }}
        >
          {session.durationMinutes} minutes
        </div>

        {/* Coach type — placeholder */}
        <div
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 13,
            color: DS.muted,
            marginBottom: 16,
          }}
        >
          {session.coachTypePlaceholder}
        </div>

        {/* Price — list vs effective */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: DS.headingFont,
              fontSize: 28,
              fontWeight: 600,
              color: DS.text,
            }}
          >
            {formatPrice(currency, councilPrice.effectivePrice)}
          </div>
          {councilPrice.discountPct > 0 && (
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: 12,
                color: DS.muted,
                textDecoration: 'line-through',
              }}
            >
              {formatPrice(currency, councilPrice.listPrice)}
            </div>
          )}
        </div>

        {/* Description — placeholder */}
        <p
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 13,
            lineHeight: 1.5,
            color: DS.textSecondary,
            margin: '0 0 20px',
            flex: 1,
          }}
        >
          {session.descriptionPlaceholder}
        </p>

        {/* CTA */}
        <button
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 14,
            fontWeight: 600,
            color: DS.bg,
            background: isCpi ? DS.accent : DS.bgDark,
            border: 'none',
            padding: '12px 20px',
            cursor: 'pointer',
            transition: DS.transition,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = isCpi ? DS.accentHover : DS.text)}
          onMouseLeave={(e) => (e.currentTarget.style.background = isCpi ? DS.accent : DS.bgDark)}
        >
          [Emily: book session CTA]
        </button>
      </div>
    </div>
  );
}

function FreeSessionHighlight({
  tierName,
  freeSessions,
}: {
  tierName: string;
  freeSessions: { count: number; durationMinutes: 30 | 60; debriefId: string };
}) {
  return (
    <div
      style={{
        padding: '20px 24px',
        background: DS.bgDark,
        color: DS.bg,
      }}
    >
      <div
        style={{
          fontFamily: DS.monoFont,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: DS.accentLight,
          marginBottom: 8,
        }}
      >
        {tierName} — Included
      </div>
      <div
        style={{
          fontFamily: DS.headingFont,
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        {freeSessions.count} × {freeSessions.durationMinutes}-min session{freeSessions.count > 1 ? 's' : ''} / month
      </div>
      <div
        style={{
          fontFamily: DS.bodyFont,
          fontSize: 13,
          opacity: 0.7,
          marginTop: 4,
        }}
      >
        [Emily: {tierName} free session description]
      </div>
    </div>
  );
}

/** Format price for display. */
function formatPrice(currency: PricingCurrency, amount: number): string {
  if (currency === 'CNY') return `¥${amount}`;
  return `$${amount}`;
}
