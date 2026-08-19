/**
 * V4.5.1 — AUTH PAGE (Reset password / Set new password)
 *
 * Route: /reset-password
 *
 * Dual-mode: if arrived via PASSWORD_RECOVERY email link → "set new password"
 * form. Otherwise → "request reset link" form + confirmation screens.
 *
 * Centered card on cream background, marketing page layout (not app shell).
 * V1 line-art system: bordered card, no shadow, 0px radius, teal primary,
 * mono labels, serif display title, text symbols (no Lucide), editorial
 * success cards (no decorative checkmarks).
 *
 * Auth logic, validation, OAuth — all stay the same. 100% visual re-skin.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  validatePasswordStrength,
  passwordScoreLabel,
  passwordScoreColor,
} from '@/lib/auth/passwordPolicy';
import { V1 } from '@/styles/v1-tokens';

type Mode = 'request' | 'reset';

export function ResetPasswordPage() {
  // #1312: If we arrived via a recovery email link, Supabase fires a
  // PASSWORD_RECOVERY event and the authStore sets isPasswordRecovery=true.
  // In that case render the "set new password" form instead of the email
  // request form.
  const isPasswordRecovery = useAuthStore((s) => s.isPasswordRecovery);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const updatePassword = useAuthStore((s) => s.updatePassword);

  const mode: Mode = isPasswordRecovery ? 'reset' : 'request';

  // ── request-mode state ──
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  // ── reset-mode state ──
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updated, setUpdated] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Live password strength evaluation (reused from signup policy).
  const pwdStrength = useMemo(
    () => validatePasswordStrength(newPassword),
    [newPassword],
  );

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Email is required'); return; }

    setLoading(true);
    const result = await resetPassword(email.trim());
    setLoading(false);

    if (result.success) {
      // #1312: Always show the "check your email" confirmation, even if the
      // address doesn't exist on an account — prevents user enumeration.
      setSent(true);
    } else {
      setError(result.error || 'Failed to send reset link');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword) { setError('Password is required'); return; }
    // #1312: enforce the same NIST-aligned policy used at signup.
    if (!pwdStrength.passes) {
      setError(pwdStrength.warnings[0] || 'Please choose a stronger password');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await updatePassword(newPassword);
    setLoading(false);

    if (result.success) {
      setUpdated(true);
    } else {
      setError(result.error || 'Unable to update password');
    }
  };

  // ── Success screens ────────────────────────────────────────────────
  if (mode === 'request' && sent) {
    return (
      <Shell>
        <Center>
          <BrandMast />
          <PageTitle
            title="Check your email"
            sub="If an account exists, you'll receive a reset link shortly."
          />
          <Card>
            <div className="v1-mono" style={{
              fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
              textTransform: 'uppercase', color: V1.teal700,
              textAlign: 'center', marginBottom: 12,
            }}>
              Sent
            </div>
            <p style={{
              fontSize: V1.textBodySm, color: V1.text,
              fontFamily: V1.bodyFont, lineHeight: V1.leadingBody,
              textAlign: 'center', margin: 0,
            }}>
              If an account exists for <strong>{email}</strong>, a reset link is
              on its way. The link expires in 60 minutes for security.
            </p>
            <div style={{
              borderTop: `1px solid ${V1.dividerSubtle}`,
              marginTop: 24, paddingTop: 20, textAlign: 'center',
            }}>
              <Link to="/login" style={footerLinkStyle}>
                Return to login →
              </Link>
            </div>
          </Card>
        </Center>
      </Shell>
    );
  }

  if (mode === 'reset' && updated) {
    return (
      <Shell>
        <Center>
          <BrandMast />
          <PageTitle
            title="Password updated"
            sub="Your account is secured with your new password."
          />
          <Card>
            <div className="v1-mono" style={{
              fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
              textTransform: 'uppercase', color: V1.teal700,
              textAlign: 'center', marginBottom: 12,
            }}>
              Done
            </div>
            <p style={{
              fontSize: V1.textBodySm, color: V1.text,
              fontFamily: V1.bodyFont, lineHeight: V1.leadingBody,
              textAlign: 'center', margin: 0,
            }}>
              Your password has been updated successfully. You can now sign in
              with your new credentials.
            </p>
            <div style={{
              borderTop: `1px solid ${V1.dividerSubtle}`,
              marginTop: 24, paddingTop: 20, textAlign: 'center',
            }}>
              <Link to="/login" style={footerLinkStyle}>
                Continue to login →
              </Link>
            </div>
          </Card>
        </Center>
      </Shell>
    );
  }

  // ── Form screens ───────────────────────────────────────────────────
  return (
    <Shell>
      <Center>
        <BrandMast />
        <PageTitle
          title={mode === 'reset' ? 'Set new password' : 'Reset password'}
          sub={
            mode === 'reset'
              ? 'Choose a strong password to secure your account'
              : 'Enter your email to receive a password reset link'
          }
        />

        <Card>
          {mode === 'request' ? (
            <form onSubmit={handleRequest}>
              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  style={inputStyle()}
                />
              </Field>

              {error && <ErrorBanner>{error}</ErrorBanner>}

              <SubmitButton loading={loading} label="Send reset link" />
            </form>
          ) : (
            <form onSubmit={handleReset}>
              <Field label="New password">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 12 characters"
                  autoComplete="new-password"
                  style={inputStyle()}
                />
              </Field>

              {/* #1312: password strength meter */}
              {newPassword && (
                <PasswordStrengthMeter strength={pwdStrength} />
              )}

              <Field label="Confirm new password" style={{ marginTop: 20 }}>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  style={inputStyle()}
                />
              </Field>

              {error && <ErrorBanner>{error}</ErrorBanner>}

              <SubmitButton loading={loading} label="Update password" />
            </form>
          )}
        </Card>

        {mode === 'reset' && (
          <p style={{
            fontSize: 12, color: V1.textMuted, textAlign: 'center',
            marginTop: 20, lineHeight: 1.5, fontFamily: V1.bodyFont,
          }}>
            Reset links expire after 60 minutes. If your link has expired,
            request a new one from the login page.
          </p>
        )}
      </Center>
    </Shell>
  );
}

