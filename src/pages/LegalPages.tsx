/**
 * V4.5.7 — LEGAL PAGES (V1 re-skin)
 *
 * Routes: /terms, /privacy, /cookies
 *
 * Marketing layout, light mode.
 *  - Header: wordmark + nav (minimal)
 *  - Mono eyebrow: page title (e.g. "Terms of Service")
 *  - Display title
 *  - Body content (existing legal text — unchanged)
 *  - Proper heading hierarchy (h1 → h2)
 *  - Minimal footer
 *
 * V1 rules: 0px radius, no shadows, cream background, serif display, mono
 * labels, teal primary. Text labels for status (no red/green backgrounds).
 * Privacy actions panel: bordered boxes, no spinner, no destructive-red chrome.
 *
 * All legal content, GDPR/PIPL rights text, third-party processors, PRC
 * governing law, and self-service export/delete logic stays the same.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authFetch } from '@/utils/authFetch';
import { SEO } from '@/components/seo/SEO';
import { V1 } from '@/styles/v1-tokens';

interface Section {
  heading: string;
  body: React.ReactNode;
}

const LEGAL_NAV = [
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/cookies', label: 'Cookies' },
];

function LegalLayout({ title, eyebrow, intro, sections, lastUpdated, actions }: {
  title: string;
  eyebrow: string;
  intro: string;
  sections: Section[];
  lastUpdated: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="v1-scope" style={{ minHeight: '100vh', background: V1.bg, color: V1.text }}>
      <style>{`
        @keyframes v1-fade-up { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .v1-enter { animation: v1-fade-up ${V1.durNormal}ms ${V1.ease} both; }
        .v1-prose p, .v1-prose li { font-family: ${V1.bodyFont}; font-size: ${V1.textBodySm}px; line-height: 1.65; color: ${V1.textSecondary}; }
        .v1-prose ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .v1-prose strong { color: ${V1.text}; font-weight: ${V1.fwSemibold}; }
        .v1-prose a { color: ${V1.teal700}; text-decoration: none; border-bottom: 1px solid ${V1.teal600}; padding-bottom: 1px; }
      `}</style>

      {/* ── Minimal header: wordmark + nav (Terms / Privacy / Cookies) ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `20px ${V1.shellPad}px`,
        background: V1.bg, borderBottom: `1px solid ${V1.border}`,
      }}>
        <Link to="/" className="v1-wordmark" aria-label="NEXUS home">
          NEXUS<span className="v1-dot">.</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {LEGAL_NAV.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className="v1-mono"
              style={{
                fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
                textTransform: 'uppercase', color: item.label === eyebrow ? V1.text : V1.textMuted,
                textDecoration: 'none',
                borderBottom: item.label === eyebrow ? `1px solid ${V1.text}` : '1px solid transparent',
                paddingBottom: 2,
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="v1-enter" style={{
        maxWidth: 760, margin: '0 auto',
        padding: `${V1.marketingPadY}px 24px ${V1.marketingPadYSm}px`,
      }}>
        {/* Back link */}
        <Link to="/" className="v1-mono" style={{
          display: 'inline-block', marginBottom: 32,
          fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
          textTransform: 'uppercase', color: V1.textMuted, textDecoration: 'none',
          borderBottom: `1px solid ${V1.border}`, paddingBottom: 2,
          transition: `border-color ${V1.durFast}ms ${V1.ease}, color ${V1.durFast}ms ${V1.ease}`,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = V1.teal600; e.currentTarget.style.color = V1.teal700; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = V1.border; e.currentTarget.style.color = V1.textMuted; }}>
          ← Back to home
        </Link>

        {/* Mono eyebrow — page title */}
        <div className="v1-mono" style={{
          fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
          textTransform: 'uppercase', color: V1.textMuted, marginBottom: 12,
        }}>
          {eyebrow}
        </div>

        {/* Display title */}
        <h1 style={{
          fontFamily: V1.displayFont, fontSize: V1.textH1, color: V1.text,
          fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
          lineHeight: V1.leadingDisplay, margin: '0 0 8px',
        }}>
          {title}
        </h1>

        {/* Last updated + intro */}
        <div className="v1-mono" style={{
          fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
          textTransform: 'uppercase', color: V1.textDim, marginBottom: 24,
        }}>
          Last updated · {lastUpdated}
        </div>
        <p className="v1-prose" style={{
          fontSize: V1.textBody, lineHeight: 1.6, color: V1.textSecondary,
          margin: '0 0 48px',
        }}>
          {intro}
        </p>

        {/* Sections — proper heading hierarchy */}
        <div style={{
          borderTop: `1px solid ${V1.border}`,
        }}>
          {sections.map((s, i) => (
            <section key={i} style={{
              padding: '32px 0',
              borderBottom: `1px solid ${V1.borderSubtle}`,
            }}>
              <h2 style={{
                fontFamily: V1.displayFont, fontSize: V1.textH3, color: V1.text,
                fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
                lineHeight: V1.leadingHeading, margin: '0 0 16px',
                display: 'flex', alignItems: 'baseline', gap: 12,
              }}>
                <span className="v1-mono" style={{
                  fontSize: V1.textCaption, color: V1.textDim,
                  letterSpacing: V1.trackingMono, fontWeight: V1.fwSemibold,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{s.heading}</span>
              </h2>
              <div className="v1-prose">{s.body}</div>
            </section>
          ))}
        </div>

        {/* Optional actions (privacy export/delete panel) */}
        {actions}

        {/* Footer — minimal */}
        <footer style={{
          marginTop: 64, paddingTop: 24, borderTop: `1px solid ${V1.border}`,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div className="v1-mono" style={{
            fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
            textTransform: 'uppercase', color: V1.textMuted,
          }}>
            LYC Partners Shanghai
          </div>
          <div style={{
            fontFamily: V1.bodyFont, fontSize: V1.textCaption, color: V1.textDim, lineHeight: 1.5,
          }}>
            For questions about this policy, contact{' '}
            <a href="mailto:legal@lyc-intelligence.app" style={{
              color: V1.teal700, textDecoration: 'none',
              borderBottom: `1px solid ${V1.teal600}`, paddingBottom: 1,
            }}>legal@lyc-intelligence.app</a>.
          </div>
        </footer>
      </main>
    </div>
  );
}

// ── Terms of Service ──
export function TermsPage() {
  const sections: Section[] = [
    {
      heading: 'Service Description',
      body: <p>LYC Intelligence ("the Service") is an executive intelligence service operated by LYC Partners Shanghai, providing AI-powered advisory (LYC Intelligence), candidate-client matching, assessment tools, and coaching services for China-APAC executives and the organizations that hire them.</p>,
    },
    {
      heading: 'User Accounts',
      body: <p>You must provide accurate information when creating an account and are responsible for safeguarding your credentials. We reserve the right to suspend accounts that violate these terms or applicable law.</p>,
    },
    {
      heading: 'Miles & Payment',
      body: <p>The Service uses a miles-based system. Your "Executive Introduction" provides 5 complimentary messages. Additional miles may be purchased. Miles are non-refundable except where required by law and do not expire unless stated otherwise at purchase. Council memberships are billed as subscriptions and may be cancelled per their terms.</p>,
    },
    {
      heading: 'AI Disclaimer',
      body: <p>LYC Intelligence responses are generated by language models and constitute advisory guidance only. They are not legal, financial, or investment advice. You should consult qualified professionals before making decisions based on AI output. We do not guarantee the accuracy or completeness of AI-generated content.</p>,
    },
    {
      heading: 'Intellectual Property',
      body: <p>All platform content, software, and branding are the property of LYC Partners or its licensors. You retain rights to content you submit (e.g., assessment answers, resumes) and grant us a license to process it solely to provide the Service.</p>,
    },
    {
      heading: 'Acceptable Use',
      body: <p>You agree not to misuse the Service, including reverse-engineering, scraping data, transmitting malware, or using the Service for unlawful purposes. Candidate and client data must be handled in compliance with applicable privacy laws.</p>,
    },
    {
      heading: 'Limitation of Liability',
      body: <p>To the maximum extent permitted by law, LYC Partners' total liability for any claim arising from the Service is limited to the amount you paid in the preceding 12 months, or the miles purchased, whichever is greater. We are not liable for indirect or consequential damages.</p>,
    },
    {
      heading: 'Governing Law & Dispute Resolution',
      body: <p>These terms are governed by the laws of the People's Republic of China (PRC). Any dispute shall first be resolved through good-faith negotiation. If unresolved within 30 days, the dispute shall be submitted to the Shanghai International Economic and Trade Arbitration Commission (SHIAC) for arbitration in Shanghai in accordance with its rules.</p>,
    },
    {
      heading: 'Changes',
      body: <p>We may update these terms. Material changes will be notified via email or in-app notice. Continued use after the effective date constitutes acceptance.</p>,
    },
  ];
  return (
    <>
      <SEO page="terms" />
      <LegalLayout
        title="Terms of Service"
        eyebrow="Terms"
        intro="These Terms govern your use of LYC Intelligence. By accessing or using the Service, you agree to be bound by these Terms."
        sections={sections}
        lastUpdated="August 4, 2026"
      />
    </>
  );
}

// ── Privacy Policy ──
export function PrivacyPage() {
  const sections: Section[] = [
    {
      heading: 'Data Controller',
      body: <p>LYC Partners Shanghai is the data controller responsible for your personal data. Contact us at <a href="mailto:privacy@lyc-intelligence.app">privacy@lyc-intelligence.app</a> for privacy inquiries.</p>,
    },
    {
      heading: 'Data We Collect',
      body: (
        <ul>
          <li><strong>Account data:</strong> name, email, password (hashed), role, organization.</li>
          <li><strong>Profile data:</strong> title, company, industry, seniority, location, resume.</li>
          <li><strong>Activity data:</strong> assessment answers, chat history, applications, bookings.</li>
          <li><strong>Usage data:</strong> device, browser, IP address, pages visited (via cookies).</li>
        </ul>
      ),
    },
    {
      heading: 'Purpose of Processing',
      body: <p>We process your data to provide the Service (matching, advisory, assessments), to operate and improve the platform, to communicate with you, to process payments, and to comply with legal obligations.</p>,
    },
    {
      heading: 'Third-Party Processors',
      body: (
        <ul>
          <li><strong>Supabase</strong> — database, authentication, and file storage (Netherlands).</li>
          <li><strong>DeepSeek</strong> — AI language model processing for LYC Intelligence responses.</li>
          <li><strong>Stripe</strong> — payment processing (PCI-DSS compliant).</li>
          <li><strong>Vercel</strong> — application hosting and content delivery.</li>
        </ul>
      ),
    },
    {
      heading: 'Cross-Border Transfers',
      body: <p>Your data may be processed outside your country of residence, including in the EU, the United States, and the PRC. We rely on appropriate safeguards (e.g., standard contractual clauses) and comply with PRC Personal Information Protection Law (PIPL) cross-border transfer requirements where applicable.</p>,
    },
    {
      heading: 'Retention',
      body: <p>We retain personal data only as long as necessary for the purposes described or as required by law. Account data is retained while your account is active. You may request deletion; deletion is completed within 30 days, subject to legal retention obligations.</p>,
    },
    {
      heading: 'Your Rights (GDPR / PIPL)',
      body: (
        <ul>
          <li>Access, correct, or delete your personal data.</li>
          <li>Restrict or object to processing.</li>
          <li>Data portability (receive your data in a structured format).</li>
          <li>Withdraw consent at any time (without affecting prior processing).</li>
          <li>Lodge a complaint with your local data protection authority.</li>
        </ul>
      ),
    },
    {
      heading: 'Data Export & Deletion',
      body: <p>To exercise your rights, contact <a href="mailto:privacy@lyc-intelligence.app">privacy@lyc-intelligence.app</a>. We will respond within 30 days. Account deletion initiates a soft delete followed by a hard delete after 30 days.</p>,
    },
    {
      heading: 'Security',
      body: <p>We use industry-standard measures including encryption in transit (TLS) and at rest, row-level security, and access controls. No method of transmission is 100% secure, but we work to protect your data.</p>,
    },
  ];
  return (
    <>
      <SEO page="privacy" />
      <LegalLayout
        title="Privacy Policy"
        eyebrow="Privacy"
        intro="This Privacy Policy explains how LYC Partners Shanghai collects, uses, and protects your personal data when you use LYC Intelligence."
        sections={sections}
        lastUpdated="August 4, 2026"
        actions={<PrivacyActionsPanel />}
      />
    </>
  );
}

// ── Cookie Policy ──
export function CookiesPage() {
  const sections: Section[] = [
    {
      heading: 'What Are Cookies',
      body: <p>Cookies are small text files stored on your device when you visit a website. They help the site function and remember your preferences. We use two categories of cookies on LYC Intelligence.</p>,
    },
    {
      heading: 'Essential Cookies',
      body: <p>These are necessary for the Service to function. They enable authentication, session management, and security. Essential cookies cannot be disabled.</p>,
    },
    {
      heading: 'Analytics Cookies',
      body: <p>These help us understand how visitors use the site so we can improve it. They collect aggregated, anonymized usage data. Analytics cookies are only set after you consent via the cookie banner.</p>,
    },
    {
      heading: 'Consent',
      body: <p>On your first visit, a banner asks you to accept or reject non-essential cookies. Your choice is stored in your browser's local storage. You can change your choice at any time by clearing your browser storage or contacting us.</p>,
    },
    {
      heading: 'Managing Cookies',
      body: <p>You can also control cookies through your browser settings. Note that disabling essential cookies may prevent the Service from working correctly.</p>,
    },
    {
      heading: 'Third-Party Cookies',
      body: <p>Our third-party processors (Supabase, Stripe, Vercel) may set their own cookies as part of their services. These are governed by their respective privacy policies.</p>,
    },
  ];
  return (
    <>
      <SEO page="cookies" />
      <LegalLayout
        title="Cookie Policy"
        eyebrow="Cookies"
        intro="This policy explains how LYC Intelligence uses cookies and similar technologies, and how you can control them."
        sections={sections}
        lastUpdated="August 4, 2026"
      />
    </>
  );
}

export default LegalLayout;

// ── Self-service privacy actions (data export + account deletion) ──
// V1 re-skin: bordered boxes, text labels for status (no red/green backgrounds),
// no spinner — V1 uses skeleton/disabled state on the button itself.
function PrivacyActionsPanel() {
  const user = useAuthStore(s => s.user);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExport = async () => {
    setError(null);
    setSuccess(null);
    setExporting(true);
    try {
      const res = await authFetch('/api/user/data-export', { method: 'GET' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const payload = await res.json();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lyc-personal-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess('Your data export has been downloaded.');
    } catch (err: any) {
      setError(err?.message || 'Could not export your data right now.');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setSuccess(null);
    setDeleting(true);
    try {
      const res = await authFetch('/api/user/delete', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      setSuccess(body.message || 'Account deletion scheduled. Personal data will be removed within 30 days.');
      setConfirming(false);
    } catch (err: any) {
      setError(err?.message || 'Could not complete deletion request.');
    } finally {
      setDeleting(false);
    }
  };

  // Not signed in — nudge to login rather than showing dead buttons.
  if (!user) {
    return (
      <div style={{
        marginTop: 48, padding: 24,
        border: `1px solid ${V1.border}`, background: V1.surfaceAlt,
      }}>
        <div className="v1-mono" style={{
          fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
          textTransform: 'uppercase', color: V1.textMuted, marginBottom: 8,
        }}>
          Sign in required
        </div>
        <p style={{
          fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary,
          lineHeight: 1.55, margin: 0,
        }}>
          To download your personal data or request account deletion, please{' '}
          <Link to="/login" style={{
            color: V1.teal700, textDecoration: 'none',
            borderBottom: `1px solid ${V1.teal600}`, paddingBottom: 1,
          }}>sign in</Link>{' '}
          first. You may also email{' '}
          <a href="mailto:privacy@lyc-intelligence.app" style={{
            color: V1.teal700, textDecoration: 'none',
            borderBottom: `1px solid ${V1.teal600}`, paddingBottom: 1,
          }}>privacy@lyc-intelligence.app</a>.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: 48, padding: 24,
      border: `1px solid ${V1.border}`, background: V1.surface,
    }}>
      <div className="v1-mono" style={{
        fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
        textTransform: 'uppercase', color: V1.teal700, marginBottom: 8,
        fontWeight: V1.fwSemibold,
      }}>
        Exercise your rights
      </div>
      <p style={{
        fontFamily: V1.bodyFont, fontSize: V1.textCaption, color: V1.textMuted,
        lineHeight: 1.55, margin: '0 0 24px',
      }}>
        Download a copy of your personal data (right to portability) or request account deletion.
      </p>

      {/* Status — text labels, not color-coded backgrounds */}
      {error && (
        <div style={{
          marginBottom: 16, padding: '12px 16px',
          border: `1px solid ${V1.fuchsia600}`, background: V1.fuchsia50,
        }}>
          <div className="v1-mono" style={{
            fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
            textTransform: 'uppercase', color: V1.fuchsia700,
            fontWeight: V1.fwSemibold, marginBottom: 4,
          }}>
            Error
          </div>
          <div style={{
            fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.fuchsia700,
            lineHeight: 1.5,
          }}>
            {error}
          </div>
        </div>
      )}
      {success && (
        <div style={{
          marginBottom: 16, padding: '12px 16px',
          border: `1px solid ${V1.teal600}`, background: V1.teal50,
        }}>
          <div className="v1-mono" style={{
            fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
            textTransform: 'uppercase', color: V1.teal700,
            fontWeight: V1.fwSemibold, marginBottom: 4,
          }}>
            Done
          </div>
          <div style={{
            fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.teal700,
            lineHeight: 1.5,
          }}>
            {success}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || deleting}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            minHeight: 40, padding: '10px 18px',
            background: V1.teal800, color: V1.white,
            border: 'none', fontFamily: V1.bodyFont, fontSize: V1.textBodySm,
            fontWeight: V1.fwSemibold, cursor: exporting || deleting ? 'not-allowed' : 'pointer',
            opacity: exporting || deleting ? 0.6 : 1,
            transition: `background ${V1.durFast}ms ${V1.ease}`,
          }}
          onMouseEnter={(e) => { if (!exporting && !deleting) e.currentTarget.style.background = V1.teal900; }}
          onMouseLeave={(e) => { if (!exporting && !deleting) e.currentTarget.style.background = V1.teal800; }}
        >
          {exporting ? 'Preparing…' : 'Download my data ↓'}
        </button>

        {!confirming ? (
          <button
            type="button"
            onClick={() => { setConfirming(true); setError(null); setSuccess(null); }}
            disabled={exporting || deleting}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              minHeight: 40, padding: '10px 18px',
              background: 'transparent', color: V1.text,
              border: `1px solid ${V1.borderStrong}`, fontFamily: V1.bodyFont,
              fontSize: V1.textBodySm, fontWeight: V1.fwMedium,
              cursor: exporting || deleting ? 'not-allowed' : 'pointer',
              opacity: exporting || deleting ? 0.6 : 1,
              transition: `border-color ${V1.durFast}ms ${V1.ease}, color ${V1.durFast}ms ${V1.ease}`,
            }}
            onMouseEnter={(e) => { if (!exporting && !deleting) { e.currentTarget.style.borderColor = V1.fuchsia600; e.currentTarget.style.color = V1.fuchsia700; } }}
            onMouseLeave={(e) => { if (!exporting && !deleting) { e.currentTarget.style.borderColor = V1.borderStrong; e.currentTarget.style.color = V1.text; } }}
          >
            Delete my account
          </button>
        ) : (
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12,
            padding: '10px 16px', border: `1px solid ${V1.fuchsia600}`, background: V1.fuchsia50,
          }}>
            <span style={{
              fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.fuchsia700,
              fontWeight: V1.fwMedium,
            }}>
              This schedules permanent deletion in 30 days. Confirm?
            </span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                minHeight: 36, padding: '8px 16px',
                background: V1.fuchsia600, color: V1.white,
                border: 'none', fontFamily: V1.bodyFont, fontSize: V1.textBodySm,
                fontWeight: V1.fwSemibold, cursor: deleting ? 'not-allowed' : 'pointer',
                opacity: deleting ? 0.6 : 1,
                transition: `background ${V1.durFast}ms ${V1.ease}`,
              }}
              onMouseEnter={(e) => { if (!deleting) e.currentTarget.style.background = V1.fuchsia700; }}
              onMouseLeave={(e) => { if (!deleting) e.currentTarget.style.background = V1.fuchsia600; }}
            >
              {deleting ? 'Scheduling…' : 'Yes, delete'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={deleting}
              style={{
                minHeight: 36, padding: '8px 16px',
                background: 'transparent', color: V1.textSecondary,
                border: `1px solid ${V1.border}`, fontFamily: V1.bodyFont,
                fontSize: V1.textBodySm, fontWeight: V1.fwMedium,
                cursor: deleting ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
