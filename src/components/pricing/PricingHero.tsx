/**
 * PricingHero.tsx — Pricing page hero section (Batch 3 / Ticket 4).
 *
 * Structural layout only. All copy is placeholder, mapped to Emily's
 * positioning doc sections. Components: eyebrow, headline, subheadline,
 * body copy, primary CTA, billing cycle toggle.
 *
 * Positioning: "Executive Intelligence" — coach first, diagnostics as tools.
 * Tagline: "Executive Intelligence for a Changing China".
 * NOTE: "platform" is a Level 1 hard banned word — never "Executive Intelligence Platform".
 */
import React from 'react';
import { DS } from '@/tokens';
import type { BillingCycle } from '@/config/tiers';

export interface PricingHeroProps {
  cycle: BillingCycle;
  onCycleChange: (cycle: BillingCycle) => void;
  onPrimaryCta: () => void;
}

export function PricingHero({ cycle, onCycleChange, onPrimaryCta }: PricingHeroProps) {
  return (
    <section
      style={{
        background: DS.bg,
        padding: '96px 24px 64px',
        borderBottom: `1px solid ${DS.border}`,
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        {/* Eyebrow — gray, never accent (#1353) */}
        <div
          style={{
            fontFamily: DS.monoFont,
            fontSize: 12,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: DS.eyebrow,
            marginBottom: 24,
          }}
        >
          [Emily: eyebrow — "Executive Intelligence for a Changing China"]
        </div>

        {/* Headline — system serif */}
        <h1
          style={{
            fontFamily: DS.headingFont,
            fontSize: 48,
            lineHeight: 1.1,
            color: DS.text,
            margin: '0 0 24px',
            fontWeight: 600,
            maxWidth: 800,
          }}
        >
          [Emily: hero headline — "Executive Intelligence" positioning (NOTE: "platform" is banned — never "Executive Intelligence Platform")]
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 22,
            lineHeight: 1.5,
            color: DS.textSecondary,
            margin: '0 0 32px',
            maxWidth: 720,
          }}
        >
          [Emily: hero subheadline — coach-first, diagnostics as tools framing]
        </p>

        {/* Body copy */}
        <p
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 16,
            lineHeight: 1.6,
            color: DS.muted,
            margin: '0 0 40px',
            maxWidth: 640,
          }}
        >
          [Emily: hero body copy — 2-3 sentences expanding on positioning.
          Mapped to positioning doc §hero.]
        </p>

        {/* Primary CTA + billing toggle */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 32,
            alignItems: 'center',
          }}
        >
          <button
            onClick={onPrimaryCta}
            style={{
              fontFamily: DS.bodyFont,
              fontSize: 16,
              fontWeight: 600,
              color: DS.bg,
              background: DS.accent,
              border: 'none',
              padding: '16px 32px',
              cursor: 'pointer',
              transition: DS.transition,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = DS.accentHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = DS.accent)}
          >
            [Emily: primary CTA text]
          </button>

          {/* Monthly / Annual toggle */}
          <BillingCycleToggle cycle={cycle} onCycleChange={onCycleChange} />
        </div>
      </div>
    </section>
  );
}

/** Monthly/annual billing toggle with "Save 15%" badge on annual. */
function BillingCycleToggle({
  cycle,
  onCycleChange,
}: {
  cycle: BillingCycle;
  onCycleChange: (c: BillingCycle) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span
        style={{
          fontFamily: DS.bodyFont,
          fontSize: 14,
          fontWeight: cycle === 'monthly' ? 600 : 400,
          color: cycle === 'monthly' ? DS.text : DS.muted,
          cursor: 'pointer',
          transition: DS.transition,
        }}
        onClick={() => onCycleChange('monthly')}
      >
        Monthly
      </span>
      <button
        onClick={() => onCycleChange(cycle === 'monthly' ? 'annual' : 'monthly')}
        style={{
          width: 48,
          height: 24,
          border: `1px solid ${DS.borderStrong}`,
          background: cycle === 'annual' ? DS.accent : DS.bgAlt,
          cursor: 'pointer',
          padding: 0,
          position: 'relative',
          transition: DS.transition,
        }}
        aria-label="Toggle billing cycle"
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: cycle === 'annual' ? 26 : 2,
            width: 18,
            height: 18,
            background: DS.bg,
            border: `1px solid ${DS.borderStrong}`,
            transition: DS.transition,
          }}
        />
      </button>
      <span
        style={{
          fontFamily: DS.bodyFont,
          fontSize: 14,
          fontWeight: cycle === 'annual' ? 600 : 400,
          color: cycle === 'annual' ? DS.text : DS.muted,
          cursor: 'pointer',
          transition: DS.transition,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
        onClick={() => onCycleChange('annual')}
      >
        Annual
        {cycle === 'annual' && (
          <span
            style={{
              fontFamily: DS.monoFont,
              fontSize: 11,
              letterSpacing: '0.05em',
              color: DS.accent,
              border: `1px solid ${DS.accent}`,
              padding: '2px 6px',
            }}
          >
            SAVE 15%
          </span>
        )}
      </span>
    </div>
  );
}
