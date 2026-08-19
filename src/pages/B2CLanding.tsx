/**
 * B2CLanding — V2 VISUAL REWORK (V1 foundation)
 *
 * Light-mode line-art system. 8 sections top→bottom:
 *   1. Nav          — How it works / Lenses / Membership · CTA "Begin with your positioning"
 *   2. Hero         — cream bg, "The leadership playbook you were given was written for a different world."
 *   3. Recognition   — teal-900 dark, credibility marks
 *   4. How it works — 3 numbered steps (01/02/03), rule lines between
 *   5. Lenses       — 11 lens grid, flagship dark callout (CPI), featured entry (PRISM)
 *   6. Membership   — 3 tiers: Explorer / Professional $99 (recommended) / Executive $199
 *   7. Final CTA    — teal-900 dark, inverted button
 *   8. Footer       — minimal, brand + "Your context stays yours."
 *
 * Naming rules (enforced):
 *  - "Membership" not "Pricing" everywhere (nav link + eyebrow aligned)
 *  - "Lenses" not "Assessments" / "Diagnostics"
 *  - "NEXUS" always by name — never "the AI" / "the coach"
 *  - No "Platform" anywhere (hard ban). No "Architecture" / "architect".
 *  - Miles are NOT a marketing feature — shown as factual mono labels, never lead.
 *
 * Canon data (locked): 11 lenses, 4-Pillar structure, mile costs from
 * canon/index.json + src/config/miles.ts. 3 landing tiers from tiers.ts.
 */
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { initScrollReveal } from '@/lib/utils';
import { V1 } from '@/styles/v1-tokens';
// FIX 7 — no icon library. Typographic symbols only.

/* ── Canon lens data (11 total — from canon/index.json + miles.ts) ──
 * Descriptors are the canon "descriptor" field. Mile costs are canon-locked.
 * Pillar roles: flagship = dark callout / featured; related = standard card.
 */
interface Lens {
  code: string;
  descriptor: string;
  pillar: string;
  pillarRole: 'flagship' | 'related';
  miles: number;
  featured?: boolean; // PRISM = featured entry lens
}

const PILLARS = [
  { id: 'P1', name: 'Talent Pipeline' },
  { id: 'P2', name: 'Cross-Border Effectiveness' },
  { id: 'P3', name: 'Strategic Impact' },
  { id: 'P4', name: 'AI-Augmented Leadership' },
];

const LENSES: Lens[] = [
  // P1
  { code: 'CPI',    descriptor: 'China Leadership Pipeline Index',     pillar: 'P1', pillarRole: 'flagship', miles: 5 },
  { code: 'LEAP',   descriptor: 'competitive positioning',             pillar: 'P1', pillarRole: 'related',  miles: 1 },
  { code: 'COACH',  descriptor: 'executive coaching fit',               pillar: 'P1', pillarRole: 'related',  miles: 2 },
  { code: 'QUEST',  descriptor: 'strategic market positioning',         pillar: 'P1', pillarRole: 'related',  miles: 2 },
  // P2
  { code: 'BRIDGE', descriptor: 'cross-cultural relational intelligence', pillar: 'P2', pillarRole: 'flagship', miles: 3 },
  { code: 'DRIVE',  descriptor: 'motivational alignment',              pillar: 'P2', pillarRole: 'related',  miles: 2 },
  { code: 'MOSAIC', descriptor: 'institutional trust & relationship velocity', pillar: 'P2', pillarRole: 'related', miles: 3 },
  // P3
  { code: 'IMPACT', descriptor: 'board & stakeholder impact',          pillar: 'P3', pillarRole: 'flagship', miles: 2 },
  { code: 'PRISM',  descriptor: 'professional branding',               pillar: 'P3', pillarRole: 'related',  miles: 2, featured: true },
  // P4
  { code: 'SPARK',  descriptor: 'AI leadership readiness',            pillar: 'P4', pillarRole: 'flagship', miles: 3 },
  { code: 'FORGE',  descriptor: 'sales excellence capability',         pillar: 'P4', pillarRole: 'related',  miles: 3 },
];

