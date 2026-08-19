/**
 * V4.5.1 — AUTH PAGE (Signup)
 *
 * Route: /signup
 *
 * Centered card on cream background, marketing page layout (not app shell).
 * V1 line-art system: bordered card, no shadow, 0px radius, teal primary,
 * mono labels, serif display title, text symbols (no Lucide).
 *
 * Auth logic, validation, OAuth — all stay the same. 100% visual re-skin.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/toastStore';
import { trackSignupSuccess } from '@/analytics/eventTracker';
import { reportError } from '@/analytics/errorMonitor';
import {
  validatePasswordStrength,
  passwordScoreLabel,
  passwordScoreColor,
} from '@/lib/auth/passwordPolicy';
import { captureUTMParams, captureAndStoreUTM } from '@/utils/utmTracking';
import { V1 } from '@/styles/v1-tokens';

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // #1312: live password strength evaluation
  const pwdStrength = useMemo(
    () => validatePasswordStrength(password, { email, name }),
    [password, email, name],
  );

  // #1326: capture UTM/source params on first mount so they survive the
  // email-verification redirect. Persisted to sessionStorage for later write.
  useEffect(() => {
    captureUTMParams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Email is required'); return; }
    if (!name.trim()) { setError('Name is required'); return; }
    if (!password) { setError('Password is required'); return; }
    // #1312: enforce password policy (min 12 chars, mix of classes,
    // not in common-password list, no personal info).
    if (!pwdStrength.passes) {
      setError(pwdStrength.warnings[0] || 'Please choose a stronger password');
      return;
    }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    const result = await signUp(email.trim(), password, 'professional', name.trim());
    setLoading(false);

    if (result.success) {
      // Fire signup_success before navigation so the event is flushed
      trackSignupSuccess('email', 'professional');
      toast.success('Account created successfully');
      // #1326: persist first-touch UTM/source onto the new profile.
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        captureAndStoreUTM(userId).catch((e) => {
          reportError(e, { scope: 'utm:store', severity: 'warning', extra: { userId } });
        });
      }
      navigate('/platform');
    } else {
      reportError(new Error(result.error || 'Signup failed'), { scope: 'auth:signup', severity: 'warning', extra: { email: email.trim() } });
      setError(result.error || 'Failed to create account');
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
        @keyframes v1-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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
        <Link to="/login" style={{
          fontFamily: V1.bodyFont, fontSize: V1.textBodySm,
          color: V1.textMuted, textDecoration: 'none',
        }}>
          Have an account? Sign in
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
            Create account
          </h1>
          <p style={{
            fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary,
            lineHeight: 1.5, textAlign: 'center', margin: '0 0 32px',
          }}>
            Your workspace starts here.
          </p>

          {/* Card */}
          <div style={{
            border: `1px solid ${V1.border}`,
            padding: 32,
            background: V1.surface,
          }}>
            <form onSubmit={handleSubmit}>

              {/* Name */}
              <div style={{ marginBottom: 20 }}>
                <label className="v1-mono" style={{
                  display: 'block', fontSize: V1.textMonoPx,
                  letterSpacing: V1.trackingMono, textTransform: 'uppercase',
                  color: V1.textMuted, marginBottom: 8,
                }}>
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: V1.bg, border: `1px solid ${V1.borderStrong}`,
                    color: V1.text, fontSize: 15, outline: 'none',
                    minHeight: 44, fontFamily: V1.bodyFont,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

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
                  placeholder="At least 12 characters"
                  autoComplete="new-password"
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: V1.bg, border: `1px solid ${V1.borderStrong}`,
                    color: V1.text, fontSize: 15, outline: 'none',
                    minHeight: 44, fontFamily: V1.bodyFont,
                    boxSizing: 'border-box',
                  }}
                />

                {/* #1312: live password strength meter — V1 line-art */}
                {password && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{
                      display: 'flex', height: 2,
                      background: V1.dividerRow,
                    }}>
                      {[0, 1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          style={{
                            width: '20%',
                            background: level < pwdStrength.score
                              ? passwordScoreColor(pwdStrength.score)
                              : 'transparent',
                            borderRight: level < 4 ? `1px solid ${V1.surface}` : 'none',
                            transition: `background-color ${V1.durNormal}ms ${V1.ease}`,
                          }}
                        />
                      ))}
                    </div>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: V1.textCaption, marginTop: 6,
                      fontFamily: V1.bodyFont,
                    }}>
                      <span className="v1-mono" style={{
                        letterSpacing: V1.trackingMono, textTransform: 'uppercase',
                        color: V1.textMuted,
                      }}>
                        {pwdStrength.score > 0 ? passwordScoreLabel(pwdStrength.score) : ' '}
                      </span>
                      {pwdStrength.warnings.length > 0 && (
                        <span style={{ color: V1.fuchsia700 }}>
                          {pwdStrength.warnings[0]}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div style={{ marginBottom: 20 }}>
                <label className="v1-mono" style={{
                  display: 'block', fontSize: V1.textMonoPx,
                  letterSpacing: V1.trackingMono, textTransform: 'uppercase',
                  color: V1.textMuted, marginBottom: 8,
                }}>
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
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
                {loading ? 'Creating account...' : 'Create account →'}
              </button>
            </form>
          </div>

          {/* Footer: terms */}
          <p style={{
            fontSize: 12, color: V1.textMuted, textAlign: 'center',
            marginTop: 20, lineHeight: 1.5, fontFamily: V1.bodyFont,
          }}>
            By creating an account, you agree to our{' '}
            <Link to="/terms" style={{
              color: V1.teal700, textDecoration: 'none',
            }}>
              Terms
            </Link>{' '}and{' '}
            <Link to="/privacy" style={{
              color: V1.teal700, textDecoration: 'none',
            }}>
              Privacy Policy
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
