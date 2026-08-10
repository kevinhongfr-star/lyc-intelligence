import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Menu, X, Lock, Layers, Clock, HelpCircle, Sparkles } from 'lucide-react';
import { initScrollReveal } from '@/lib/utils';
import { ASSESSMENT_CATALOG, type AssessmentInfo } from '@/assessments/catalog';
import { UnifiedFooter } from '@/components/layout/UnifiedFooter';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
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

export function CanonicalInstrumentLanding() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  useEffect(() => {
    const observer = initScrollReveal();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const key = (code || '').toUpperCase();
  const info: AssessmentInfo | undefined = ASSESSMENT_CATALOG[key];

  if (!info) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DS.bodyFont, padding: '32px' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ fontFamily: DS.monoFont, fontSize: '11px', letterSpacing: '0.2em', color: DS.accent, marginBottom: '12px', textTransform: 'uppercase' }}>Instrument not found</div>
          <h1 style={{ fontFamily: DS.headingFont, fontSize: '32px', marginBottom: '16px', color: DS.text }}>This assessment does not exist.</h1>
          <p style={{ color: DS.muted, marginBottom: '28px', lineHeight: 1.6 }}>
            The instrument code "{code}" is not in the canonical catalog. Return to the assessment catalog to browse all 11 diagnostics.
          </p>
          <a
            href="/assessment"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: DS.accent, color: '#FFF', textDecoration: 'none', fontFamily: DS.bodyFont, fontSize: '12px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', borderRadius: DS.radius }}
          >
            <ArrowLeft style={{ width: 13, height: 13 }} /> Browse assessments
          </a>
        </div>
      </div>
    );
  }

  const tierColor = info.is_cpi ? DS.accent : '#15151E';
  const tierEyebrow = info.is_cpi
    ? 'FLAGSHIP · 199 MI'
    : info.is_shift
      ? 'SHIFT SUITE · 149 MI'
      : 'ADVISORY · 99 MI';
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/assessment', label: 'Assessments' },
    { href: '/match', label: 'Match Analysis' },
    { href: '/pricing', label: 'Pricing' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: DS.bg, color: DS.text }}>
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
              style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.textSecondary, textDecoration: 'none', padding: '10px 14px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', fontWeight: 500 }}
            >
              {l.label}
            </a>
          ))}
          <a
            href="/nexus/chat"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', marginLeft: '8px', color: DS.text, fontFamily: DS.bodyFont, fontSize: '13px', fontWeight: 600, textDecoration: 'none', minHeight: '44px' }}
          >
            Try NEXUS <ArrowRight style={{ width: 12, height: 12 }} />
          </a>
          <a
            href="/login"
            className="cta-glow"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: DS.accent, color: '#FFF', fontFamily: DS.bodyFont, fontSize: '13px', fontWeight: 600, textDecoration: 'none', minHeight: '44px' }}
          >
            <Lock style={{ width: 14, height: 14 }} /> Platform
          </a>
        </div>
        <button className="nav-toggle" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu style={{ color: DS.text }} />
        </button>
      </nav>

      <div className={`nav-mobile-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`nav-mobile ${mobileOpen ? 'open' : ''}`} style={{ background: DS.bg }}>
        <button className="nav-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <X style={{ width: 24, height: 24, color: '#000' }} />
        </button>
        {navLinks.map(l => (
          <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} style={{ color: DS.textSecondary, borderBottom: `1px solid ${DS.border}` }}>{l.label}</a>
        ))}
        <a href="/nexus/chat" onClick={() => setMobileOpen(false)} style={{ fontFamily: DS.bodyFont, fontSize: '15px', fontWeight: 600, color: DS.accent, borderBottom: `1px solid ${DS.border}` }}>Try NEXUS →</a>
        <a href="/login" onClick={() => setMobileOpen(false)} style={{ fontFamily: DS.bodyFont, fontSize: '15px', fontWeight: 600, color: DS.text, borderBottom: `1px solid ${DS.border}` }}>Platform</a>
      </div>

      {/* HERO */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${info.is_cpi ? '#140a1a' : '#0c0c18'} 0%, #0a0812 45%, #1a0c1e 100%)`,
          color: '#FFF',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '720px',
            height: '440px',
            background: `radial-gradient(circle, ${DS.accent}1c 0%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '980px', margin: '0 auto', padding: '80px 32px 64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <a
              href="/assessment"
              style={{ fontFamily: DS.monoFont, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft style={{ width: 12, height: 12 }} /> All 11 instruments
            </a>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: '10px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                fontWeight: 600,
                color: info.is_cpi ? DS.accent : 'rgba(255,255,255,0.55)',
              }}
            >
              {tierEyebrow}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'inline-block',
                fontFamily: DS.monoFont,
                fontSize: '11px',
                letterSpacing: '0.28em',
                color: DS.accent,
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              {info.code}
            </div>
            <h1
              style={{
                fontFamily: DS.headingFont,
                fontSize: 'clamp(32px, 5vw, 52px)',
                fontWeight: 700,
                color: '#FFF',
                margin: '0 0 10px',
                lineHeight: 1.1,
                letterSpacing: '-0.015em',
                maxWidth: '780px',
              }}
            >
              {info.name}
            </h1>
            <p
              style={{
                fontFamily: DS.bodyFont,
                fontSize: 'clamp(15px, 1.7vw, 19px)',
                color: 'rgba(255,255,255,0.7)',
                maxWidth: '620px',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {info.tagline || `${info.b2cName} — ${info.dimensions.length} dimensions, ${info.archetype_count} archetypes.`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '24px', margin: '36px 0', flexWrap: 'wrap' }}>
            <Stat icon={HelpCircle} value={`${info.total_questions}`} label="QUESTIONS" />
            <Stat icon={Clock} value={`${info.duration_minutes}`} label="MINUTES" />
            <Stat icon={Layers} value={`${info.dimensions.length}`} label="DIMENSIONS" />
            <Stat icon={Sparkles} value={`${info.archetype_count}`} label="ARCHETYPES" />
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href="/nexus/chat"
              className="cta-glow"
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
                borderRadius: DS.radius,
              }}
            >
              Begin with NEXUS <ArrowRight style={{ width: 15, height: 15 }} />
            </a>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: '4px',
                padding: '14px 24px',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: DS.radius,
              }}
            >
              <span style={{ fontFamily: DS.headingFont, fontSize: '26px', fontWeight: 700, color: DS.accent, lineHeight: 1 }}>{info.priceMiles}</span>
              <span style={{ fontFamily: DS.monoFont, fontSize: '10px', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginLeft: '4px' }}>mi · executive introduction</span>
            </div>
          </div>
        </div>
      </section>

      {/* DIMENSIONS */}
      <section className="reveal section-padding" style={{ maxWidth: '1120px', margin: '0 auto', padding: '88px 32px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.26em',
              color: DS.accent,
              marginBottom: '12px',
            }}
          >
            Instrument dimensions
          </div>
          <h2
            style={{
              fontFamily: DS.headingFont,
              fontSize: 'clamp(24px, 3vw, 32px)',
              fontWeight: 700,
              color: DS.text,
              maxWidth: '680px',
              margin: '0 auto',
              lineHeight: 1.18,
              letterSpacing: '-0.01em',
            }}
          >
            Measured on {info.dimensions.length} axes of executive capability.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {info.dimensions.map((d, i) => (
            <div
              key={d.id}
              className="card-hover"
              style={{
                background: DS.card,
                border: `1px solid ${DS.cardBorder}`,
                borderRadius: DS.radius,
                padding: '22px 20px',
                boxShadow: DS.shadow,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    background: info.is_cpi ? DS.accent : '#15151E',
                    color: '#FFF',
                    fontFamily: DS.monoFont,
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: DS.radius,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ fontFamily: DS.monoFont, fontSize: '10px', letterSpacing: '0.18em', color: DS.muted, textTransform: 'uppercase' }}>
                  D{i + 1}
                </div>
              </div>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 700, color: DS.text, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                {d.name}
              </h3>
              <p style={{ fontFamily: DS.bodyFont, fontSize: '12.5px', color: DS.textSecondary, lineHeight: 1.55, margin: '0 0 12px' }}>
                {d.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: DS.monoFont, fontSize: '9.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: DS.muted }}>
                <span>← {d.lowLabel}</span>
                <span style={{ color: DS.accent }}>{d.question_count}Q</span>
                <span>{d.highLabel} →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING TIERS */}
      <section
        style={{ background: DS.bgAlt, padding: '88px 32px', borderTop: `1px solid ${DS.border}`, borderBottom: `1px solid ${DS.border}` }}
      >
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.26em',
                color: DS.accent,
                marginBottom: '12px',
              }}
            >
              Miles pricing
            </div>
            <h2
              style={{
                fontFamily: DS.headingFont,
                fontSize: 'clamp(24px, 3vw, 32px)',
                fontWeight: 700,
                color: DS.text,
                maxWidth: '640px',
                margin: '0 auto 10px',
                lineHeight: 1.18,
              }}
            >
              Executive Introduction. Professional Deep-Dive. Executive Advisory.
            </h2>
            <p style={{ fontFamily: DS.bodyFont, fontSize: '14px', color: DS.muted, maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
              Spend miles on the depth that matches your current transition point. Earn miles through NEXUS engagement, or subscribe monthly.
            </p>
          </div>

          <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {info.pricing.map((p, idx) => {
              const highlight = idx === 1;
              return (
                <div
                  key={p.tier}
                  className="card-hover"
                  style={{
                    background: highlight ? '#0A0A12' : DS.card,
                    border: highlight ? `2px solid ${DS.accent}` : `1px solid ${DS.cardBorder}`,
                    borderRadius: DS.radius,
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
                        borderRadius: DS.radius,
                      }}
                    >
                      Recommended
                    </div>
                  )}
                  <div style={{ marginBottom: '20px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        background: highlight ? DS.accent : (info.is_cpi ? `${DS.accent}18` : '#1a1a25'),
                        color: highlight ? '#FFF' : (info.is_cpi ? DS.accent : '#FFF'),
                        fontFamily: DS.monoFont,
                        fontSize: '10px',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.16em',
                        borderRadius: DS.radius,
                      }}
                    >
                      {p.tier.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontFamily: DS.headingFont, fontSize: '22px', fontWeight: 700, color: highlight ? '#FFF' : DS.text, marginBottom: '4px' }}>
                    {p.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '20px' }}>
                    <span style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 700, color: highlight ? DS.accent : DS.accent, lineHeight: 1 }}>
                      {p.miles_cost}
                    </span>
                    <span style={{ fontFamily: DS.monoFont, fontSize: '10px', letterSpacing: '0.14em', color: highlight ? 'rgba(255,255,255,0.5)' : DS.muted, textTransform: 'uppercase', marginLeft: '2px' }}>
                      mi · one instrument
                    </span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    {p.features.map(f => (
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
                        <span style={{ width: '5px', height: '5px', marginTop: '7px', background: DS.accent, flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="/nexus/chat"
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
                      borderRadius: DS.radius,
                      boxSizing: 'border-box',
                    }}
                  >
                    Unlock with NEXUS <ArrowRight style={{ width: 13, height: 13 }} />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ARCHETYPES (if any) */}
      {info.archetypes.length > 0 && (
        <section className="reveal section-padding" style={{ maxWidth: '1120px', margin: '0 auto', padding: '88px 32px 48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.26em',
                color: DS.accent,
                marginBottom: '12px',
              }}
            >
              Archetype library
            </div>
            <h2
              style={{
                fontFamily: DS.headingFont,
                fontSize: 'clamp(24px, 3vw, 32px)',
                fontWeight: 700,
                color: DS.text,
                maxWidth: '680px',
                margin: '0 auto',
                lineHeight: 1.18,
              }}
            >
              {info.archetype_count} executive profiles.
            </h2>
            <p style={{ fontFamily: DS.bodyFont, fontSize: '14px', color: DS.muted, maxWidth: '520px', margin: '12px auto 0', lineHeight: 1.6 }}>
              The {info.code} instrument classifies every profile into a named archetype with development implications.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
            {info.archetypes.slice(0, 12).map((a) => (
              <div
                key={a.name}
                className="card-hover"
                style={{
                  background: DS.card,
                  border: `1px solid ${DS.cardBorder}`,
                  borderRadius: DS.radius,
                  padding: '20px 18px',
                  boxShadow: DS.shadow,
                }}
              >
                <div style={{ fontFamily: DS.headingFont, fontSize: '15px', fontWeight: 700, color: DS.text, marginBottom: '8px' }}>
                  {a.name}
                </div>
                <p style={{ fontFamily: DS.bodyFont, fontSize: '12px', color: DS.textSecondary, lineHeight: 1.55, margin: '0 0 10px', minHeight: '48px' }}>
                  {a.description || a.traits?.[0] || ''}
                </p>
                {a.traits && a.traits.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {a.traits.slice(0, 2).map(t => (
                      <span
                        key={t}
                        style={{
                          fontFamily: DS.monoFont,
                          fontSize: '9px',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          background: `${DS.accent}10`,
                          color: DS.accent,
                          borderRadius: DS.radius,
                        }}
                      >
                        {t.slice(0, 36)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FINAL CTA */}
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
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto' }}>
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
            Begin with {info.code}
          </div>
          <h2
            style={{
              fontFamily: DS.headingFont,
              fontSize: 'clamp(26px, 4vw, 38px)',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: '0 0 16px',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
          >
            One conversation with NEXUS.<br />Your {info.code} profile unlocked.
          </h2>
          <p
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '15px',
              color: 'rgba(255,255,255,0.62)',
              maxWidth: '460px',
              margin: '0 auto 36px',
              lineHeight: 1.6,
            }}
          >
            NEXUS surfaces the right diagnostic at the right moment. Start a conversation and let it guide you into {info.name}.
          </p>
          <a
            href="/nexus/chat"
            className="cta-glow"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '18px 36px',
              background: '#C108AB',
              color: '#FFFFFF',
              borderRadius: '0px',
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
        </div>
      </section>

      <UnifiedFooter />
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div
        style={{
          width: '40px',
          height: '40px',
          background: 'rgba(193,8,171,0.12)',
          color: DS.accent,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: DS.radius,
        }}
      >
        <Icon style={{ width: 18, height: 18 }} />
      </div>
      <div>
        <div style={{ fontFamily: DS.headingFont, fontSize: '22px', fontWeight: 700, lineHeight: 1, color: '#FFF' }}>{value}</div>
        <div style={{ fontFamily: DS.monoFont, fontSize: '9.5px', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.45)', marginTop: '4px', textTransform: 'uppercase' }}>{label}</div>
      </div>
    </div>
  );
}
