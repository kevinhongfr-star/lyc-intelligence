/**
 * PricingFAQ.tsx — Pricing FAQ section (Batch 3 / Ticket 6).
 *
 * 8-12 common questions across categories: billing, miles, debriefs,
 * annual plan, upgrades/downgrades, CPI access, doc upload.
 * Accordion pattern (reusable from LandingTemplate FAQ pattern).
 *
 * Copy placeholders mapped to pricing v1.1 + tier matrix + copy TBD.
 */
import React, { useState } from 'react';
import { DS } from '@/tokens';

interface FaqItem {
  category: string;
  question: string;
  answer: string;
}

/** FAQ items — structural placeholders. Copy from Emily / pricing v1.1. */
const FAQ_ITEMS: FaqItem[] = [
  // ── Billing ──
  {
    category: 'Billing',
    question: '[Emily: How does billing work?]',
    answer: '[Emily: Billing answer — monthly vs annual, currency options, payment methods. Mapped to pricing v1.1 §billing.]',
  },
  {
    category: 'Billing',
    question: '[Emily: Is there a money-back guarantee?]',
    answer: '[Emily: Guarantee answer — trial period, refund policy. Mapped to pricing v1.1 §guarantee.]',
  },
  // ── Miles ──
  {
    category: 'Miles',
    question: '[Emily: What are miles and how do they work?]',
    answer: '[Emily: Miles explainer — miles as premium currency for diagnostics, monthly allocation, rollover. Mapped to pricing v1.1 §miles.]',
  },
  {
    category: 'Miles',
    question: '[Emily: Do unused miles roll over?]',
    answer: '[Emily: Rollover answer — 50% rollover, max 3 months. Reads from ROLLOVER_PERCENT / ROLLOVER_MAX_MONTHS in config.]',
  },
  {
    category: 'Miles',
    question: '[Emily: Can I buy extra miles?]',
    answer: '[Emily: Mile packs answer — 1/5/15 mile packs, 12-month expiry. Mapped to pricing v1.1 §mile-packs.]',
  },
  // ── Debriefs ──
  {
    category: 'Debriefs',
    question: '[Emily: What is a human debrief session?]',
    answer: '[Emily: Debrief explainer — 30/45/60/90-min sessions with human coaches, what to expect. Mapped to positioning doc §debriefs.]',
  },
  {
    category: 'Debriefs',
    question: '[Emily: Do I get a discount on debrief sessions?]',
    answer: '[Emily: Session discount answer — tier-based 10-25% off, annual +10% stacking bonus on sessions only.]',
  },
  // ── Annual plan ──
  {
    category: 'Annual Plan',
    question: '[Emily: What are the benefits of annual billing?]',
    answer: '[Emily: Annual benefits — 15% off subscription + 10% session stacking bonus on debriefs (not mile packs).]',
  },
  // ── Upgrades / Downgrades ──
  {
    category: 'Upgrades',
    question: '[Emily: Can I upgrade or downgrade my plan?]',
    answer: '[Emily: Upgrade/downgrade answer — self-serve for paid tiers, prorated billing, Council requires invite.]',
  },
  {
    category: 'Upgrades',
    question: '[Emily: What happens when I use my complimentary Explorer assessments?]',
    answer: '[Emily: Explorer upgrade path — after LEAP + PRISM tokens used, NEXUS recommends upgrading to Starter for continued access.]',
  },
  // ── CPI access ──
  {
    category: 'CPI Access',
    question: '[Emily: How do I access the CPI assessment?]',
    answer: '[Emily: CPI answer — CPI is the flagship 5-mile assessment, requires Council tier. Mapped to tier matrix §cpi.]',
  },
  // ── Document Upload ──
  {
    category: 'Documents',
    question: '[Emily: Can I upload documents for NEXUS to analyze?]',
    answer: '[Emily: Doc upload answer — tier-based upload limits, supported formats. Mapped to tier matrix §documents.]',
  },
];

/** Ordered list of FAQ categories. */
const FAQ_CATEGORIES = (() => {
  const seen: string[] = [];
  for (const item of FAQ_ITEMS) {
    if (!seen.includes(item.category)) seen.push(item.category);
  }
  return seen;
})();

export function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      style={{
        background: DS.bgAlt,
        padding: '64px 24px',
      }}
    >
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
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
            [Emily: FAQ eyebrow]
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
            [Emily: FAQ headline]
          </h2>
        </div>

        {/* FAQ items grouped by category */}
        {FAQ_CATEGORIES.map((category) => (
          <div key={category} style={{ marginBottom: 32 }}>
            {/* Category header */}
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: 12,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: DS.accent,
                marginBottom: 16,
                paddingBottom: 8,
                borderBottom: `1px solid ${DS.border}`,
              }}
            >
              {category}
            </div>

            {/* Questions in this category */}
            {FAQ_ITEMS.filter((item) => item.category === category).map((item) => {
              const idx = FAQ_ITEMS.indexOf(item);
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    borderBottom: `1px solid ${DS.border}`,
                  }}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      padding: '16px 0',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 16,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: DS.headingFont,
                        fontSize: 18,
                        fontWeight: 500,
                        color: DS.text,
                      }}
                    >
                      {item.question}
                    </span>
                    <span
                      style={{
                        fontFamily: DS.bodyFont,
                        fontSize: 20,
                        color: isOpen ? DS.accent : DS.muted,
                        transition: DS.transition,
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        flexShrink: 0,
                      }}
                    >
                      ⌄
                    </span>
                  </button>
                  <div
                    style={{
                      maxHeight: isOpen ? 200 : 0,
                      overflow: 'hidden',
                      transition: `max-height 350ms ${DS.transition.includes('cubic') ? DS.transition.split(' ')[1] : 'ease-out'}`,
                    }}
                  >
                    <p
                      style={{
                        fontFamily: DS.bodyFont,
                        fontSize: 15,
                        lineHeight: 1.6,
                        color: DS.textSecondary,
                        margin: '0 0 16px',
                        paddingRight: 32,
                      }}
                    >
                      {item.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
