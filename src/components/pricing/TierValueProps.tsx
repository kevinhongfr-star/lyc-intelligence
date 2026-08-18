/**
 * TierValueProps.tsx — Tier value propositions section (Batch 3 / Ticket 5).
 *
 * 5 tier value prop blocks above the pricing cards. Each block frames the
 * tier's unique value proposition + the upgrade ladder (why upgrade).
 * Council gets special framing (invite-only, executive intelligence suite).
 *
 * Structural layout only — copy placeholders mapped to positioning doc.
 */
import React from 'react';
import { DS } from '@/tokens';
import { PRICING_TIERS, type PricingTier } from '@/config/pricingData';

export function TierValueProps() {
  return (
    <section
      style={{
        background: DS.bgAlt,
        padding: '64px 24px',
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        {/* Section heading */}
        <div style={{ marginBottom: 48 }}>
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
            [Emily: section eyebrow — "Choose your access level"]
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
            [Emily: value props headline]
          </h2>
        </div>

        {/* Value prop blocks — horizontal rail on desktop, stacked on mobile */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 24,
          }}
        >
          {PRICING_TIERS.map((tier) => (
            <TierValuePropBlock key={tier.key} tier={tier} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TierValuePropBlock({ tier }: { tier: PricingTier }) {
  return (
    <div
      style={{
        background: DS.card,
        border: `1px solid ${DS.border}`,
        padding: 24,
        borderTop: tier.isRecommended ? `3px solid ${DS.accent}` : `3px solid transparent`,
      }}
    >
      {/* Tier name */}
      <div
        style={{
          fontFamily: DS.headingFont,
          fontSize: 22,
          fontWeight: 600,
          color: DS.text,
          marginBottom: 8,
        }}
      >
        {tier.displayName}
      </div>

      {/* Positioning one-liner — placeholder */}
      <p
        style={{
          fontFamily: DS.bodyFont,
          fontSize: 14,
          lineHeight: 1.5,
          color: DS.textSecondary,
          margin: '0 0 16px',
        }}
      >
        {tier.positioningOneLiner}
      </p>

      {/* Mile allocation — value framing as "included diagnostics" */}
      <div
        style={{
          fontFamily: DS.monoFont,
          fontSize: 12,
          color: DS.muted,
          marginBottom: 12,
        }}
      >
        {tier.isEntryTier
          ? '2 complimentary diagnostics'
          : `${tier.monthlyMiles} miles / month`}
      </div>

      {/* Upgrade ladder framing — placeholder */}
      <p
        style={{
          fontFamily: DS.bodyFont,
          fontSize: 13,
          lineHeight: 1.5,
          color: DS.muted,
          margin: 0,
          fontStyle: 'italic',
        }}
      >
        {tier.isInviteOnly
          ? '[Emily: Council special framing — invite-only, executive intelligence suite]'
          : `[Emily: ${tier.key} upgrade ladder — why upgrade here]`}
      </p>
    </div>
  );
}
