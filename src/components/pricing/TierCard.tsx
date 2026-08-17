/**
 * TierCard.tsx — Reusable tier card component (Batch 3 / Ticket 2).
 *
 * Renders a single tier card for the pricing page. 5 instances on the page.
 * Fields: tier name, positioning one-liner, price (monthly/annual toggle),
 * CTA button, key feature highlights, "Most Popular" badge (Pro),
 * "Invite Only" badge (Council).
 *
 * All data comes from pricingData.ts — no hardcoded numbers.
 * Mobile: cards stack vertically (handled by parent grid).
 */
import React from 'react';
import { DS } from '@/tokens';
import {
  computeTierPrice,
  formatPrice,
  type BillingCycle,
  type PricingCurrency,
} from '@/config/tiers';
import type { PricingTier } from '@/config/pricingData';
import type { CtaConfig } from './usePricingCta';

export interface TierCardProps {
  tier: PricingTier;
  cycle: BillingCycle;
  currency: PricingCurrency;
  cta: CtaConfig;
  onSelect: () => void;
}

export function TierCard({ tier, cycle, currency, cta, onSelect }: TierCardProps) {
  const price = computeTierPrice(tier.key, currency, cycle);

  return (
    <div
      style={{
        background: DS.card,
        border: tier.isRecommended
          ? `2px solid ${DS.accent}`
          : `1px solid ${DS.border}`,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: DS.transition,
      }}
    >
      {/* Badges */}
      {tier.isRecommended && (
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
          Most Popular
        </div>
      )}
      {tier.isInviteOnly && !tier.isRecommended && (
        <div
          style={{
            position: 'absolute',
            top: -1,
            left: -1,
            right: -1,
            background: DS.bgDark,
            color: DS.bg,
            fontFamily: DS.monoFont,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textAlign: 'center',
            padding: '6px 0',
          }}
        >
          Invite Only
        </div>
      )}

      <div
        style={{
          padding: tier.isRecommended || tier.isInviteOnly ? '40px 24px 24px' : '24px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        {/* Tier name */}
        <div
          style={{
            fontFamily: DS.headingFont,
            fontSize: 24,
            fontWeight: 600,
            color: DS.text,
            marginBottom: 4,
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
            margin: '0 0 24px',
            minHeight: 42,
          }}
        >
          {tier.positioningOneLiner}
        </p>

        {/* Price */}
        <div style={{ marginBottom: 24 }}>
          {price.isZero ? (
            <div
              style={{
                fontFamily: DS.headingFont,
                fontSize: 36,
                fontWeight: 600,
                color: DS.text,
              }}
            >
              Complimentary
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                style={{
                  fontFamily: DS.headingFont,
                  fontSize: 36,
                  fontWeight: 600,
                  color: DS.text,
                }}
              >
                {formatPrice(price.perMonth, currency)}
              </span>
              <span
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: 14,
                  color: DS.muted,
                }}
              >
                / month
              </span>
            </div>
          )}

          {/* Billing cycle note */}
          {!price.isZero && (
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: 12,
                color: cycle === 'annual' ? DS.accent : DS.muted,
                marginTop: 4,
              }}
            >
              {cycle === 'annual'
                ? `${formatPrice(price.amount, currency)} billed annually · Save 15%`
                : 'Billed monthly'}
            </div>
          )}
          {price.isZero && (
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: 12,
                color: DS.muted,
                marginTop: 4,
              }}
            >
              No credit card required
            </div>
          )}
        </div>

        {/* CTA button */}
        <button
          onClick={onSelect}
          disabled={cta.disabled}
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 15,
            fontWeight: 600,
            color: cta.disabled ? DS.muted : DS.bg,
            background: cta.disabled ? DS.bgAlt : tier.isRecommended ? DS.accent : DS.bgDark,
            border: `1px solid ${cta.disabled ? DS.border : 'transparent'}`,
            padding: '14px 24px',
            cursor: cta.disabled ? 'default' : 'pointer',
            transition: DS.transition,
            marginBottom: 24,
          }}
          onMouseEnter={(e) => {
            if (!cta.disabled) e.currentTarget.style.background = tier.isRecommended ? DS.accentHover : DS.text;
          }}
          onMouseLeave={(e) => {
            if (!cta.disabled) e.currentTarget.style.background = tier.isRecommended ? DS.accent : DS.bgDark;
          }}
        >
          {cta.label}
        </button>

        {/* Feature highlights — 3-5 bullets */}
        <div
          style={{
            borderTop: `1px solid ${DS.border}`,
            paddingTop: 20,
            flex: 1,
          }}
        >
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {tier.highlightPlaceholders.map((highlight, i) => (
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
                <span style={{ color: DS.accent, flexShrink: 0 }}>✓</span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Explorer complimentary tokens note */}
        {tier.isEntryTier && tier.complimentaryTokens.length > 0 && (
          <div
            style={{
              marginTop: 20,
              padding: '12px 16px',
              background: DS.bgAlt,
              fontFamily: DS.bodyFont,
              fontSize: 13,
              color: DS.textSecondary,
            }}
          >
            Includes {tier.complimentaryTokens.join(' + ')} — 2 complimentary assessment tokens on signup
          </div>
        )}
      </div>
    </div>
  );
}
