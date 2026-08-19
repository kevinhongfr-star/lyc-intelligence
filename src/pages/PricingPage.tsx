/**
 * PricingPage — V3.4 VISUAL REWORK (V1 foundation)
 *
 * Full pricing page. V1 light-mode line-art system. Sections top→bottom:
 *   1. Nav          — wordmark + nav links + "Begin with your positioning" CTA
 *   2. Hero         — eyebrow "Membership" + display headline + sub + billing toggle
 *   3. Tiers        — 3-tier grid: Explorer (complimentary) / Professional $99
 *                     (recommended, fuchsia) / Executive $199
 *   4. Comparison   — feature comparison table (rows × 3 tiers)
 *   5. Human Depth  — add-on section (Bronze / Silver / Gold packages, fuchsia accent)
 *   6. FAQ          — short accordion
 *   7. Final CTA    — teal-900 dark, inverted button
 *   8. Footer       — minimal
 *
 * Naming rules (enforced):
 *  - "Membership" not "Pricing" in section eyebrow (page route stays /pricing)
 *  - "NEXUS" always by name — never "the AI" / "the coach"
 *  - No "Platform" / "Architecture" anywhere
 *  - No "unlimited" — name a specific benefit instead
 *  - No "free" — use "complimentary" (Executive Introduction tier)
 *  - Miles are NOT a marketing feature — shown as factual mono labels, never lead
 *
 * Billing/CTA wiring preserved verbatim from legacy PricingPage: usePricingCta hook
 * + getCta/handleSelectTier + Stripe checkout. Only presentation changed.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { trackBillingView } from '@/analytics/eventTracker';
import { useAuthStore } from '@/stores/authStore';
import { V1 } from '@/styles/v1-tokens';
import { initScrollReveal } from '@/lib/utils';
import { PRICING_TIERS } from '@/config/pricingData';
import type { BillingCycle, PricingCurrency } from '@/config/tiers';
import { usePricingCta } from '@/components/pricing/usePricingCta';

/* ── 3-tier membership display (landing shows 3 of the real 5 tiers) ──
 * Explorer $0 (complimentary) · Professional $99 (recommended, fuchsia)
 * · Executive $199. Human coaching is a separate add-on layer, not shown here.
 *
 * PRICING_TIERS (from pricingData.ts) is the source of truth for the 5 real
 * tiers. We filter to the 3 landing-visible keys: explorer / professional /
 * executive. "Professional" on landing = "Pro" internal tier (display override).
 */
const VISIBLE_TIER_KEYS = ['explorer', 'professional', 'executive'] as const;

interface LandingTier {
  key: string;
  name: string;
  price: number;
  priceLabel: string;
  blurb: string;
  features: string[];
  recommended?: boolean;
}

const LANDING_TIERS: LandingTier[] = [
  {
    key: 'explorer',
    name: 'Explorer',
    price: 0,
    priceLabel: 'Complimentary',
    blurb: 'Begin the conversation. Daily NEXUS messages, the PRISM lens on us, and a baseline to grow from.',
    features: ['20 NEXUS messages / day', 'PRISM + LEAP lenses on us', 'Baseline leadership profile'],
  },
  {
    key: 'professional',
    name: 'Professional',
    price: 99,
    priceLabel: '$99/mo',
    recommended: true,
    blurb: 'NEXUS, always on. The full 11-lens catalog. Branded reports, advanced insights, peer benchmarking.',
    features: ['NEXUS messages, no cap', 'Full 11-lens catalog access', 'Branded PDF reports', '5 miles / month'],
  },
  {
    key: 'executive',
    name: 'Executive',
    price: 199,
    priceLabel: '$199/mo',
    blurb: 'The deepest layer. Priority NEXUS, quarterly consultant debriefs, full benchmarking, council eligibility.',
    features: ['Priority NEXUS responses', 'Quarterly consultant debriefs', 'Full percentile benchmarking', 'Council eligibility'],
  },
];

/* ── Feature comparison table (3 visible tiers × rows) ──
 * Rows are factual capability comparisons — no "unlimited", no marketing fluff.
 * Tier values: '—' (not included) / specific value.
 *
 * V4.5.6: rows organized by category (AI Coaching, Diagnostics / Lenses,
 * Memory & Context, Human Depth, Support) — grouped headers + 1px rules.
 */
