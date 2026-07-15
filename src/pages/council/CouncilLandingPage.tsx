import React, { useState } from 'react';
import { Crown, Users, Building2, Briefcase, ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Council Landing Page (P1) — public, no auth required.
 * Converts visitors → DEX AI Executive Introduction or Council membership.
 *
 * Brand rules:
 *  - NEVER use "free" — use "Executive Introduction" or "Complimentary"
 *  - DEX AI is the product name
 */

interface Tier {
  id: 'founding' | 'individual' | 'corporate' | 'pe-partner';
  name: string;
  price: string;
  period: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  popular: boolean;
  spotsRemaining?: number;
  features: string[];
  cta: string;
}

const TIERS: Tier[] = [
  {
    id: 'founding',
    name: 'Founding',
    price: '¥2,800',
    period: '/year',
    description: 'First 20 members only — locked at the founding rate',
    icon: Crown,
    popular: true,
    spotsRemaining: 12,
    features: [
      '12 Council Credits / year',
      '12 coaching sessions',
      'All events included',
      'DEX AI access included',
      'Member directory access',
      'Priority event booking',
      'Legacy "Founding Member" badge',
    ],
    cta: 'Join Founding Tier',
  },
  {
    id: 'individual',
    name: 'Individual',
    price: '¥3,800',
    period: '/year',
    description: 'Standard Council membership for senior leaders',
    icon: Users,
    popular: false,
    features: [
      '12 Council Credits / year',
      '12 coaching sessions',
      'All events included',
      'DEX AI access included',
      'Member directory access',
      'Monthly intelligence newsletter',
    ],
    cta: 'Select Individual',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    price: '¥12,000',
    period: '/year',
    description: 'For teams — up to 5 seats',
    icon: Building2,
    popular: false,
    features: [
      '48 Council Credits / year',
      '48 coaching sessions',
      'All events included',
      'Up to 5 member seats',
      'DEX AI access included',
      'Team intelligence reports',
    ],
    cta: 'Select Corporate',
  },
  {
    id: 'pe-partner',
    name: 'PE Partner',
    price: '¥25,000',
    period: '/year',
    description: 'For PE / VC partners — deal flow access',
    icon: Briefcase,
    popular: false,
    features: [
      '100 Council Credits / year',
      '100 coaching sessions',
      'All events included',
      'Deal flow access',
      'DEX AI access included',
      'Priority coaching matching',
    ],
    cta: 'Select PE Partner',
  },
];

const BENEFITS = [
  {
    icon: Briefcase,
    title: 'AI Executive Advisory',
    desc: 'DEX AI answers your career, compensation, and market questions in minutes — grounded in real benchmark data.',
  },
  {
    icon: Crown,
    title: '1-on-1 Coaching',
    desc: 'Book sessions with senior LYC coaches on-demand. Strategy, transitions, negotiation — on your schedule.',
  },
  {
    icon: Building2,
    title: 'Exclusive Events',
    desc: 'Workshops, roundtables, and networking dinners with peers who operate at your altitude.',
  },
  {
    icon: Users,
    title: 'Peer Network',
    desc: 'A curated directory of C-suite professionals. Connect, refer, and grow with people who get it.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'The Council gave me a peer network I had been missing for years. The DEX AI advisory alone pays for the membership.',
    name: 'Sarah Chen',
    title: 'VP Strategy, Fortune 500 Tech',
    tier: 'Founding Member',
  },
  {
    quote:
      'Coaching sessions with senior LYC partners reshaped how I think about my next move. Worth every credit.',
    name: 'David Park',
    title: 'CFO, Series D Startup',
    tier: 'Individual Member',
  },
  {
    quote:
      'We sent our entire leadership team through the Corporate tier. The intelligence reports are best-in-class.',
    name: 'Wei Zhang',
    title: 'Partner, Growth Equity Firm',
    tier: 'Corporate Member',
  },
];

const STATS = [
  { label: 'Active Members', value: '180+' },
  { label: 'Events Hosted', value: '42' },
  { label: 'Coaching Sessions', value: '1,200+' },
  { label: 'Countries', value: '14' },
];

export function CouncilLandingPage() {
  const [applyingTier, setApplyingTier] = useState<string | null>(null);

  const handleApply = (tierId: string) => {
    setApplyingTier(tierId);
    // Navigate to the application form. In production this would route via react-router.
    setTimeout(() => {
      window.location.href = `/council/apply?tier=${tierId}`;
    }, 600);
  };

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
            className="font-bold text-base tracking-tight text-[#1C1C1C] no-underline"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            The Council
          </a>
          <div className="flex items-center gap-3">
            <a
              href="/council/membership"
              className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline hidden sm:inline"
            >
              Membership
            </a>
            <a
              href="/dex/chat"
              className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline hidden sm:inline"
            >
              DEX AI
            </a>
            <Button size="sm" onClick={() => handleApply('individual')}>
              Apply
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-white border-b border-[#E5E5E5]">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[420px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(193,8,171,0.08) 0%, transparent 70%)' }}
          aria-hidden="true"
        />
        <div className="relative max-w-4xl mx-auto px-6 py-24 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 bg-[rgba(193,8,171,0.08)] text-[#C108AB] text-xs font-semibold uppercase tracking-widest">
            <Crown className="w-3 h-3" />
            Membership Community
          </div>
          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6 text-[#1C1C1C]"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            The Council for
            <br />
            <span className="text-[#C108AB]">Executive Excellence</span>
          </h1>
          <p className="text-base md:text-lg text-[#525252] max-w-2xl mx-auto mb-10 leading-relaxed">
            Executive coaching. Exclusive events. AI-powered career intelligence.
            A community of senior peers who understand where you are headed — and help you get there faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => (window.location.href = '/dex/chat')}>
              Start Your Executive Introduction
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => (window.location.href = '/council/membership')}>
              Explore Membership
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label}>
                <div
                  className="text-2xl md:text-3xl font-bold text-[#1C1C1C]"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  {s.value}
                </div>
                <div className="text-[10px] md:text-xs uppercase tracking-wider text-[#A3A3A3] mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-bold uppercase tracking-[2.5px] text-[#C108AB] mb-3">
              What You Get
            </div>
            <h2
              className="text-2xl md:text-4xl font-bold tracking-tight text-[#1C1C1C]"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Four pillars of an exceptional career
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="bg-white border border-[#E5E5E5] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(26,23,20,0.08)]"
                >
                  <div className="w-10 h-10 bg-[rgba(193,8,171,0.08)] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#C108AB]" />
                  </div>
                  <h3
                    className="text-base font-semibold text-[#1C1C1C] mb-2"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {b.title}
                  </h3>
                  <p className="text-sm text-[#525252] leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tier Comparison Cards */}
      <section className="bg-white border-y border-[#E5E5E5] py-20 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-bold uppercase tracking-[2.5px] text-[#C108AB] mb-3">
              Membership Tiers
            </div>
            <h2
              className="text-2xl md:text-4xl font-bold tracking-tight text-[#1C1C1C] mb-3"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Choose your level of access
            </h2>
            <p className="text-sm md:text-base text-[#525252] max-w-2xl mx-auto">
              Annual prepay. All tiers include DEX AI access, member directory, and event priority booking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TIERS.map((tier) => {
              const Icon = tier.icon;
              const isApplying = applyingTier === tier.id;
              return (
                <div
                  key={tier.id}
                  className={`relative bg-white p-6 flex flex-col transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(26,23,20,0.08)] ${
                    tier.popular
                      ? 'border-2 border-[#C108AB] shadow-[0_4px_12px_rgba(193,8,171,0.12)]'
                      : 'border border-[#E5E5E5]'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 bg-[#C108AB] text-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                        <Crown className="w-3 h-3" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="w-11 h-11 bg-[rgba(193,8,171,0.08)] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#C108AB]" />
                  </div>

                  <h3
                    className="text-lg font-semibold text-[#1C1C1C]"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {tier.name}
                  </h3>
                  <p className="text-xs text-[#A3A3A3] mt-1 mb-4 leading-relaxed min-h-[2.5rem]">
                    {tier.description}
                  </p>

                  <div className="mb-5">
                    <span
                      className="text-3xl font-bold text-[#1C1C1C]"
                      style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                    >
                      {tier.price}
                    </span>
                    <span className="text-xs text-[#A3A3A3] ml-1">{tier.period}</span>
                  </div>

                  {typeof tier.spotsRemaining === 'number' && (
                    <div className="mb-4 text-[11px] font-semibold text-[#C108AB] uppercase tracking-wide">
                      {tier.spotsRemaining} founding spots remaining
                    </div>
                  )}

                  <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-[#525252]">
                        <Check className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={tier.popular ? 'default' : 'outline'}
                    size="default"
                    className="w-full"
                    onClick={() => handleApply(tier.id)}
                    disabled={isApplying}
                    aria-busy={isApplying}
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Applying…
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

          <div className="text-center mt-10">
            <a
              href="/council/membership"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#C108AB] hover:text-[#A50798] transition-colors no-underline"
            >
              Compare all benefits in detail
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-bold uppercase tracking-[2.5px] text-[#C108AB] mb-3">
              Social Proof
            </div>
            <h2
              className="text-2xl md:text-4xl font-bold tracking-tight text-[#1C1C1C]"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              What Council members say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="bg-white border border-[#E5E5E5] p-7 flex flex-col"
              >
                <div className="text-[#C108AB] text-3xl leading-none mb-3" aria-hidden="true">
                  &ldquo;
                </div>
                <p className="text-sm text-[#1C1C1C] leading-relaxed mb-6 flex-1">{t.quote}</p>
                <div className="border-t border-[#E5E5E5] pt-4">
                  <div className="text-sm font-semibold text-[#1C1C1C]">{t.name}</div>
                  <div className="text-xs text-[#A3A3A3] mt-0.5">{t.title}</div>
                  <div className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold uppercase tracking-wide text-[#C108AB] bg-[rgba(193,8,171,0.08)] px-2 py-0.5">
                    <Crown className="w-3 h-3" />
                    {t.tier}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application CTA */}
      <section className="px-6 pb-20 md:pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden bg-[#C108AB] px-8 py-14 md:px-14 md:py-16 text-center">
            <div
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)' }}
              aria-hidden="true"
            />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 bg-white/15 text-white text-xs font-semibold uppercase tracking-widest">
                <Crown className="w-3 h-3" />
                Ready to Join?
              </div>
              <h2
                className="text-2xl md:text-4xl font-bold text-white mb-4 tracking-tight"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Apply to The Council today
              </h2>
              <p className="text-sm md:text-base text-white/85 max-w-xl mx-auto mb-8 leading-relaxed">
                Membership is curated. Applications are reviewed within 48 hours.
                Start with a Complimentary Executive Introduction to DEX AI, or jump straight to membership.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  className="!bg-white !text-[#C108AB] !border-white hover:!bg-white/90"
                  onClick={() => handleApply('individual')}
                >
                  Apply for Membership
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
