import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown, Zap, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { MinimalFooter } from '@/components/MinimalFooter';

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
  radius: '0px',
  radiusSm: '0px',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowHover: '0 4px 12px rgba(0,0,0,0.1)',
  success: '#22C55E',
};

interface PricingPageProps {
  onUpgradeSuccess?: () => void;
}

export function PricingPage({ onUpgradeSuccess }: PricingPageProps) {
  const { user, profile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tiers = [
    {
      id: 'member',
      name: 'Member',
      price: '$0',
      period: '',
      description: 'Free tier with basic access',
      features: [
        '2 Match Analyses per day',
        'Basic chat with Nexus',
        'Career insights',
        'Community forum',
      ],
      cta: 'Get Started',
      popular: false,
      icon: Zap,
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$29',
      period: '/month',
      description: 'Premium leadership development',
      features: [
        '5 Match Analyses per day',
        'All SHIFT assessments',
        'Premium insights',
        'Priority support',
        'Unlimited reports',
        'Exclusive content',
      ],
      cta: 'Upgrade to Professional',
      popular: true,
      icon: Crown,
    },
  ];

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_COUNCIL || '',
          successUrl: `${window.location.origin}/settings?upgraded=true`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (e: any) {
      console.error('Upgrade error:', e);
      setError(e.message || 'Failed to start upgrade');
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    if (!user) {
      window.location.href = '/auth/signin';
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: DS.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 24px 0', width: '100%' }}>
        <Link to="/" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none', display: 'inline-block', marginBottom: '16px', fontFamily: DS.bodyFont }}>← Back to home</Link>
      </div>

      {/* Header */}
      <header style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px 64px', textAlign: 'center', width: '100%' }}>
        <h1 style={{ fontFamily: DS.headingFont, fontSize: '32px', fontWeight: 700, color: DS.text, margin: '0 0 16px' }}>
          Choose Your Plan
        </h1>
        <p style={{ fontFamily: DS.bodyFont, fontSize: '16px', color: DS.muted, lineHeight: 1.6, maxWidth: '560px', margin: '0 auto' }}>
          Select the right tier for your leadership journey. Upgrade anytime as your needs grow.
        </p>
      </header>

      {/* Pricing Cards */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 64px', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isCurrentTier = profile?.tier === tier.id;

            return (
              <div
                key={tier.id}
                style={{
                  position: 'relative',
                  background: DS.card,
                  border: `2px solid ${tier.popular ? DS.accent : DS.cardBorder}`,
                  borderRadius: DS.radius,
                  padding: '32px 24px',
                  boxShadow: DS.shadowHover,
                }}
              >
                {tier.popular && (
                  <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)' }}>
                    <span style={{
                      background: DS.accent,
                      color: '#FFFFFF',
                      padding: '4px 12px',
                      borderRadius: DS.radius,
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontFamily: DS.bodyFont,
                    }}>
                      <Sparkles style={{ width: 12, height: 12 }} />
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrentTier && (
                  <div style={{ position: 'absolute', top: '-14px', right: '16px' }}>
                    <span style={{
                      background: DS.success,
                      color: '#FFFFFF',
                      padding: '4px 12px',
                      borderRadius: DS.radius,
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: DS.bodyFont,
                    }}>
                      Current Plan
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: tier.popular ? DS.accent : DS.muted,
                    borderRadius: DS.radius,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon style={{ width: 24, height: 24, color: '#FFFFFF' }} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: 0 }}>
                      {tier.name}
                    </h3>
                    <p style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.muted, margin: '4px 0 0' }}>
                      {tier.description}
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <span style={{ fontFamily: DS.headingFont, fontSize: '32px', fontWeight: 700, color: DS.text }}>
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span style={{ fontFamily: DS.bodyFont, fontSize: '14px', color: DS.muted, marginLeft: '4px' }}>
                      {tier.period}
                    </span>
                  )}
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tier.features.map((feature, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: DS.bodyFont, fontSize: '14px', color: DS.textSecondary }}>
                      <Check style={{ width: 18, height: 18, color: DS.success, flexShrink: 0 }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={tier.id === 'professional' ? handleUpgrade : handleGetStarted}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    background: tier.popular ? DS.accent : DS.bgAlt,
                    color: tier.popular ? '#FFFFFF' : DS.text,
                    border: 'none',
                    borderRadius: DS.radius,
                    fontFamily: DS.bodyFont,
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    minHeight: '48px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                      Processing...
                    </>
                  ) : (
                    <>
                      {tier.cta}
                      <ArrowRight style={{ width: 16, height: 16 }} />
                    </>
                  )}
                </button>

                {error && tier.id === 'professional' && (
                  <p style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: '#EF4444', marginTop: '12px', textAlign: 'center' }}>
                    {error}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 64px', width: '100%' }}>
        <h2 style={{ fontFamily: DS.headingFont, fontSize: '24px', fontWeight: 700, color: DS.text, textAlign: 'center', margin: '0 0 32px' }}>
          Feature Comparison
        </h2>
        <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: DS.bodyFont }}>
            <thead>
              <tr style={{ background: DS.bgAlt }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, color: DS.textSecondary, fontSize: '14px' }}>Feature</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 600, color: DS.textSecondary, fontSize: '14px' }}>Member</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 600, color: DS.accent, fontSize: '14px' }}>Professional</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Daily Match Analyses', member: '2', professional: '5' },
                { feature: 'Nexus Chat', member: 'Basic', professional: 'Premium' },
                { feature: 'SHIFT Assessments', member: '✗', professional: '✓' },
                { feature: 'Career Reports', member: 'Basic', professional: 'Unlimited' },
                { feature: 'Priority Support', member: '✗', professional: '✓' },
                { feature: 'Exclusive Content', member: '✗', professional: '✓' },
                { feature: 'Team Insights', member: '✗', professional: '✓' },
              ].map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? DS.card : DS.bgAlt }}>
                  <td style={{ padding: '16px 24px', color: DS.textSecondary, fontSize: '14px' }}>{row.feature}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'center', color: DS.text, fontSize: '14px' }}>
                    {row.member}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'center', color: row.professional === '✓' ? DS.success : DS.accent, fontSize: '14px', fontWeight: 600 }}>
                    {row.professional}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 64px', width: '100%' }}>
        <h2 style={{ fontFamily: DS.headingFont, fontSize: '24px', fontWeight: 700, color: DS.text, textAlign: 'center', margin: '0 0 32px' }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            {
              question: 'Can I cancel my subscription at any time?',
              answer: 'Yes, you can cancel your Professional subscription at any time. You will continue to have access until the end of your current billing period.',
            },
            {
              question: 'How do Match Analyses work?',
              answer: 'Match Analyses are used for premium features like SHIFT assessments and advanced insights. Member accounts get 2 Match Analyses per day, while Professional members get 5 Match Analyses per day. Unused analyses do not roll over.',
            },
            {
              question: 'Can I upgrade or downgrade my plan?',
              answer: 'Absolutely! You can upgrade to Professional at any time. If you downgrade from Professional to Member, your change will take effect at the end of your current billing cycle.',
            },
            {
              question: 'What payment methods are accepted?',
              answer: 'We accept all major credit cards (Visa, Mastercard, American Express) through Stripe. We also support Apple Pay and Google Pay where available.',
            },
          ].map((faq, i) => (
            <div key={i} style={{
              background: DS.card,
              border: `1px solid ${DS.cardBorder}`,
              borderRadius: DS.radius,
              padding: '24px',
            }}>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>
                {faq.question}
              </h3>
              <p style={{ fontFamily: DS.bodyFont, fontSize: '14px', color: DS.muted, margin: 0, lineHeight: 1.6 }}>
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 64px', width: '100%' }}>
        <div style={{
          background: DS.accent,
          borderRadius: DS.radius,
          padding: '48px 32px',
          textAlign: 'center',
          color: '#FFFFFF',
        }}>
          <h2 style={{ fontFamily: DS.headingFont, fontSize: '24px', fontWeight: 700, margin: '0 0 16px', color: '#FFFFFF' }}>
            Ready to Elevate Your Leadership?
          </h2>
          <p style={{ fontFamily: DS.bodyFont, fontSize: '15px', margin: '0 0 24px', opacity: 0.9, lineHeight: 1.6 }}>
            Join Professional today and unlock premium features designed for ambitious leaders.
          </p>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            style={{
              background: '#FFFFFF',
              color: DS.accent,
              border: 'none',
              borderRadius: DS.radius,
              padding: '14px 28px',
              fontFamily: DS.bodyFont,
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '48px',
            }}
          >
            {loading ? (
              <>
                <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                Processing...
              </>
            ) : (
              <>
                Upgrade to Professional
                <ArrowRight style={{ width: 16, height: 16 }} />
              </>
            )}
          </button>
        </div>
      </section>

      <MinimalFooter />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
