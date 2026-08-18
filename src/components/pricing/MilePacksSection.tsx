/**
 * MilePacksSection.tsx — Mile pack purchase section (Batch 3 / Ticket 7).
 *
 * 3 pack sizes: 1mi $49, 5mi $199, 15mi $499. Savings % display (18% / 33%).
 * 12-month expiry note. "How miles work" explainer.
 *
 * All pricing from MILE_PACKS in miles.ts — no hardcoded numbers.
 * Annual stacking bonus does NOT apply to mile packs (sessions only).
 */
import React from 'react';
import { DS } from '@/tokens';
import {
  MILE_PACKS,
  PURCHASED_MILES_EXPIRY_MONTHS,
  INSTRUMENT_MILE_COST,
  type MilePack,
} from '@/config/pricingData';
import { computeMilePackSavings } from '@/config/pricingData';

export function MilePacksSection() {
  return (
    <section
      style={{
        background: DS.bg,
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
            [Emily: mile packs eyebrow]
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
            [Emily: mile packs headline]
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
            [Emily: mile packs subhead — value-first framing, miles as premium currency.
            Mapped to Pricing Strategy v1.1 §mile-packs.]
          </p>
        </div>

        {/* Pack cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            marginTop: 48,
          }}
        >
          {MILE_PACKS.map((pack) => (
            <MilePackCard key={pack.id} pack={pack} />
          ))}
        </div>

        {/* Expiry note */}
        <div
          style={{
            marginTop: 32,
            padding: '16px 24px',
            background: DS.bgAlt,
            fontFamily: DS.bodyFont,
            fontSize: 14,
            color: DS.textSecondary,
            textAlign: 'center',
          }}
        >
          Purchased miles expire {PURCHASED_MILES_EXPIRY_MONTHS} months after purchase.
          Mile packs are one-time purchases — not a subscription.
        </div>

        {/* "How miles work" explainer */}
        <HowMilesWorkExplainer />
      </div>
    </section>
  );
}

function MilePackCard({ pack }: { pack: MilePack }) {
  const savings = computeMilePackSavings(pack);
  const isBestValue = pack.miles === 15;

  return (
    <div
      style={{
        background: DS.card,
        border: isBestValue ? `2px solid ${DS.accent}` : `1px solid ${DS.border}`,
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {isBestValue && (
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
          Best Value
        </div>
      )}

      <div
        style={{
          padding: isBestValue ? '24px 0 0' : '0',
        }}
      >
        {/* Pack size */}
        <div
          style={{
            fontFamily: DS.headingFont,
            fontSize: 28,
            fontWeight: 600,
            color: DS.text,
            marginBottom: 4,
          }}
        >
          {pack.miles} {pack.miles === 1 ? 'mile' : 'miles'}
        </div>

        {/* Price */}
        <div
          style={{
            fontFamily: DS.headingFont,
            fontSize: 36,
            fontWeight: 600,
            color: DS.text,
            marginBottom: 8,
          }}
        >
          ${pack.priceUsd}
        </div>

        {/* Savings */}
        {savings > 0 && (
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: 12,
              color: DS.accent,
              marginBottom: 24,
            }}
          >
            Save {savings}%
          </div>
        )}

        {/* CTA */}
        <button
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 15,
            fontWeight: 600,
            color: DS.bg,
            background: isBestValue ? DS.accent : DS.bgDark,
            border: 'none',
            padding: '14px 24px',
            cursor: 'pointer',
            transition: DS.transition,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = isBestValue ? DS.accentHover : DS.text)}
          onMouseLeave={(e) => (e.currentTarget.style.background = isBestValue ? DS.accent : DS.bgDark)}
        >
          [Emily: purchase CTA]
        </button>
      </div>
    </div>
  );
}

function HowMilesWorkExplainer() {
  return (
    <div
      style={{
        marginTop: 64,
        padding: '40px 32px',
        background: DS.bgAlt,
        border: `1px solid ${DS.border}`,
      }}
    >
      <h3
        style={{
          fontFamily: DS.headingFont,
          fontSize: 22,
          fontWeight: 600,
          color: DS.text,
          margin: '0 0 24px',
        }}
      >
        [Emily: "How miles work" heading]
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 32,
        }}
      >
        {/* Mile cost tiers — displayed as mile counts, NOT category names (P0-4) */}
        <div>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: 12,
              color: DS.eyebrow,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Diagnostic costs
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li style={{ fontFamily: DS.bodyFont, fontSize: 14, color: DS.textSecondary }}>
              1 mile — LEAP
            </li>
            <li style={{ fontFamily: DS.bodyFont, fontSize: 14, color: DS.textSecondary }}>
              2 miles — PRISM, IMPACT, COACH, DRIVE, QUEST
            </li>
            <li style={{ fontFamily: DS.bodyFont, fontSize: 14, color: DS.textSecondary }}>
              3 miles — BRIDGE, MOSAIC, SPARK, FORGE
            </li>
            <li style={{ fontFamily: DS.bodyFont, fontSize: 14, color: DS.textSecondary }}>
              5 miles — CPI
            </li>
          </ul>
        </div>
        <div>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: 12,
              color: DS.eyebrow,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            [Emily: explainer column 2 heading]
          </div>
          <p
            style={{
              fontFamily: DS.bodyFont,
              fontSize: 14,
              lineHeight: 1.6,
              color: DS.textSecondary,
              margin: 0,
            }}
          >
            [Emily: miles explainer copy — monthly allocation, rollover, purchasing packs.
            Mapped to Pricing Strategy v1.1 §mile-packs.]
          </p>
        </div>
      </div>
    </div>
  );
}