/* ── 3-tier membership display (landing shows 3 of the real 5 tiers) ──
 * Explorer $0 · Professional $99 (recommended, = internal "professional"/"Pro" tier)
 * · Executive $199. Human coaching is a separate add-on layer, not shown here.
 */
const TIERS = [
  {
    name: 'Explorer',
    price: 0,
    priceLabel: 'Complimentary',
    blurb: 'Begin the conversation. Daily NEXUS messages, the PRISM lens on us, and a baseline to grow from.',
    features: ['20 NEXUS messages / day', 'PRISM + LEAP lenses on us', 'Baseline leadership profile'],
  },
  {
    name: 'Professional',
    price: 99,
    priceLabel: '$99/mo',
    recommended: true,
    blurb: 'NEXUS, always on. The full 11-lens catalog. Branded reports, advanced insights, peer benchmarking.',
    features: ['NEXUS messages, no cap', 'Full 11-lens catalog access', 'Branded PDF reports', '5 miles / month'],
  },
  {
    name: 'Executive',
    price: 199,
    priceLabel: '$199/mo',
    blurb: 'Priority NEXUS responses, executive workshops, and a deeper mile allowance for the work that matters most.',
    features: ['Everything in Professional', 'Priority NEXUS responses', 'Quarterly executive workshops', '10 miles / month'],
  },
];

