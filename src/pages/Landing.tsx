import React, { useEffect, useState } from 'react';
import { initScrollReveal } from '@/lib/utils';
import { ArrowRight, Menu, X, Lock, Layers, BadgeDollarSign, UserCheck } from 'lucide-react';
import { ASSESSMENT_CATALOG, FLAGSHIP_KEYS, SHIFT_SUITE_KEYS, ADVISORY_PRODUCT_KEYS, type AssessmentInfo } from '@/assessments/catalog';
import { UnifiedFooter } from '@/components/layout/UnifiedFooter';
import { SEO } from '@/components/seo/SEO';
import { trackCTA, trackNexusChatInitiation, trackAssessmentStart } from '@/analytics/eventTracker';
import { ResultMockup, NexusChatMockup } from '@/components/visual/ProductMockup';

const DS = {
  headingFont: "'Crimson Pro', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  monoFont: "'IBM Plex Mono', ui-monospace, monospace",
  accent: '#C108AB',
  accentHover: '#A00790',
  bg: '#FFFFFF',
  bgAlt: '#F7F6F3',
  card: '#FFFFFF',
  cardBorder: '#E9E7E1',
  text: '#0A0A12',
  textSecondary: '#2B2B3A',
  muted: '#616170',
  border: '#E9E7E1',
  radius: '0px',
  shadow: '0 1px 2px rgba(10,10,18,0.06), 0 1px 1px rgba(10,10,18,0.04)',
  shadowHover: '0 12px 30px rgba(10,10,18,0.08)',
};

const HERO_POSTER = 'https://www.lyc-partners.ai/images/heroes/hero-boardroom.webp';

// ── 5 Subscription Tiers (Canonical NEXUS Pricing v1.0) ──
interface PricingTierRow {
  key: 'explorer' | 'starter' | 'pro' | 'executive' | 'council';
  name: string;
  label: string;
  priceUsd: string;
  miles: number;
  features: string[];
  highlight?: boolean;
  cta: string;
  ctaHref: string;
}

const SUBSCRIPTION_TIERS: PricingTierRow[] = [
  {
    key: 'explorer',
    name: 'Executive Introduction',
    label: 'Complimentary access',
    priceUsd: '—',
    miles: 0,
    features: [
      'NEXUS AI — introductory sessions',
      'Framework exploration and sample outputs',
      'Assessment previews (no personalised reports)',
      'Community forum',
    ],
    cta: 'Begin exploration',
    ctaHref: '/nexus/chat',
  },
  {
    key: 'starter',
    name: 'Starter',
    label: 'Engaged executive',
    priceUsd: '$25',
    miles: 50,
    features: [
      'Unlimited NEXUS AI',
      'Full framework awareness',
      'Miles earning enabled',
      'Full assessments — pay per mile',
      'Detailed AI reports',
    ],
    cta: 'Start with Starter',
    ctaHref: '/pricing',
  },
  {
    key: 'pro',
    name: 'Pro',
    label: 'Serious transition',
    priceUsd: '$99',
    miles: 150,
    features: [
      'Everything in Starter',
      '360° rater access',
      'Peer benchmarking deep',
      'Historical tracking',
      'Content library',
    ],
    highlight: true,
    cta: 'Upgrade to Pro',
    ctaHref: '/pricing',
  },
  {
    key: 'executive',
    name: 'Executive',
    label: 'Board and C-suite',
    priceUsd: '$199',
    miles: 300,
    features: [
      'Everything in Pro',
      'Executive reviews',
      'Events access',
      'Priority support',
    ],
    cta: 'Go Executive',
    ctaHref: '/pricing',
  },
  {
    key: 'council',
    name: 'Council',
    label: 'Principal investors + board chairs',
    priceUsd: '$499',
    miles: 600,
    features: [
      'Everything in Executive',
      'Council community',
      'Live sessions / workshops',
      'Dedicated concierge',
    ],
    cta: 'Apply for Council',
    ctaHref: '/pricing',
  },
];

