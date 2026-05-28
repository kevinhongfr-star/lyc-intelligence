import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Briefcase, Users, Search, ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  accentHover: '#A00790',
  bg: '#FFFFFF',
  bgAlt: '#F5F5F5',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
  border: '#E5E5E5',
  radius: '12px',
  radiusSm: '8px',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowHover: '0 4px 12px rgba(0,0,0,0.1)',
};

type SignupStep = 'email' | 'icp' | 'profile' | 'password' | 'success';
type ICPType = 'leader' | 'job_seeker' | 'hiring' | 'search_professional';

const ICP_OPTIONS: Array<{ id: ICPType; icon: React.ReactNode; title: string; description: string }> = [
  {
    id: 'leader',
    icon: <Briefcase style={{ width: 28, height: 28 }} />,
    title: "Senior leader / executive",
    description: "C-suite, VP, Director looking to advance or transition",
  },
  {
    id: 'job_seeker',
    icon: <Users style={{ width: 28, height: 28 }} />,
    title: "Actively job searching",
    description: "In transition, exploring new opportunities",
  },
  {
    id: 'hiring',
    icon: <Briefcase style={{ width: 28, height: 28 }} />,
    title: "Hiring for my company",
    description: "Building a team, need executive search support",
  },
  {
    id: 'search_professional',
    icon: <Search style={{ width: 28, height: 28 }} />,
    title: "Executive search professional",
    description: "Join our waitlist for search firm partnerships",
  },
];

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuthStore();

  const [step, setStep] = useState<SignupStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [icp, setIcp] = useState<ICPType | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailNext = () => {
    setError('');
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setStep('icp');
  };

  const handleIcpSelect = (selected: ICPType) => {
    setIcp(selected);
    setStep('profile');
  };

  const handleProfileNext = () => {
    setError('');
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    setStep('password');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await signUp(email, password, icp, name);
    setLoading(false);

    if (result.success) {
      setStep('success');
    } else {
      setError(result.error || 'Failed to create account');
    }
  };

  if (step === 'success') {
    return (
      <div style={{ minHeight: '100vh', background: DS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '420px', width: '100%', background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '48px 40px', textAlign: 'center' }}>
          <CheckCircle2 style={{ width: 56, height: 56, color: DS.success, margin: '0 auto 24px' }} />
          <h1 style={{ fontFamily: DS.headingFont, fontSize: '24px', fontWeight: 600, color: DS.text, margin: '0 0 12px' }}>
            Check your email
          </h1>
          <p style={{ fontSize: '15px', color: DS.muted, margin: '0 0 24px', lineHeight: 1.6 }}>
            We sent a confirmation link to <strong style={{ color: DS.text }}>{email}</strong>.
            Click the link to activate your account.
          </p>
          <p style={{ fontSize: '13px', color: DS.muted }}>
            Already confirmed?{' '}
            <Link to="/login" style={{ color: DS.accent, textDecoration: 'none', fontWeight: 500 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: DS.bg }}>
      {/* Header */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${DS.border}` }}>
        <Link to="/" style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, textDecoration: 'none' }}>
          LYC Intelligence
        </Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link to="/login" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>Sign in</Link>
          <Link to="/nexus" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>Talk to Nexus AI</Link>
        </div>
      </nav>

      {/* Progress Steps */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '48px 24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          {['email', 'icp', 'profile', 'password'].map((s, i) => (
            <React.Fragment key={s}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: (step === s || ['email', 'icp', 'profile', 'password'].indexOf(step) > i) ? DS.accent : DS.border,
                transition: 'background 0.2s',
              }} />
              {i < 3 && <div style={{ flex: 1, height: '2px', background: ['email', 'icp', 'profile', 'password'].indexOf(step) > i ? DS.accent : DS.border }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Email */}
        {step === 'email' && (
          <div>
            <h1 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>
              Create your account
            </h1>
            <p style={{ fontSize: '15px', color: DS.muted, margin: '0 0 32px' }}>
              Start with your email address
            </p>

            <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '32px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DS.textSecondary, marginBottom: '8px' }}>
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: DS.muted }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailNext()}
                    placeholder="you@company.com"
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 44px',
                      background: DS.bg,
                      border: `1px solid ${DS.cardBorder}`,
                      borderRadius: '8px',
                      color: DS.text,
                      fontSize: '15px',
                      outline: 'none',
                      minHeight: '44px',
                    }}
                  />
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: `${DS.error}15`, borderRadius: '8px', color: DS.error, fontSize: '14px', marginBottom: '20px' }}>
                  <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
                  {error}
                </div>
              )}

              <button
                onClick={handleEmailNext}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: DS.accent,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  minHeight: '48px',
                }}
              >
                Continue
                <ArrowRight style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: ICP Selector */}
        {step === 'icp' && (
          <div>
            <button
              onClick={() => setStep('email')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: DS.muted, fontSize: '14px', cursor: 'pointer', marginBottom: '24px' }}
            >
              <ArrowLeft style={{ width: 16, height: 16 }} />
              Back
            </button>

            <h1 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>
              Which best describes you?
            </h1>
            <p style={{ fontSize: '15px', color: DS.muted, margin: '0 0 32px' }}>
              This helps us personalize your experience
            </p>

            <div style={{ display: 'grid', gap: '12px' }}>
              {ICP_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleIcpSelect(option.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    padding: '20px',
                    background: DS.card,
                    border: `1px solid ${DS.cardBorder}`,
                    borderRadius: DS.radius,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = DS.accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = DS.border)}
                >
                  <div style={{ color: DS.accent, marginTop: '2px' }}>{option.icon}</div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: DS.text, margin: '0 0 4px' }}>{option.title}</h3>
                    <p style={{ fontSize: '13px', color: DS.muted, margin: 0 }}>{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Profile */}
        {step === 'profile' && (
          <div>
            <button
              onClick={() => setStep('icp')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: DS.muted, fontSize: '14px', cursor: 'pointer', marginBottom: '24px' }}
            >
              <ArrowLeft style={{ width: 16, height: 16 }} />
              Back
            </button>

            <h1 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>
              Tell us about yourself
            </h1>
            <p style={{ fontSize: '15px', color: DS.muted, margin: '0 0 32px' }}>
              Help us personalize your experience
            </p>

            <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '32px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DS.textSecondary, marginBottom: '8px' }}>
                  Full name
                </label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: DS.muted }} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleProfileNext()}
                    placeholder="John Smith"
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 44px',
                      background: DS.bg,
                      border: `1px solid ${DS.cardBorder}`,
                      borderRadius: '8px',
                      color: DS.text,
                      fontSize: '15px',
                      outline: 'none',
                      minHeight: '44px',
                    }}
                  />
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: `${DS.error}15`, borderRadius: '8px', color: DS.error, fontSize: '14px', marginBottom: '20px' }}>
                  <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
                  {error}
                </div>
              )}

              <button
                onClick={handleProfileNext}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: DS.accent,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  minHeight: '48px',
                }}
              >
                Continue
                <ArrowRight style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Password */}
        {step === 'password' && (
          <div>
            <button
              onClick={() => setStep('profile')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: DS.muted, fontSize: '14px', cursor: 'pointer', marginBottom: '24px' }}
            >
              <ArrowLeft style={{ width: 16, height: 16 }} />
              Back
            </button>

            <h1 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>
              Set your password
            </h1>
            <p style={{ fontSize: '15px', color: DS.muted, margin: '0 0 32px' }}>
              Create a secure password for your account
            </p>

            <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '32px' }}>
              <form onSubmit={handleSignup}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DS.textSecondary, marginBottom: '8px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: DS.muted }} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 44px',
                        background: DS.bg,
                        border: `1px solid ${DS.cardBorder}`,
                        borderRadius: '8px',
                        color: DS.text,
                        fontSize: '15px',
                        outline: 'none',
                        minHeight: '44px',
                      }}
                    />
                  </div>
                </div>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: `${DS.error}15`, borderRadius: '8px', color: DS.error, fontSize: '14px', marginBottom: '20px' }}>
                    <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: DS.accent,
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    minHeight: '48px',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight style={{ width: 18, height: 18 }} />
                    </>
                  )}
                </button>
              </form>

              <p style={{ fontSize: '12px', color: DS.muted, textAlign: 'center', marginTop: '16px' }}>
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus {
          border-color: ${DS.accent} !important;
        }
        input::placeholder {
          color: ${DS.muted};
        }
      `}</style>
    </div>
  );
}
