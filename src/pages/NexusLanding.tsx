import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';

const ACCENT = '#C108AB';
const INK = '#0F1115';
const OFF = '#F5F5F3';
const G100 = '#FAFAFA';
const G200 = '#E8E8E5';
const G300 = '#D4D4D1';
const G400 = '#9CA3AF';
const G600 = '#4B5563';
const WHITE = '#FFFFFF';

const monoStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  fontWeight: 500,
};

const containerStyle: React.CSSProperties = {
  maxWidth: 940,
  margin: '0 auto',
  padding: '0 32px',
};

const btnBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '14px 28px',
  fontSize: '14px',
  fontWeight: 500,
  textDecoration: 'none',
  border: `1px solid ${INK}`,
  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  cursor: 'pointer',
  minHeight: 44,
};

// Ticket #1355 — section eyebrow labels use light gray #9CA3AF per brand v1.2, not accent.
const btnPrimary: React.CSSProperties = { ...btnBase, background: INK, color: WHITE };
const btnSecondary: React.CSSProperties = { ...btnBase, background: 'transparent', color: INK };
const sectionLabel: React.CSSProperties = { ...monoStyle, color: G400, marginBottom: 20, display: 'inline-block' };

// ── MOTION: Scroll reveal hook (fadeUp 350ms, IntersectionObserver) ──
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('nl-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.nl-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ── MOTION: CTA active-state micro-compress (scale 0.98, 120ms) ────
const ctaCompressHandlers = {
  onMouseDown: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transition = 'transform 120ms cubic-bezier(0.4,0,0.2,1)';
    e.currentTarget.style.transform = 'scale(0.98)';
  },
  onMouseUp: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
  },
};

// ── NAV ────────────────────────────────────────────────────────────
function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      background: scrolled ? 'rgba(245,245,243,0.96)' : 'rgba(245,245,243,0.92)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      zIndex: 100,
      borderBottom: scrolled ? `1px solid ${G200}` : '1px solid transparent',
      transition: 'border-color 200ms ease, background 200ms ease',
    }}>
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/nexus" style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 20, fontWeight: 700, textDecoration: 'none', color: INK, display: 'flex', alignItems: 'baseline', gap: 6 }}>
          NEXUS <span style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 10, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.08em', color: G400, fontStyle: 'normal' }}>by LYC</span>
        </Link>
        <ul className="nav-links-desktop" style={{ display: 'flex', gap: 28, listStyle: 'none', alignItems: 'center', margin: 0, padding: 0 }}>
          {/* Ticket #1352 — remove For Business B2B link from marketing nav */}
          {[['#capabilities', 'What it does'], ['#diagnostics', 'Diagnostics'], ['#pricing', 'Pricing']].map(([h, l]) => (
            <li key={h}>
              <a href={h} style={{ fontSize: 13, fontWeight: 500, color: INK, textDecoration: 'none', opacity: 0.7, transition: 'opacity 120ms ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}>{l}</a>
            </li>
          ))}
        </ul>
        <a href="#start" style={{ padding: '10px 20px', background: INK, color: WHITE, fontSize: 13, fontWeight: 500, textDecoration: 'none',  border: `1px solid ${INK}`, transition: 'background 200ms ease, border-color 200ms ease', minHeight: 40, display: 'inline-flex', alignItems: 'center' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.borderColor = ACCENT; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = INK; e.currentTarget.style.borderColor = INK; }}>
          Start — Executive Introduction
        </a>
        <button
          className="nav-toggle-btn"
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Toggle menu"
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 8, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', color: INK }}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 150 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 280, background: WHITE, boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', zIndex: 200, padding: '80px 32px 32px', transition: 'transform 350ms cubic-bezier(0.16,1,0.3,1)' }}>
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu" style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: INK }}><X size={22} /></button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { href: '#capabilities', label: 'What it does' },
                { href: '#diagnostics', label: 'Diagnostics' },
                { href: '#pricing', label: 'Pricing' },
                { href: '#start', label: 'Start', primary: true },
              ].map(l => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                  style={{ display: 'block', fontSize: 16, color: INK, textDecoration: 'none', padding: '14px 0', borderBottom: `1px solid ${G200}`, minHeight: 44, fontWeight: l.primary ? 600 : 500, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
      <style>{`@media (max-width: 768px) { .nav-links-desktop { display: none !important; } .nav-toggle-btn { display: flex !important; } }`}</style>
    </nav>
  );
}

// ── HERO ───────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{ padding: '180px 0 120px', textAlign: 'center', position: 'relative' }} className="hero-padding">
      {/* Static hero accent line (2px vertical gradient, fuchsia → transparent, ~200px tall, no animation) */}
      <div aria-hidden="true" style={{ position: 'absolute', top: 140, left: '50%', transform: 'translateX(-50%)', width: 2, height: 200, background: `linear-gradient(to bottom, ${ACCENT} 0%, transparent 100%)`, pointerEvents: 'none' }} />
      <div style={containerStyle} className="nl-reveal">
        <span style={{ ...monoStyle, color: ACCENT, marginBottom: 28, display: 'inline-block' }}>Your AI leadership coach</span>
        <h1 className="hero-heading" style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 700, lineHeight: 1.15, color: INK, fontSize: 48, maxWidth: 760, margin: '0 auto 24px' }}>
          Grow faster. <br /><em style={{ fontWeight: 400 }}>Always have a coach.</em>
        </h1>
        <p className="hero-sub" style={{ fontSize: 18, maxWidth: 600, margin: '0 auto 40px', color: G600, lineHeight: 1.6 }}>
          Get instant, executive-level feedback on your leadership decisions. Benchmark yourself against 47 markets. Know exactly where you stand and what to work on next — anytime, on demand.
        </p>
        <div className="cta-row" style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 60, flexWrap: 'wrap' }}>
          <a href="#start" style={btnPrimary} {...ctaCompressHandlers}
            onMouseEnter={(e) => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.borderColor = ACCENT; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = INK; e.currentTarget.style.borderColor = INK; }}>
            Start with Executive Introduction
          </a>
          <a href="#how-it-works" style={btnSecondary} {...ctaCompressHandlers}
            onMouseEnter={(e) => { e.currentTarget.style.background = INK; e.currentTarget.style.color = WHITE; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = INK; }}>
            See how it works
          </a>
        </div>
        <div style={{ width: 1, height: 60, background: G300, margin: '0 auto' }} />
        <div style={{ marginTop: 80, fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: G400 }}>
          Powered by <strong style={{ color: INK, fontWeight: 500, letterSpacing: '0.12em' }}>DEX AI</strong>
        </div>
      </div>
    </section>
  );
}

