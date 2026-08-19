/**
 * V4.5.1 — AUTH PAGE (Login)
 *
 * Route: /login
 *
 * Centered card on cream background, marketing page layout (not app shell).
 * V1 line-art system: bordered card, no shadow, 0px radius, teal primary,
 * mono labels, serif display title.
 *
 * Auth logic, validation, OAuth — all stay the same. 100% visual re-skin.
 */
import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getDefaultRoute } from '@/components/auth/PostLoginRedirect';
import { trackLoginSuccess } from '@/analytics/eventTracker';
import { reportError } from '@/analytics/errorMonitor';
import { V1 } from '@/styles/v1-tokens';

export function LoginPage() {
  const navigate = useNavigate();
  const { signInWithPassword } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Preload platform route on hover for instant navigation
  const handleMouseEnter = useCallback(() => {
    import('../components/dashboard/ConsultantDashboard');
    import('../components/layout/AppLayout');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    const result = await signInWithPassword(email.trim(), password);
    setLoading(false);

    if (result.success) {
      // Load profile to determine user role before redirecting
      const store = useAuthStore.getState?.() || {};
      if (store.loadProfile) {
        await store.loadProfile();
      }
      const profile = useAuthStore.getState?.().profile;
      // Fire login_success event with role context
      trackLoginSuccess('email', profile?.role ?? undefined);
      const target = getDefaultRoute(profile?.role);
      navigate(target);
    } else {
      reportError(new Error(result.error || 'Login failed'), { scope: 'auth:login', severity: 'warning', extra: { email: email.trim() } });
      setError(result.error || 'Invalid credentials. Please try again.');
    }
  };

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

      {/* ── Nav: minimal, wordmark + back link ── */}
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
        <Link to="/" style={{
          fontFamily: V1.bodyFont, fontSize: V1.textBodySm,
          color: V1.textMuted, textDecoration: 'none',
        }}>
          Back to site
        </Link>
      </nav>

      {/* ── Centered card ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '64px 24px',
        minHeight: '100vh',
      }}>
        <div className="auth-enter" style={{ maxWidth: 400, width: '100%' }}>

          {/* Brand wordmark + tagline */}
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

          {/* Page title */}
          <h1 style={{
            fontFamily: V1.displayFont, fontSize: 30, color: V1.text,
            fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
            lineHeight: V1.leadingDisplay, margin: '0 0 8px', textAlign: 'center',
          }}>
            Sign in
          </h1>
          <p style={{
            fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary,
            lineHeight: 1.5, textAlign: 'center', margin: '0 0 32px',
          }}>
            Your workspace is where you left it.
          </p>

          {/* Card */}
          <div style={{
            border: `1px solid ${V1.border}`,
            padding: 32,
            background: V1.surface,
          }}>
            <form onSubmit={handleSubmit} onMouseEnter={handleMouseEnter}>

              {/* Email */}
              <div style={{ marginBottom: 20 }}>
                <label className="v1-mono" style={{
                  display: 'block', fontSize: V1.textMonoPx,
                  letterSpacing: V1.trackingMono, textTransform: 'uppercase',
                  color: V1.textMuted, marginBottom: 8,
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: V1.bg, border: `1px solid ${V1.borderStrong}`,
                    color: V1.text, fontSize: 15, outline: 'none',
                    minHeight: 44, fontFamily: V1.bodyFont,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 20 }}>
                <label className="v1-mono" style={{
                  display: 'block', fontSize: V1.textMonoPx,
                  letterSpacing: V1.trackingMono, textTransform: 'uppercase',
                  color: V1.textMuted, marginBottom: 8,
                }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: V1.bg, border: `1px solid ${V1.borderStrong}`,
                    color: V1.text, fontSize: 15, outline: 'none',
                    minHeight: 44, fontFamily: V1.bodyFont,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  padding: '12px 16px',
                  border: `1px solid ${V1.fuchsia600}`,
                  background: V1.fuchsia50,
                  color: V1.fuchsia700,
                  fontSize: V1.textBodySm, fontFamily: V1.bodyFont,
                  marginBottom: 20, lineHeight: 1.4,
                }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px',
                  background: V1.teal800, color: V1.white,
                  border: 'none', fontSize: 15, fontWeight: V1.fwSemibold,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  minHeight: 48, fontFamily: V1.bodyFont,
                  transition: `background ${V1.durFast}ms ${V1.ease}`,
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.background = V1.teal900)}
                onMouseLeave={(e) => (e.currentTarget.style.background = V1.teal800)}
              >
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>

              {/* Footer links */}
              <div style={{
                display: 'flex', justifyContent: 'center', gap: 16,
                marginTop: 16,
              }}>
                <Link to="/reset-password" style={{
                  fontSize: V1.textBodySm, color: V1.textMuted,
                  textDecoration: 'none', fontFamily: V1.bodyFont,
                }}>
                  Forgot password?
                </Link>
                <span style={{ fontSize: V1.textBodySm, color: V1.border }}>.</span>
                <Link to="/signup" style={{
                  fontSize: V1.textBodySm, color: V1.teal700,
                  textDecoration: 'none', fontFamily: V1.bodyFont,
                  fontWeight: V1.fwMedium,
                }}>
                  Create account
                </Link>
              </div>
            </form>
          </div>

          <p style={{
            fontSize: 12, color: V1.textMuted, textAlign: 'center',
            marginTop: 20, lineHeight: 1.5, fontFamily: V1.bodyFont,
          }}>
            Your context stays yours.
          </p>
        </div>
      </div>
    </div>
  );
}