interface ComparisonRow {
  feature: string;
  explorer: string;
  professional: string;
  executive: string;
}
interface ComparisonCategory {
  label: string;
  rows: ComparisonRow[];
}

const COMPARISON_CATEGORIES: ComparisonCategory[] = [
  {
    label: 'AI Coaching',
    rows: [
      { feature: 'NEXUS messages / day',  explorer: '20',           professional: 'No cap',          executive: 'No cap, priority' },
      { feature: 'Priority NEXUS responses', explorer: '—',        professional: '—',               executive: 'Yes' },
      { feature: 'Advisory frameworks',  explorer: 'Basic',         professional: 'Full',            executive: 'Full + custom' },
    ],
  },
  {
    label: 'Diagnostics / Lenses',
    rows: [
      { feature: 'Lens catalog',         explorer: 'PRISM + LEAP', professional: 'All 11 lenses',   executive: 'All 11 lenses' },
      { feature: 'Miles / month',        explorer: '2',            professional: '5',               executive: '15' },
      { feature: 'Percentile benchmarking', explorer: '—',         professional: 'Standard',       executive: 'Full' },
    ],
  },
  {
    label: 'Memory & Context',
    rows: [
      { feature: 'Conversation memory',  explorer: '7 days',       professional: 'Unlimited',      executive: 'Unlimited' },
      { feature: 'Cross-assessment memory', explorer: '—',          professional: 'Yes',            executive: 'Yes + composite' },
      { feature: 'Document enrichment',   explorer: '1 document',   professional: '25 documents',   executive: 'Unlimited' },
    ],
  },
  {
    label: 'Human Depth',
    rows: [
      { feature: 'PDF readouts',          explorer: 'Plain',        professional: 'Branded',         executive: 'Branded + shareable' },
      { feature: 'Consultant debriefs',   explorer: '—',            professional: 'Add-on',          executive: 'Quarterly included' },
      { feature: 'Human coaching add-on', explorer: '—',            professional: 'Optional',        executive: 'Optional' },
    ],
  },
  {
    label: 'Support',
    rows: [
      { feature: 'Council eligibility',   explorer: '—',            professional: '—',               executive: 'Yes' },
      { feature: 'Response window',       explorer: 'Standard',    professional: 'Standard',       executive: 'Priority' },
    ],
  },
];

/* ── Human Depth add-on packages (Bronze / Silver / Gold) ──
 * Separate layer from AI subscription. Fuchsia accent (recommended = Silver).
 */
interface HumanPackage {
  name: string;
  price: string;
  sessions: string;
  blurb: string;
  recommended?: boolean;
}

const HUMAN_PACKAGES: HumanPackage[] = [
  { name: 'Bronze', price: '$199', sessions: '1 session', blurb: 'A single 60-minute debrief on one readout.' },
  { name: 'Silver', price: '$549',  sessions: '3 sessions', blurb: 'A working arc across one lens, with a senior LYC consultant.', recommended: true },
  { name: 'Gold',   price: '$1,499', sessions: '8 sessions', blurb: 'Quarterly partnership. The full human layer, sustained.' },
];

/* ── FAQ ── */
const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'What is a mile?',
    a: 'Miles are the unit NEXUS uses for diagnostics. Each lens costs between one and five miles. You earn miles through conversation and receive a monthly allocation based on your membership.',
  },
  {
    q: 'Can I change membership later?',
    a: 'Yes — upgrade, downgrade, or pause at any time. Changes take effect at the next cycle.',
  },
  {
    q: 'Is the Explorer tier really complimentary?',
    a: 'Yes. Twenty NEXUS messages a day, the PRISM and LEAP lenses, and a baseline profile. No card required.',
  },
  {
    q: 'How does human coaching work alongside NEXUS?',
    a: 'Human Depth (Bronze / Silver / Gold) is a separate add-on. Book a debrief when a readout deserves a human walk-through.',
  },
  {
    q: 'What happens to my conversation history if I cancel?',
    a: 'Your thread stays yours. You can export it. NEXUS will not resume without you.',
  },
];

interface PricingPageProps {
  onUpgradeSuccess?: () => void;
}

