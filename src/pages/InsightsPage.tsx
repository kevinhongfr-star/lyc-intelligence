/**
 * V5.1 PLACEHOLDER — NEXUS INSIGHTS PAGE
 *
 * Route: /nexus/insights (sidebar nav entry exists per V4 spec; page is V5.1 scope)
 *
 * Built in the V1 line-art 3-column app shell so the sidebar entry links to a
 * cohesive, on-brand surface rather than a 404. Real content + insight
 * generation engine ships in V5.1. This is a presentation-only placeholder.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { SkipToContent } from '@/components/a11y/SkipToContent';
import { useAuthStore } from '@/stores/authStore';
import { V1 } from '@/styles/v1-tokens';

export function InsightsPage() {
  const { user, profile } = useAuthStore();
  const memberName = profile?.name || 'Alex Morgan';
  const avatarLetter = memberName.slice(0, 1).toUpperCase();

  return (
    <div className="v1-scope" style={{ minHeight: '100vh', background: V1.bg }}>
      <SEO page="nexus" />
      <style>{`
        /* ── V4 page transitions: fade + 4px Y shift, 0.2s ease ── */
        @keyframes is-reveal { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .is-enter { animation: is-reveal ${V1.durNormal}ms ${V1.ease} both; }
        .is-enter-d1 { animation: is-reveal ${V1.durNormal}ms ${V1.ease} 80ms both; }
        /* ── Accessibility: V4-specified TEAL focus ring scoped ── */
        .v1-scope :focus-visible {
          outline: 2px solid ${V1.teal600} !important;
          outline-offset: 2px;
          border-radius: 0;
        }
        /* ── Micro-interactions: subtle bg shift 0.15s ── */
        .v1-scope .v1-btn {
          transition: background ${V1.durFast}ms ${V1.ease},
                      color ${V1.durFast}ms ${V1.ease},
                      border-color ${V1.durFast}ms ${V1.ease};
        }
        .v1-scope .v1-btn-secondary:hover {
          background: ${V1.ink50};
          color: ${V1.teal800};
          border-color: ${V1.teal600};
        }
        .v1-scope .v1-sidebar-link {
          transition: color ${V1.durFast}ms ${V1.ease},
                      background ${V1.durFast}ms ${V1.ease},
                      border-left-color ${V1.durFast}ms ${V1.ease};
        }
        .v1-scope .v1-sidebar-link:hover:not(.v1-active) {
          color: ${V1.teal700};
          background: ${V1.ink50};
        }
        /* ── Responsive: mobile touch targets ≥44px ── */
        @media (max-width: 768px) {
          .v1-scope .v1-btn { min-height: 44px; min-width: 44px; }
          .v1-scope .v1-appshell-main > div { padding: 20px 16px; }
        }
      `}</style>

      <SkipToContent />

      {/* ══════════ NAV ══════════ */}
      <nav className="v1-nav" aria-label="Primary">
        <div className="v1-nav-inner">
          <Link to="/" className="v1-wordmark" aria-label="NEXUS home">
            NEXUS<span className="v1-dot">.</span>
          </Link>
          <div className="v1-nav-links v1-hidden-mobile">
            <Link to="/nexus/chat">Chat</Link>
            <Link to="/nexus/lenses">Lenses</Link>
            <Link to="/nexus/milestones">Milestones</Link>
          </div>
          <div className="v1-nav-cta">
            {!user ? (
              <Link to="/login" className="v1-btn v1-btn-secondary">Sign in</Link>
            ) : (
              <span className="v1-avatar v1-avatar-sm" title={memberName}>
                {avatarLetter}
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════ 3-COLUMN APP SHELL ══════════ */}
      <div
        className="v1-appshell"
        style={{ marginTop: V1.navHeight, minHeight: `calc(100vh - ${V1.navHeight}px)` }}
      >
        {/* ── LEFT SIDEBAR ── */}
        <aside className="v1-appshell-col" aria-label="Workspace navigation">
          <div className="v1-sidebar-sticky">
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Workspace</div>
              <Link to="/nexus/chat" className="v1-sidebar-link">Chat</Link>
              <Link to="/nexus/lenses" className="v1-sidebar-link">Lenses</Link>
              <Link to="/nexus/milestones" className="v1-sidebar-link">Milestones</Link>
              <Link to="/nexus/insights" className="v1-sidebar-link v1-active">Insights</Link>
              <Link to="/app/documents" className="v1-sidebar-link">Documents</Link>
            </div>
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Depth</div>
              {['Positioning', 'Influence', 'Transition', 'Enterprise China'].map((area) => (
                <Link to="/nexus/lenses" key={area} className="v1-sidebar-link">
                  {area}
                  <span className="v1-sidebar-meta">practice</span>
                </Link>
              ))}
              <Link to="/nexus/lenses" className="v1-sidebar-link">
                All eleven lenses <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Human Layer</div>
              <Link to="/nexus/coaching" className="v1-sidebar-link">Coaching hours</Link>
              <Link to="/app/bookings" className="v1-sidebar-link">Upcoming sessions</Link>
            </div>
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Account</div>
              <Link to="/nexus/settings" className="v1-sidebar-link">Settings</Link>
              <Link to="/app/billing" className="v1-sidebar-link">Billing</Link>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="v1-appshell-main" id="main-content" tabIndex={-1}>
          <div style={{ padding: V1.shellPad, maxWidth: V1.contentMax, width: '100%' }}>
            <div className="v1-eyebrow" style={{ marginBottom: 8 }}>Workspace</div>
            <h1
              className="v1-display"
              style={{
                fontSize: V1.textH1,
                margin: '0 0 16px',
                letterSpacing: V1.trackingTight,
                lineHeight: V1.leadingDisplay,
                fontFamily: V1.displayFont,
                color: V1.text,
                fontWeight: V1.fwRegular,
              }}
            >
              Insights
            </h1>
            <p
              style={{
                fontFamily: V1.bodyFont,
                fontSize: V1.textBody,
                color: V1.textSecondary,
                lineHeight: V1.leadingBody,
                maxWidth: 560,
                margin: '0 0 40px',
              }}
            >
              Patterns across your conversations, lenses, and milestones. Compiled
              into a brief you can act on.
            </p>

            <div
              style={{
                border: `1px solid ${V1.border}`,
                padding: 40,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: V1.displayFont,
                  fontSize: 22,
                  color: V1.text,
                  marginBottom: 8,
                }}
              >
                Your first insights brief is being prepared.
              </div>
              <p
                style={{
                  fontFamily: V1.bodyFont,
                  fontSize: V1.textBodySm,
                  color: V1.textMuted,
                  maxWidth: 420,
                  margin: '0 auto 20px',
                  lineHeight: 1.5,
                }}
              >
                NEXUS compiles a rolling brief after you've completed three lenses
                and two coaching sessions. Come back once you've moved a few
                milestones forward.
              </p>
              <div
                className="v1-mono"
                style={{
                  fontSize: 10.5,
                  letterSpacing: V1.trackingMono,
                  textTransform: 'uppercase',
                  color: V1.teal700,
                }}
              >
                ◆ V5.1 · Automated insights generation
              </div>
            </div>
          </div>
        </main>

        {/* ── RIGHT RAIL ── */}
        <aside className="v1-appshell-col" aria-label="Insights info panel">
          <div className="v1-sidebar-sticky">
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">What goes here</div>
              <dl
                style={{
                  margin: '8px 0 0',
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  fontFamily: V1.bodyFont,
                  fontSize: V1.textBodySm,
                }}
              >
                <div>
                  <dt
                    className="v1-mono"
                    style={{
                      fontSize: 10.5,
                      color: V1.textMuted,
                      letterSpacing: V1.trackingMono,
                      textTransform: 'uppercase',
                      marginBottom: 2,
                    }}
                  >
                    01 · Pattern digest
                  </dt>
                  <dd style={{ margin: 0, color: V1.textSecondary, lineHeight: 1.45 }}>
                    Recurring themes across 90 days of conversation.
                  </dd>
                </div>
                <div>
                  <dt
                    className="v1-mono"
                    style={{
                      fontSize: 10.5,
                      color: V1.textMuted,
                      letterSpacing: V1.trackingMono,
                      textTransform: 'uppercase',
                      marginBottom: 2,
                    }}
                  >
                    02 · Blind spots
                  </dt>
                  <dd style={{ margin: 0, color: V1.textSecondary, lineHeight: 1.45 }}>
                    What your lens scores consistently flag, unprompted.
                  </dd>
                </div>
                <div>
                  <dt
                    className="v1-mono"
                    style={{
                      fontSize: 10.5,
                      color: V1.textMuted,
                      letterSpacing: V1.trackingMono,
                      textTransform: 'uppercase',
                      marginBottom: 2,
                    }}
                  >
                    03 · Momentum
                  </dt>
                  <dd style={{ margin: 0, color: V1.textSecondary, lineHeight: 1.45 }}>
                    Milestone velocity vs. the prior quarter.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default InsightsPage;
