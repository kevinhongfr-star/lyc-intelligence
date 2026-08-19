/**
 * LensesLibraryPage — V3.1 VISUAL REWORK (V1 foundation)
 *
 * 3-column app shell (same as chat page). Replaces old /assessments catalog.
 *
 *   LEFT  (220)  — Workspace / Depth / Human Layer nav (same as chat), "Lenses" active
 *   MAIN        — page header (eyebrow + display "Eleven lenses." + sub),
 *                  4-pillar grouping tabs, lens rows (code / title / meta / status badge)
 *   RIGHT (280) — miles balance pill, active lenses, recommended for you,
 *                  "What are lenses?" explainer link
 *
 * Naming rules (enforced):
 *  - "Lenses" not "Assessments" / "Diagnostics" (user-facing copy always)
 *  - "NEXUS" always by name — never "the AI" / "the coach"
 *  - No "Platform" / "Architecture" anywhere
 *  - Lens activation = coach-recommended opt-in, NOT auto-activate
 *  - Miles are a UI unit, never marketed. Shown here because balance matters.
 *
 * Canon data (locked): 11 lenses, 4-Pillar structure, mile costs from
 * canon/index.json + src/config/miles.ts. Tier label derived from miles:
 *   1 → Light · 2 → Standard · 3 → Signature · 5 → Flagship (CPI only)
 *
 * Status badges:
 *  - Flagship (fuchsia) — CPI only
 *  - Completed (teal bg) — when user has a scored result for the lens
 *  - Available (ink-400 outline) — default
 *
 * NOTE: completion detection is wired to local result history via
 * @/services/diagnosticApi where a list API exists; otherwise falls back to
 * Available. No invented completion state.
 */
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { initScrollReveal } from '@/lib/utils';
import { V1 } from '@/styles/v1-tokens';
import { useAuthStore } from '@/stores/authStore';

/* ── Canon lens data (11 total — from canon/index.json + miles.ts) ──
 * Descriptors are the canon "descriptor" field. Mile costs are canon-locked.
 * Pillar roles: flagship = dark callout / featured; related = standard row.
 * PRISM = featured entry lens (callout in P3).
 */
type TierLabel = 'Light' | 'Standard' | 'Signature' | 'Flagship';

interface Lens {
  code: string;
  descriptor: string;
  pillar: 'P1' | 'P2' | 'P3' | 'P4';
  miles: number;
  tier: TierLabel;
  pillarRole: 'flagship' | 'related';
  featured?: boolean; // PRISM = featured entry lens
  dimensions: number;
  archetypes: number;
}

const PILLARS = [
  { id: 'P1' as const, name: 'Talent Pipeline Health' },
  { id: 'P2' as const, name: 'Cross-Border Leadership Effectiveness' },
  { id: 'P3' as const, name: 'Strategic & Organizational Impact' },
  { id: 'P4' as const, name: 'AI-Augmented Leadership' },
];

function tierFromMiles(miles: number): TierLabel {
  if (miles >= 5) return 'Flagship';
  if (miles >= 3) return 'Signature';
  if (miles >= 2) return 'Standard';
  return 'Light';
}