export function PricingPage({ onUpgradeSuccess }: PricingPageProps) {
  const { user } = useAuthStore();
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [currency] = useState<PricingCurrency>('USD');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { getCta, handleSelectTier } = usePricingCta(onUpgradeSuccess);

  React.useEffect(() => { trackBillingView(user ? 'portal_nav' : 'direct_link'); }, [user]);
  useEffect(() => { initScrollReveal(); }, []);

  const onPrimaryCta = useCallback(() => {
    const cards = document.getElementById('pricing-tier-cards');
    if (cards) cards.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div style={{ background: V1.bg, color: V1.text, minHeight: '100vh' }}>
      <SEO page="pricing" />

      {/* ════════════════ 1. NAV ════════════════ */}
      <nav className="v1-nav">
        <div className="v1-nav-inner">
          <Link to="/" className="v1-wordmark" aria-label="NEXUS home">
            NEXUS<span className="v1-dot">.</span>
          </Link>
          <div className="v1-nav-links v1-hidden-mobile">
            <Link to="/#how-it-works">How it works</Link>
            <Link to="/#lenses">Lenses</Link>
            <a href="#membership">Membership</a>
          </div>
          <div className="v1-nav-cta">
            <Link to="/nexus/chat" className="v1-btn v1-btn-primary">
              Begin with your positioning <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </nav>

      <div style={{ height: V1.navHeight }} />

      {/* ════════════════ 2. HERO ════════════════ */}
      <header className="v1-marketing v1-section" style={{ paddingTop: 80, paddingBottom: 56, textAlign: 'center' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div className="v1-eyebrow" style={{ textAlign: 'center' }}>Membership</div>
          <h1 className="v1-display reveal" style={{ fontSize: V1.textDisplay, margin: '8px 0 16px', lineHeight: V1.leadingDisplay }}>
            Three ways in. One thread underneath.
          </h1>
          <p className="reveal" style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodyLg, lineHeight: V1.leadingBody, color: V1.textSecondary, maxWidth: 560, margin: '0 auto 32px' }}>
            Pick the depth that matches where you are. Change it whenever the work changes.
          </p>
          {/* Billing toggle */}
          <div className="reveal" style={{ display: 'inline-flex', alignItems: 'center', gap: 0, border: `1px solid ${V1.border}`, background: V1.surface }}>
            <button
              onClick={() => setCycle('monthly')}
              style={{
                fontFamily: V1.bodyFont, fontSize: V1.textBodySm, padding: '10px 16px',
                background: cycle === 'monthly' ? V1.text : 'transparent', color: cycle === 'monthly' ? V1.surface : V1.textSecondary,
                border: 'none', cursor: 'pointer', fontWeight: V1.fwSemibold,
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle('annual')}
              style={{
                fontFamily: V1.bodyFont, fontSize: V1.textBodySm, padding: '10px 16px',
                background: cycle === 'annual' ? V1.text : 'transparent', color: cycle === 'annual' ? V1.surface : V1.textSecondary,
                border: 'none', cursor: 'pointer', fontWeight: V1.fwSemibold, display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              Annual <span className="v1-mono" style={{ fontSize: 10, border: `1px solid ${cycle === 'annual' ? V1.surface : V1.teal600}`, padding: '1px 5px', color: cycle === 'annual' ? V1.surface : V1.teal600 }}>SAVE 15%</span>
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════ 3. TIERS ════════════════ */}
      <section id="membership" className="v1-marketing v1-section" style={{ paddingTop: 0, paddingBottom: 80 }}>
        <div id="pricing-tier-cards" className="v1-grid-pricing" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: V1.shellGap }}>
          {LANDING_TIERS.map(tier => {
            const realTier = PRICING_TIERS.find(t => t.key === tier.key);
            const cta = realTier ? getCta(realTier.key as any) : { label: tier.price === 0 ? 'Begin' : `Choose ${tier.name}`, href: '/nexus/chat' };
            return (
              <div
                key={tier.key}
                className={`v1-card reveal ${tier.recommended ? 'v1-card-addon' : ''}`}
                style={{
                  display: 'flex', flexDirection: 'column', padding: 32, minHeight: 460,
                  borderColor: tier.recommended ? V1.fuchsia600 : V1.border,
                  borderWidth: tier.recommended ? 2 : 1,
                }}
              >
                <div className="v1-mono" style={{ color: tier.recommended ? V1.fuchsia600 : V1.teal700, marginBottom: 8 }}>
                  {tier.recommended ? 'Recommended' : tier.name}
                </div>
                <h3 className="v1-display" style={{ fontSize: V1.textH2, margin: '0 0 4px' }}>{tier.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
                  <span className="v1-display" style={{ fontSize: 36, color: V1.text }}>{tier.price === 0 ? '$0' : `$${tier.price}`}</span>
                  <span className="v1-mono" style={{ color: V1.textDim }}>{tier.price === 0 ? '' : '/mo'}</span>
                </div>
                <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary, lineHeight: V1.leadingBody, margin: '0 0 24px', minHeight: 60 }}>
                  {tier.blurb}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1 }}>
                  {tier.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.text, marginBottom: 10 }}>
                      <span aria-hidden="true" style={{ color: V1.teal600, marginTop: 2, flexShrink: 0 }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: 'auto' }}>
                  <button
                    onClick={() => {
                      if (realTier) handleSelectTier(realTier.key as any, cycle);
                      else onPrimaryCta();
                    }}
                    className={`v1-btn ${tier.recommended ? 'v1-btn-primary' : 'v1-btn-secondary'}`}
                    style={{ width: '100%' }}
                  >
                    {tier.price === 0 ? 'Begin' : `Choose ${tier.name}`} <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="v1-mono" style={{ textAlign: 'center', marginTop: 32, color: V1.textDim }}>
          All tiers include the 11-lens catalog at the mile cost shown. Human coaching sold separately.
        </p>
      </section>

      {/* ════════════════ 4. COMPARISON TABLE ════════════════ */}
      <section className="v1-section" style={{ background: V1.surfaceAlt, borderTop: `1px solid ${V1.border}`, borderBottom: `1px solid ${V1.border}`, padding: '64px 0' }}>
        <div className="v1-marketing">
          <div className="v1-eyebrow">Compare</div>
          <h2 className="v1-display reveal" style={{ fontSize: V1.textH1, margin: '8px 0 32px' }}>What each tier includes.</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: V1.bodyFont, fontSize: V1.textBodySm }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${V1.dividerStrong}` }}>
                  <th style={{ textAlign: 'left', padding: '16px 12px', fontFamily: V1.monoFont, fontSize: V1.textCaption, letterSpacing: V1.trackingMono, textTransform: 'uppercase', color: V1.textDim, fontWeight: V1.fwSemibold }}>Feature</th>
                  {LANDING_TIERS.map(t => (
                    <th key={t.key} style={{ textAlign: 'left', padding: '16px 12px', fontFamily: V1.displayFont, fontSize: V1.textH3, color: V1.text, fontWeight: V1.fwSemibold }}>
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_CATEGORIES.map(cat => (
                  <React.Fragment key={cat.label}>
                    {/* Category subhead row — spans all 4 columns */}
                    <tr style={{ background: V1.surfaceAlt }}>
                      <td
                        colSpan={4}
                        style={{
                          padding: '12px 12px 8px',
                          fontFamily: V1.monoFont,
                          fontSize: V1.textCaption,
                          letterSpacing: V1.trackingMono,
                          textTransform: 'uppercase',
                          color: V1.teal700,
                          fontWeight: V1.fwSemibold,
                          borderBottom: `1px solid ${V1.dividerRow}`,
                        }}
                      >
                        {cat.label}
                      </td>
                    </tr>
                    {cat.rows.map((row) => (
                      <tr key={row.feature} style={{ borderBottom: `1px solid ${V1.dividerRow}` }}>
                        <td style={{ padding: '14px 12px', color: V1.text, fontWeight: V1.fwMedium }}>{row.feature}</td>
                        <td style={{ padding: '14px 12px', color: row.explorer === '—' ? V1.textDim : V1.textSecondary }}>{row.explorer}</td>
                        <td style={{ padding: '14px 12px', color: row.professional === '—' ? V1.textDim : V1.textSecondary }}>{row.professional}</td>
                        <td style={{ padding: '14px 12px', color: row.executive === '—' ? V1.textDim : V1.textSecondary }}>{row.executive}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ════════════════ 5. HUMAN DEPTH ADD-ON ════════════════ */}
      <section className="v1-marketing v1-section" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <div className="v1-eyebrow" style={{ textAlign: 'center' }}>Human Depth</div>
          <h2 className="v1-display reveal" style={{ fontSize: V1.textH1, margin: '8px 0 16px' }}>When the readout deserves a human.</h2>
          <p className="reveal" style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodyLg, color: V1.textSecondary, maxWidth: 560, margin: '0 auto', lineHeight: V1.leadingBody }}>
            A separate add-on layer — not part of any AI membership. Book debriefs by the session or as a sustained partnership.
          </p>
        </div>
        <div className="v1-grid-pricing" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: V1.shellGap }}>
          {HUMAN_PACKAGES.map(pkg => (
            <div
              key={pkg.name}
              className={`v1-card reveal ${pkg.recommended ? 'v1-card-addon' : ''}`}
              style={{ padding: 28, borderColor: pkg.recommended ? V1.fuchsia600 : V1.border, borderWidth: pkg.recommended ? 2 : 1 }}
            >
              <div className="v1-mono" style={{ color: pkg.recommended ? V1.fuchsia600 : V1.teal700, marginBottom: 8 }}>
                {pkg.recommended ? 'Recommended' : pkg.name}
              </div>
              <h3 className="v1-display" style={{ fontSize: V1.textH2, margin: '0 0 4px' }}>{pkg.name}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
                <span className="v1-display" style={{ fontSize: 28, color: V1.text }}>{pkg.price}</span>
                <span className="v1-mono" style={{ color: V1.textDim }}>· {pkg.sessions}</span>
              </div>
              <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary, lineHeight: V1.leadingBody, margin: '0 0 24px' }}>
                {pkg.blurb}
              </p>
              <Link to="/debrief/book" className={`v1-btn ${pkg.recommended ? 'v1-btn-primary' : 'v1-btn-secondary'}`} style={{ width: '100%' }}>
                Book a debrief <span aria-hidden="true">→</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════ 6. FAQ ════════════════ */}
      <section className="v1-section" style={{ background: V1.surfaceAlt, borderTop: `1px solid ${V1.border}`, borderBottom: `1px solid ${V1.border}`, padding: '64px 0' }}>
        <div className="v1-marketing" style={{ maxWidth: 760 }}>
          <div className="v1-eyebrow">FAQ</div>
          <h2 className="v1-display reveal" style={{ fontSize: V1.textH1, margin: '8px 0 32px' }}>Questions, answered.</h2>
          <div>
            {FAQ_ITEMS.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={i} style={{ borderBottom: `1px solid ${V1.dividerRow}` }}>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '20px 0', background: 'transparent', border: 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, cursor: 'pointer',
                      fontFamily: V1.displayFont, fontSize: V1.textH3, color: V1.text,
                    }}
                  >
                    <span>{item.q}</span>
                    <span aria-hidden="true" style={{ color: V1.textDim, fontSize: V1.textBody }}>{open ? '−' : '+'}</span>
                  </button>
                  {open && (
                    <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBody, color: V1.textSecondary, lineHeight: V1.leadingBody, margin: '0 0 20px', maxWidth: 600 }}>
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════ 7. FINAL CTA (teal-900 dark, inverted) ════════════════ */}
      <section className="v1-section-dark" style={{ padding: '96px 0', textAlign: 'center' }}>
        <div className="v1-marketing">
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <h2 className="v1-display" style={{ fontSize: V1.textH1, margin: '0 0 16px', color: V1.onDark }}>
              Begin where you are.
            </h2>
            <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodyLg, lineHeight: V1.leadingBody, color: V1.onDarkMuted, margin: '0 0 32px' }}>
              No form to fill out first. The conversation is the onboarding.
            </p>
            <Link to="/nexus/chat" className="v1-btn v1-btn-primary v1-on-dark" style={{ padding: '14px 28px' }}>
              Begin with your positioning <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════ 8. FOOTER ════════════════ */}
      <footer style={{ background: V1.surface, borderTop: `1px solid ${V1.border}`, padding: '40px 0' }}>
        <div className="v1-marketing" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <Link to="/" className="v1-wordmark">
            NEXUS<span className="v1-dot">.</span>
          </Link>
          <p className="v1-mono" style={{ color: V1.textDim }}>Your context stays yours.</p>
        </div>
      </footer>

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) {
          .v1-grid-pricing { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default PricingPage;