// ── WHAT NEXUS IS ──────────────────────────────────────────────────
function WhatIs() {
  return (
    <section style={{ padding: '100px 0', background: G100 }} className="section-padding">
      <div style={containerStyle} className="nl-reveal">
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <span style={sectionLabel}>What NEXUS is</span>
          <h2 className="section-heading" style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 700, fontSize: 34, lineHeight: 1.2, color: INK, marginBottom: 32 }}>Your coach. <em style={{ fontWeight: 400 }}>On your schedule.</em></h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: G600, marginBottom: 24 }}><strong style={{ color: INK, fontWeight: 600 }}>Most leadership advice is either generic or expensive.</strong> Self-help content doesn't know your context. Executive coaches cost thousands and aren't there at 9pm when you're stuck on a decision.</p>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: G600, marginBottom: 24 }}>NEXUS is different. It's an AI leadership coach grounded in <strong style={{ color: INK, fontWeight: 600 }}>LYC Partners' 10+ years of executive search data</strong>, validated assessment frameworks, and real talent market intelligence.</p>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: G600, marginBottom: 24 }}>Ask it about a tricky promotion conversation. Get benchmarked against peers in your market. Analyze your next career move. All from your phone or laptop, whenever you need it.</p>
        </div>
      </div>
    </section>
  );
}