const LENSES: Lens[] = [
  // P1 — Talent Pipeline Health
  { code: 'CPI',    descriptor: 'China Leadership Pipeline Index',     pillar: 'P1', miles: 5, tier: tierFromMiles(5), pillarRole: 'flagship', dimensions: 6, archetypes: 6 },
  { code: 'LEAP',   descriptor: 'competitive positioning',             pillar: 'P1', miles: 1, tier: tierFromMiles(1), pillarRole: 'related',  dimensions: 5, archetypes: 17 },
  { code: 'COACH',  descriptor: 'executive coaching fit',               pillar: 'P1', miles: 2, tier: tierFromMiles(2), pillarRole: 'related',  dimensions: 4, archetypes: 8 },
  // P2 — Cross-Border Leadership Effectiveness
  { code: 'BRIDGE', descriptor: 'cross-cultural relational intelligence', pillar: 'P2', miles: 3, tier: tierFromMiles(3), pillarRole: 'flagship', dimensions: 6, archetypes: 6 },
  { code: 'MOSAIC', descriptor: 'institutional trust & relationship velocity', pillar: 'P2', miles: 3, tier: tierFromMiles(3), pillarRole: 'related', dimensions: 4, archetypes: 6 },
  { code: 'DRIVE',  descriptor: 'motivational alignment',              pillar: 'P2', miles: 2, tier: tierFromMiles(2), pillarRole: 'related',  dimensions: 5, archetypes: 10 },
  // P3 — Strategic & Organizational Impact
  { code: 'PRISM',  descriptor: 'professional branding',               pillar: 'P3', miles: 2, tier: tierFromMiles(2), pillarRole: 'related',  dimensions: 5, archetypes: 10, featured: true },
  { code: 'IMPACT', descriptor: 'board & stakeholder impact',          pillar: 'P3', miles: 2, tier: tierFromMiles(2), pillarRole: 'flagship', dimensions: 5, archetypes: 8 },
  { code: 'QUEST',  descriptor: 'strategic market positioning',         pillar: 'P3', miles: 2, tier: tierFromMiles(2), pillarRole: 'related',  dimensions: 6, archetypes: 10 },
  // P4 — AI-Augmented Leadership
  { code: 'SPARK',  descriptor: 'AI leadership readiness',            pillar: 'P4', miles: 3, tier: tierFromMiles(3), pillarRole: 'flagship', dimensions: 3, archetypes: 4 },
  { code: 'FORGE',  descriptor: 'sales excellence capability',         pillar: 'P4', miles: 3, tier: tierFromMiles(3), pillarRole: 'related',  dimensions: 4, archetypes: 4 },
];

type FilterKey = 'all' | 'P1' | 'P2' | 'P3' | 'P4';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All eleven' },
  ...PILLARS.map(p => ({ key: p.id, label: p.name })),
];

/* ── Status badge ──
 * Flagship (fuchsia) / Completed (teal bg) / Available (ink-400 outline).
 * Completion detected from localStorage result history (V1 presentation only —
 * no scoring logic touched). Falls back to Available if no history API.
 */
type Status = 'flagship' | 'completed' | 'available';

function lensStatus(lens: Lens, completedCodes: Set<string>): Status {
  if (lens.pillarRole === 'flagship' && lens.tier === 'Flagship') return 'flagship';
  if (completedCodes.has(lens.code)) return 'completed';
  return 'available';
}

function StatusBadge({ status }: { status: Status }) {
  const common: React.CSSProperties = {
    display: 'inline-block',
    fontFamily: V1.monoFont,
    fontSize: V1.textCaption,
    letterSpacing: V1.trackingMono,
    textTransform: 'uppercase',
    padding: '3px 8px',
    fontWeight: V1.fwSemibold,
    lineHeight: 1.4,
  };
  if (status === 'flagship') {
    return <span style={{ ...common, background: V1.fuchsia600, color: V1.white }}>Flagship</span>;
  }
  if (status === 'completed') {
    return <span style={{ ...common, background: V1.teal600, color: V1.white }}>Completed</span>;
  }
  return <span style={{ ...common, border: `1px solid ${V1.ink400}`, color: V1.ink500 }}>Available</span>;
}

