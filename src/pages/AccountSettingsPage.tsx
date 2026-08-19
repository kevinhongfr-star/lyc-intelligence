/**
 * V4.3 — ACCOUNT SETTINGS PAGE
 *
 * Route: /nexus/settings (consolidates current /profile and /billing)
 *
 * 3-column app shell (V1 line-art system):
 *   LEFT (220)  — Workspace / Depth / Human Layer / Account (Settings active,
 *                 Billing below)
 *   MAIN        — Top tab navigation: Profile (active) / Privacy / Plan /
 *                 Notifications
 *                 Profile tab: setting rows (Name, Email, Working context,
 *                   Preferred language) with label + desc + value + Edit link
 *                 Privacy tab: conversation storage, share/training toggles,
 *                   Export/Delete action links
 *                 Plan tab: current plan card, Human Depth add-on card (fuchsia
 *                   left border), 3 usage bars (miles, lenses, coaching hrs)
 *                 Notifications tab: 4 toggles — milestone recaps, new lens
 *                   suggestions, session reminders, product updates
 *   RIGHT (280) — Profile card (avatar + name + email, centered), Your
 *                 account summary (plan, miles, coaching, lenses, milestones,
 *                 member since), Security badge (teal border, E2E encrypted)
 */
import React, { useState, useMemo, Suspense, lazy } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { SkipToContent } from '@/components/a11y/SkipToContent';
import { useAuthStore } from '@/stores/authStore';
import { V1 } from '@/styles/v1-tokens';

// V5.1 Personas tab — 5th settings tab
const PersonasSettingsTab = lazy(() => import('@/pages/nexus/PersonasSettingsTab'));

// ── V1 motion ──
const EASE_OUT = V1.ease;
const REVEAL_MS = V1.durNormal;

type SettingsTab = 'profile' | 'privacy' | 'plan' | 'notifications' | 'personas';

const TABS: { key: SettingsTab; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'privacy', label: 'Privacy' },
  { key: 'plan', label: 'Plan' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'personas', label: 'Personas' },
];

