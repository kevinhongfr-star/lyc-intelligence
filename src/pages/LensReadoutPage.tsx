/**
 * LensReadoutPage — V3.2 VISUAL REWORK (V1 foundation)
 *
 * Post-diagnostic readout. Naming rule: "Readout", NOT "report" or "results".
 * Route: /nexus/lenses/:code/readout/:resultId
 *
 * 3-column layout, different proportions:
 *   LEFT        — in-page section nav (Overview, Dimension 1..N)
 *                  Active section: teal left bar. Completed: checkmark.
 *   MAIN        — readout content per section:
 *                  title (serif display), finding (body), action items,
 *                  related milestone suggestion, "What this means" callout
 *   RIGHT       — sticky score panel: overall score (big serif number),
 *                  dimension breakdown (mini bars), "Your focus" rec,
 *                  "Talk about this with NEXUS" CTA, "Book a debrief" (fuchsia)
 *
 * IMPORTANT: This is 100% presentation layer. Scoring logic, data model, and
 * question banks are NOT touched. We load the scored result via the existing
 * @/services/diagnosticApi.getResult() API (same as DiagnosticResults #1341)
 * and render it in V1 line-art style.
 *
 * Naming rules (enforced):
 *  - "Readout" not "report" / "results" (user-facing copy)
 *  - "Lenses" not "Assessments" / "Diagnostics"
 *  - "NEXUS" always by name — never "the AI" / "the coach"
 *  - No "Platform" / "Architecture" anywhere
 *  - Lens activation = coach-recommended opt-in, NOT auto-activate
 */
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { V1 } from '@/styles/v1-tokens';
import { useAuthStore } from '@/stores/authStore';
import { getResult } from '@/services/diagnosticApi';
import type { ScoringResult, DimensionScore } from '@/services/diagnosticScoring';

/* ── Canon lens metadata for header + dimension fallback ──
 * Code → human name. Descriptors from canon/index.json.
 */
const LENS_NAMES: Record<string, { name: string; descriptor: string }> = {
  cpi:    { name: 'CPI',    descriptor: 'China Leadership Pipeline Index' },
  prism:  { name: 'PRISM',  descriptor: 'professional branding' },
  spark:  { name: 'SPARK',  descriptor: 'AI leadership readiness' },
  bridge: { name: 'BRIDGE', descriptor: 'cross-cultural relational intelligence' },
  forge:  { name: 'FORGE',  descriptor: 'sales excellence capability' },
  mosaic: { name: 'MOSAIC', descriptor: 'institutional trust & relationship velocity' },
  drive:  { name: 'DRIVE',  descriptor: 'motivational alignment' },
  quest:  { name: 'QUEST',  descriptor: 'strategic market positioning' },
  leap:   { name: 'LEAP',   descriptor: 'competitive positioning' },
  coach:  { name: 'COACH',  descriptor: 'executive coaching fit' },
  impact: { name: 'IMPACT', descriptor: 'board & stakeholder impact' },
};

type LoadStatus = 'loading' | 'loaded' | 'error' | 'notfound';

/* ── Score color by level (V1: teal scale, no traffic-light palette) ── */
function scoreColor(score: number): string {
  if (score >= 70) return V1.teal600;
  if (score >= 40) return V1.teal700;
  return V1.ink500;
}

