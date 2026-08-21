/**
 * V7.0 — Auth page (/auth).
 *
 * Standalone full-viewport dark auth screen (not wrapped in MarketingLayout —
 * the design specifies its own wordmark at top + centered content, which a
 * fixed nav + footer would conflict with).
 *
 * Two modes (toggled by "Already have access? Sign in"):
 *  - Signup: email + name + password → useAuthStore.signUp → Explorer tier
 *    (backend tier 'executive_introduction') → redirect /nexus/chat
 *  - Signin: email + password → useAuthStore.signInWithPassword → /nexus/chat
 *
 * Bottom-line inputs only (no box, no border except bottom underline). Mono
 * labels above inputs. Exact copy per spec. Uses existing Supabase auth
 * infrastructure — no rebuild. Password reset → existing /reset-password.
 *
 * Analytics: auth_page_view on mount, signup_start/login_start on submit,
 * trackSignupSuccess/trackLoginSuccess on success.
 *
 * NOTE: spec lists only email + name for signup, but the existing signUp()
 * backend requires a password — a password field is included so signup
 * actually works against existing infra (no rebuild, no breakage).
 */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { V3 } from '@/styles/v3-tokens';
import { useAuthStore } from '@/stores/authStore';
import {
  trackEvent,
  trackSignupSuccess,
  trackLoginSuccess,
  setTrackingUser,
} from '@/analytics/eventTracker';

type Mode = 'signup' | 'signin';

const REDIRECT_TARGET = '/nexus/chat';

/* ── Bottom-line input field ── */
function Field({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}): React.ReactElement {
  return (
    <div style={{ marginBottom: 28 }}>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontFamily: V3.monoFont,
          fontSize: '0.68rem',
          letterSpacing: V3.trackingMono,
          textTransform: 'uppercase',
          fontWeight: V3.fwMedium,
          color: V3.teal300,
          marginBottom: 10,
        }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          borderBottom: `1px solid rgba(250,250,250,0.22)`,
          borderRadius: 0,
          padding: '10px 0',
          fontFamily: V3.bodyFont,
          fontSize: '1rem',
          color: V3.cream,
          outline: 'none',
          transition: `border-color ${V3.durNormal}ms ${V3.ease}`,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderBottomColor = V3.teal300;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderBottomColor = 'rgba(250,250,250,0.22)';
        }}
      />
    </div>
  );
}

