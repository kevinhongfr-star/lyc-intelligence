import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import {
  validatePasswordStrength,
  passwordScoreLabel,
  passwordScoreColor,
} from '@/lib/auth/passwordPolicy';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  bg: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
  border: '#E5E5E5',
};

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
      <div style={{ minHeight: '100vh', background: DS.bg }}>
        <Nav />
        <Center>
          <Header
            title="Check Your Email"
            subtitle="If an account exists, you'll receive a reset link shortly."
          />
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '32px', textAlign: 'center' }}>
            <CheckCircle style={{ width: 48, height: 48, color: '#16A34A', margin: '0 auto 16px' }} />
            <p style={{ fontSize: '15px', color: '#166534', fontFamily: DS.bodyFont, lineHeight: 1.6 }}>
              If an account exists for <strong>{email}</strong>, a reset link is on its way. The link expires in 60 minutes for security.
            </p>
            <Link to="/login" style={{ display: 'inline-block', marginTop: '20px', color: DS.accent, fontSize: '14px', fontFamily: DS.bodyFont }}>
              Return to login
            </Link>
          </div>
        </Center>
      </div>
    );
  }

  if (mode === 'reset' && updated) {
    return (
      <div style={{ minHeight: '100vh', background: DS.bg }}>
        <Nav />
        <Center>
          <Header
            title="Password Updated"
            subtitle="Your account is secured with your new password."
          />
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '32px', textAlign: 'center' }}>
            <CheckCircle style={{ width: 48, height: 48, color: '#16A34A', margin: '0 auto 16px' }} />
            <p style={{ fontSize: '15px', color: '#166534', fontFamily: DS.bodyFont, lineHeight: 1.6 }}>
              Your password has been updated successfully. You can now sign in with your new credentials.
            </p>
            <Link to="/login" style={{ display: 'inline-block', marginTop: '20px', color: DS.accent, fontSize: '14px', fontFamily: DS.bodyFont }}>
              Continue to login
            </Link>
          </div>
        </Center>
      </div>
    );
  }

  // ── Form screens ───────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: DS.bg }}>
      <Nav />
      <Center>
        <Header
          title={mode === 'reset' ? 'Set New Password' : 'Reset Password'}
          subtitle={
            mode === 'reset'
              ? 'Choose a strong password to secure your account'
              : 'Enter your email to receive a password reset link'
          }
        />

        <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, padding: '32px' }}>
          {mode === 'request' ? (
            <form onSubmit={handleRequest}>
              <Field label="Email">
                <InputWithIcon icon={<Mail style={{ width: 18, height: 18, color: DS.muted }} />}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    style={inputStyle(DS)}
                  />
                </InputWithIcon>
              </Field>

              {error && <ErrorBanner>{error}</ErrorBanner>}

              <SubmitButton loading={loading} label="Send Reset Link" />
            </form>
          ) : (
            <form onSubmit={handleReset}>
              <Field label="New Password">
                <InputWithIcon icon={<Lock style={{ width: 18, height: 18, color: DS.muted }} />}>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 12 characters"
                    autoComplete="new-password"
                    style={inputStyle(DS)}
                  />
                </InputWithIcon>
              </Field>

              {/* #1312: password strength meter */}
              <PasswordStrengthMeter strength={pwdStrength} />

              <Field label="Confirm New Password" style={{ marginTop: '16px' }}>
                <InputWithIcon icon={<Lock style={{ width: 18, height: 18, color: DS.muted }} />}>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                    style={inputStyle(DS)}
                  />
                </InputWithIcon>
              </Field>

              {error && <ErrorBanner>{error}</ErrorBanner>}

              <SubmitButton loading={loading} label="Update Password" icon />
            </form>
          )}
        </div>

        {mode === 'reset' && (
          <p style={{ fontSize: '12px', color: DS.muted, textAlign: 'center', marginTop: '20px', lineHeight: 1.5, fontFamily: DS.bodyFont }}>
            Reset links expire after 60 minutes. If your link has expired, request a new one from the login page.
          </p>
        )}
      </Center>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus { border-color: ${DS.accent} !important; box-shadow: 0 0 0 2px rgba(193,8,171,0.2) !important; }
        input::placeholder { color: ${DS.muted}; }
      `}</style>
    </div>
  );
}

// ── Inline subcomponents (kept local — single-use) ──────────────────

function Nav() {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${DS.border}` }}>
      <Link to="/" style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, textDecoration: 'none' }}>
        LYC Intelligence
      </Link>
      <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: DS.muted, textDecoration: 'none', fontFamily: DS.bodyFont }}>
        <ArrowLeft style={{ width: 14, height: 14 }} /> Back to login
      </Link>
    </nav>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ maxWidth: '420px', width: '100%' }}>{children}</div>
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
      <h1 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>
        {title}
      </h1>
      <p style={{ fontSize: '14px', color: DS.muted, lineHeight: 1.6, fontFamily: DS.bodyFont }}>
        {subtitle}
      </p>
    </div>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ marginBottom: '16px', ...style }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DS.textSecondary, marginBottom: '8px', fontFamily: DS.bodyFont }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function InputWithIcon({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
        {icon}
      </div>
      {children}
    </div>
  );
}

function inputStyle(DS: typeof DS): React.CSSProperties {
  return {
    width: '100%',
    padding: '12px 16px 12px 44px',
    background: DS.bg,
    border: `1px solid ${DS.cardBorder}`,
    color: DS.text,
    fontSize: '15px',
    outline: 'none',
    minHeight: '44px',
    fontFamily: DS.bodyFont,
    boxSizing: 'border-box',
  };
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#FEF2F2', color: '#DC2626', fontSize: '14px', marginBottom: '20px', fontFamily: DS.bodyFont }}>
      <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
      {children}
    </div>
  );
}

function SubmitButton({ loading, label, icon }: { loading: boolean; label: string; icon?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: '100%',
        padding: '14px',
        background: DS.accent,
        color: '#FFFFFF',
        border: 'none',
        fontSize: '15px',
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        minHeight: '48px',
        transition: 'background-color 200ms cubic-bezier(0.4,0,0.2,1)',
        fontFamily: DS.bodyFont,
      }}
    >
      {loading ? (
        <><Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />{label}...</>
      ) : (
        <>
          {label}
          {icon && <ArrowRight style={{ width: 18, height: 18 }} />}
        </>
      )}
    </button>
  );
}

function PasswordStrengthMeter({ strength }: { strength: ReturnType<typeof validatePasswordStrength> }) {
  return (
    <div style={{ marginTop: '8px', marginBottom: '4px' }}>
      <div style={{ display: 'flex', height: '4px', background: '#E5E5E5' }}>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            style={{
              width: '20%',
              background: level < strength.score ? passwordScoreColor(strength.score) : 'transparent',
              borderRight: level < 4 ? '1px solid #FFFFFF' : 'none',
              transition: 'background-color 200ms cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px', fontFamily: DS.bodyFont }}>
        <span style={{ color: passwordScoreColor(strength.score) }}>
          {strength.score > 0 ? passwordScoreLabel(strength.score) : ' '}
        </span>
        {strength.warnings.length > 0 && (
          <span style={{ color: '#B91C1C' }}>{strength.warnings[0]}</span>
        )}
      </div>
    </div>
  );
}
