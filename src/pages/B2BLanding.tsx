import React, { useEffect, useState } from 'react';
import { initScrollReveal } from '@/lib/utils';
import { ArrowRight, Menu, X, Lock, Users, Target, Gauge, Building2, ClipboardList, MessageSquarePlus } from 'lucide-react';
import { UnifiedFooter } from '@/components/layout/UnifiedFooter';
import { LeadCaptureForm } from '@/components/LeadCaptureForm';
import { SEO } from '@/components/seo/SEO';
import { EnterpriseContactForm } from '@/components/billing/EnterpriseContactForm';

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

const B2B_HERO_POSTER = 'https://www.lyc-partners.ai/images/heroes/hero-b2b-boardroom.webp';

const NAV_LINKS = [
  { href: '/match', label: 'Match Analysis' },
  { href: '/assessment', label: 'Assessments' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/', label: 'For Leaders' },
];

const B2B_FEATURES = [
  {
    icon: Users,
    eyebrow: 'NEXUS FOR TEAMS',
    title: 'An intelligent front door for every recruiter',
    desc: 'Every seat on your talent team uses NEXUS — framework-aware, confidential, tuned to your firm\'s search methodology. Conversations surface shortlist candidates, surface mandate risks, and draft outreach — all in one thinking partner.',
  },
  {
    icon: Target,
    eyebrow: 'MATCH ANALYSIS',
    title: 'JD-to-CV scoring, three dimensions of fit',
    desc: 'Paste one JD, add ten CVs. Get ranked verdicts, match reasoning, risk flags, and approach strategy — scored on Experience & Achievement, Skills & Expertise, and Organizational Fit. Hours of partner work in minutes.',
  },
  {
    icon: Building2,
    eyebrow: 'ENTERPRISE INSTRUMENTS',
    title: 'Assessments deployed at team scale',
    desc: 'Run CPI for pipeline diagnostics, SHIFT suite for leadership bench, IMPACT for board candidates — all from one portal. Aggregate analytics, comparative percentiles, progress tracking across engagements.',
  },
];

const MATCH_DIMENSIONS = [
  { code: 'D1', name: 'Experience & Achievements', desc: 'Career trajectory, scope progression, quantifiable impact, leadership breadth across contexts.' },
  { code: 'D2', name: 'Skills & Expertise', desc: 'Functional depth, technical fluency, cross-border capability, language and market fit.' },
  { code: 'D3', name: 'Organizational Fit', desc: 'Cultural alignment, stakeholder mapping, transformation readiness, board dynamics.' },
];

function Nav({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (v: boolean) => void }) {
  return (
    <>
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
        <a href="/" style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, textDecoration: 'none', letterSpacing: '-0.01em' }}>LYC Intelligence</a>
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {NAV_LINKS.map(l => (
            <a
              key={l.href}
              href={l.href}
              style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.textSecondary, textDecoration: 'none', padding: '10px 14px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', fontWeight: 500 }}
            >{l.label}</a>
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
        <button className="nav-toggle" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu style={{ color: DS.text }} /></button>
      </nav>
      <div className={`nav-mobile-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`nav-mobile ${mobileOpen ? 'open' : ''}`} style={{ background: DS.bg }}>
        <button className="nav-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X style={{ width: 24, height: 24, color: DS.text }} /></button>
        {NAV_LINKS.map(l => (
          <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} style={{ color: DS.textSecondary, borderBottom: `1px solid ${DS.border}` }}>{l.label}</a>
        ))}
        <a href="/nexus/chat" onClick={() => setMobileOpen(false)} style={{ fontFamily: DS.bodyFont, fontSize: '15px', fontWeight: 600, color: DS.accent, borderBottom: `1px solid ${DS.border}` }}>Try NEXUS →</a>
        <a href="/login" onClick={() => setMobileOpen(false)} style={{ fontFamily: DS.bodyFont, fontSize: '15px', fontWeight: 600, color: DS.text, borderBottom: `1px solid ${DS.border}` }}>Platform</a>
      </div>
    </>
  );
}

export function B2BLanding() {
  const [mobileOpen, setMobileOpen] = useState(false);
  // #1326: Enterprise contact form modal — human handoff, NOT NEXUS bot.
  // Mirrors the pricing page pattern so B2B "Talk to sales" routes to the
  // same human channel everywhere, not into NEXUS.
  const [enterpriseOpen, setEnterpriseOpen] = useState(false);

  useEffect(() => {
    const observer = initScrollReveal();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <div style={{ minHeight: '100vh', background: DS.bg, color: DS.text }}>
      <SEO page="b2b" />
      <Nav mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* HERO — NEXUS for Teams */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '78vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${B2B_HERO_POSTER})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(2px) brightness(0.45)',
            transform: 'scale(1.04)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(6,5,12,0.86) 0%, rgba(8,5,12,0.72) 35%, rgba(14,8,20,0.72) 60%, rgba(6,5,12,0.95) 100%)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '720px',
            height: '440px',
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
            FOR FIRMS · FOR SEARCH · FOR BOARDS
          </div>
          <h1
            style={{
              fontFamily: DS.headingFont,
              fontSize: 'clamp(34px, 5.6vw, 56px)',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: '0 auto 16px',
              lineHeight: 1.08,
              letterSpacing: '-0.015em',
              maxWidth: '820px',
            }}
          >
            NEXUS for Teams.<br />Match Analysis for the hire.<br />
          </h1>
          <p
            style={{
              fontFamily: DS.bodyFont,
              fontSize: 'clamp(15px, 1.7vw, 18px)',
              color: 'rgba(255,255,255,0.72)',
              maxWidth: '620px',
              margin: '0 auto 44px',
              lineHeight: 1.6,
            }}
          >
            One thinking partner across every recruiter on the desk. Score candidates against any mandate with three-dimension fit, clear reasoning, and approach strategy — in minutes, not weeks.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
            <a
              href="/match"
              className="cta-glow"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '18px 36px', background: '#C108AB', color: '#FFF', fontFamily: DS.bodyFont, fontSize: '13px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none' }}
            >
              Try Match Analysis <ArrowRight style={{ width: 15, height: 15 }} />
            </a>
            <a
              href="/nexus/chat"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '18px 32px', border: '1px solid rgba(255,255,255,0.28)', color: '#FFFFFF', fontFamily: DS.bodyFont, fontSize: '13px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', textDecoration: 'none', background: 'rgba(255,255,255,0.04)' }}
            >
              Launch NEXUS
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
            3 DIMENSIONS · BATCH PROCESSING · CONFIDENTIAL BY DEFAULT
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section style={{ background: DS.bgAlt, padding: '44px 32px', borderBottom: `1px solid ${DS.border}` }}>
        <div
          className="reveal"
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
            { v: '500+', l: 'Executive placements' },
            { v: '47', l: 'Markets covered' },
            { v: '93%', l: 'Placement retention' },
            { v: '15x', l: 'Faster shortlisting' },
          ].map(s => (
            <div key={s.l}>
              <div style={{ fontFamily: DS.headingFont, fontSize: '32px', fontWeight: 700, color: DS.accent, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontFamily: DS.bodyFont, fontSize: '11px', color: DS.muted, marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* B2B FEATURES — 3 CARDS */}
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
              color: DS.accent,
              marginBottom: '12px',
            }}
          >
            Built for retained search
          </div>
          <h2
            style={{
              fontFamily: DS.headingFont,
              fontSize: 'clamp(26px, 3vw, 34px)',
              fontWeight: 700,
              color: DS.text,
              maxWidth: '700px',
              margin: '0 auto',
              lineHeight: 1.18,
              letterSpacing: '-0.01em',
            }}
          >
            Move candidates through the pipe faster.<br />Back every verdict with reasoning.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {B2B_FEATURES.map(f => (
            <div
              key={f.title}
              className="card-hover"
              style={{
                background: DS.card,
                border: `1px solid ${DS.cardBorder}`,
 
                padding: '28px 24px',
                boxShadow: DS.shadow,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'inline-flex', width: '40px', height: '40px', background: `${DS.accent}12`, color: DS.accent, alignItems: 'center', justifyContent: 'center' }}>
                <f.icon style={{ width: 18, height: 18 }} />
              </div>
              <div
                style={{
                  fontFamily: DS.monoFont,
                  fontSize: '10px',
                  letterSpacing: '0.2em',
                  color: DS.accent,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                {f.eyebrow}
              </div>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, margin: 0, letterSpacing: '-0.01em' }}>
                {f.title}
              </h3>
              <p style={{ fontFamily: DS.bodyFont, fontSize: '13.5px', color: DS.textSecondary, margin: 0, lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* MATCH DIMENSIONS */}
      <section
        style={{
          background: DS.bgAlt,
          padding: '96px 32px',
          borderTop: `1px solid ${DS.border}`,
          borderBottom: `1px solid ${DS.border}`,
        }}
      >
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '44px' }}>
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
              Match Analysis
            </div>
            <h2
              style={{
                fontFamily: DS.headingFont,
                fontSize: 'clamp(26px, 3vw, 34px)',
                fontWeight: 700,
                color: DS.text,
                maxWidth: '640px',
                margin: '0 auto 12px',
                lineHeight: 1.18,
                letterSpacing: '-0.01em',
              }}
            >
              Three dimensions of fit. One consistent verdict.
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
              Each candidate is ranked Strong / Good / Potential Fit with match reasons, risk flags,
              and tailored approach strategy for the first outreach call.
            </p>
          </div>

          <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {MATCH_DIMENSIONS.map((d, i) => (
              <div
                key={d.code}
                className="card-hover"
                style={{
                  background: DS.card,
                  border: `1px solid ${DS.cardBorder}`,
 
                  padding: '28px 24px',
                  boxShadow: DS.shadow,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      background: DS.accent,
                      color: '#FFF',
                      fontFamily: DS.monoFont,
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
 
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div
                    style={{
                      fontFamily: DS.monoFont,
                      fontSize: '10px',
                      letterSpacing: '0.2em',
                      color: DS.muted,
                      textTransform: 'uppercase',
                    }}
                  >
                    {d.code}
                  </div>
                </div>
                <h3
                  style={{
                    fontFamily: DS.headingFont,
                    fontSize: '18px',
                    fontWeight: 700,
                    color: DS.text,
                    margin: '0 0 8px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {d.name}
                </h3>
                <p
                  style={{
                    fontFamily: DS.bodyFont,
                    fontSize: '13.5px',
                    color: DS.textSecondary,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {d.desc}
                </p>
              </div>
            ))}
          </div>

          <div
            className="reveal"
            style={{
              marginTop: '32px',
              padding: '20px 24px',
              background: DS.card,
              border: `1px solid ${DS.cardBorder}`,
 
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              boxShadow: DS.shadow,
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                background: `${DS.accent}14`,
                color: DS.accent,
 
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ClipboardList style={{ width: 18, height: 18 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: DS.headingFont,
                  fontSize: '14px',
                  fontWeight: 700,
                  color: DS.text,
                  marginBottom: '4px',
                }}
              >
                Output — ranked verdicts
              </div>
              <div style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.muted, lineHeight: 1.6 }}>
                Strong Fit · Good Fit · Potential Fit. Each with match rationale, fit-gap summary, risk flags,
                and first-call approach strategy. Export as mandate briefing for the partner review.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ENTERPRISE OFFERING */}
      <section className="reveal section-padding" style={{ maxWidth: '1120px', margin: '0 auto', padding: '96px 32px 48px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '32px',
            alignItems: 'center',
          }}
        >
          <div>
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
              Team deployment
            </div>
            <h2
              style={{
                fontFamily: DS.headingFont,
                fontSize: 'clamp(24px, 2.8vw, 32px)',
                fontWeight: 700,
                color: DS.text,
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                marginBottom: '16px',
              }}
            >
              NEXUS for Teams, shipped in a day.
            </h2>
            <p
              style={{
                fontFamily: DS.bodyFont,
                fontSize: '14px',
                color: DS.textSecondary,
                lineHeight: 1.65,
                marginBottom: '20px',
              }}
            >
              Onboard every desk. Tailor system prompts to your firm's practice, mandate typology,
              and research culture. SSO. Audit logs. Org-level usage analytics. Mandate sharing
              across pods. Everything the retained search practice needs — none of the generic SaaS fluff.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                'Seat-based billing — Council tier for teams',
                'SSO, SCIM, SAML, role-based access',
                'Mandate-level confidentiality controls',
                'Custom framework training onboarding',
              ].map(f => (
                <li key={f} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontFamily: DS.bodyFont, fontSize: '13.5px', color: DS.textSecondary }}>
                  <span style={{ width: '5px', height: '5px', background: DS.accent, marginTop: '8px', flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: '28px' }}>
              <button
                type="button"
                onClick={() => setEnterpriseOpen(true)}
                className="cta-glow"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 32px', background: '#C108AB', color: '#FFF', fontFamily: DS.bodyFont, fontSize: '13px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', border: 'none', cursor: 'pointer' }}
              >
                Talk to sales <ArrowRight style={{ width: 14, height: 14 }} />
              </button>
              <p
                style={{
                  marginTop: '10px',
                  fontFamily: DS.monoFont,
                  fontSize: '10px',
                  color: DS.muted,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Human follow-up · Not a bot
              </p>
            </div>
          </div>
          <div
            className="card-hover"
            style={{
              background: '#0A0A12',
 
              padding: '32px',
              border: `1px solid ${DS.accent}22`,
              boxShadow: `0 30px 70px ${DS.accent}16`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <MessageSquarePlus style={{ width: 18, height: 18, color: DS.accent }} />
              <span style={{ fontFamily: DS.monoFont, fontSize: '10px', letterSpacing: '0.2em', color: DS.accent, textTransform: 'uppercase', fontWeight: 700 }}>NEXUS TEAMS SAMPLE</span>
            </div>
            <div
              style={{
                background: '#12121E',
                padding: '16px',
 
                marginBottom: '12px',
                border: `1px solid ${DS.accent}22`,
              }}
            >
              <div style={{ fontFamily: DS.monoFont, fontSize: '10px', color: DS.accent, letterSpacing: '0.16em', marginBottom: '8px', fontWeight: 600 }}>RECRUITER</div>
              <div style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.55 }}>
                Shortlist 5 CFO candidates for Series B biotech mandate, HQ SG, US VC-backed, APAC expansion next year.
              </div>
            </div>
            <div
              style={{
                background: `${DS.accent}14`,
                padding: '16px',
 
                border: `1px solid ${DS.accent}22`,
              }}
            >
              <div style={{ fontFamily: DS.monoFont, fontSize: '10px', color: DS.accent, letterSpacing: '0.16em', marginBottom: '8px', fontWeight: 600 }}>NEXUS</div>
              <div style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.55 }}>
                5 profiles ranked below: 1 Strong Fit (US-based CFO with biotech exit + SG family office ties),
                3 Good Fit, 1 Potential Fit flagged governance-capability gap.
                Approach strategy per profile + mandate risk summary attached.
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '16px',
                fontFamily: DS.monoFont,
                fontSize: '10px',
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.14em',
              }}
            >
              <span style={{ padding: '4px 8px', background: '#1a1a27' }}>GOV</span>
              <span style={{ padding: '4px 8px', background: '#1a1a27' }}>APAC</span>
              <span style={{ padding: '4px 8px', background: '#1a1a27' }}>VERDICT</span>
            </div>
          </div>
        </div>
      </section>

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
            For your next mandate
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
            Ship shortlists this week.<br />NEXUS for Teams + Match Analysis.
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
            Book an Executive Introduction. Paste your next JD — walk out with a ranked shortlist.
          </p>
          <LeadCaptureForm
            type="b2b"
            source="b2b_landing_v3"
            heading="Executive Introduction — B2B"
            subheading="Paste a JD, share 5 CVs, we return ranked verdicts same day."
          />
        </div>
      </section>

      <UnifiedFooter />

      {/* #1326 — Enterprise contact modal (human, not NEXUS bot). Mirrors
          the pricing page pattern so B2B "Talk to sales" lands in the same
          human channel everywhere. */}
      {enterpriseOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Talk to our team"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,10,18,0.55)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEnterpriseOpen(false);
          }}
        >
          <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto">
            <EnterpriseContactForm
              dismissible
              onClose={() => setEnterpriseOpen(false)}
              heading="Talk to our team"
              subheading={'Tell us about your firm and we\u2019ll design a NEXUS for Teams deployment that fits \u2014 seats, SSO, custom framework training, and a dedicated point of contact. You\u2019ll hear from a human, not a bot.'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