// ── 3 Capability cards
// Phase 9 Batch 6 ticket #1353: remove "Miles economy" from visitor-facing capability cards.
// Ticket #1351: fix 11→6 diagnostic count.
const CAPABILITIES = [
  {
    icon: Layers,
    title: 'Framework-aware conversations',
    desc: 'NEXUS knows all 6 leadership assessment frameworks end-to-end. Ask about positioning, governance, cross-border fit, or team transitions — it speaks the language of executive leadership, not generic advice.',
    href: '/nexus/chat',
    cta: 'Start a conversation',
  },
  {
    icon: BadgeDollarSign,
    title: 'Simple transparent pricing',
    desc: 'Pay for assessments à la carte from $99, or subscribe for a monthly allocation and deeper benefits. No fluff, no hidden fees.',
    href: '/pricing',
    cta: 'View pricing',
  },
  {
    icon: UserCheck,
    title: 'Personalized recommendations',
    desc: 'Based on what you discuss, NEXUS surfaces the right diagnostic at the right moment — not generic personality tests, but targeted assessments matched to your current transition point.',
    href: '/assessments',
    cta: 'Browse assessments',
  },
];

function TierBadge({ label, color = DS.accent }: { label: string; color?: string }) {
  return (
    <div
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        background: color,
        color: '#FFFFFF',
        fontFamily: DS.monoFont,
        fontSize: '10px',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.16em',
 
      }}
    >
      {label}
    </div>
  );
}

function AssessmentCard({ a, wide }: { a: AssessmentInfo; wide?: boolean }) {
  // Phase 9 Batch 6 ticket #1353: USD-first for visitors. Miles ≈ USD.
  const priceUsd = a.priceMiles; // miles and USD are 1:1
  return (
    <a
      href={`/assessment/${a.code.toLowerCase()}`}
      onClick={() => {
        trackCTA({ location: 'assessment_card', label: `Assessment: ${a.code}`, destination: `/assessment/${a.code.toLowerCase()}`, context_id: a.code });
        trackAssessmentStart(a.code, a.name, 'landing');
      }}
      className="card-hover"
      style={{
        display: 'block',
        textDecoration: 'none',
        background: DS.card,
        border: `1px solid ${DS.cardBorder}`,
 
        padding: wide ? '32px 28px' : '24px 20px',
        boxShadow: DS.shadow,
        transition: 'all 0.25s ease',
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              letterSpacing: '0.2em',
              // Ticket #1355: eyebrow labels are light gray, not accent
              color: '#9CA3AF',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            {a.code}
          </div>
          <h3
            style={{
              fontFamily: DS.headingFont,
              fontSize: wide ? '22px' : '17px',
              fontWeight: 700,
              color: DS.text,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {a.name}
          </h3>
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: '2px',
            fontFamily: DS.headingFont,
            fontSize: wide ? '28px' : '20px',
            fontWeight: 700,
            color: DS.text,
            lineHeight: 1,
          }}
        >
          ${priceUsd}
          <span
            style={{
              fontFamily: DS.monoFont,
              fontSize: '9px',
              letterSpacing: '0.1em',
              fontWeight: 500,
              textTransform: 'uppercase',
              marginLeft: '6px',
              color: '#9CA3AF',
            }}
          >
            USD
          </span>
        </span>
      </div>
      <p
        style={{
          fontFamily: DS.bodyFont,
          fontSize: '13px',
          lineHeight: 1.55,
          color: DS.textSecondary,
          margin: '0 0 16px',
          minHeight: wide ? '48px' : '60px',
        }}
      >
        {a.tagline || `${a.b2cName} — ${a.dimensions.length} dimensions, ${a.archetype_count} archetypes.`}
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontFamily: DS.monoFont,
          fontSize: '11px',
          color: DS.muted,
          letterSpacing: '0.04em',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <span>{a.total_questions} Q</span>
        <span style={{ color: DS.cardBorder }}>·</span>
        <span>{a.duration_minutes} MIN</span>
        <span style={{ color: DS.cardBorder }}>·</span>
        <span>{a.archetype_count} ARCHETYPES</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: `1px solid ${DS.border}`,
          paddingTop: '12px',
        }}
      >
        <span
          style={{
            fontFamily: DS.bodyFont,
            fontSize: '12px',
            fontWeight: 600,
            color: DS.accent,
          }}
        >
          Learn more
        </span>
        <ArrowRight style={{ width: 14, height: 14, color: DS.accent }} />
      </div>
    </a>
  );
}

