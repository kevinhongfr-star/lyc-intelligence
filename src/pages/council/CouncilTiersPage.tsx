import React, { useState } from 'react';
import { Check, X, ChevronDown, ArrowRight, Loader2, Crown, Users, Building2, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Council Membership Tiers Page (P2) — public, no auth required.
 * Detailed comparison table of all 4 tiers + FAQ.
 *
 * Brand rules:
 *  - NEVER use "free" — use "Executive Introduction" or "Complimentary"
 *  - Founding ¥2,800 / Individual ¥3,800 / Corporate ¥12,000 / PE Partner ¥25,000 (annual, CNY)
 */

type TierId = 'founding' | 'individual' | 'corporate' | 'pe-partner';

interface TierMeta {
  id: TierId;
  name: string;
  price: string;
  period: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  popular: boolean;
  spotsRemaining?: number;
  cta: string;
}

const TIERS: TierMeta[] = [
  {
    id: 'founding',
    name: 'Founding',
    price: '¥2,800',
    period: '/year',
    tagline: 'First 20 members — founding rate locked',
    icon: Crown,
    popular: true,
    spotsRemaining: 12,
    cta: 'Join Founding',
  },
  {
    id: 'individual',
    name: 'Individual',
    price: '¥3,800',
    period: '/year',
    tagline: 'Standard membership for senior leaders',
    icon: Users,
    popular: false,
    cta: 'Select Individual',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    price: '¥12,000',
    period: '/year',
    tagline: 'For teams — up to 5 seats',
    icon: Building2,
    popular: false,
    cta: 'Select Corporate',
  },
  {
    id: 'pe-partner',
    name: 'PE Partner',
    price: '¥25,000',
    period: '/year',
    tagline: 'For PE / VC partners — deal flow access',
    icon: Briefcase,
    popular: false,
    cta: 'Select PE Partner',
  },
];

interface BenefitRow {
  category: string;
  label: string;
  // Per-tier value. A string is rendered as-is; true = check; false = dash.
  values: Record<TierId, string | boolean>;
}

const BENEFIT_ROWS: BenefitRow[] = [
  {
    category: 'Credits & Coaching',
    label: 'Council Credits / year',
    values: { founding: '12', individual: '12', corporate: '48', 'pe-partner': '100' },
  },
  {
    category: 'Credits & Coaching',
    label: '1-on-1 coaching sessions',
    values: { founding: '12', individual: '12', corporate: '48', 'pe-partner': '100' },
  },
  {
    category: 'Credits & Coaching',
    label: 'DEX AI credits included',
    values: { founding: '5 / day', individual: '5 / day', corporate: '25 / day', 'pe-partner': '50 / day' },
  },
  {
    category: 'Events',
    label: 'All workshops & roundtables',
    values: { founding: true, individual: true, corporate: true, 'pe-partner': true },
  },
  {
    category: 'Events',
    label: 'Priority event booking',
    values: { founding: true, individual: true, corporate: true, 'pe-partner': true },
  },
  {
    category: 'Events',
    label: 'Concierge event access',
    values: { founding: false, individual: false, corporate: true, 'pe-partner': true },
  },
  {
    category: 'Intelligence',
    label: 'Monthly intelligence reports',
    values: { founding: true, individual: true, corporate: true, 'pe-partner': true },
  },
  {
    category: 'Intelligence',
    label: 'Quarterly market briefings',
    values: { founding: true, individual: true, corporate: true, 'pe-partner': true },
  },
  {
    category: 'Intelligence',
    label: 'Custom team intelligence reports',
    values: { founding: false, individual: false, corporate: true, 'pe-partner': true },
  },
  {
    category: 'Community',
    label: 'Member directory access',
    values: { founding: true, individual: true, corporate: true, 'pe-partner': true },
  },
  {
    category: 'Community',
    label: 'Community feed & discussions',
    values: { founding: true, individual: true, corporate: true, 'pe-partner': true },
  },
  {
    category: 'Community',
    label: 'Member seats included',
    values: { founding: '1', individual: '1', corporate: '5', 'pe-partner': '3' },
  },
  {
    category: 'PE Partner Exclusives',
    label: 'Deal flow access',
    values: { founding: false, individual: false, corporate: false, 'pe-partner': true },
  },
  {
    category: 'PE Partner Exclusives',
    label: 'Priority coaching matching',
    values: { founding: true, individual: false, corporate: true, 'pe-partner': true },
  },
  {
    category: 'Recognition',
    label: 'Legacy "Founding Member" badge',
    values: { founding: true, individual: false, corporate: false, 'pe-partner': false },
  },
];

const ALL_TIERS_INCLUDE = [
  'DEX AI access included',
  'Member directory access',
  'Community feed participation',
  'Event priority booking',
  'Monthly intelligence newsletter',
  'Annual membership review',
];

const FAQS = [
  {
    q: 'How is The Council different from DEX AI on its own?',
    a: 'DEX AI is your AI executive advisory — the intelligence layer. The Council wraps it with human coaching, curated events, a peer network, and intelligence reports. Council members also get a daily DEX AI credit allowance as part of their membership.',
  },
  {
    q: 'What is the Executive Introduction?',
    a: 'Your first 5 DEX AI messages are Complimentary — we call this the Executive Introduction. It lets you experience DEX AI before purchasing credits or a Council membership. No payment is required, and you can graduate to Council membership at any time.',
  },
  {
    q: 'How does annual billing work?',
    a: 'All Council tiers are billed annually in CNY via Stripe. Annual prepay unlocks the founding rate and grants your full year of Council Credits up front. You can upgrade mid-cycle with proration. Renewal is automatic with 60 / 30 / 7-day reminders.',
  },
  {
    q: 'What are Council Credits vs DEX AI credits?',
    a: 'They are separate ledgers. Council Credits pay for coaching sessions, event registrations, and premium content. DEX AI credits pay for AI chat messages and advanced AI features. Both are included with membership — they cannot be transferred or mixed.',
  },
  {
    q: 'Can I cancel my membership?',
    a: 'Yes. Cancellation within the first 30 days comes with a pro-rated refund. After 30 days, your membership remains active until the end of the annual term and will not auto-renew.',
  },
  {
    q: 'How are Founding members chosen?',
    a: 'The Founding tier is limited to the first 20 members and is locked at ¥2,800/year for the lifetime of the membership. It includes a permanent Legacy badge. Once the 20 spots are filled, the tier closes permanently.',
  },
  {
    q: 'Can my company pay for a Corporate membership?',
    a: 'Yes. The Corporate tier includes up to 5 seats and supports team billing. Contact us for custom enterprise tiers above 5 seats — we can configure dedicated coaching capacity and reporting.',
  },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <div className="flex items-center justify-center">
        <Check className="w-4 h-4 text-[#16A34A]" aria-label="Included" />
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex items-center justify-center">
        <X className="w-4 h-4 text-[#D4D4D4]" aria-label="Not included" />
      </div>
    );
  }
  return <div className="text-center text-sm font-semibold text-[#1C1C1C]">{value}</div>;
}

function FaqItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#E5E5E5]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C108AB] focus-visible:ring-offset-2"
        aria-expanded={open}
      >
        <span className="text-sm md:text-base font-semibold text-[#1C1C1C]">{q}</span>
        <ChevronDown
          className={`w-5 h-5 text-[#A3A3A3] flex-shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <div className="pb-5 pr-8 text-sm text-[#525252] leading-relaxed">{a}</div>
      )}
    </div>
  );
}

export function CouncilTiersPage() {
  const [checkoutTier, setCheckoutTier] = useState<TierId | null>(null);

  const handleSelect = (tierId: TierId) => {
    setCheckoutTier(tierId);
    // In production this would route to auth + Stripe Checkout.
    setTimeout(() => {
      window.location.href = `/council/apply?tier=${tierId}`;
    }, 600);
  };

  // Group rows by category for the comparison table
  const categories = Array.from(new Set(BENEFIT_ROWS.map((r) => r.category)));

  return (
    <div
      className="min-h-screen bg-[#F7F7F7] text-[#1C1C1C]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Nav */}
      <nav className="bg-white border-b border-[#E5E5E5] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="/council"
            className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline"
          >
            ← Back to Council
          </a>
          <Button size="sm" onClick={() => handleSelect('founding')}>
            Apply Now
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 text-center">
          <div className="text-xs font-bold uppercase tracking-[2.5px] text-[#C108AB] mb-3">
            Membership Tiers
          </div>
          <h1
            className="text-3xl md:text-5xl font-bold tracking-tight text-[#1C1C1C] mb-4"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Compare every benefit, side by side
          </h1>
          <p className="text-sm md:text-base text-[#525252] max-w-2xl mx-auto leading-relaxed">
            Four tiers, all annual prepay, all including DEX AI access. Pick the one that matches your altitude.
          </p>
        </div>
      </header>

      {/* Tier Cards (quick view) */}
      <section className="py-14 md:py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            const isCheckingOut = checkoutTier === tier.id;
            return (
              <div
                key={tier.id}
                className={`relative bg-white p-6 flex flex-col transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(26,23,20,0.08)] ${
                  tier.popular ? 'border-2 border-[#C108AB]' : 'border border-[#E5E5E5]'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-[#C108AB] text-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                      <Crown className="w-3 h-3" />
                      Founding
                    </span>
                  </div>
                )}
                <div className="w-10 h-10 bg-[rgba(193,8,171,0.08)] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#C108AB]" />
                </div>
                <h3
                  className="text-base font-semibold text-[#1C1C1C]"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  {tier.name}
                </h3>
                <p className="text-xs text-[#A3A3A3] mt-1 mb-4 leading-relaxed min-h-[2.5rem]">
                  {tier.tagline}
                </p>
                <div className="mb-5">
                  <span
                    className="text-2xl font-bold text-[#1C1C1C]"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {tier.price}
                  </span>
                  <span className="text-xs text-[#A3A3A3] ml-1">{tier.period}</span>
                </div>
                {typeof tier.spotsRemaining === 'number' && (
                  <div className="mb-4 text-[11px] font-semibold text-[#C108AB] uppercase tracking-wide">
                    {tier.spotsRemaining} / 20 spots left
                  </div>
                )}
                <Button
                  variant={tier.popular ? 'default' : 'outline'}
                  size="default"
                  className="w-full mt-auto"
                  onClick={() => handleSelect(tier.id)}
                  disabled={isCheckingOut}
                  aria-busy={isCheckingOut}
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      {tier.cta}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Detailed Comparison Table */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1C1C] mb-6"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Full benefit comparison
          </h2>

          <div className="bg-white border border-[#E5E5E5] overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="bg-[#F7F7F7] border-b border-[#E5E5E5]">
                  <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#525252] min-w-[220px]">
                    Benefit
                  </th>
                  {TIERS.map((t) => (
                    <th
                      key={t.id}
                      className={`px-3 py-4 text-center min-w-[140px] ${
                        t.popular ? 'bg-[rgba(193,8,171,0.04)]' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 bg-[rgba(193,8,171,0.08)] flex items-center justify-center">
                          <t.icon className="w-4 h-4 text-[#C108AB]" />
                        </div>
                        <div
                          className={`text-sm font-semibold ${
                            t.popular ? 'text-[#C108AB]' : 'text-[#1C1C1C]'
                          }`}
                          style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                        >
                          {t.name}
                        </div>
                        <div className="text-xs text-[#A3A3A3]">
                          {t.price}
                          <span className="text-[#A3A3A3]"> {t.period}</span>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((category, ci) => (
                  <React.Fragment key={category}>
                    <tr className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                      <td
                        colSpan={5}
                        className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#C108AB]"
                      >
                        {category}
                      </td>
                    </tr>
                    {BENEFIT_ROWS.filter((r) => r.category === category).map((row, ri) => (
                      <tr
                        key={`${category}-${ri}`}
                        className={`border-b border-[#F0F0F0] ${
                          ri % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'
                        }`}
                      >
                        <td className="px-5 py-3.5 text-sm text-[#1C1C1C]">{row.label}</td>
                        {TIERS.map((t) => (
                          <td
                            key={t.id}
                            className={`px-3 py-3.5 ${
                              t.popular ? 'bg-[rgba(193,8,171,0.02)]' : ''
                            }`}
                          >
                            <Cell value={row.values[t.id]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* All tiers include */}
          <div className="mt-10 bg-white border border-[#E5E5E5] p-7">
            <h3
              className="text-base font-semibold text-[#1C1C1C] mb-4"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              All tiers include
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_TIERS_INCLUDE.map((item) => (
                <div key={item} className="flex items-start gap-2.5 text-sm text-[#525252]">
                  <Check className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-xs font-bold uppercase tracking-[2.5px] text-[#C108AB] mb-3">
              FAQ
            </div>
            <h2
              className="text-2xl md:text-3xl font-bold tracking-tight text-[#1C1C1C]"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Frequently asked questions
            </h2>
          </div>
          <div className="bg-white border border-[#E5E5E5] px-6">
            {FAQS.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden bg-[#C108AB] px-8 py-12 md:px-14 md:py-14 text-center">
            <div
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)' }}
              aria-hidden="true"
            />
            <div className="relative">
              <h2
                className="text-xl md:text-3xl font-bold text-white mb-3 tracking-tight"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Ready to join The Council?
              </h2>
              <p className="text-sm text-white/85 max-w-xl mx-auto mb-7">
                Applications reviewed within 48 hours. Or start with a Complimentary Executive Introduction to DEX AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  className="!bg-white !text-[#C108AB] hover:!bg-white/90"
                  onClick={() => handleSelect('founding')}
                >
                  Apply for Founding
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  className="!bg-[#1C1C1C] !text-white hover:!bg-black"
                  onClick={() => (window.location.href = '/dex/chat')}
                >
                  Try DEX AI First
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d0a14] text-white">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div
            className="text-sm font-bold"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            The Council — by LYC Intelligence
          </div>
          <nav className="flex gap-6 text-xs text-white/60">
            <a href="/council" className="hover:text-white transition-colors no-underline">Council</a>
            <a href="/council/membership" className="hover:text-white transition-colors no-underline">Membership</a>
            <a href="/dex/chat" className="hover:text-white transition-colors no-underline">DEX AI</a>
            <a href="/dex/credits" className="hover:text-white transition-colors no-underline">Credit Store</a>
          </nav>
          <div className="text-[11px] text-white/40">© 2026 LYC Partners</div>
        </div>
      </footer>
    </div>
  );
}
