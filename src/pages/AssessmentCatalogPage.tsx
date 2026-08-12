/**
 * AssessmentCatalogPage — dedicated /assessment catalog (#1319).
 *
 * Surfaces all 11 canonical diagnostics in one indexable, shareable page,
 * organised by the 3 canonical categories (Flagship / SHIFT Suite / Advisory
 * Products) per NEXUS Product Spec v3 §6. Replaces the previous /assessment →
 * /#assessment-catalog hash redirect so assessments have their own URL, SEO
 * metadata, and navigation target.
 *
 * CTAs are assessments-first: every card links directly to the instrument
 * landing page. NEXUS appears only as a secondary "not sure where to start"
 * prompt at the bottom, preserving NEXUS as the intelligent front door without
 * burying the diagnostics behind it.
 */
import React, { useEffect, useState } from 'react';
import { ArrowRight, Menu, X, Lock, Compass } from 'lucide-react';
import { initScrollReveal } from '@/lib/utils';
import {
  ASSESSMENT_CATALOG,
  FLAGSHIP_KEYS,
  SHIFT_SUITE_KEYS,
  ADVISORY_PRODUCT_KEYS,
  type AssessmentInfo,
  type InstrumentTierGroup,
} from '@/assessments/catalog';
import { UnifiedFooter } from '@/components/layout/UnifiedFooter';
import { SEO } from '@/components/seo/SEO';
import { trackCTA, trackAssessmentStart } from '@/analytics/eventTracker';

const DS = {
  headingFont: "'Crimson Pro', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  monoFont: "'IBM Plex Mono', ui-monospace, monospace",
  accent: '#C108AB',
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
};

interface CategoryDef {
  group: InstrumentTierGroup;
  label: string;
  eyebrow: string;
  description: string;
  keys: string[];
  priceHint: string;
}

const CATEGORIES: CategoryDef[] = [
  {
    group: 'flagship',
    label: 'Flagship',
    eyebrow: '1 instrument · positioning baseline',
    description:
      'The single-shot diagnostic calibrated against 20 years of LYC APAC placement data. Begin here before a senior market move — it establishes the composite baseline every other instrument refines.',
    keys: FLAGSHIP_KEYS,
    priceHint: 'UNIQUE TIER · 199 MI',
  },
  {
    group: 'shift',
    label: 'SHIFT Suite',
    eyebrow: '5 instruments · executive transitions',
    description:
      'For leaders stepping into a broader mandate — functional to enterprise, executive to board, or resetting motivation and coaching range. Each instrument isolates the dimension where the transition typically breaks.',
    keys: SHIFT_SUITE_KEYS,
    priceHint: 'STANDARD 99 MI · PREMIUM 149 MI',
  },
  {
    group: 'advisory',
    label: 'Advisory Products',
    eyebrow: '5 instruments · targeted pressure points',
    description:
      'Focused diagnostics for the current pressure point — market legibility, AI readiness, bilateral coaching, cross-border fit, or partnership architecture. Choose the one that names the tension you are sitting in.',
    keys: ADVISORY_PRODUCT_KEYS,
    priceHint: 'STANDARD 99 MI · PREMIUM 149 MI',
  },
];

function AssessmentCard({ a, wide }: { a: AssessmentInfo; wide?: boolean }) {
  const accentColor = a.is_cpi ? DS.accent : '#15151E';
  return (
    <a
      href={`/assessment/${a.code.toLowerCase()}`}
      onClick={() => {
        trackCTA({ location: 'assessment_card', label: `Assessment: ${a.code}`, destination: `/assessment/${a.code.toLowerCase()}`, context_id: a.code });
        trackAssessmentStart(a.code, a.name, 'catalog');
      }}
      className="card-hover"
      style={{
        display: 'block',
        textDecoration: 'none',
        background: DS.card,
        border: `1px solid ${DS.cardBorder}`,
        borderRadius: DS.radius,
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
              color: DS.accent,
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
            color: accentColor,
            lineHeight: 1,
          }}
        >
          {a.priceMiles}
          <span
            style={{
              fontFamily: DS.monoFont,
              fontSize: '9px',
              letterSpacing: '0.1em',
              fontWeight: 500,
              textTransform: 'uppercase',
              marginLeft: '4px',
            }}
          >
            mi
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
          Explore instrument
        </span>
        <ArrowRight style={{ width: 14, height: 14, color: DS.accent }} />
      </div>
    </a>
  );
}