function renderTierGroup(label: string, accent: string, keys: string[]) {
  const assessments = keys.map(k => ASSESSMENT_CATALOG[k]).filter(Boolean);
  if (assessments.length === 0) return null;
  const wide = keys.length === 1; // Flagship single card = wide
  return (
    <section id={`tier-${label.toLowerCase().replace(/\s+/g, '-')}`} style={{ marginBottom: '72px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px', borderBottom: `1px solid ${DS.border}`, paddingBottom: '12px' }}>
        <div>
          <div
            style={{
              display: 'inline-block',
              fontFamily: DS.monoFont,
              fontSize: '10px',
              letterSpacing: '0.2em',
              // Ticket #1355: eyebrow labels → #9CA3AF light gray per v1.2 brand spec
              color: '#9CA3AF',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            {assessments.length} {assessments.length === 1 ? 'ASSESSMENT' : 'ASSESSMENTS'}
          </div>
          <h3
            style={{
              fontFamily: DS.headingFont,
              fontSize: '24px',
              fontWeight: 700,
              color: DS.text,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {label}
          </h3>
        </div>
        <div
          style={{
            fontFamily: DS.monoFont,
            fontSize: '11px',
            color: DS.muted,
            letterSpacing: '0.1em',
          }}
          >
            {/* Ticket #1353: USD labels on catalog tiers */}
            {assessments.length === 1
              ? 'FROM $99 USD'
              : label.includes('Premium') ? 'PREMIUM · $149 USD' : 'STANDARD · $99 USD'}
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: wide ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        {assessments.map(a => (
          <AssessmentCard key={a.code} a={a} wide={wide} />
        ))}
      </div>
    </section>
  );
}

function PricingTableCard({ t }: { t: PricingTierRow }) {
  const highlight = !!t.highlight;
  return (
    <div
      className="card-hover"
      style={{
        background: highlight ? '#0A0A12' : DS.card,
        border: highlight ? `2px solid ${DS.accent}` : `1px solid ${DS.cardBorder}`,
 
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxShadow: highlight ? `0 0 0 1px ${DS.accent}14, 0 20px 50px ${DS.accent}18` : DS.shadow,
        position: 'relative',
      }}
    >
      {highlight && (
        <div
          style={{
            position: 'absolute',
            top: '-1px',
            right: '24px',
            transform: 'translateY(-50%)',
            background: DS.accent,
            color: '#FFF',
            fontFamily: DS.monoFont,
            fontSize: '9px',
            fontWeight: 600,
            letterSpacing: '0.2em',
            padding: '4px 10px',
            textTransform: 'uppercase',
 
          }}
        >
          Recommended
        </div>
      )}
      <div style={{ marginBottom: '20px' }}>
        <TierBadge label={t.key.toUpperCase()} color={highlight ? DS.accent : '#1a1a25'} />
      </div>
      <div
        style={{
          fontFamily: DS.headingFont,
          fontSize: '22px',
          fontWeight: 700,
          color: highlight ? '#FFF' : DS.text,
          marginBottom: '4px',
          letterSpacing: '-0.01em',
        }}
      >
        {t.name}
      </div>
      <div
        style={{
          fontFamily: DS.bodyFont,
          fontSize: '12px',
          color: highlight ? 'rgba(255,255,255,0.6)' : DS.muted,
          marginBottom: '16px',
        }}
      >
        {t.label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '6px' }}>
        <span
          style={{
            fontFamily: DS.headingFont,
            fontSize: '28px',
            fontWeight: 700,
            color: highlight ? '#FFF' : DS.text,
            lineHeight: 1,
          }}
        >
          {t.priceUsd}
        </span>
        {t.priceUsd !== '—' && (
          <span
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '12px',
              color: highlight ? 'rgba(255,255,255,0.5)' : DS.muted,
            }}
          >
            /mo
          </span>
        )}
      </div>
      {/* Ticket #1353: Miles made secondary (small, muted) — visitor-facing page shows USD as primary */}
      {t.priceUsd !== '—' && t.miles > 0 && (
        <div
          style={{
            fontFamily: DS.monoFont,
            fontSize: '10px',
            color: highlight ? 'rgba(255,255,255,0.4)' : '#9CA3AF',
            letterSpacing: '0.1em',
            marginBottom: '18px',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          {t.miles} mi included / mo
        </div>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {t.features.map(f => (
          <li
            key={f}
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
              fontFamily: DS.bodyFont,
              fontSize: '12.5px',
              lineHeight: 1.5,
              color: highlight ? 'rgba(255,255,255,0.8)' : DS.textSecondary,
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                marginTop: '7px',
                background: highlight ? DS.accent : DS.accent,
                flexShrink: 0,
              }}
            />
            {f}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 'auto' }}>
        <a
          href={t.ctaHref}
          onClick={() => trackCTA({ location: 'pricing_tier', label: `Pricing: ${t.cta}`, destination: t.ctaHref, context_id: t.key })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '14px 18px',
            background: highlight ? DS.accent : '#0A0A12',
            color: '#FFF',
            textDecoration: 'none',
            fontFamily: DS.bodyFont,
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
 
            transition: 'background 0.2s ease',
            boxSizing: 'border-box',
          }}
        >
          {t.cta} <ArrowRight style={{ width: 13, height: 13 }} />
        </a>
      </div>
    </div>
  );
}

export function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const observer = initScrollReveal();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Ticket #1352 — only B2C links in marketing nav.
  const navLinks = [
    { href: '/assessments', label: 'Assessments' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/nexus/chat', label: 'NEXUS AI' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: DS.bg, color: DS.text }}>
      <SEO page="landing" />
      {/* NAV */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 32px',
          borderBottom: `1px solid ${DS.border}`,
        }}
      >
        <a href="/" style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, textDecoration: 'none', letterSpacing: '-0.01em' }}>
          LYC Intelligence
        </a>
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {navLinks.map(l => (
            <a
              key={l.href}
              href={l.href}
              style={{
                fontFamily: DS.bodyFont,
                fontSize: '13px',
                color: DS.textSecondary,
                textDecoration: 'none',
                padding: '10px 14px',
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                fontWeight: 500,
              }}
            >
              {l.label}
            </a>
          ))}
          <a
            href="/nexus/chat"
            onClick={() => { trackNexusChatInitiation('hero_nav'); trackCTA({ location: 'hero', label: 'Try NEXUS (nav)', destination: '/nexus/chat' }); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              marginLeft: '8px',
              color: DS.text,
              fontFamily: DS.bodyFont,
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              minHeight: '44px',
            }}
          >
            Try NEXUS <ArrowRight style={{ width: 12, height: 12 }} />
          </a>
          <a
            href="/login"
            onClick={() => trackCTA({ location: 'hero', label: 'Platform Login', destination: '/login' })}
            className=""
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              background: DS.accent,
              color: '#FFFFFF',
 
              fontFamily: DS.bodyFont,
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              minHeight: '44px',
              transition: 'all 0.2s ease',
            }}
          >
            <Lock style={{ width: 14, height: 14 }} /> Platform
          </a>
        </div>
        <button className="nav-toggle" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu style={{ color: DS.text }} />
        </button>
      </nav>

      {/* MOBILE OVERLAY */}
      <div className={`nav-mobile-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`nav-mobile ${mobileOpen ? 'open' : ''}`} style={{ background: DS.bg }}>
        <button className="nav-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <X style={{ width: 24, height: 24, color: '#000' }} />
        </button>
        {navLinks.map(l => (
          <a key={l.href} href={l.href} onClick={() => { setMobileOpen(false); trackCTA({ location: 'hero', label: `Mobile: ${l.label}`, destination: l.href }); }} style={{ color: DS.textSecondary, borderBottom: `1px solid ${DS.border}` }}>{l.label}</a>
        ))}
        <a href="/nexus/chat" onClick={() => { setMobileOpen(false); trackNexusChatInitiation('hero_nav_mobile'); trackCTA({ location: 'hero', label: 'Try NEXUS (mobile)', destination: '/nexus/chat' }); }} style={{ fontFamily: DS.bodyFont, fontSize: '15px', fontWeight: 600, color: DS.accent, borderBottom: `1px solid ${DS.border}` }}>Try NEXUS →</a>
        <a href="/login" onClick={() => { setMobileOpen(false); trackCTA({ location: 'hero', label: 'Platform Login (mobile)', destination: '/login' }); }} style={{ fontFamily: DS.bodyFont, fontSize: '15px', fontWeight: 600, color: DS.text, borderBottom: `1px solid ${DS.border}` }}>Platform</a>
      </div>

      {/* HERO */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '82vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Background image layer */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${HERO_POSTER})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(2px) brightness(0.55)',
            transform: 'scale(1.04)',
          }}
        />
        {/* Gradient overlay — deep obsidian with fuchsia edge */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(7,6,14,0.85) 0%, rgba(10,6,14,0.7) 30%, rgba(18,10,24,0.7) 55%, rgba(8,5,12,0.95) 100%)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '720px',
            height: '480px',
            background: 'radial-gradient(circle, rgba(193,8,171,0.14) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '920px',
            padding: '104px 32px 80px',
            textAlign: 'center',
            margin: '0 auto',
          }}
        >
          <div
            className="section-label-dark"
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.28em',
              color: 'rgba(255,255,255,0.55)',
              marginBottom: '20px',
            }}
          >
            LYC INTELLIGENCE · V3.0
          </div>
          <h1
            className="hero-heading"
            style={{
              fontFamily: DS.headingFont,
              fontSize: 'clamp(36px, 6vw, 60px)',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: '0 auto 16px',
              lineHeight: 1.08,
              letterSpacing: '-0.015em',
              maxWidth: '820px',
            }}
          >
            The intelligent front door<br />to leadership intelligence.
          </h1>
          <p
            className="hero-sub"
            style={{
              fontFamily: DS.bodyFont,
              fontSize: 'clamp(15px, 1.7vw, 18px)',
              color: 'rgba(255,255,255,0.72)',
              maxWidth: '600px',
              margin: '0 auto 44px',
              lineHeight: 1.6,
            }}
          >
            NEXUS holds every leadership assessment framework in memory, surfaces the blind spots you haven't
            named yet, and opens the door to deep assessments tailored to your current transition.
          </p>

          <div className="reveal reveal-delay-1" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
            <a
              href="/nexus/chat"
              onClick={() => { trackNexusChatInitiation('hero_cta'); trackCTA({ location: 'hero', label: 'Try NEXUS (primary)', destination: '/nexus/chat' }); }}
              className=""
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '18px 36px',
                background: '#C108AB',
                color: '#FFF',
                fontFamily: DS.bodyFont,
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                textDecoration: 'none',
 
                transition: 'all 0.2s ease',
              }}
            >
              Try NEXUS <ArrowRight style={{ width: 15, height: 15 }} />
            </a>
            <a
              href="/assessment"
              onClick={() => trackCTA({ location: 'hero', label: 'Explore Assessments', destination: '/assessment' })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '18px 32px',
                border: '1px solid rgba(255,255,255,0.28)',
                color: '#FFFFFF',
                fontFamily: DS.bodyFont,
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                textDecoration: 'none',
 
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}
            >
              Explore assessments
            </a>
          </div>

          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '11px',
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.16em',
            }}
          >
            6 LEADERSHIP ASSESSMENTS · 2 TIERS · TRANSPARENT PRICING
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section style={{ background: DS.bgAlt, padding: '44px 32px', borderBottom: `1px solid ${DS.border}` }}>
        <div
          className="reveal grid-responsive"
          style={{
            maxWidth: '1120px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '24px',
            textAlign: 'center',
          }}
        >
          {[
            { v: '6', l: 'Leadership assessments' },
            { v: '47', l: 'Markets covered' },
            { v: '93%', l: 'Executive retention' },
            { v: '20yr', l: 'APAC placement data' },
          ].map(s => (
            <div key={s.l}>
              <div style={{ fontFamily: DS.headingFont, fontSize: '32px', fontWeight: 700, color: DS.accent, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontFamily: DS.bodyFont, fontSize: '11px', color: DS.muted, marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CAPABILITIES — 3 CARDS */}
      <section
        className="reveal section-padding"
        style={{ maxWidth: '1120px', margin: '0 auto', padding: '96px 32px 48px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.26em',
              // Ticket #1355: light gray eyebrow #9CA3AF
              color: '#9CA3AF',
              marginBottom: '12px',
            }}
          >
            How NEXUS works
          </div>
          <h2
            style={{
              fontFamily: DS.headingFont,
              fontSize: 'clamp(26px, 3vw, 34px)',
              fontWeight: 700,
              color: DS.text,
              maxWidth: '680px',
              margin: '0 auto',
              lineHeight: 1.18,
              letterSpacing: '-0.01em',
            }}
          >
            One thinking partner.<br />Every executive framework.
          </h2>
        </div>
        <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {CAPABILITIES.map(c => (
            <a
              key={c.title}
              href={c.href}
              onClick={() => trackCTA({ location: 'match_cta', label: `Capability: ${c.cta}`, destination: c.href })}
              className="card-hover"
              style={{
                background: DS.card,
                border: `1px solid ${DS.cardBorder}`,
 
                padding: '28px 24px',
                textDecoration: 'none',
                boxShadow: DS.shadow,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'inline-flex', width: '40px', height: '40px', background: `${DS.accent}12`, color: DS.accent, alignItems: 'center', justifyContent: 'center' }}>
                <c.icon style={{ width: 18, height: 18 }} />
              </div>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, margin: 0, letterSpacing: '-0.01em' }}>
                {c.title}
              </h3>
              <p style={{ fontFamily: DS.bodyFont, fontSize: '13.5px', color: DS.textSecondary, margin: 0, lineHeight: 1.6 }}>
                {c.desc}
              </p>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '8px',
                  fontFamily: DS.bodyFont,
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: DS.accent,
                }}
              >
                {c.cta} <ArrowRight style={{ width: 13, height: 13 }} />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* #1370 — SEE IT IN ACTION: CSS-illustrated product mockups (premium visual assets) */}
      <section
        className="reveal section-padding"
        style={{ maxWidth: '1120px', margin: '0 auto', padding: '96px 32px 48px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.26em',
              color: '#9CA3AF',
              marginBottom: '12px',
            }}
          >
            See it in action
          </div>
          <h2
            style={{
              fontFamily: DS.headingFont,
              fontSize: 'clamp(26px, 3vw, 34px)',
              fontWeight: 700,
              color: DS.text,
              maxWidth: '680px',
              margin: '0 auto',
              lineHeight: 1.18,
              letterSpacing: '-0.01em',
            }}
          >
            Premium reports. AI coaching. One platform.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'start', justifyItems: 'center' }}>
          <ResultMockup style={{ maxWidth: 340, width: '100%' }} />
          <NexusChatMockup style={{ maxWidth: 340, width: '100%' }} />
        </div>
      </section>

      {/* ASSESSMENT CATALOG — 3 TIER */}
      <section
        id="assessment-catalog"
        style={{ background: DS.bgAlt, padding: '96px 32px', borderTop: `1px solid ${DS.border}`, borderBottom: `1px solid ${DS.border}` }}
      >
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.26em',
                // Ticket #1355: light gray eyebrow
                color: '#9CA3AF',
                marginBottom: '12px',
              }}
            >
              Assessment Catalog
            </div>
            <h2
              style={{
                fontFamily: DS.headingFont,
                fontSize: 'clamp(26px, 3vw, 34px)',
                fontWeight: 700,
                color: DS.text,
                maxWidth: '680px',
                margin: '0 auto 12px',
                lineHeight: 1.18,
                letterSpacing: '-0.01em',
              }}
            >
              Six leadership assessments.<br />Exactly one right fit per moment.
            </h2>
            <p
              style={{
                fontFamily: DS.bodyFont,
                fontSize: '14px',
                color: DS.muted,
                maxWidth: '560px',
                margin: '0 auto',
                lineHeight: 1.6,
              }}
            >
              Pay for exactly what you need — a targeted diagnostic for a specific
              transition moment, or subscribe for the full suite.
            </p>
          </div>

          {renderTierGroup('Leadership Assessments', DS.accent, ADVISORY_PRODUCT_KEYS)}
        </div>
      </section>

      {/* PRICING — 5 TIERS */}
      <section id="pricing" className="reveal section-padding" style={{ maxWidth: '1120px', margin: '0 auto', padding: '96px 32px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.26em',
              // Ticket #1355: light gray eyebrow
              color: '#9CA3AF',
              marginBottom: '12px',
            }}
          >
            Subscription plans
          </div>
          <h2
            style={{
              fontFamily: DS.headingFont,
              fontSize: 'clamp(26px, 3vw, 34px)',
              fontWeight: 700,
              color: DS.text,
              maxWidth: '720px',
              margin: '0 auto 12px',
              lineHeight: 1.18,
              letterSpacing: '-0.01em',
            }}
          >
            Start with an Executive Introduction. Scale when you're ready.
          </h2>
          <p
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '14px',
              color: DS.muted,
              maxWidth: '560px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            All USD pricing shown. Monthly allocations and member benefits are explained after sign-up.
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            alignItems: 'stretch',
          }}
        >
          {SUBSCRIPTION_TIERS.map(t => (
            <PricingTableCard key={t.key} t={t} />
          ))}
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section
        className="reveal"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 32px',
          textAlign: 'center',
          marginTop: '48px',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #0a0812 0%, #160c1c 40%, #25122d 70%, #33183f 100%)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-120px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '720px',
            height: '480px',
            background: 'radial-gradient(circle, rgba(193,8,171,0.18) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px', margin: '0 auto' }}>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.28em',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '16px',
            }}
          >
            Begin today
          </div>
          <h2
            style={{
              fontFamily: DS.headingFont,
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: '0 0 16px',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
          >
            Start with NEXUS.<br />One conversation in.
          </h2>
          <p
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '15px',
              color: 'rgba(255,255,255,0.62)',
              maxWidth: '440px',
              margin: '0 auto 36px',
              lineHeight: 1.6,
            }}
          >
            The intelligent front door is open. NEXUS will ask the questions you haven't yet thought to ask.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/nexus/chat"
              className=""
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '18px 36px',
                background: '#C108AB',
                color: '#FFFFFF',
 
                fontFamily: DS.bodyFont,
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                textDecoration: 'none',
              }}
            >
              Try NEXUS <ArrowRight style={{ width: 14, height: 14 }} />
            </a>
            <a
              href="/assessment"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '18px 32px',
                border: '1px solid rgba(193,8,171,0.45)',
                color: '#C108AB',
 
                fontFamily: DS.bodyFont,
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                textDecoration: 'none',
              }}
            >
              Browse assessments
            </a>
          </div>
        </div>
      </section>

      <UnifiedFooter />
    </div>
  );
}