export function AuthPage(): React.ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const intentTier = searchParams.get('tier'); // from /auth?tier=pro membership CTA

  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const signUp = useAuthStore((s) => s.signUp);
  const signInWithPassword = useAuthStore((s) => s.signInWithPassword);

  // Track auth page view on mount
  useEffect(() => {
    trackEvent('auth_page_view', { mode: 'signup', intent_tier: intentTier ?? null });
  }, [intentTier]);

  // If already signed in, go straight to the app
  const user = useAuthStore((s) => s.user);
  useEffect(() => {
    if (user) navigate(REDIRECT_TARGET, { replace: true });
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'signup') {
        trackEvent('signup_start', { intent_tier: intentTier ?? null });
        const result = await signUp(email, password, '', name);
        if (!result.success) {
          setError(result.error || 'Failed to create account');
          setSubmitting(false);
          return;
        }
        trackSignupSuccess('email', 'member');
        setTrackingUser({ role: 'member' });
        trackEvent('signup_complete', { tier: 'explorer' });
      } else {
        trackEvent('login_start', {});
        const result = await signInWithPassword(email, password);
        if (!result.success) {
          setError(result.error || 'Failed to sign in');
          setSubmitting(false);
          return;
        }
        trackLoginSuccess('email');
      }
      navigate(REDIRECT_TARGET, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <>
      <SEO
        title="Your first conversation. | NEXUS."
        description="Five minutes to set up. A lifetime of clarity. Complimentary baseline. No card required. Fully discreet."
        path="/auth"
      />
      <div
        style={{
          minHeight: '100vh',
          background: V3.ink900,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 32px',
          fontFamily: V3.bodyFont,
        }}
      >
        {/* Wordmark — links to / */}
        <Link
          to="/"
          aria-label="NEXUS home"
          style={{ textDecoration: 'none', marginBottom: 48 }}
        >
          <span
            style={{
              fontFamily: V3.displayFont,
              fontWeight: V3.fwBold,
              fontSize: '1.5rem',
              color: V3.cream,
              letterSpacing: '-0.02em',
            }}
          >
            NEXUS<span style={{ color: V3.fuchsia600 }}>.</span>
          </span>
        </Link>

        {/* Auth card */}
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Headline */}
          <h1
            style={{
              fontFamily: V3.displayFont,
              fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
              lineHeight: 1.2,
              fontWeight: V3.fwLight,
              color: V3.cream,
              letterSpacing: V3.trackingDisplay,
              margin: '0 0 12px 0',
              textAlign: 'center',
            }}
          >
            Your first conversation.
          </h1>
          <p
            style={{
              fontFamily: V3.displayFont,
              fontSize: '1.15rem',
              lineHeight: 1.4,
              fontWeight: V3.fwRegular,
              color: V3.onDarkMuted,
              fontStyle: 'italic',
              margin: '0 0 40px 0',
              textAlign: 'center',
            }}
          >
            Five minutes to set up. A lifetime of clarity.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <Field
              id="auth-email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@company.com"
              autoComplete="email"
            />
            {mode === 'signup' && (
              <Field
                id="auth-name"
                label="Name"
                value={name}
                onChange={setName}
                placeholder="What should we call you"
                autoComplete="name"
              />
            )}
            <Field
              id="auth-password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />

            {/* Error */}
            {error && (
              <p
                role="alert"
                style={{
                  fontFamily: V3.bodyFont,
                  fontSize: '0.82rem',
                  color: V3.fuchsia600,
                  margin: '0 0 20px 0',
                }}
              >
                {error}
              </p>
            )}

            {/* Primary CTA */}
            <button
              type="submit"
              disabled={submitting}
              className="v3-cta-primary"
              style={{
                display: 'block',
                width: '100%',
                fontFamily: V3.bodyFont,
                fontSize: '0.9rem',
                fontWeight: V3.fwMedium,
                color: V3.ink900,
                background: V3.cream,
                padding: '14px 32px',
                border: 'none',
                borderRadius: 0,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
                transition: `opacity ${V3.durNormal}ms ${V3.durNormal}ms`,
              }}
            >
              {submitting ? 'One moment…' : mode === 'signup' ? 'Begin with Explorer' : 'Sign in'}
            </button>
          </form>

          {/* Small print (signup only) */}
          {mode === 'signup' && (
            <p
              style={{
                fontFamily: V3.bodyFont,
                fontSize: '0.78rem',
                lineHeight: 1.5,
                color: V3.onDarkMuted,
                margin: '24px 0 0 0',
                textAlign: 'center',
              }}
            >
              Complimentary baseline. No card required. Fully discreet. You can delete everything at any time.
            </p>
          )}

          {/* Mode toggle */}
          <div style={{ marginTop: 40, textAlign: 'center' }}>
            {mode === 'signup' ? (
              <p
                style={{
                  fontFamily: V3.bodyFont,
                  fontSize: '0.85rem',
                  color: V3.onDarkMuted,
                  margin: 0,
                }}
              >
                Already have access?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontFamily: V3.bodyFont,
                    fontSize: '0.85rem',
                    color: V3.teal300,
                    cursor: 'pointer',
                    borderBottom: `1px solid ${V3.teal300}`,
                  }}
                >
                  Sign in
                </button>
              </p>
            ) : (
              <>
                <p
                  style={{
                    fontFamily: V3.bodyFont,
                    fontSize: '0.85rem',
                    color: V3.onDarkMuted,
                    margin: '0 0 12px 0',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontFamily: V3.bodyFont,
                      fontSize: '0.85rem',
                      color: V3.teal300,
                      cursor: 'pointer',
                      borderBottom: `1px solid ${V3.teal300}`,
                    }}
                  >
                    Create an account
                  </button>
                </p>
                <Link
                  to="/reset-password"
                  style={{
                    fontFamily: V3.bodyFont,
                    fontSize: '0.8rem',
                    color: V3.onDarkMuted,
                    textDecoration: 'none',
                    borderBottom: `1px solid rgba(250,250,250,0.18)`,
                  }}
                >
                  Forgot your password?
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default AuthPage;