export function AccountSettingsPage() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Mock profile data — presentation layer, existing authStore/profile
  // integration preserved for real write-back via Edit actions.
  const memberName = profile?.name || 'Alex Morgan';
  const memberEmail = user?.email || profile?.email || 'alex.morgan@example.com';
  const avatarLetter = memberName.slice(0, 1).toUpperCase();
  const memberSince = useMemo(
    () => 'April 3, 2026',
    [],
  );

  // Toggle states — write-back would hook into existing settings APIs.
  const [toggles, setToggles] = useState({
    shareConsultants: false,
    trainingOptOut: false,
    milestoneRecaps: true,
    newLensSuggestions: true,
    sessionReminders: true,
    productUpdates: false,
  });
  const toggle = (k: keyof typeof toggles) =>
    setToggles((prev) => ({ ...prev, [k]: !prev[k] }));

  return (
    <div className="v1-scope" style={{ minHeight: '100vh', background: V1.bg }}>
      <SEO page="nexus" />
      <style>{`
        /* ── V4 page transitions: fade + 4px Y shift, 0.2s ease ── */
        @keyframes st-reveal { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .st-enter { animation: st-reveal ${REVEAL_MS}ms ${EASE_OUT} both; }
        @keyframes st-reveal-delay { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .st-enter-d1 { animation: st-reveal-delay ${REVEAL_MS}ms ${EASE_OUT} 80ms both; }
        .st-enter-d2 { animation: st-reveal-delay ${REVEAL_MS}ms ${EASE_OUT} 160ms both; }
        /* ── Progress bar fill: simple width grow ── */
        @keyframes st-fill { from { width: 0%; } }
        .st-progress-fill { animation: st-fill 500ms ${EASE_OUT} both; }
        /* ── Accessibility: V4-specified TEAL focus ring (not fuchsia) scoped ── */
        .v1-scope :focus-visible {
          outline: 2px solid ${V1.teal600} !important;
          outline-offset: 2px;
          border-radius: 0;
        }
        /* ── Micro-interactions: subtle bg shift 0.15s, NO shadow/lift ── */
        .v1-scope .v1-btn {
          transition: background ${V1.durFast}ms ${EASE_OUT},
                      color ${V1.durFast}ms ${EASE_OUT},
                      border-color ${V1.durFast}ms ${EASE_OUT};
        }
        .v1-scope .v1-btn-secondary:hover {
          background: ${V1.ink50};
          color: ${V1.teal800};
          border-color: ${V1.teal600};
        }
        .v1-scope [role="tab"]:focus-visible { outline-offset: 4px; }
        /* ── Card hover: border color shift only (no shadow, no lift) ── */
        .v1-scope .v1-card-hover {
          transition: border-color ${V1.durFast}ms ${EASE_OUT},
                      background ${V1.durFast}ms ${EASE_OUT};
        }
        .v1-scope .v1-card-hover:hover {
          border-color: ${V1.teal600};
          background: ${V1.cream};
        }
        /* ── Option chip / sidebar link micro hover ── */
        .v1-scope .v1-sidebar-link {
          transition: color ${V1.durFast}ms ${EASE_OUT},
                      background ${V1.durFast}ms ${EASE_OUT},
                      border-left-color ${V1.durFast}ms ${EASE_OUT};
        }
        .v1-scope .v1-sidebar-link:hover:not(.v1-active) {
          color: ${V1.teal700};
          background: ${V1.ink50};
        }
        /* ── Responsive: tablet (≤1100px) right rail collapses already handled
              by v1-appshell @ 1024px in index.css. On mobile, touch ≥44px. ── */
        @media (max-width: 768px) {
          .v1-scope .v1-btn,
          .v1-scope button[role="tab"],
          .v1-scope input[type="checkbox"] + span,
          .v1-scope label[aria-label="Toggle switch"] {
            min-height: 44px;
            min-width: 44px;
          }
          .v1-scope button[role="tab"] { padding: 14px 16px; }
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
              <Link to="/nexus/insights" className="v1-sidebar-link">Insights</Link>
              <Link to="/app/documents" className="v1-sidebar-link">Documents</Link>
            </div>
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Depth</div>
              {['Positioning', 'Influence', 'Transition', 'Enterprise China'].map((area) => (
                <Link
                  to="/nexus/lenses"
                  key={area}
                  className="v1-sidebar-link"
                >
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
              <Link to="/nexus/settings" className="v1-sidebar-link v1-active">Settings</Link>
              <Link to="/app/billing" className="v1-sidebar-link">Billing</Link>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="v1-appshell-main" id="main-content" tabIndex={-1}>
          <div style={{ padding: V1.shellPad, maxWidth: V1.contentMax, width: '100%' }}>
            {/* ═══ Page header + tabs ═══ */}
            <div className="st-enter" style={{ marginBottom: V1.shellPad }}>
              <div className="v1-eyebrow" style={{ marginBottom: 8 }}>Account</div>
              <h1
                className="v1-display"
                style={{
                  fontSize: V1.textH1,
                  margin: '0 0 24px',
                  letterSpacing: V1.trackingTight,
                  lineHeight: V1.leadingDisplay,
                  fontFamily: V1.displayFont,
                  color: V1.text,
                  fontWeight: V1.fwRegular,
                }}
              >
                Settings
              </h1>

              {/* Tab navigation */}
              <div
                role="tablist"
                aria-label="Settings categories"
                style={{
                  display: 'flex',
                  borderBottom: `1px solid ${V1.borderStrong}`,
                  gap: 0,
                }}
              >
                {TABS.map((t) => {
                  const active = activeTab === t.key;
                  return (
                    <button
                      key={t.key}
                      role="tab"
                      aria-selected={active}
                      tabIndex={active ? 0 : -1}
                      onClick={() => setActiveTab(t.key)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '12px 18px',
                        marginBottom: -1,
                        borderBottom: active
                          ? `2px solid ${V1.teal600}`
                          : '2px solid transparent',
                        fontFamily: active ? V1.bodyFont : V1.bodyFont,
                        fontSize: V1.textBodySm,
                        color: active ? V1.text : V1.textSecondary,
                        fontWeight: active ? V1.fwSemibold : V1.fwMedium,
                        cursor: 'pointer',
                        letterSpacing: active ? undefined : undefined,
                        transition: `color ${V1.durFast}ms ${V1.ease}, border-color ${V1.durFast}ms ${V1.ease}`,
                      }}
                      onMouseEnter={(e) =>
                        !active && (e.currentTarget.style.color = V1.text)
                      }
                      onMouseLeave={(e) =>
                        !active && (e.currentTarget.style.color = V1.textSecondary)
                      }
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ═══ Tab bodies ═══ */}
            <div className="st-enter" role="tabpanel">
              {activeTab === 'profile' && <ProfileTab />}
              {activeTab === 'privacy' && <PrivacyTab toggles={toggles} onToggle={toggle} />}
              {activeTab === 'plan' && <PlanTab onNavigate={navigate} />}
              {activeTab === 'notifications' && <NotificationsTab toggles={toggles} onToggle={toggle} />}
              {activeTab === 'personas' && (
                <Suspense fallback={<div className="v1-mono" style={{ padding: 24, color: V1.textDim }}>Loading personas →</div>}>
                  <PersonasSettingsTab />
                </Suspense>
              )}
            </div>
          </div>
        </main>

        {/* ── RIGHT RAIL ── */}
        <aside className="v1-appshell-col" aria-label="Account summary panel">
          <div className="v1-sidebar-sticky">
            {/* 1. Profile card — centered */}
            <div className="v1-sidebar-section">
              <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
                <span
                  className="v1-avatar v1-avatar-lg"
                  style={{
                    display: 'inline-flex',
                    margin: '0 auto 12px',
                    width: 72,
                    height: 72,
                    fontSize: 28,
                    background: V1.teal900,
                    color: V1.white,
                    fontFamily: V1.displayFont,
                    fontWeight: V1.fwSemibold,
                  }}
                  aria-hidden="true"
                >
                  {avatarLetter}
                </span>
                <div
                  style={{
                    fontFamily: V1.displayFont,
                    fontSize: 20,
                    color: V1.text,
                    lineHeight: 1.3,
                    marginBottom: 2,
                  }}
                >
                  {memberName}
                </div>
                <div
                  style={{
                    fontFamily: V1.bodyFont,
                    fontSize: V1.textBodySm,
                    color: V1.textSecondary,
                    wordBreak: 'break-word',
                  }}
                >
                  {memberEmail}
                </div>
              </div>
            </div>

            {/* 2. Your account — data summary list */}
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Your account</div>
              <dl
                style={{
                  margin: '8px 0 0',
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <SummaryRow label="Plan" value="Professional" />
                <SummaryRow label="Miles" value="148 mi" />
                <SummaryRow label="Coaching" value="14 hrs / Silver" />
                <SummaryRow label="Lenses" value="3 of 11 taken" />
                <SummaryRow label="Milestones" value="7 in motion" />
                <SummaryRow label="Member since" value={memberSince} />
              </dl>
            </div>

            {/* 3. Security badge — teal border, "End-to-end encrypted" */}
            <div className="v1-sidebar-section">
              <div
                style={{
                  border: `1px solid ${V1.teal600}`,
                  padding: 18,
                  background: `${V1.teal50}40`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                    marginBottom: 6,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      color: V1.teal700,
                      marginTop: 2,
                      flexShrink: 0,
                      fontSize: 14,
                      lineHeight: 1,
                    }}
                  >
                    ◆
                  </span>
                  <div
                    style={{
                      fontFamily: V1.bodyFont,
                      fontSize: V1.textBodySm,
                      color: V1.teal900,
                      fontWeight: V1.fwSemibold,
                      lineHeight: 1.3,
                    }}
                  >
                    End-to-end encrypted
                  </div>
                </div>
                <p
                  style={{
                    fontFamily: V1.bodyFont,
                    fontSize: 12,
                    color: V1.textSecondary,
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  Conversation history, lens results, and working context are
                  encrypted at rest with keys scoped to your account. Session
                  notes from human coaching are stored separately and governed
                  by the coaching agreement.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Tabs
// ═══════════════════════════════════════════════════════════════════════

// ── Profile tab ──
function ProfileTab() {
  const rows = [
    {
      label: 'Name',
      description: 'How NEXUS and your coaches address you.',
      value: 'Alex Morgan',
    },
    {
      label: 'Email',
      description: 'Primary account contact and recovery email.',
      value: 'alex.morgan@example.com',
    },
    {
      label: 'Working context',
      description:
        'Role, company, geography — what NEXUS reads first when a thread starts.',
      value: 'VP Operations · SinoGlobal Tech · Singapore',
    },
    {
      label: 'Preferred language',
      description:
        'NEXUS responds in this language. Coaching sessions can be booked separately in other languages.',
      value: 'English (UK)',
    },
  ];

  return (
    <div aria-label="Profile settings">
      {rows.map((row, i) => (
        <div
          key={row.label}
          style={{
            display: 'grid',
            gridTemplateColumns: '200px 1fr 100px',
            alignItems: 'flex-start',
            gap: 16,
            padding: '20px 0',
            borderBottom:
              i < rows.length - 1 ? `1px solid ${V1.borderSubtle}` : undefined,
          }}
        >
          {/* Label + description */}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: V1.bodyFont,
                fontSize: V1.textBodySm,
                color: V1.text,
                fontWeight: V1.fwSemibold,
                marginBottom: 4,
              }}
            >
              {row.label}
            </div>
            <div
              style={{
                fontFamily: V1.bodyFont,
                fontSize: 13,
                color: V1.textMuted,
                lineHeight: 1.45,
              }}
            >
              {row.description}
            </div>
          </div>

          {/* Value */}
          <div
            style={{
              fontFamily: V1.bodyFont,
              fontSize: V1.textBodySm,
              color: V1.text,
              paddingTop: 0,
              wordBreak: 'break-word',
            }}
          >
            {row.value}
          </div>

          {/* Edit link */}
          <div style={{ textAlign: 'right' }}>
            <Link
              to="/app/profile"
              style={{
                fontFamily: V1.bodyFont,
                fontSize: V1.textBodySm,
                color: V1.teal700,
                textDecoration: 'none',
                fontWeight: V1.fwMedium,
                whiteSpace: 'nowrap',
              }}
            >
              Edit
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Privacy tab ──
function PrivacyTab({
  toggles,
  onToggle,
}: {
  toggles: { shareConsultants: boolean; trainingOptOut: boolean };
  onToggle: (k: 'shareConsultants' | 'trainingOptOut') => void;
}) {
  return (
    <div aria-label="Privacy settings" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Conversation storage — info display */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr 100px',
          alignItems: 'flex-start',
          gap: 16,
          padding: '20px 0',
          borderBottom: `1px solid ${V1.borderSubtle}`,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: V1.bodyFont,
              fontSize: V1.textBodySm,
              color: V1.text,
              fontWeight: V1.fwSemibold,
              marginBottom: 4,
            }}
          >
            Conversation storage
          </div>
          <div
            style={{
              fontFamily: V1.bodyFont,
              fontSize: 13,
              color: V1.textMuted,
              lineHeight: 1.45,
            }}
          >
            How long NEXUS remembers prior threads. Governed by your plan tier.
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: V1.bodyFont,
              fontSize: V1.textBodySm,
              color: V1.text,
              marginBottom: 6,
            }}
          >
            180-day rolling window
          </div>
          <div
            className="v1-mono"
            style={{
              fontSize: 10.5,
              color: V1.teal700,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span aria-hidden="true" style={{ color: V1.teal600 }}>◆</span>
            End-to-end encrypted
          </div>
        </div>
      </div>

      {/* Share with consultants — toggle */}
      <ToggleRow
        label="Share with consultants"
        description="Allow assigned LYC consultants to read your milestones and lens summaries when working together on a mandate. Never shared with third parties."
        checked={toggles.shareConsultants}
        onChange={() => onToggle('shareConsultants')}
      />

      {/* Training opt-out — toggle */}
      <ToggleRow
        label="Training opt-out"
        description="By default your anonymized patterns help improve the quality of non-personalized recommendations. Exclude my data from model training."
        checked={toggles.trainingOptOut}
        onChange={() => onToggle('trainingOptOut')}
        invertLabel
      />

      {/* Action links row */}
      <div
        style={{
          padding: '20px 0',
          borderTop: `1px solid ${V1.borderSubtle}`,
          marginTop: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <Link
          to="#"
          className="v1-btn v1-btn-link"
          style={{ padding: 0, minHeight: 'auto', fontSize: 14 }}
          onClick={(e) => e.preventDefault()}
        >
          Export my data <span aria-hidden="true">→</span>
        </Link>
        <Link
          to="#"
          className="v1-btn v1-btn-link"
          style={{
            padding: 0,
            minHeight: 'auto',
            fontSize: 14,
            color: V1.textMuted,
          }}
          onClick={(e) => e.preventDefault()}
        >
          Delete my account
        </Link>
      </div>
    </div>
  );
}

// ── Plan tab ──
function PlanTab({ onNavigate }: { onNavigate: (to: string) => void }) {
  // Usage stats
  const usageMiles = { used: 22, total: 150, label: 'Mile balance' };
  const usageLenses = { used: 3, total: 11, label: 'Lenses completed' };
  const usageCoaching = { used: 6, total: 20, label: 'Coaching hours' };

  return (
    <div aria-label="Plan & usage" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Current plan card */}
      <div
        style={{
          border: `1px solid ${V1.border}`,
          padding: 22,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              className="v1-mono"
              style={{
                fontSize: 11.2,
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                color: V1.teal700,
                marginBottom: 6,
              }}
            >
              Current plan
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontFamily: V1.displayFont,
                  fontSize: 30,
                  color: V1.text,
                  lineHeight: 1.05,
                  fontWeight: V1.fwRegular,
                }}
              >
                Professional
              </span>
              <span
                style={{
                  fontFamily: V1.bodyFont,
                  fontSize: 16,
                  color: V1.textSecondary,
                }}
              >
                $99 / month
              </span>
            </div>
            <div
              className="v1-mono"
              style={{
                fontSize: 10.5,
                color: V1.textMuted,
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
              }}
            >
              Active · next billing Aug 1, 2026
            </div>
          </div>
          <button
            className="v1-btn v1-btn-secondary"
            style={{ minHeight: 40, fontSize: 13 }}
            onClick={() => onNavigate('/pricing')}
          >
            Change plan <span aria-hidden="true">→</span>
          </button>
        </div>
        <hr className="v1-rule" style={{ margin: '16px 0' }} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 0,
            fontFamily: V1.bodyFont,
            fontSize: V1.textBodySm,
            color: V1.textSecondary,
          }}
        >
          <div>
            <div
              className="v1-mono"
              style={{
                fontSize: 10.5,
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                color: V1.textMuted,
                marginBottom: 4,
              }}
            >
              Miles
            </div>
            150 mi / month · rollover
          </div>
          <div>
            <div
              className="v1-mono"
              style={{
                fontSize: 10.5,
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                color: V1.textMuted,
                marginBottom: 4,
              }}
            >
              Memory
            </div>
            180-day conversation window
          </div>
          <div>
            <div
              className="v1-mono"
              style={{
                fontSize: 10.5,
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                color: V1.textMuted,
                marginBottom: 4,
              }}
            >
              Sessions
            </div>
            20% debrief discount
          </div>
        </div>
      </div>

      {/* Human Depth add-on card — fuchsia left border */}
      <div
        style={{
          border: `1px solid ${V1.border}`,
          borderLeft: `4px solid ${V1.fuchsia600}`,
          padding: 22,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              className="v1-mono"
              style={{
                fontSize: 11.2,
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                color: V1.fuchsia600,
                marginBottom: 6,
              }}
            >
              Human Depth · Add-on
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontFamily: V1.displayFont,
                  fontSize: 22,
                  color: V1.text,
                  lineHeight: 1.1,
                  fontWeight: V1.fwRegular,
                }}
              >
                Silver coaching package
              </span>
            </div>
            <div
              style={{
                fontFamily: V1.bodyFont,
                fontSize: V1.textBodySm,
                color: V1.textSecondary,
                margin: 0,
                lineHeight: V1.leadingBody,
                maxWidth: 480,
              }}
            >
              20 coaching hours across any coach · 14 hrs remaining · renews Aug 1, 2026.
            </div>
          </div>
          <button
            className="v1-btn v1-btn-secondary"
            style={{
              minHeight: 40,
              fontSize: 13,
              borderColor: V1.fuchsia600,
              color: V1.fuchsia600,
            }}
            onClick={() => onNavigate('/nexus/coaching')}
          >
            Manage <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      {/* Usage bars */}
      <div
        aria-label="Usage breakdown"
        style={{
          border: `1px solid ${V1.border}`,
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <UsageBar
          label={usageMiles.label}
          used={usageMiles.used}
          total={usageMiles.total}
          suffix=" mi"
          color={V1.teal600}
        />
        <UsageBar
          label={usageLenses.label}
          used={usageLenses.used}
          total={usageLenses.total}
          suffix=" lenses"
          color={V1.teal600}
        />
        <UsageBar
          label={usageCoaching.label}
          used={usageCoaching.used}
          total={usageCoaching.total}
          suffix=" hrs"
          color={V1.fuchsia600}
          accent
        />
      </div>
    </div>
  );
}

// ── Notifications tab ──
function NotificationsTab({
  toggles,
  onToggle,
}: {
  toggles: {
    milestoneRecaps: boolean;
    newLensSuggestions: boolean;
    sessionReminders: boolean;
    productUpdates: boolean;
  };
  onToggle: (
    k:
      | 'milestoneRecaps'
      | 'newLensSuggestions'
      | 'sessionReminders'
      | 'productUpdates',
  ) => void;
}) {
  return (
    <div aria-label="Notification settings" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <ToggleRow
        label="Milestone recaps"
        description="Weekly digest email. What moved, what didn't, and what NEXUS recommends next. Sent on Monday mornings, your timezone."
        checked={toggles.milestoneRecaps}
        onChange={() => onToggle('milestoneRecaps')}
      />
      <ToggleRow
        label="New lens suggestions"
        description="NEXUS emails when a new lens would sharpen a conversation milestone. At most 1–2 per month."
        checked={toggles.newLensSuggestions}
        onChange={() => onToggle('newLensSuggestions')}
      />
      <ToggleRow
        label="Session reminders"
        description="Calendar + email reminders 48 hours and 2 hours before each coaching session, plus the NEXUS prep brief."
        checked={toggles.sessionReminders}
        onChange={() => onToggle('sessionReminders')}
      />
      <ToggleRow
        label="Product updates"
        description="Major changes to NEXUS, new lenses, and Human Depth practice notes. About 1 email every 2 months."
        checked={toggles.productUpdates}
        onChange={() => onToggle('productUpdates')}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Reusable row components
// ═══════════════════════════════════════════════════════════════════════

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  invertLabel,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  invertLabel?: boolean;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr 100px',
        alignItems: 'center',
        gap: 16,
        padding: '20px 0',
        borderBottom: `1px solid ${V1.borderSubtle}`,
      }}
    >
      <div style={{ alignSelf: 'flex-start', paddingTop: 2 }}>
        <div
          style={{
            fontFamily: V1.bodyFont,
            fontSize: V1.textBodySm,
            color: V1.text,
            fontWeight: V1.fwSemibold,
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        {invertLabel && checked && (
          <div
            className="v1-mono"
            style={{
              fontSize: 10.5,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: V1.fuchsia600,
            }}
          >
            Opted out
          </div>
        )}
      </div>
      <div
        style={{
          fontFamily: V1.bodyFont,
          fontSize: 13,
          color: V1.textMuted,
          lineHeight: 1.45,
        }}
      >
        {description}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SquareToggle checked={checked} onChange={onChange} />
      </div>
    </div>
  );
}

// V1 design: square toggle (not rounded). Checked = teal fill + square
// check indicator (not circle knob).
function SquareToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      style={{
        display: 'inline-block',
        position: 'relative',
        width: 44,
        height: 24,
        cursor: 'pointer',
        userSelect: 'none',
      }}
      aria-label="Toggle switch"
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
        }}
      />
      {/* Track — square, 0 radius */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: checked ? V1.teal600 : V1.ink200,
          transition: `background ${V1.durFast}ms ${V1.ease}`,
        }}
      />
      {/* Knob — square, slides inside the track */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 2,
          left: 2,
          width: 20,
          height: 20,
          background: checked ? V1.white : V1.ink500,
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
          transition: `transform ${V1.durFast}ms ${V1.ease}, background ${V1.durFast}ms ${V1.ease}`,
        }}
      />
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 8,
      }}
    >
      <dt
        className="v1-mono"
        style={{
          fontSize: 10.5,
          color: V1.textMuted,
          letterSpacing: V1.trackingMono,
          textTransform: 'uppercase',
          flexShrink: 0,
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          margin: 0,
          fontFamily: V1.bodyFont,
          fontSize: V1.textBodySm,
          color: V1.text,
          fontWeight: V1.fwMedium,
          textAlign: 'right',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </dd>
    </div>
  );
}

function UsageBar({
  label,
  used,
  total,
  suffix,
  color,
  accent,
}: {
  label: string;
  used: number;
  total: number;
  suffix: string;
  color: string;
  accent?: boolean;
}) {
  const pct = Math.round((used / total) * 100);
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: V1.bodyFont,
            fontSize: V1.textBodySm,
            color: V1.text,
            fontWeight: V1.fwMedium,
          }}
        >
          {label}
        </span>
        <span
          className="v1-mono"
          style={{
            fontSize: 11.2,
            letterSpacing: V1.trackingMono,
            textTransform: 'uppercase',
            color: accent ? V1.fuchsia600 : V1.textMuted,
          }}
        >
          {used} / {total}
          {suffix}
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: V1.borderSubtle,
          overflow: 'hidden',
        }}
      >
        <div
          className="st-progress-fill"
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}