export function B2CLanding() {
  useEffect(() => {
    const observer = initScrollReveal();
    return () => observer.disconnect();
  }, []);

  return (
    <div className="v1-scope" style={{ minHeight: '100vh', background: V1.bg }}>
      {/* ════════════════ 1. NAV ════════════════ */}
      <nav className="v1-nav" aria-label="Primary">
        <div className="v1-nav-inner">
          <Link to="/" className="v1-wordmark" aria-label="NEXUS home">
            NEXUS<span className="v1-dot">.</span>
          </Link>
          <div className="v1-nav-links v1-hidden-mobile">
            <a href="#how-it-works">How it works</a>
            <a href="#lenses">Lenses</a>
            <a href="#membership">Membership</a>
          </div>
          <div className="v1-nav-cta">
            <Link to="/nexus/chat" className="v1-btn v1-btn-primary">
              Begin with your positioning <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* spacer for fixed nav */}
      <div style={{ height: V1.navHeight }} />

      {/* ════════════════ 2. HERO ════════════════ */}
      <header className="v1-marketing v1-section" style={{ paddingTop: 80, paddingBottom: 72 }}>
        <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
          <div className="v1-eyebrow" style={{ textAlign: 'center' }}>For Senior Leaders</div>
          <h1 className="v1-display reveal" style={{ fontSize: V1.textDisplay, margin: '0 0 24px' }}>
            The leadership playbook you were given was written for a different world.
          </h1>
          <p className="reveal" style={{
            fontFamily: V1.bodyFont, fontSize: V1.textBodyLg, lineHeight: V1.leadingBody,
            color: V1.textSecondary, maxWidth: 600, margin: '0 auto 40px',
          }}>
            NEXUS asks the questions most executives skip. Lenses reveal where you actually stand.
            One private thread, eleven lenses, a trajectory you can shape.
          </p>
          <div className="reveal" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/nexus/chat" className="v1-btn v1-btn-primary">
              Begin with your positioning <span aria-hidden="true">→</span>
            </Link>
            <a href="#lenses" className="v1-btn v1-btn-secondary">Explore the lenses</a>
          </div>
        </div>

        {/* Line-art illustration — thin-stroke compass/network */}
        <div className="reveal" style={{ maxWidth: 720, margin: '56px auto 0', opacity: 1 }} aria-hidden="true">
          <svg viewBox="0 0 720 220" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: 'auto' }}>
            <g stroke={V1.teal600} strokeWidth="1.2" strokeLinecap="square">
              {/* horizon rule */}
              <line x1="0" y1="110" x2="720" y2="110" stroke={V1.ink200} strokeWidth="1" />
              {/* compass rings */}
              <circle cx="360" cy="110" r="78" stroke={V1.teal600} />
              <circle cx="360" cy="110" r="48" stroke={V1.ink300} />
              <circle cx="360" cy="110" r="3" fill={V1.teal600} stroke="none" />
              {/* needle */}
              <line x1="360" y1="40" x2="360" y2="180" stroke={V1.teal700} strokeWidth="1.4" />
              {/* cardinal ticks */}
              <line x1="360" y1="26" x2="360" y2="36" />
              <line x1="360" y1="184" x2="360" y2="194" />
              <line x1="276" y1="110" x2="286" y2="110" />
              <line x1="434" y1="110" x2="444" y2="110" />
              {/* network nodes (line-art) */}
              <line x1="120" y1="110" x2="200" y2="60" stroke={V1.ink300} />
              <line x1="200" y1="60" x2="240" y2="110" stroke={V1.ink300} />
              <line x1="120" y1="110" x2="240" y2="110" stroke={V1.ink200} />
              <circle cx="120" cy="110" r="3" fill={V1.teal600} stroke="none" />
              <circle cx="200" cy="60" r="3" fill={V1.ink400} stroke="none" />

              <line x1="600" y1="110" x2="520" y2="60" stroke={V1.ink300} />
              <line x1="520" y1="60" x2="480" y2="110" stroke={V1.ink300} />
              <line x1="600" y1="110" x2="480" y2="110" stroke={V1.ink200} />
              <circle cx="600" cy="110" r="3" fill={V1.teal600} stroke="none" />
              <circle cx="520" cy="60" r="3" fill={V1.ink400} stroke="none" />
            </g>
          </svg>
        </div>
      </header>

      {/* ════════════════ 3. RECOGNITION / TRUST (teal-900 dark) ════════════════ */}
      <section className="v1-section-dark" style={{ padding: '72px 0' }}>
        <div className="v1-marketing">
          <div className="v1-eyebrow v1-eyebrow-on-dark" style={{ textAlign: 'center' }}>Recognition</div>
          <h2 className="v1-display reveal" style={{ fontSize: V1.textH2, textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
            Trusted by leaders across global executive markets.
          </h2>
          <div className="reveal" style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0,
            borderTop: `1px solid ${V1.teal800}`, borderBottom: `1px solid ${V1.teal800}`,
          }}>
            {['Fortune 500', 'Cross-border', 'C-suite', 'Sovereign funds'].map((mark, i, arr) => (
              <div key={mark} style={{
                padding: '28px 16px', textAlign: 'center',
                borderRight: i < arr.length - 1 ? `1px solid ${V1.teal800}` : 'none',
                fontFamily: V1.monoFont, fontSize: V1.textBodySm, letterSpacing: V1.trackingMono,
                color: V1.onDarkMuted, textTransform: 'uppercase',
              }}>{mark}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ 4. HOW IT WORKS (3 numbered steps, rule lines between) ════════════════ */}
      <section id="how-it-works" className="v1-marketing v1-section">
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div className="v1-eyebrow">How it works</div>
          <h2 className="v1-display reveal" style={{ fontSize: V1.textH1, margin: '0 0 16px' }}>
            Three movements. One continuous thread.
          </h2>
          <p className="reveal" style={{
            fontFamily: V1.bodyFont, fontSize: V1.textBodyLg, lineHeight: V1.leadingBody,
            color: V1.textSecondary, maxWidth: 560, margin: '0 0 48px',
          }}>
            No intake form first. No locked gates. Start wherever you want, and NEXUS meets you there.
          </p>

          <div className="v1-grid-steps">
            {[
              { n: '01', title: 'Start the conversation', desc: 'Open NEXUS chat and say what is on your mind — a decision, a friction, a question you have been avoiding. The thread begins immediately.' },
              { n: '02', title: 'Add a lens when it sharpens things', desc: 'NEXUS proposes a lens when it would make the conversation clearer. You opt in deliberately — each lens is a focused diagnostic, not a form to fill out.' },
              { n: '03', title: 'Carry the thread forward', desc: 'Insights, milestones, and the next lens all live in one private place. Your context compounds across every conversation.' },
            ].map((s) => (
              <div className="v1-step reveal" key={s.n} style={{ display: 'flex', gap: 32, alignItems: 'baseline' }}>
                <div className="v1-mono v1-mono-teal" style={{ flexShrink: 0, fontSize: 13 }}>{s.n}</div>
                <div>
                  <h3 className="v1-display" style={{ fontSize: V1.textH3, margin: '0 0 8px' }}>{s.title}</h3>
                  <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBody, lineHeight: V1.leadingBody, color: V1.textSecondary, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ 5. LENSES (11 lens grid + flagship dark callout) ════════════════ */}
      <section id="lenses" className="v1-section" style={{ background: V1.surfaceAlt, borderTop: `1px solid ${V1.border}`, borderBottom: `1px solid ${V1.border}` }}>
        <div className="v1-marketing">
          <div className="v1-eyebrow">Lenses</div>
          <h2 className="v1-display reveal" style={{ fontSize: V1.textH1, margin: '0 0 16px' }}>
            Eleven lenses across four pillars.
          </h2>
          <p className="reveal" style={{
            fontFamily: V1.bodyFont, fontSize: V1.textBodyLg, lineHeight: V1.leadingBody,
            color: V1.textSecondary, maxWidth: 600, margin: '0 0 48px',
          }}>
            Each lens is a focused diagnostic NEXUS may propose mid-conversation. PRISM is where most leaders begin.
            CPI is the flagship — reserved for the deepest organizational work.
          </p>

          {/* Pillar legend */}
          <div className="reveal" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
            {PILLARS.map(p => (
              <div key={p.id} className="v1-mono" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="v1-status-dot v1-status-dot-teal" /> {p.id} · {p.name}
              </div>
            ))}
          </div>

          {/* CPI flagship — dark system callout (full width) */}
          {(() => {
            const cpi = LENSES.find(l => l.code === 'CPI')!;
            const pillarName = PILLARS.find(p => p.id === cpi.pillar)!.name;
            return (
              <Link to="/nexus/chat" className="reveal" style={{ textDecoration: 'none', display: 'block', marginBottom: 24 }}>
                <div className="v1-card v1-card-system v1-card-hover" style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: '0 0 auto' }}>
                    <div className="v1-mono v1-mono-on-dark" style={{ marginBottom: 8 }}>Flagship · {pillarName}</div>
                    <h3 className="v1-display" style={{ fontSize: V1.textH2, margin: 0 }}>{cpi.code}</h3>
                  </div>
                  <div style={{ flex: '1 1 320px', minWidth: 220 }}>
                    <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBody, lineHeight: V1.leadingBody, color: V1.onDarkMuted, margin: 0 }}>
                      {cpi.descriptor} — the deepest lens in the catalog. Six dimensions, six archetypes, built for organizational pipeline work. NEXUS brings it in only when the stakes warrant it.
                    </p>
                  </div>
                  <div className="v1-mono v1-mono-on-dark" style={{ flex: '0 0 auto', textAlign: 'right' }}>
                    {cpi.miles} miles
                  </div>
                </div>
              </Link>
            );
          })()}

          {/* 10 remaining lens cards (PRISM featured = add-on fuchsia left border) */}
          <div className="v1-grid-lenses">
            {LENSES.filter(l => l.code !== 'CPI').map(lens => {
              const pillarName = PILLARS.find(p => p.id === lens.pillar)!.name;
              const featured = lens.featured;
              return (
                <Link key={lens.code} to="/nexus/chat" className="reveal"
                  style={{ textDecoration: 'none' }}>
                  <div className={`v1-card v1-card-hover ${featured ? 'v1-card-addon' : ''}`}
                    style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span className="v1-mono" style={{ color: V1.textMuted }}>{lens.pillar}</span>
                      {featured && <span className="v1-tag v1-tag-fuchsia">Featured entry</span>}
                    </div>
                    <h3 className="v1-display" style={{ fontSize: V1.textH3, margin: 0 }}>{lens.code}</h3>
                    <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, lineHeight: V1.leadingBody, color: V1.textSecondary, margin: 0, flex: 1 }}>
                      {lens.descriptor}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <span className="v1-mono">{lens.miles} {lens.miles === 1 ? 'mile' : 'miles'}</span>
                      <span className="v1-mono" style={{ color: V1.teal700 }}>{pillarName.split(' ')[0]}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div style={{ marginTop: 40 }}>
            <Link to="/nexus/chat" className="v1-btn v1-btn-link">
              Explore all lenses <span className="v1-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════ 6. MEMBERSHIP (3 tiers — eyebrow "Membership", not "Pricing") ════════════════ */}
      <section id="membership" className="v1-marketing v1-section">
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div className="v1-eyebrow">Membership</div>
          <h2 className="v1-display reveal" style={{ fontSize: V1.textH1, margin: '0 0 16px' }}>
            One subscription. The whole catalog.
          </h2>
          <p className="reveal" style={{
            fontFamily: V1.bodyFont, fontSize: V1.textBodyLg, lineHeight: V1.leadingBody,
            color: V1.textSecondary, maxWidth: 560, margin: '0 0 48px',
          }}>
            Three tiers on this page. Human coaching is a separate add-on layer when you want a person in the room.
          </p>

          <div className="v1-grid-pricing">
            {TIERS.map(tier => (
              <div key={tier.name} className={`v1-card v1-card-hover reveal ${tier.recommended ? 'v1-card-addon' : ''}`}
                style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
                {tier.recommended && (
                  <div className="v1-tag v1-tag-fuchsia" style={{ position: 'absolute', top: 0, left: 0 }}>Recommended</div>
                )}
                <div style={{ marginTop: tier.recommended ? 24 : 0 }}>
                  <h3 className="v1-display" style={{ fontSize: V1.textH2, margin: 0 }}>{tier.name}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span className="v1-display" style={{ fontSize: 36 }}>{tier.price === 0 ? 'Complimentary' : `$${tier.price}`}</span>
                  {tier.price !== 0 && <span className="v1-mono" style={{ color: V1.textMuted }}>/mo</span>}
                </div>
                <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, lineHeight: V1.leadingBody, color: V1.textSecondary, margin: 0 }}>
                  {tier.blurb}
                </p>
                <hr className="v1-rule v1-rule-subtle" />
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tier.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary }}>
                      <span className="v1-status-dot v1-status-dot-teal" style={{ marginTop: 6 }} /> {f}
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                  <Link to="/nexus/chat" className={`v1-btn ${tier.recommended ? 'v1-btn-primary' : 'v1-btn-secondary'}`} style={{ width: '100%' }}>
                    {tier.price === 0 ? 'Start free' : `Choose ${tier.name}`} <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <p className="v1-mono" style={{ textAlign: 'center', marginTop: 32 }}>
            Human coaching · Bronze / Silver / Gold — added separately, never bundled
          </p>
        </div>
      </section>

      {/* ════════════════ 7. FINAL CTA (teal-900 dark, inverted button) ════════════════ */}
      <section className="v1-section-dark" style={{ padding: '96px 0', textAlign: 'center' }}>
        <div className="v1-marketing">
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            {/* Editorial ornament — CSS circle + cross (typographic, no icon library) */}
            <div aria-hidden="true" style={{ width: 28, height: 28, margin: '0 auto 16px', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, border: `1px solid ${V1.onDark}`, borderRadius: '50%' }} />
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: V1.onDark }} />
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: V1.onDark }} />
            </div>
            <h2 className="v1-display" style={{ fontSize: V1.textH1, margin: '0 0 16px' }}>
              Open the thread. See where it leads.
            </h2>
            <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodyLg, lineHeight: V1.leadingBody, color: V1.onDarkMuted, margin: '0 0 32px' }}>
              Start wherever you want. No form to fill out first.
            </p>
            <Link to="/nexus/chat" className="v1-btn v1-btn-primary v1-on-dark" style={{ padding: '14px 28px' }}>
              Begin with your positioning <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════ 8. FOOTER (minimal) ════════════════ */}
      <footer style={{ background: V1.surface, borderTop: `1px solid ${V1.border}`, padding: '40px 0' }}>
        <div className="v1-marketing" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <Link to="/" className="v1-wordmark">NEXUS<span className="v1-dot">.</span></Link>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }} className="v1-hidden-mobile">
            <Link to="/nexus/chat" className="v1-btn v1-btn-link">Chat</Link>
            <a href="#lenses" className="v1-btn v1-btn-link">Lenses</a>
            <a href="#membership" className="v1-btn v1-btn-link">Membership</a>
          </div>
          <span className="v1-mono" style={{ color: V1.textMuted }}>Your context stays yours.</span>
        </div>
      </footer>
    </div>
  );
}

export default B2CLanding;