/* ── Mini bar (2px thin, editorial) ── */
function MiniBar({ score, label }: { score: number; label?: string; key?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.text }}>{label}</span>
          <span className="v1-mono" style={{ color: V1.textDim }}>{score}</span>
        </div>
      )}
      <div style={{ height: 2, background: V1.dividerSubtle, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${score}%`, background: scoreColor(score) }} />
      </div>
    </div>
  );
}

/* ── In-page section nav item ── */
function SectionNavItem({
  label, active, completed, onClick,
}: { label: string; active: boolean; completed: boolean; onClick: () => void; key?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 0 10px 12px',
        width: '100%',
        background: 'transparent',
        border: 'none',
        borderLeft: active ? `2px solid ${V1.teal600}` : `2px solid transparent`,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: V1.bodyFont,
        fontSize: V1.textBodySm,
        color: active ? V1.text : V1.textSecondary,
        fontWeight: active ? V1.fwSemibold : V1.fwRegular,
      }}
    >
      {completed && <span aria-hidden="true" style={{ color: V1.teal600 }}>✓</span>}
      <span>{label}</span>
    </button>
  );
}

export function LensReadoutPage() {
  const { code, resultId } = useParams<{ code: string; resultId: string }>();
  const { user } = useAuthStore();
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [activeSection, setActiveSection] = useState(0);

  const slug = (code || '').toLowerCase();
  const lensMeta = LENS_NAMES[slug] || { name: slug.toUpperCase(), descriptor: slug };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!resultId || !slug) { setStatus('notfound'); return; }
      setStatus('loading');
      try {
        const data = await getResult(resultId, slug, user?.id ?? null);
        if (cancelled) return;
        if (!data) { setStatus('notfound'); return; }
        setResult(data);
        setStatus('loaded');
      } catch (err) {
        if (cancelled) return;
        console.error('LensReadoutPage: getResult failed', err);
        setStatus('error');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [resultId, slug, user?.id]);

  // Build sections: Overview + one per dimension
  const sections = useMemo(() => {
    const dims: DimensionScore[] = result?.dimension_scores || [];
    return [
      { id: 'overview', label: 'Overview' },
      ...dims.map((d: DimensionScore, i: number) => ({ id: d.dimension_key, label: d.dimension_name || `Dimension ${i + 1}` })),
    ];
  }, [result]);

  // Scroll to active section
  useEffect(() => {
    if (status !== 'loaded' || !result) return;
    const el = document.getElementById(`section-${activeSection}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeSection, status, result]);

  const overall = result?.overall_score ?? 0;
  const overallLevel = result?.overall_level ?? '—';
  const archetype = result?.archetype_name;

  return (
    <div style={{ background: V1.bg, minHeight: '100vh', color: V1.text }}>
      <SEO page="assessments" />

      {/* Nav */}
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
            <Link to="/nexus/lenses" className="v1-btn v1-btn-secondary">
              <span aria-hidden="true">←</span> All lenses
            </Link>
          </div>
        </div>
      </nav>

      {/* Readout shell — 3 cols: in-page nav (200) + main (1fr) + score panel (300) */}
      <div
        style={{
          marginTop: V1.navHeight,
          minHeight: `calc(100vh - ${V1.navHeight})`,
          display: 'grid',
          gridTemplateColumns: '200px 1fr 300px',
          maxWidth: V1.shellMax,
          margin: `${V1.navHeight}px auto 0`,
          background: V1.bg,
          borderLeft: `1px solid ${V1.border}`,
          borderRight: `1px solid ${V1.border}`,
        }}
      >
        {/* ── LEFT: in-page section nav ── */}
        <aside style={{ borderRight: `1px solid ${V1.border}`, padding: `${V1.shellPad}px 0`, position: 'sticky', top: V1.navHeight, height: `calc(100vh - ${V1.navHeight})`, overflow: 'auto' }}>
          <div style={{ padding: `0 ${V1.shellPad}px ${V1.shellPad}px`, borderBottom: `1px solid ${V1.dividerRow}`, marginBottom: V1.shellPad }}>
            <div className="v1-eyebrow">Readout</div>
            <h2 className="v1-display" style={{ fontSize: V1.textH3, margin: '4px 0 0', color: V1.text }}>{lensMeta.name}</h2>
            <p className="v1-mono" style={{ color: V1.textDim, marginTop: 4 }}>{lensMeta.descriptor}</p>
          </div>
          <div style={{ padding: `0 ${V1.shellPad}px` }}>
            {sections.map((s: { id: string; label: string }, i: number) => (
              <SectionNavItem
                key={s.id}
                label={s.label}
                active={activeSection === i}
                completed={i < activeSection}
                onClick={() => { setActiveSection(i); }}
              />
            ))}
          </div>
        </aside>

        {/* ── MAIN: readout content ── */}
        <main style={{ padding: `${V1.shellPad * 1.5}px`, overflow: 'auto' }}>
          {/* Error / loading / notfound states */}
          {status === 'loading' && (
            <div style={{ maxWidth: 720 }}>
              <div className="v1-eyebrow">Loading</div>
              <h1 className="v1-display" style={{ fontSize: V1.textH1, margin: '8px 0 16px' }}>Pulling your readout.</h1>
              <p style={{ fontFamily: V1.bodyFont, color: V1.textSecondary }}>A moment.</p>
            </div>
          )}
          {status === 'notfound' && (
            <div style={{ maxWidth: 720 }}>
              <div className="v1-eyebrow">Not found</div>
              <h1 className="v1-display" style={{ fontSize: V1.textH1, margin: '8px 0 16px' }}>No readout here.</h1>
              <p style={{ fontFamily: V1.bodyFont, color: V1.textSecondary, marginBottom: 24 }}>
                This readout link is not valid, or the result has been removed.
              </p>
              <Link to="/nexus/lenses" className="v1-btn v1-btn-secondary">Back to lenses <span aria-hidden="true">→</span></Link>
            </div>
          )}
          {status === 'error' && (
            <div style={{ maxWidth: 720 }}>
              <div className="v1-eyebrow">Something went wrong</div>
              <h1 className="v1-display" style={{ fontSize: V1.textH1, margin: '8px 0 16px' }}>Readout could not load.</h1>
              <p style={{ fontFamily: V1.bodyFont, color: V1.textSecondary, marginBottom: 24 }}>
                Try the link again. If it persists, ask NEXUS to recover the thread.
              </p>
              <Link to="/nexus/chat" className="v1-btn v1-btn-primary">Open chat <span aria-hidden="true">→</span></Link>
            </div>
          )}

          {status === 'loaded' && result && (
            <div style={{ maxWidth: 720 }}>
              {/* Overview section */}
              <section id="section-0" style={{ marginBottom: 48, paddingBottom: 32, borderBottom: `1px solid ${V1.dividerRow}` }}>
                <div className="v1-eyebrow">Overview</div>
                <h1 className="v1-display" style={{ fontSize: V1.textDisplay, margin: '8px 0 16px', lineHeight: V1.leadingDisplay }}>
                  {lensMeta.descriptor}.
                </h1>
                {archetype && (
                  <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodyLg, color: V1.textSecondary, lineHeight: V1.leadingBody, margin: '0 0 24px', maxWidth: 600 }}>
                    Your archetype: <strong style={{ color: V1.text, fontWeight: V1.fwSemibold }}>{archetype}</strong>.
                  </p>
                )}
                <div style={{ background: V1.surfaceAlt, borderLeft: `2px solid ${V1.teal600}`, padding: '16px 20px', maxWidth: 600 }}>
                  <p style={{ fontFamily: V1.displayFont, fontStyle: 'italic', fontSize: V1.textBodyLg, color: V1.text, lineHeight: V1.leadingBody, margin: 0 }}>
                    What this means — your overall position is <strong style={{ fontWeight: V1.fwSemibold }}>{overallLevel.toLowerCase()}</strong> against the APAC executive benchmark.
                  </p>
                </div>
              </section>

              {/* Dimension sections */}
              {result.dimension_scores.map((dim: DimensionScore, i: number) => {
                const sectionIdx = i + 1;
                return (
                  <section
                    key={dim.dimension_key}
                    id={`section-${sectionIdx}`}
                    style={{ marginBottom: 48, paddingBottom: 32, borderBottom: `1px solid ${V1.dividerRow}` }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
                      <span className="v1-mono" style={{ color: V1.teal700 }}>{String(sectionIdx).padStart(2, '0')}</span>
                      <h2 className="v1-display" style={{ fontSize: V1.textH2, margin: 0, color: V1.text }}>
                        {dim.dimension_name}
                      </h2>
                    </div>
                    <div className="v1-mono" style={{ color: V1.textDim, marginBottom: 16 }}>
                      Score: {dim.score} / 100 · {dim.level}
                    </div>
                    <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBody, color: V1.text, lineHeight: V1.leadingBody, margin: '0 0 20px', maxWidth: 600 }}>
                      {dim.description}
                    </p>
                    <div style={{ marginBottom: 20 }}>
                      <div className="v1-eyebrow" style={{ marginBottom: 8 }}>What to work on</div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary, lineHeight: V1.leadingBody }}>
                        <li style={{ marginBottom: 6 }}>Strengthen the lower-scoring dimension above through one deliberate practice this week.</li>
                        <li style={{ marginBottom: 6 }}>Bring this dimension into your next NEXUS conversation — ask for a sharper angle.</li>
                      </ul>
                    </div>
                    <div style={{ background: V1.surfaceAlt, borderLeft: `2px solid ${V1.teal600}`, padding: '12px 16px', maxWidth: 600 }}>
                      <p style={{ fontFamily: V1.displayFont, fontStyle: 'italic', fontSize: V1.textBody, color: V1.text, lineHeight: V1.leadingBody, margin: 0 }}>
                        What this means — {dim.level.toLowerCase()} on {dim.dimension_name.toLowerCase()}.
                      </p>
                    </div>
                    {/* Related milestone suggestion */}
                    <div className="v1-milestone-badge" style={{ marginTop: 20, display: 'inline-flex', gap: 10, alignItems: 'center', padding: '8px 12px' }}>
                      <span aria-hidden="true" style={{ color: V1.fuchsia600, fontWeight: 700 }}>✓</span>
                      <span className="v1-mono" style={{ color: V1.fuchsia600 }}>Suggested milestone</span>
                      <span style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.text }}>
                        Act on {dim.dimension_name.toLowerCase()} this month.
                      </span>
                    </div>
                  </section>
                );
              })}

              {/* Talk to NEXUS CTA */}
              <section style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${V1.dividerStrong}` }}>
                <div className="v1-eyebrow">Continue in chat</div>
                <h3 className="v1-display" style={{ fontSize: V1.textH3, margin: '8px 0 16px' }}>
                  Talk this readout through with NEXUS.
                </h3>
                <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBody, color: V1.textSecondary, lineHeight: V1.leadingBody, margin: '0 0 20px', maxWidth: 600 }}>
                  The readout is a still frame. The conversation is where it becomes a next move.
                </p>
                <Link
                  to={`/nexus/chat?code=${slug}`}
                  className="v1-btn v1-btn-primary"
                >
                  Open in chat <span aria-hidden="true">→</span>
                </Link>
              </section>
            </div>
          )}
        </main>

        {/* ── RIGHT: sticky score panel ── */}
        <aside style={{ borderLeft: `1px solid ${V1.border}`, padding: `${V1.shellPad * 1.5}px`, position: 'sticky', top: V1.navHeight, height: `calc(100vh - ${V1.navHeight})`, overflow: 'auto' }}>
          {status === 'loaded' && result ? (
            <>
              {/* Overall score */}
              <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${V1.dividerRow}` }}>
                <div className="v1-eyebrow">Overall</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                  <span className="v1-display" style={{ fontSize: 72, color: scoreColor(overall), lineHeight: 1 }}>{overall}</span>
                  <span className="v1-mono" style={{ color: V1.textDim }}>/ 100</span>
                </div>
                <div className="v1-mono" style={{ color: V1.textSecondary, marginTop: 4, textTransform: 'uppercase', letterSpacing: V1.trackingMono, fontSize: V1.textCaption }}>
                  {overallLevel}
                </div>
              </div>

              {/* Dimension breakdown */}
              <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${V1.dividerRow}` }}>
                <div className="v1-sidebar-label" style={{ marginBottom: 12 }}>Dimensions</div>
                {result.dimension_scores.map((d: DimensionScore) => (
                  <MiniBar key={d.dimension_key} score={d.score} label={d.dimension_name} />
                ))}
              </div>

              {/* Your focus */}
              <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${V1.dividerRow}` }}>
                <div className="v1-sidebar-label">Your focus</div>
                <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary, margin: '8px 0 0', lineHeight: V1.leadingBody }}>
                  {(() => {
                    const lowest = [...result.dimension_scores].sort((a: DimensionScore, b: DimensionScore) => a.score - b.score)[0];
                    return lowest ? `Bring ${lowest.dimension_name.toLowerCase()} into your next conversation. It is where the most movement is available.` : 'Begin with the dimension closest to where you stand now.';
                  })()}
                </p>
              </div>

              {/* Talk to NEXUS CTA */}
              <div style={{ marginBottom: 20 }}>
                <Link
                  to={`/nexus/chat?code=${slug}`}
                  className="v1-btn v1-btn-primary"
                  style={{ width: '100%' }}
                >
                  Talk about this with NEXUS <span aria-hidden="true">→</span>
                </Link>
              </div>

              {/* Book a debrief (fuchsia accent) */}
              <div className="v1-card v1-card-addon" style={{ padding: 16 }}>
                <div className="v1-mono" style={{ color: V1.fuchsia600, marginBottom: 6 }}>Human Depth</div>
                <h4 className="v1-display" style={{ fontSize: V1.textH3, margin: '0 0 6px' }}>Book a debrief.</h4>
                <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary, margin: '0 0 12px', lineHeight: V1.leadingBody }}>
                  A 60-minute walk-through with a senior LYC consultant.
                </p>
                <Link to="/debrief/book" className="v1-btn v1-btn-link" style={{ color: V1.fuchsia600, padding: 0, minHeight: 'auto' }}>
                  Book a debrief <span aria-hidden="true">→</span>
                </Link>
              </div>
            </>
          ) : (
            <div>
              <div className="v1-eyebrow">{status === 'loading' ? 'Loading' : 'Readout'}</div>
              <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary, margin: '8px 0 0', lineHeight: V1.leadingBody }}>
                {status === 'loading' ? 'Pulling your scores.' : 'Score panel will appear once the readout loads.'}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default LensReadoutPage;