// ── Inline subcomponents (kept local — single-use) ──────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="v1-scope" style={{ minHeight: '100vh', background: V1.bg }}>
      <style>{`
        .v1-scope input:focus {
          border-color: ${V1.teal600} !important;
          outline: none;
        }
        .v1-scope input::placeholder { color: ${V1.textDim}; }
        @keyframes auth-reveal { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .auth-enter { animation: auth-reveal ${V1.durNormal}ms ${V1.ease} both; }
      `}</style>
      <Nav />
      {children}
    </div>
  );
}

function Nav() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: V1.navHeight,
      background: V1.bg,
      borderBottom: `1px solid ${V1.border}`,
      zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: `0 ${V1.shellPad}px`,
    }}>
      <Link to="/" className="v1-wordmark" aria-label="NEXUS home">
        NEXUS<span className="v1-dot">.</span>
      </Link>
      <Link to="/login" style={{
        fontFamily: V1.bodyFont, fontSize: V1.textBodySm,
        color: V1.textMuted, textDecoration: 'none',
      }}>
        Back to login
      </Link>
    </nav>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '64px 24px', minHeight: '100vh',
    }}>
      <div className="auth-enter" style={{ maxWidth: 400, width: '100%' }}>
        {children}
      </div>
    </div>
  );
}

function BrandMast() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 32 }}>
      <div style={{
        fontFamily: V1.displayFont, fontSize: 28, color: V1.teal700,
        letterSpacing: V1.trackingTight, marginBottom: 4,
      }}>
        NEXUS<span style={{ color: V1.fuchsia600 }}>.</span>
      </div>
      <div className="v1-mono" style={{
        fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
        textTransform: 'uppercase', color: V1.textMuted,
      }}>
        Executive intelligence
      </div>
    </div>
  );
}

function PageTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 32 }}>
      <h1 style={{
        fontFamily: V1.displayFont, fontSize: 30, color: V1.text,
        fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
        lineHeight: V1.leadingDisplay, margin: '0 0 8px',
      }}>
        {title}
      </h1>
      <p style={{
        fontFamily: V1.bodyFont, fontSize: V1.textBodySm,
        color: V1.textSecondary, lineHeight: 1.5, margin: 0,
      }}>
        {sub}
      </p>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      border: `1px solid ${V1.border}`,
      padding: 32, background: V1.surface,
    }}>
      {children}
    </div>
  );
}

const footerLinkStyle: React.CSSProperties = {
  fontFamily: V1.bodyFont,
  fontSize: V1.textBodySm,
  color: V1.teal700,
  textDecoration: 'none',
  fontWeight: V1.fwMedium,
};

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ marginBottom: 20, ...style }}>
      <label className="v1-mono" style={{
        display: 'block', fontSize: V1.textMonoPx,
        letterSpacing: V1.trackingMono, textTransform: 'uppercase',
        color: V1.textMuted, marginBottom: 8,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: '12px 16px',
    background: V1.bg,
    border: `1px solid ${V1.borderStrong}`,
    color: V1.text,
    fontSize: 15,
    outline: 'none',
    minHeight: 44,
    fontFamily: V1.bodyFont,
    boxSizing: 'border-box',
  };
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '12px 16px',
      border: `1px solid ${V1.fuchsia600}`,
      background: V1.fuchsia50,
      color: V1.fuchsia700,
      fontSize: V1.textBodySm,
      fontFamily: V1.bodyFont,
      marginBottom: 20,
      lineHeight: 1.4,
    }}>
      {children}
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: '100%',
        padding: '14px',
        background: V1.teal800,
        color: V1.white,
        border: 'none',
        fontSize: 15,
        fontWeight: V1.fwSemibold,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 48,
        fontFamily: V1.bodyFont,
        transition: `background ${V1.durFast}ms ${V1.ease}`,
      }}
      onMouseEnter={(e) => !loading && (e.currentTarget.style.background = V1.teal900)}
      onMouseLeave={(e) => (e.currentTarget.style.background = V1.teal800)}
    >
      {loading ? `${label}...` : `${label} →`}
    </button>
  );
}

function PasswordStrengthMeter({ strength }: { strength: ReturnType<typeof validatePasswordStrength> }) {
  return (
    <div style={{ marginTop: 10, marginBottom: 4 }}>
      <div style={{
        display: 'flex', height: 2, background: V1.dividerRow,
      }}>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            style={{
              width: '20%',
              background: level < strength.score
                ? passwordScoreColor(strength.score)
                : 'transparent',
              borderRight: level < 4 ? `1px solid ${V1.surface}` : 'none',
              transition: `background-color ${V1.durNormal}ms ${V1.ease}`,
            }}
          />
        ))}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: V1.textCaption, marginTop: 6, fontFamily: V1.bodyFont,
      }}>
        <span className="v1-mono" style={{
          letterSpacing: V1.trackingMono, textTransform: 'uppercase',
          color: V1.textMuted,
        }}>
          {strength.score > 0 ? passwordScoreLabel(strength.score) : ' '}
        </span>
        {strength.warnings.length > 0 && (
          <span style={{ color: V1.fuchsia700 }}>
            {strength.warnings[0]}
          </span>
        )}
      </div>
    </div>
  );
}
