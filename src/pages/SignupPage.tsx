import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, User, Building } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/toastStore';
import { MinimalFooter } from '@/components/MinimalFooter';

import { COLORS, TYPOGRAPHY, RADII, SHADOWS } from '@/styles/tokens';

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Email is required'); return; }
    if (!name.trim()) { setError('Name is required'); return; }
    if (!password) { setError('Password is required'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    const result = await signUp(email.trim(), password, 'professional', name.trim());
    setLoading(false);

    if (result.success) {
      toast.success('Account created successfully');
      navigate('/app');
    } else {
      setError(result.error || 'Failed to create account');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${COLORS.border}` }}>
        <Link to="/" style={{ fontFamily: TYPOGRAPHY.fontFamily.serif, fontSize: '18px', fontWeight: 700, color: COLORS.text, textDecoration: 'none' }}>
          LYC Intelligence
        </Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link to="/login" style={{ fontSize: '13px', color: COLORS.textMuted, textDecoration: 'none' }}>Already have an account? Sign in</Link>
        </div>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', flex: 1 }}>
        <div style={{ maxWidth: '420px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontFamily: TYPOGRAPHY.fontFamily.serif, fontSize: '28px', fontWeight: 600, color: COLORS.text, margin: '0 0 8px' }}>
              Create Account
            </h1>
            <p style={{ fontSize: '14px', color: COLORS.textMuted, lineHeight: 1.6 }}>
              Join the LYC Intelligence Platform
            </p>
          </div>

          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: `${RADII.none}px`, padding: '32px', boxShadow: SHADOWS.sm }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: COLORS.textSecondary, marginBottom: '8px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: COLORS.textMuted }} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    style={{
                      width: '100%', padding: '12px 16px 12px 44px',
                      background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '0px',
                      color: COLORS.text, fontSize: '15px', outline: 'none', minHeight: '44px',
                      fontFamily: TYPOGRAPHY.fontFamily.sans, boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: COLORS.textSecondary, marginBottom: '8px' }}>
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: COLORS.textMuted }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    style={{
                      width: '100%', padding: '12px 16px 12px 44px',
                      background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '0px',
                      color: COLORS.text, fontSize: '15px', outline: 'none', minHeight: '44px',
                      fontFamily: TYPOGRAPHY.fontFamily.sans, boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: COLORS.textSecondary, marginBottom: '8px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: COLORS.textMuted }} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    style={{
                      width: '100%', padding: '12px 16px 12px 44px',
                      background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '0px',
                      color: COLORS.text, fontSize: '15px', outline: 'none', minHeight: '44px',
                      fontFamily: TYPOGRAPHY.fontFamily.sans, boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: COLORS.textSecondary, marginBottom: '8px' }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: COLORS.textMuted }} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    style={{
                      width: '100%', padding: '12px 16px 12px 44px',
                      background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '0px',
                      color: COLORS.text, fontSize: '15px', outline: 'none', minHeight: '44px',
                      fontFamily: TYPOGRAPHY.fontFamily.sans, boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#FEF2F2', borderRadius: '0px', color: '#DC2626', fontSize: '14px', marginBottom: '20px', fontFamily: TYPOGRAPHY.fontFamily.sans }}>
                  <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px',
                  background: COLORS.primary, color: '#FFFFFF',
                  border: 'none', borderRadius: '0px',
                  fontSize: '15px', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  minHeight: '48px', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  fontFamily: TYPOGRAPHY.fontFamily.sans,
                }}
              >
                {loading ? (
                  <><Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />Creating account...</>
                ) : (
                  <>Create Account <ArrowRight style={{ width: 18, height: 18 }} /></>
                )}
              </button>
            </form>
          </div>

          <p style={{ fontSize: '12px', color: COLORS.textMuted, textAlign: 'center', marginTop: '20px', lineHeight: 1.5 }}>
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus { border-color: ${COLORS.primary} !important; box-shadow: 0 0 0 2px rgba(193,8,171,0.2) !important; }
        input::placeholder { color: ${COLORS.textMuted}; }
      `}</style>
      <MinimalFooter />
    </div>
  );
}