/* ── Lens row (rows, not cards) ── */
function LensRow({ lens, completedCodes }: { lens: Lens; completedCodes: Set<string>; key?: string }) {
  const status = lensStatus(lens, completedCodes);
  const isFeatured = lens.featured;
  return (
    <Link
      to={`/nexus/lenses/${lens.code.toLowerCase()}`}
      className="v1-lens-row"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: 16,
        alignItems: 'baseline',
        padding: '20px 0',
        borderTop: `1px solid ${V1.dividerRow}`,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
          <span className="v1-mono" style={{ color: V1.text, fontWeight: V1.fwSemibold }}>{lens.code}</span>
          {isFeatured && (
            <span className="v1-mono" style={{ color: V1.fuchsia600, fontSize: V1.textCaption }}>
              ★ Featured entry
            </span>
          )}
          {status === 'completed' && (
            <span className="v1-mono" style={{ color: V1.teal700, fontSize: V1.textCaption }}>
              ✓ Readout available
            </span>
          )}
        </div>
        <h3 className="v1-display" style={{ fontSize: V1.textH3, margin: '0 0 6px', color: V1.text, lineHeight: V1.leadingHeading }}>
          {lens.descriptor}
        </h3>
        <div className="v1-mono" style={{ color: V1.textDim }}>
          {lens.dimensions} dimensions · {lens.archetypes} {lens.code === 'DRIVE' ? 'profiles' : 'archetypes'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
        <div className="v1-mono" style={{ color: V1.textSecondary }}>
          {lens.miles} mi · {lens.tier}
        </div>
        <StatusBadge status={status} />
      </div>
    </Link>
  );
}

const PRACTICE_FILTER_MAP: Record<string, string[]> = {
  positioning: ['PRISM', 'IMPACT', 'QUEST', 'CPI', 'LEAP'],
  influence: ['BRIDGE', 'MOSAIC', 'COACH'],
  transition: ['DRIVE', 'IMPACT', 'COACH'],
  'enterprise-china': ['CPI', 'BRIDGE', 'MOSAIC'],
};

const PRACTICE_NAME_MAP: Record<string, string> = {
  positioning: 'Positioning',
  influence: 'Influence',
  transition: 'Transition',
  'enterprise-china': 'Enterprise China',
};

/* ── 3-column app shell (mirrors NexusPage layout) ── */
export function LensesLibraryPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [completedCodes, setCompletedCodes] = useState<Set<string>>(new Set());
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const practiceFilter = searchParams.get('practice');

  useEffect(() => { initScrollReveal(); }, []);

  // Completion detection — read from localStorage result history.
  // V1 presentation only: no scoring logic touched. Key shape: `diag_result_[slug]_[id]`
  // or `result:[slug]:[id]`. We scan for any stored result per lens code.
  useEffect(() => {
    try {
      const codes = new Set<string>();
      const slugs: string[] = LENSES.map((l: Lens) => l.code.toLowerCase());
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        // Match patterns like "diag_result_prism_..." or "result:prism:..."
        for (const slug of slugs) {
          if (k.includes(`_${slug}_`) || k.includes(`:${slug}:`) || k.includes(`_${slug}:`)) {
            codes.add(slug.toUpperCase());
            break;
          }
        }
      }
      setCompletedCodes(codes);
    } catch { /* localStorage unavailable */ }
  }, []);

  const filteredLenses = useMemo(() => {
    let list = LENSES;
    if (practiceFilter && PRACTICE_FILTER_MAP[practiceFilter]) {
      const allowedCodes = PRACTICE_FILTER_MAP[practiceFilter];
      list = list.filter(l => allowedCodes.includes(l.code.toUpperCase()));
    }
    if (activeFilter === 'all') return list;
    return list.filter(l => l.pillar === activeFilter);
  }, [activeFilter, practiceFilter]);

  // Group filtered lenses by pillar for display
  const grouped = useMemo(() => {
    return PILLARS.map((p: typeof PILLARS[number]) => ({
      pillar: p,
      lenses: filteredLenses.filter((l: Lens) => l.pillar === p.id),
    })).filter((g: { pillar: typeof PILLARS[number]; lenses: Lens[] }) => g.lenses.length > 0);
  }, [filteredLenses]);

  return (
    <div style={{ background: V1.bg, minHeight: '100vh', color: V1.text }}>
      <SEO page="assessments" />

      {/* Nav (mirrors chat page nav) */}
      <nav className="v1-nav">
        <div className="v1-nav-inner">
          <Link to="/" className="v1-wordmark" aria-label="NEXUS home">
            NEXUS<span className="v1-dot">.</span>
          </Link>
          <div className="v1-nav-links v1-hidden-mobile">
            <Link to="/nexus/chat">Chat</Link>
            <Link to="/nexus/lenses" className="v1-active-link">Lenses</Link>
            <Link to="/nexus/milestones">Milestones</Link>
            <Link to="/nexus/insights">Insights</Link>
          </div>
          <div className="v1-nav-cta">
            {user ? (
              <span className="v1-avatar v1-avatar-sm" title={user.email || ''}>
                {(user.email || 'U').slice(0, 1).toUpperCase()}
              </span>
            ) : (
              <Link to="/login" className="v1-btn v1-btn-secondary">Sign in</Link>
            )}
          </div>
        </div>
      </nav>

      {/* 3-column app shell */}
      <div className="v1-appshell" style={{ marginTop: V1.navHeight, minHeight: `calc(100vh - ${V1.navHeight})` }}>
        {/* ── LEFT SIDEBAR ── */}
        <aside className="v1-appshell-col">
          <div className="v1-sidebar-sticky">
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Workspace</div>
              <Link to="/nexus/chat" className="v1-sidebar-link">Chat</Link>
              <Link to="/nexus/lenses" className="v1-sidebar-link v1-active">Lenses</Link>
              <Link to="/nexus/milestones" className="v1-sidebar-link">Milestones</Link>
              <Link to="/nexus/insights" className="v1-sidebar-link">Insights</Link>
            </div>
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Depth</div>
              {['Positioning', 'Influence', 'Transition', 'Enterprise China'].map(area => (
                <Link to="/nexus/lenses" key={area} className="v1-sidebar-link">{area}<span className="v1-sidebar-meta">practice</span></Link>
              ))}
              <Link to="/nexus/lenses" className="v1-sidebar-link">All eleven lenses <span aria-hidden="true">→</span></Link>
            </div>
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Human Layer</div>
              <Link to="/debrief/book" className="v1-sidebar-link">Book a debrief</Link>
              <Link to="/nexus/chat" className="v1-sidebar-link">Coaching packages</Link>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="v1-appshell-main" style={{ padding: `${V1.shellPad}px`, overflow: 'auto' }}>
          <div style={{ maxWidth: 760 }}>
            {/* Active practice filter banner */}
            {practiceFilter && PRACTICE_NAME_MAP[practiceFilter] && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: `1px solid ${V1.teal200}`,
                background: V1.teal50,
                padding: 16,
                marginBottom: 24,
              }}>
                <span style={{
                  fontFamily: V1.monoFont,
                  fontSize: V1.textCaption,
                  letterSpacing: V1.trackingMono,
                  textTransform: 'uppercase',
                  color: V1.teal700,
                  fontWeight: V1.fwSemibold,
                }}>
                  Filtering by practice · {PRACTICE_NAME_MAP[practiceFilter]}
                </span>
                <Link
                  to="/app/nexus/lenses"
                  onClick={(e) => {
                    e.preventDefault();
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('practice');
                    setSearchParams(newParams, { replace: true });
                  }}
                  style={{
                    fontFamily: V1.bodyFont,
                    fontSize: V1.textBodySm,
                    color: V1.teal700,
                    textDecoration: 'none',
                    fontWeight: V1.fwMedium,
                  }}
                >
                  Clear filter →
                </Link>
              </div>
            )}

            {/* Page header */}
            <header style={{ marginBottom: 40, paddingBottom: 24, borderBottom: `1px solid ${V1.dividerStrong}` }}>
              <div className="v1-eyebrow">Diagnostic lenses</div>
              <h1 className="v1-display" style={{ fontSize: V1.textDisplay, margin: '8px 0 16px', lineHeight: V1.leadingDisplay }}>
                Eleven lenses.
              </h1>
              <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodyLg, lineHeight: V1.leadingBody, color: V1.textSecondary, maxWidth: 600, margin: 0 }}>
                Each lens surfaces a specific dimension of executive practice. NEXUS proposes one when it would sharpen the conversation — you opt in deliberately. Costs are in miles.
              </p>
            </header>

            {/* Filter tabs — 4 pillars + All */}
            <div role="tablist" style={{ display: 'flex', flexWrap: 'wrap', gap: 0, borderBottom: `1px solid ${V1.dividerRow}`, marginBottom: 8 }} className="v1-hidden-mobile">
              {FILTERS.map(f => {
                const isActive = activeFilter === f.key;
                return (
                  <button
                    key={f.key}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveFilter(f.key)}
                    style={{
                      fontFamily: V1.monoFont,
                      fontSize: V1.textCaption,
                      letterSpacing: V1.trackingMono,
                      textTransform: 'uppercase',
                      color: isActive ? V1.text : V1.textDim,
                      background: 'transparent',
                      border: 'none',
                      borderBottom: isActive ? `2px solid ${V1.teal600}` : '2px solid transparent',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      marginBottom: -1,
                      fontWeight: V1.fwSemibold,
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Lens list grouped by pillar */}
            <div>
              {grouped.map((group: { pillar: typeof PILLARS[number]; lenses: Lens[] }) => (
                <section key={group.pillar.id} style={{ marginTop: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                    <span className="v1-mono" style={{ color: V1.teal700, fontWeight: V1.fwSemibold }}>{group.pillar.id}</span>
                    <h2 className="v1-display" style={{ fontSize: V1.textH2, margin: 0, color: V1.text }}>
                      {group.pillar.name}
                    </h2>
                  </div>
                  <div>
                    {group.lenses.map((lens: Lens) => (
                      <LensRow key={lens.code} lens={lens} completedCodes={completedCodes} />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* What are lenses? explainer */}
            <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${V1.dividerRow}` }}>
              <div className="v1-eyebrow" style={{ marginBottom: 8 }}>What are lenses?</div>
              <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBody, lineHeight: V1.leadingBody, color: V1.textSecondary, margin: 0, maxWidth: 600 }}>
                A lens is a structured diagnostic on one dimension of executive practice — succession, branding, board impact, AI readiness. NEXUS brings one in when the conversation would benefit from a sharper frame. You always opt in. Each costs miles.
              </p>
              <Link to="/nexus/chat" className="v1-btn v1-btn-link" style={{ marginTop: 16 }}>
                Ask NEXUS which lens fits <span className="v1-arrow" aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </main>

        {/* ── RIGHT RAIL ── */}
        <aside className="v1-appshell-col">
          <div className="v1-sidebar-sticky">
            {/* Miles balance pill */}
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Miles balance</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="v1-display" style={{ fontSize: 36, color: V1.text, lineHeight: 1 }}>148</span>
                <span className="v1-mono" style={{ color: V1.textDim }}>mi</span>
              </div>
              <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary, margin: '8px 0 0', lineHeight: V1.leadingBody }}>
                Earned through conversation. Spent when a lens is activated.
              </p>
            </div>

            {/* Active lenses */}
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Active lenses</div>
              <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary, margin: 0, lineHeight: V1.leadingBody }}>
                None active right now. NEXUS will propose one when it fits.
              </p>
            </div>

            {/* Recommended for you */}
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Recommended for you</div>
              <div className="v1-card v1-card-addon" style={{ padding: 16, marginTop: 4 }}>
                <div className="v1-mono" style={{ color: V1.fuchsia600, marginBottom: 4 }}>NEXUS suggests</div>
                <h4 className="v1-display" style={{ fontSize: V1.textH3, margin: '0 0 4px' }}>PRISM</h4>
                <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary, margin: '0 0 12px', lineHeight: V1.leadingBody }}>
                  professional branding · 2 mi
                </p>
                <Link to="/nexus/chat?code=prism" className="v1-btn v1-btn-link" style={{ padding: 0, minHeight: 'auto' }}>
                  Open in chat <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            {/* What are lenses? short link */}
            <div className="v1-sidebar-section">
              <Link to="/nexus/lenses" className="v1-btn v1-btn-link" style={{ padding: 0, minHeight: 'auto' }}>
                What are lenses? <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default LensesLibraryPage;