function CategorySection({ cat }: { cat: CategoryDef }) {
  const assessments = cat.keys.map((k) => ASSESSMENT_CATALOG[k]).filter(Boolean);
  if (assessments.length === 0) return null;
  const wide = cat.group === 'flagship';
  return (
    <section style={{ marginBottom: '72px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px', borderBottom: `1px solid ${DS.border}`, paddingBottom: '12px' }}>
        <div>
          <div
            style={{
              display: 'inline-block',
              fontFamily: DS.monoFont,
              fontSize: '10px',
              letterSpacing: '0.2em',
              color: DS.accent,
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            {cat.eyebrow}
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
            {cat.label}
          </h3>
        </div>
        <div
          style={{
            fontFamily: DS.monoFont,
            fontSize: '11px',
            color: DS.muted,
            letterSpacing: '0.1em',
            textAlign: 'right',
          }}
        >
          {cat.priceHint}
        </div>
      </div>
      <p
        style={{
          fontFamily: DS.bodyFont,
          fontSize: '13.5px',
          lineHeight: 1.6,
          color: DS.textSecondary,
          margin: '0 0 28px',
          maxWidth: '680px',
        }}
      >
        {cat.description}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: wide ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        {assessments.map((a) => (
          <AssessmentCard key={a.code} a={a} wide={wide} />
        ))}
      </div>
    </section>
  );
}

export function AssessmentCatalogPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const observer = initScrollReveal();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navLinks = [
    { href: '/assessment', label: 'Assessments' },
    { href: '/match', label: 'Match Analysis' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/b2b', label: 'For Firms' },
  ];

  const totalInstruments =
    FLAGSHIP_KEYS.length + SHIFT_SUITE_KEYS.length + ADVISORY_PRODUCT_KEYS.length;

  return (
    <div style={{ minHeight: '100vh', background: DS.bg, color: DS.text }}>
      <SEO page="assessments" />

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
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                fontFamily: DS.bodyFont,
                fontSize: '13px',
                color: l.href === '/assessment' ? DS.accent : DS.textSecondary,
                textDecoration: 'none',
                padding: '10px 14px',
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                fontWeight: l.href === '/assessment' ? 700 : 500,
                borderBottom: l.href === '/assessment' ? `2px solid ${DS.accent}` : '2px solid transparent',
              }}
            >
              {l.label}
            </a>
          ))}
          <a
            href="/login"
            onClick={() => trackCTA({ location: 'catalog_nav', label: 'Platform Login', destination: '/login' })}
            className="cta-glow"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              marginLeft: '8px',
              background: DS.accent,
              color: '#FFFFFF',
              borderRadius: DS.radius,
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
        {navLinks.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} style={{ color: DS.textSecondary, borderBottom: `1px solid ${DS.border}` }}>{l.label}</a>
        ))}
        <a href="/login" onClick={() => setMobileOpen(false)} style={{ fontFamily: DS.bodyFont, fontSize: '15px', fontWeight: 600, color: DS.text, borderBottom: `1px solid ${DS.border}` }}>Platform</a>
      </div>

      {/* HERO */}
      <section
        style={{
          background: DS.bgAlt,
          padding: '88px 32px 64px',
          borderBottom: `1px solid ${DS.border}`,
        }}
      >
        <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.28em',
              color: DS.accent,
              marginBottom: '16px',
            }}
          >
            Assessment Catalog
          </div>
          <h1
            style={{
              fontFamily: DS.headingFont,
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 700,
              color: DS.text,
              margin: '0 auto 16px',
              lineHeight: 1.12,
              letterSpacing: '-0.015em',
              maxWidth: '720px',
            }}
          >
            Eleven leadership diagnostics.<br />Three categories. One right fit per moment.
          </h1>
          <p
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '15px',
              color: DS.textSecondary,
              maxWidth: '580px',
              margin: '0 auto 32px',
              lineHeight: 1.65,
            }}
          >
            Each instrument is validated against 20 years of LYC APAC placement data — not
            generic personality tests, but targeted diagnostics matched to the transition you
            are actually in. Spend miles on exactly what you need.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <a
              href="#catalog"
              onClick={() => trackCTA({ location: 'catalog_hero', label: 'Browse the catalog', destination: '#catalog' })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '16px 32px',
                background: DS.accent,
                color: '#FFFFFF',
                fontFamily: DS.bodyFont,
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                borderRadius: DS.radius,
                transition: 'all 0.2s ease',
              }}
            >
              Browse the catalog <ArrowRight style={{ width: 14, height: 14 }} />
            </a>
            <a
              href="/pricing"
              onClick={() => trackCTA({ location: 'catalog_hero', label: 'View pricing', destination: '/pricing' })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '16px 28px',
                border: `1px solid ${DS.border}`,
                color: DS.text,
                fontFamily: DS.bodyFont,
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                borderRadius: DS.radius,
                background: DS.card,
              }}
            >
              View pricing
            </a>
          </div>
          <div
            style={{
              marginTop: '28px',
              fontFamily: DS.monoFont,
              fontSize: '11px',
              color: DS.muted,
              letterSpacing: '0.16em',
            }}
          >
            {totalInstruments} INSTRUMENTS · 3 CATEGORIES · MILES ECONOMY
          </div>
        </div>
      </section>

      {/* CATALOG */}
      <section
        id="catalog"
        className="reveal section-padding"
        style={{ maxWidth: '1120px', margin: '0 auto', padding: '80px 32px 48px' }}
      >
        {CATEGORIES.map((cat) => (
          <CategorySection key={cat.group} cat={cat} />
        ))}
      </section>

      {/* NEXUS SECONDARY CTA */}
      <section
        className="reveal"
        style={{
          background: DS.bgAlt,
          padding: '80px 32px',
          borderTop: `1px solid ${DS.border}`,
          borderBottom: `1px solid ${DS.border}`,
        }}
      >
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              width: '44px',
              height: '44px',
              background: `${DS.accent}12`,
              color: DS.accent,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: DS.radius,
              marginBottom: '20px',
            }}
          >
            <Compass style={{ width: 20, height: 20 }} />
          </div>
          <h2
            style={{
              fontFamily: DS.headingFont,
              fontSize: 'clamp(24px, 3vw, 30px)',
              fontWeight: 700,
              color: DS.text,
              margin: '0 0 12px',
              letterSpacing: '-0.01em',
            }}
          >
            Not sure which instrument fits?
          </h2>
          <p
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '14.5px',
              color: DS.textSecondary,
              maxWidth: '480px',
              margin: '0 auto 28px',
              lineHeight: 1.6,
            }}
          >
            NEXUS holds all eleven frameworks in memory and surfaces the diagnostic matched
            to your current transition point — not the one you would have picked by default.
          </p>
          <a
            href="/nexus/chat"
            onClick={() => trackCTA({ location: 'catalog_nexus', label: 'Ask NEXUS', destination: '/nexus/chat' })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '15px 30px',
              background: '#0A0A12',
              color: '#FFFFFF',
              fontFamily: DS.bodyFont,
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              borderRadius: DS.radius,
              transition: 'all 0.2s ease',
            }}
          >
            Ask NEXUS <ArrowRight style={{ width: 13, height: 13 }} />
          </a>
        </div>
      </section>

      <UnifiedFooter />
    </div>
  );
}

export default AssessmentCatalogPage;