// ── CAPABILITIES ───────────────────────────────────────────────────
const CAPS = [
  { n: '01', title: 'AI Advisory Chat', desc: 'Executive-level guidance on leadership, career, and talent questions. Context-aware — remembers your profile, your assessments, your situation. Not generic answers.', link: 'Try a question →', href: '/nexus/chat' },
  { n: '02', title: 'Leadership Diagnostics', desc: 'Scientific assessments that measure where you actually stand. Strengths, blind spots, developmental areas — with benchmarks against real executive populations.', link: 'See Diagnostics →', href: '#diagnostics' },
  { n: '03', title: 'Role Fit Analysis', desc: "Curious about a new role? Upload any JD and see how you match across dimensions. Know where you're strong and where you'd need to grow — before you apply.", link: 'Check a role →', href: '#start' },
  { n: '04', title: 'Market Intelligence', desc: 'Talent market data specific to your industry and level. Compensation benchmarks, in-demand capabilities, and movement patterns — so you negotiate from information.', link: 'View your market →', href: '#start' },
];
function Capabilities() {
  return (
    <section id="capabilities" style={{ padding: '100px 0' }} className="section-padding">
      <div style={containerStyle}>
        <div className="nl-reveal" style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>What your coach does</span>
          <h2 className="section-heading" style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 700, fontSize: 36, lineHeight: 1.2, color: INK, marginBottom: 20 }}>Four ways NEXUS <em style={{ fontWeight: 400 }}>moves you forward</em></h2>
          <p style={{ fontSize: 17, color: G600, lineHeight: 1.6 }}>Everything a senior leader needs to understand their strengths, benchmark their capabilities, and make better career and leadership decisions.</p>
        </div>
        <div className="nl-reveal grid-responsive-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: G200, border: `1px solid ${G200}` }}>
          {CAPS.map((c, i) => (
            <div key={c.n} style={{
              background: WHITE, padding: '40px 36px', display: 'flex', flexDirection: 'column',
              transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1), border-color 200ms ease',
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = ACCENT; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'transparent'; }}>
              <div className="nl-reveal" style={{ width: 40, height: 40, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: G100, fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 14, color: ACCENT, fontWeight: 500, transitionDelay: `${i * 80}ms` }}>{c.n}</div>
              <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 700, fontSize: 22, marginBottom: 12, lineHeight: 1.25, color: INK }}>{c.title}</h3>
              <p style={{ color: G600, fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>{c.desc}</p>
              <a href={c.href} style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: ACCENT, textDecoration: 'none', fontWeight: 500, marginTop: 'auto' }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}>{c.link}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── HOW IT WORKS ───────────────────────────────────────────────────
const STEPS = [
  { n: '01', title: 'Start', desc: 'Create your profile and do your first diagnostic. It takes about 15 minutes. NEXUS learns your context from the very first interaction.' },
  { n: '02', title: 'Understand', desc: 'Get your personalized report with strengths, blind spots, and benchmarked results. Then start asking questions — your coach already knows your profile.' },
  { n: '03', title: 'Grow', desc: 'Follow development recommendations, track your progress, and keep moving. Your coach is always there when you hit a new question or crossroads.' },
];
function HowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: '100px 0', background: G100 }} className="section-padding">
      <div style={containerStyle}>
        <div className="nl-reveal" style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>How it works</span>
          <h2 className="section-heading" style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 700, fontSize: 36, lineHeight: 1.2, color: INK, marginBottom: 0 }}>Three steps. <em style={{ fontWeight: 400 }}>No guesswork.</em></h2>
        </div>
        <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48, position: 'relative' }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ paddingTop: 56, position: 'relative' }}>
              {/* Staggered number reveals — only the number, 80ms stagger, total <350ms */}
              <div className="nl-reveal" style={{
                position: 'absolute', top: 0, left: 0,
                fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 48, fontWeight: 400, fontStyle: 'italic', color: ACCENT, lineHeight: 1,
                transitionDelay: `${i * 80}ms`,
              }}>{s.n}</div>
              <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 700, fontSize: 20, marginBottom: 14, lineHeight: 1.25, color: INK }}>{s.title}</h3>
              <p style={{ color: G600, fontSize: 15, lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── DIAGNOSTICS ────────────────────────────────────────────────────
const DIAGS = [
  { tag: 'Strategic', title: 'Strategic Thinking Diagnostic', desc: 'Measure your ability to frame complex problems, anticipate market shifts, and make decisions under uncertainty.', meta: '4 sub-dimensions · 25 min' },
  { tag: 'Executive Presence', title: 'Executive Presence Diagnostic', desc: 'Assess how you show up — communication clarity, influence style, gravitas, and stakeholder impact.', meta: '4 sub-dimensions · 20 min' },
  { tag: 'People Leadership', title: 'Team Leadership Diagnostic', desc: 'Evaluate how you build teams, develop people, and drive performance through others.', meta: '5 sub-dimensions · 22 min' },
  { tag: 'China & APAC', title: 'China Leadership Pipeline Diagnostic', desc: 'Context-specific assessment for leaders in China and cross-cultural APAC environments. Built on local executive benchmarks.', meta: '5 dimensions · 6 profiles · China/APAC' },
  { tag: 'Change', title: 'Change Agility Diagnostic', desc: 'Understand how you navigate ambiguity, lead through transition, and adapt under pressure.', meta: '4 sub-dimensions · 18 min' },
  { tag: 'Commercial', title: 'Commercial Acumen Diagnostic', desc: 'Test your business judgment — P&L orientation, market analysis, and investment decision-making.', meta: '4 sub-dimensions · 20 min' },
];
function Diagnostics() {
  return (
    <section id="diagnostics" style={{ padding: '100px 0' }} className="section-padding">
      <div style={containerStyle}>
        <div className="nl-reveal" style={{ maxWidth: 640, margin: '0 auto 56px', textAlign: 'center' }}>
          <span style={sectionLabel}>Diagnostics</span>
          <h2 className="section-heading" style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 700, fontSize: 36, lineHeight: 1.2, color: INK, marginBottom: 20 }}>Know where you stand. <em style={{ fontWeight: 400 }}>Measured, not guessed.</em></h2>
          <p style={{ color: G600, fontSize: 17, lineHeight: 1.6 }}>Every diagnostic is built on validated executive assessment frameworks and benchmarked against real leaders. Not personality tests. Actual leadership measurement.</p>
        </div>
        <div className="nl-reveal grid-responsive-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: G200, border: `1px solid ${G200}`, marginBottom: 56 }}>
          {DIAGS.map(d => (
            <div key={d.title} style={{
              background: WHITE, padding: '36px 32px',
              transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1), border-color 200ms ease',
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = ACCENT; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'transparent'; }}>
              <span style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: ACCENT, marginBottom: 14, display: 'block' }}>{d.tag}</span>
              <h4 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 700, fontSize: 18, marginBottom: 10, lineHeight: 1.3, color: INK }}>{d.title}</h4>
              <p style={{ color: G600, fontSize: 14, lineHeight: 1.6, marginBottom: 18 }}>{d.desc}</p>
              <div style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 11, color: G400, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.meta}</div>
            </div>
          ))}
        </div>
        <div className="nl-reveal" style={{ textAlign: 'center' }}>
          <a href="#start" style={{ ...btnPrimary, background: ACCENT, borderColor: ACCENT }} {...ctaCompressHandlers}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
            Take your first diagnostic
          </a>
        </div>
      </div>
    </section>
  );
}

