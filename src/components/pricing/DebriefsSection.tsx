/**
 * DebriefsSection.tsx — Human debrief sessions section (Batch 3 / Ticket 8).
 *
 * 4 session types: 30min $149, 45min $249, 60min $349, 90min CPI $599.
 * Tier session discount display (10/15/20/25% off by tier).
 * Annual +10% stacking note (sessions only, not mile packs).
 * Executive free session (1×30min/mo) + Council free sessions (2×60min/mo) highlights.
 *
 * All prices from DEBRIEF_SESSIONS in pricingData.ts. Tier discounts from
 * TIER_SESSION_DISCOUNT_PCT. Free session allowances from TIER_FREE_SESSIONS.
 */
import React from 'react';
import { DS } from '@/tokens';
import {
  DEBRIEF_SESSIONS,
  TIER_ORDER,
  TIERS,
  ANNUAL_SESSION_STACKING_BONUS_PCT,
  computeDebriefPrice,
  type DebriefSessionType,
} from '@/config/pricingData';
import type { BillingCycle, PricingCurrency } from '@/config/tiers';

export function DebriefsSection({
  cycle = 'monthly',
  currency = 'USD',
}: {
  cycle?: BillingCycle;
  currency?: PricingCurrency;
}) {
  return (
    <section
      style={{
        background: DS.bgAlt,
        padding: '64px 24px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
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
            [Emily: debriefs subhead — human coaches, what to expect.
            Mapped to positioning doc §debriefs.]
          </p>
        </div>

        {/* Session cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
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

        {/* Tier discounts + free sessions */}
        <div style={{ marginTop: 64, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          <DiscountsTable cycle={cycle} currency={currency} />
          <FreeSessionsHighlight />
        </div>

        {/* Annual stacking note */}
        <div
          style={{
            marginTop: 48,
            padding: '16px 24px',
            background: DS.bgDark,
            color: DS.bg,
            fontFamily: DS.bodyFont,
            fontSize: 15,
            textAlign: 'center',
          }}
        >
          Annual billing — +{ANNUAL_SESSION_STACKING_BONUS_PCT}% session stacking bonus
          <span style={{ color: DS.muted, marginLeft: 12, fontSize: 13 }}>
            (applied to debrief sessions only, not mile packs)
          </span>
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
  // Show the list price on the marketing surface; tier discounts in the table below.
  const listPrice = currency === 'USD' ? session.priceUsd : session.priceCny;
  const symbol = currency === 'USD' ? '$' : '¥';

  return (
    <div
      style={{
        background: DS.card,
        border: `1px solid ${DS.border}`,
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Duration */}
      <div
        style={{
          fontFamily: DS.headingFont,
          fontSize: 24,
          fontWeight: 600,
          color: DS.text,
          marginBottom: 4,
        }}
      >
        {session.durationMinutes}-minute
        {session.isCpi && (
          <span
            style={{
              fontFamily: DS.monoFont,
              fontSize: 12,
              marginLeft: 8,
              color: DS.accent,
              letterSpacing: '0.05em',
            }}
          >
            CPI
          </span>
        )}
      </div>

      {/* Label */}
      <div
        style={{
          fontFamily: DS.bodyFont,
          fontSize: 14,
          color: DS.textSecondary,
          marginBottom: 16,
        }}
      >
        {session.label}
      </div>

      {/* Price */}
      <div
        style={{
          fontFamily: DS.headingFont,
          fontSize: 32,
          fontWeight: 600,
          color: DS.text,
          marginBottom: 20,
        }}
      >
        {symbol}{listPrice}
      </div>

      {/* Coach type — placeholder */}
      <div
        style={{
          fontFamily: DS.bodyFont,
          fontSize: 14,
          color: DS.textSecondary,
          marginBottom: 12,
        }}
      >
        {session.coachTypePlaceholder}
      </div>

      {/* Description — placeholder */}
      <p
        style={{
          fontFamily: DS.bodyFont,
          fontSize: 13,
          lineHeight: 1.6,
          color: DS.muted,
          margin: 0,
          flex: 1,
        }}
      >
        {session.descriptionPlaceholder}
      </p>

      {/* Book CTA */}
      <button
        style={{
          marginTop: 24,
          fontFamily: DS.bodyFont,
          fontSize: 15,
          fontWeight: 600,
          color: DS.text,
          background: DS.bg,
          border: `1px solid ${DS.borderStrong}`,
          padding: '14px 24px',
          cursor: 'pointer',
          transition: DS.transition,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = DS.accent;
          e.currentTarget.style.color = DS.accent;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = DS.borderStrong;
          e.currentTarget.style.color = DS.text;
        }}
      >
        [Emily: book CTA]
      </button>
    </div>
  );
}

/** Tier-based session discount table. */
function DiscountsTable({ cycle, currency }: { cycle: BillingCycle; currency: PricingCurrency }) {
  const sampleSession = DEBRIEF_SESSIONS.find((s) => s.id === 'debrief_60')!;
  const symbol = currency === 'USD' ? '$' : '¥';

  return (
    <div>
      <h3
        style={{
          fontFamily: DS.headingFont,
          fontSize: 22,
          fontWeight: 600,
          color: DS.text,
          margin: '0 0 20px',
        }}
      >
        Tier session discounts
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${DS.borderStrong}` }}>
            <th
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                fontFamily: DS.monoFont,
                fontSize: 12,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: DS.eyebrow,
                fontWeight: 400,
              }}
            >
              Tier
            </th>
            <th
              style={{
                textAlign: 'right',
                padding: '10px 12px',
                fontFamily: DS.monoFont,
                fontSize: 12,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: DS.eyebrow,
                fontWeight: 400,
              }}
            >
              Discount
            </th>
            <th
              style={{
                textAlign: 'right',
                padding: '10px 12px',
                fontFamily: DS.monoFont,
                fontSize: 12,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: DS.eyebrow,
                fontWeight: 400,
              }}
            >
              60-min from
            </th>
          </tr>
        </thead>
        <tbody>
          {TIER_ORDER.map((tierKey) => {
            const { discountPct, effectivePrice } = computeDebriefPrice(
              sampleSession,
              tierKey,
              cycle,
              currency,
            );
            return (
              <tr key={tierKey} style={{ borderBottom: `1px solid ${DS.border}` }}>
                <td
                  style={{
                    padding: '12px',
                    fontFamily: DS.bodyFont,
                    color: DS.text,
                    fontWeight: 500,
                  }}
                >
                  {TIERS[tierKey].displayName}
                </td>
                <td
                  style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontFamily: DS.bodyFont,
                    color: discountPct > 0 ? DS.accent : DS.muted,
                    fontWeight: 600,
                  }}
                >
                  {discountPct > 0 ? `${discountPct}% off` : 'List price'}
                </td>
                <td
                  style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontFamily: DS.bodyFont,
                    color: DS.text,
                    fontWeight: 600,
                  }}
                >
                  {symbol}{effectivePrice}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Highlights Executive + Council free session allowances. */
function FreeSessionsHighlight() {
  return (
    <div>
      <h3
        style={{
          fontFamily: DS.headingFont,
          fontSize: 22,
          fontWeight: 600,
          color: DS.text,
          margin: '0 0 20px',
        }}
      >
        Included sessions
      </h3>
      <div
        style={{
          background: DS.card,
          border: `1px solid ${DS.border}`,
          padding: 24,
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: DS.headingFont,
              fontSize: 18,
              fontWeight: 600,
              color: DS.text,
              marginBottom: 4,
            }}
          >
            Executive
          </div>
          <div
            style={{
              fontFamily: DS.bodyFont,
              fontSize: 15,
              color: DS.textSecondary,
            }}
          >
            1 × 30-minute debrief / month, complimentary
          </div>
        </div>
        <div
          style={{
            borderTop: `1px solid ${DS.border}`,
            paddingTop: 20,
          }}
        >
          <div
            style={{
              fontFamily: DS.headingFont,
              fontSize: 18,
              fontWeight: 600,
              color: DS.accent,
              marginBottom: 4,
            }}
          >
            Council
          </div>
          <div
            style={{
              fontFamily: DS.bodyFont,
              fontSize: 15,
              color: DS.textSecondary,
            }}
          >
            2 × 60-minute debriefs / month, complimentary
          </div>
        </div>
      </div>
    </div>
  );
}