// ── PERSONAS ───────────────────────────────────────────────────────
const PERSONAS = [
  { label: 'Director level', title: 'Rising toward VP', desc: "You've hit Director and you know the next leap is different. You want to close the gaps before the next opportunity appears.", bullets: ['Executive presence gaps', 'Strategic thinking depth', 'Stakeholder management'] },
  { label: 'VP / GM level', title: 'Running a business', desc: 'You own a P&L or a function. Your scope keeps growing and you need to see your blind spots before they cost you.', bullets: ['Team leadership at scale', 'Change agility', 'Commercial judgment'] },
  { label: 'C-suite / Founder', title: 'At the top of your game', desc: "You're already senior. Feedback gets harder to find. You want an honest, always-available sounding board that isn't your team.", bullets: ['Executive sounding board', 'Succession planning', 'Board-level impact'] },
];
function Personas() {
  return (
    <section style={{ padding: '100px 0', background: G100 }} className="section-padding">
      <div style={containerStyle}>
        <div className="nl-reveal" style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>Who it's for</span>
          <h2 className="section-heading" style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 700, fontSize: 36, lineHeight: 1.2, color: INK, marginBottom: 20 }}>Built for leaders <em style={{ fontWeight: 400 }}>who take growth seriously</em></h2>
          <p style={{ fontSize: 17, color: G600, lineHeight: 1.6 }}>If you're ambitious and you know your development is the bottleneck, NEXUS is for you.</p>
        </div>
        <div className="nl-reveal grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {PERSONAS.map(p => (
            <div key={p.title} style={{
              padding: '36px 28px', border: `1px solid ${G200}`, background: WHITE,
              transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1), border-color 200ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = ACCENT; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = G200; }}>
              <span style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: ACCENT, marginBottom: 16, display: 'block' }}>{p.label}</span>
              <h4 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 700, fontSize: 20, marginBottom: 12, lineHeight: 1.25, color: INK }}>{p.title}</h4>
              <p style={{ color: G600, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{p.desc}</p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {p.bullets.map(b => (
                  <li key={b} style={{ fontSize: 13, color: G600, padding: '6px 0', borderBottom: `1px solid ${G200}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: ACCENT, fontSize: 11, fontWeight: 600 }}>→</span>{b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── B2B TEASER ─────────────────────────────────────────────────────
function B2BTeaser() {
  return (
    <section id="for-business" style={{ textAlign: 'center', padding: '80px 0', background: G100, borderTop: `1px solid ${G200}`, borderBottom: `1px solid ${G200}` }} className="section-padding">
      <div style={containerStyle} className="nl-reveal">
        <span style={{ ...monoStyle, color: G600, marginBottom: 16, display: 'block' }}>Also for business</span>
        <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", color: INK, maxWidth: 500, margin: '0 auto 16px', fontSize: 26, fontWeight: 700, lineHeight: 1.25 }}>NEXUS for teams and organizations</h3>
        <p style={{ color: G600, maxWidth: 500, margin: '0 auto 24px', fontSize: 15, lineHeight: 1.6 }}>If you're looking at this for your team or your firm, NEXUS scales for enterprise use. Team-level pipeline assessment, consistent scoring across recruiters, bulk candidate screening.</p>
        <a href="/b2b" style={{ ...btnSecondary, fontSize: 13, padding: '10px 22px', minHeight: 40 }} {...ctaCompressHandlers}
          onMouseEnter={(e) => { e.currentTarget.style.background = INK; e.currentTarget.style.color = WHITE; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = INK; }}>
          Explore for Business <ArrowRight size={14} style={{ marginLeft: 6 }} />
        </a>
      </div>
    </section>
  );
}

// ── PRICING ────────────────────────────────────────────────────────
// Ticket #1352 — only B2C plans on marketing landing page (Enterprise / B2B removed from visitor view).
const PLANS = [
  { label: 'Start', title: 'Executive Introduction', price: '', small: null, desc: 'Get your first leadership diagnostic and initial advisory session. No credit card.', bullets: ['China Leadership Pipeline Diagnostic', 'Full narrative report', 'Initial advisory conversation', 'Basic profile'], cta: 'Start — Executive Introduction', href: '#start', featured: false },
  { label: 'Recommended', title: 'Executive Access', price: 'From $29', small: '/month', desc: 'Full access to all diagnostics, unlimited advisory chat, and role fit analysis.', bullets: ['All 6 leadership diagnostics', 'Unlimited AI advisory chat', 'Role Fit Analysis — unlimited', 'Development tracking', 'Market intelligence access'], cta: 'Begin Executive Access', href: '#start', featured: true },
];
function PricingCard({ plan }: { plan: typeof PLANS[number] }) {
  const f = plan.featured;
  const bg = f ? INK : WHITE;
  const text = f ? WHITE : INK;
  const muted = f ? 'rgba(255,255,255,0.6)' : G600;
  const border = f ? 'rgba(255,255,255,0.1)' : G200;
  const ctaStyle = f
    ? { ...btnPrimary, background: ACCENT, color: WHITE, borderColor: ACCENT, width: '100%' as const }
    : { ...btnSecondary, width: '100%' as const, borderColor: INK, color: INK };
  return (
    <div style={{
      background: bg, padding: '40px 32px', display: 'flex', flexDirection: 'column', color: text,
      transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1), box-shadow 200ms ease',
      border: f ? `1px solid rgba(255,255,255,0.1)` : '1px solid transparent',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; if (!f) e.currentTarget.style.borderColor = ACCENT; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; if (!f) e.currentTarget.style.borderColor = 'transparent'; }}>
      <span style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: ACCENT, marginBottom: 12, fontWeight: 500 }}>{plan.label}</span>
      <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 22, marginBottom: 8, fontWeight: 700, lineHeight: 1.25, color: text }}>{plan.title}</h3>
      <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 28, fontWeight: 700, marginBottom: 20, color: text }}>
        {plan.price}{plan.small && <span style={{ fontSize: 14, fontWeight: 400, color: muted, fontFamily: "'DM Sans', system-ui, sans-serif" }}> {plan.small}</span>}
      </div>
      <p style={{ fontSize: 14, color: muted, marginBottom: 24, lineHeight: 1.6 }}>{plan.desc}</p>
      <ul style={{ listStyle: 'none', flexGrow: 1, marginBottom: 28, padding: 0 }}>
        {plan.bullets.map((b, i) => (
          <li key={i} style={{ padding: '8px 0', fontSize: 14, borderBottom: i === plan.bullets.length - 1 ? 'none' : `1px solid ${border}`, color: f ? 'rgba(255,255,255,0.8)' : G600 }}>{b}</li>
        ))}
      </ul>
      <a href={plan.href} style={ctaStyle} {...ctaCompressHandlers}
        onMouseEnter={(e) => {
          if (f) { e.currentTarget.style.opacity = '0.9'; } else { e.currentTarget.style.background = INK; e.currentTarget.style.color = WHITE; }
        }}
        onMouseLeave={(e) => {
          if (f) { e.currentTarget.style.opacity = '1'; } else { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = INK; }
        }}>
        {plan.cta}
      </a>
    </div>
  );
}
function Pricing() {
  return (
    <section id="pricing" style={{ padding: '100px 0' }} className="section-padding">
      <div style={containerStyle}>
        <div className="nl-reveal" style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>Pricing</span>
          <h2 className="section-heading" style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 700, fontSize: 36, lineHeight: 1.2, color: INK, marginBottom: 20 }}>Start with Executive Introduction. <em style={{ fontWeight: 400 }}>Grow when you're ready.</em></h2>
          <p style={{ fontSize: 17, color: G600, lineHeight: 1.6 }}>Three tiers designed for where you are today — with clear paths forward.</p>
        </div>
        <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: G200, border: `1px solid ${G200}` }}>
          {PLANS.map(p => <PricingCard key={p.title} plan={p} />)}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <a href="/pricing" style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: ACCENT, textDecoration: 'none', fontWeight: 500 }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}>See full pricing →</a>
        </div>
      </div>
    </section>
  );
}

// ── TRUST ──────────────────────────────────────────────────────────
const TRUST = [
  { icon: '★', title: 'Backed by LYC Partners', desc: "10+ years of executive search and assessment expertise across China and APAC. We've placed hundreds of senior leaders." },
  { icon: '⚡', title: 'Powered by DEX AI', desc: 'Multi-agent AI systems, specialized assessment models, and talent market data — all working together behind the scenes.' },
  { icon: '◎', title: 'Global Benchmarks', desc: "Every diagnostic is benchmarked against executives across 47 markets. You're not just comparing to yourself." },
];
function Trust() {
  return (
    <section style={{ padding: '100px 0', background: G100 }} className="section-padding">
      <div style={containerStyle}>
        <div className="nl-reveal" style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>Why you can trust it</span>
          <h2 className="section-heading" style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 700, fontSize: 36, lineHeight: 1.2, color: INK, marginBottom: 0 }}>Built on real expertise. <em style={{ fontWeight: 400 }}>Validated by real data.</em></h2>
        </div>
        <div className="nl-reveal grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48, textAlign: 'center' }}>
          {TRUST.map(t => (
            <div key={t.title} style={{ padding: '0 16px' }}>
              <div style={{ width: 48, height: 48, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${G200}`, fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 16, color: ACCENT, background: WHITE }}>{t.icon}</div>
              <h4 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 18, marginBottom: 10, fontWeight: 700, color: INK }}>{t.title}</h4>
              <p style={{ color: G600, fontSize: 14, lineHeight: 1.6 }}>{t.desc}</p>
            </div>
          ))}
        </div>
        <div className="nl-reveal" style={{ textAlign: 'center', marginTop: 64, paddingTop: 48, borderTop: `1px solid ${G200}` }}>
          <span style={{ ...monoStyle, color: G400, marginBottom: 12, display: 'block' }}>The intelligence engine</span>
          {/* Ticket #1356 — internal DEX code name removed from public copy. This is LYC Intelligence platform. */}
          <strong style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 20, fontWeight: 700, color: INK }}>Powered by LYC Intelligence</strong><br />
        </div>
      </div>
    </section>
  );
}

// ── FINAL CTA ──────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section id="start" style={{ textAlign: 'center', padding: '120px 0', background: INK, color: WHITE }} className="section-padding">
      <div style={containerStyle} className="nl-reveal">
        <span style={{ ...monoStyle, color: ACCENT, marginBottom: 20, display: 'block' }}>Ready when you are</span>
        <h2 className="section-heading" style={{ fontFamily: "'Crimson Pro', Georgia, serif", color: WHITE, maxWidth: 640, margin: '0 auto 20px', fontSize: 42, fontWeight: 700, lineHeight: 1.15 }}>Leadership isn't a title.<br /><em style={{ fontWeight: 400 }}>It's a trajectory.</em></h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 520, margin: '0 auto 36px', fontSize: 17, lineHeight: 1.6 }}>Start with the Executive Introduction. No credit card required. About 15 minutes.</p>
        <Link to="/nexus/chat" style={{ ...btnPrimary, background: ACCENT, color: WHITE, borderColor: ACCENT, padding: '16px 36px' }} {...ctaCompressHandlers}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
          Start — Executive Introduction
        </Link>
      </div>
    </section>
  );
}

// ── FOOTER ─────────────────────────────────────────────────────────
function Footer() {
  const linkHandlers = {
    enter: (e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = ACCENT; },
    leave: (e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.color = INK; },
  };
  const a = { color: INK, textDecoration: 'none', fontSize: 14, opacity: 0.7, transition: 'opacity 120ms ease, color 120ms ease' };
  return (
    <footer style={{ background: G100, padding: '64px 0 32px', borderTop: `1px solid ${G200}` }} className="section-padding">
      <div style={containerStyle}>
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
          <div>
            <h4 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 20, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'baseline', gap: 6, color: INK, lineHeight: 1.2 }}>
              NEXUS <span style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: G400, fontWeight: 400, fontStyle: 'normal' }}>by LYC</span>
            </h4>
            <p style={{ color: G600, fontSize: 14, maxWidth: 280, marginTop: 16, lineHeight: 1.6 }}>Your AI leadership coach — built on executive search data and validated assessment frameworks.</p>
          </div>
          <div>
            <h5 style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: G400, marginBottom: 20, fontWeight: 500 }}>Product</h5>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <li style={{ marginBottom: 10 }}><Link to="/nexus" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>NEXUS</Link></li>
              <li style={{ marginBottom: 10 }}><a href="#pricing" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Pricing</a></li>
              <li style={{ marginBottom: 10 }}><a href="#diagnostics" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Leadership Assessments</a></li>
              <li style={{ marginBottom: 10 }}><Link to="/assessment" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Catalog</Link></li>
            </ul>
          </div>
          <div>
            <h5 style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: G400, marginBottom: 20, fontWeight: 500 }}>Company</h5>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <li style={{ marginBottom: 10 }}><a href="#" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>About</a></li>
              <li style={{ marginBottom: 10 }}><a href="#" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>LYC Partners</a></li>
              <li style={{ marginBottom: 10 }}><a href="#" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Careers</a></li>
              <li style={{ marginBottom: 10 }}><a href="#" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Contact</a></li>
            </ul>
          </div>
          <div>
            <h5 style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: G400, marginBottom: 20, fontWeight: 500 }}>Legal</h5>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <li style={{ marginBottom: 10 }}><Link to="/privacy" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Privacy</Link></li>
              <li style={{ marginBottom: 10 }}><Link to="/terms" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Terms</Link></li>
              <li style={{ marginBottom: 10 }}><a href="#" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Security</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-inline" style={{ paddingTop: 32, borderTop: `1px solid ${G200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: G400, fontFamily: "'IBM Plex Mono', 'Courier New', monospace", flexWrap: 'wrap', gap: 12 }}>
          <span>© 2026 LYC Intelligence. All rights reserved.</span>
          <span>Made for leaders.</span>
        </div>
      </div>
    </footer>
  );
}

// ── PAGE EXPORT ────────────────────────────────────────────────────
export function NexusLanding() {
  useScrollReveal();
  return (
    <div style={{ background: OFF, color: INK, minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.6, WebkitFontSmoothing: 'antialiased' }}>
      <Nav />
      <main>
        <Hero />
        <WhatIs />
        <Capabilities />
        <HowItWorks />
        <Diagnostics />
        <Personas />
        <B2BTeaser />
        <Pricing />
        <Trust />
        <FinalCTA />
      </main>
      <Footer />
      <style>{`.nl-reveal { opacity: 0; transform: translateY(24px); transition: opacity 350ms cubic-bezier(0.16,1,0.3,1), transform 350ms cubic-bezier(0.16,1,0.3,1); } .nl-reveal.nl-visible { opacity: 1; transform: translateY(0); } @media (max-width: 768px) { .nl-reveal { opacity: 1; transform: none; transition: none; } }`}</style>
    </div>
  );
}

export default NexusLanding;
