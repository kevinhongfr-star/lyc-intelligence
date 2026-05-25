import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, ArrowRight, Loader2, Zap } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { UpgradeModal, TIERS } from '../components/credits/UpgradeModal';

const DS = {
  headingFont: 'Georgia, serif',
  accent: '#C108AB',
  bg: '#0A0A0A',
  card: '#111111',
  muted: '#888888',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  border: '#222222',
  success: '#10B981',
  warning: '#F59E0B'
};

const FEATURE_COMPARISON = [
  {
    category: 'Core Features',
    features: [
      { name: 'Nexus AI Chat', free: 'Unlimited', basic: 'Unlimited', pro: 'Unlimited', council: 'Unlimited' },
      { name: 'TRIDENT Match (per candidate)', free: '3 free', basic: '20/month', pro: 'Unlimited', council: 'Unlimited' },
      { name: 'Career Assessment (CPD)', free: '1 free', basic: 'Unlimited', pro: 'Unlimited', council: 'Unlimited' },
    ]
  },
  {
    category: 'Credits & Resources',
    features: [
      { name: 'Monthly Credits', free: '5/day', basic: '50/month', pro: '200/month', council: 'Unlimited' },
      { name: 'Document Uploads', free: '—', basic: '3 docs', pro: '10 docs', council: 'Unlimited' },
      { name: 'Memory Persistence', free: 'Session only', basic: '90 days', pro: 'Permanent', council: 'Permanent' },
    ]
  },
  {
    category: 'Premium Features',
    features: [
      { name: 'Priority AI Model', free: '—', basic: '—', pro: '✓', council: '✓' },
      { name: 'Quarterly Advisory Call', free: '—', basic: '—', pro: '—', council: '✓' },
      { name: 'Custom Branding (PDF)', free: '—', basic: '—', pro: '✓', council: '✓' },
      { name: 'White-Glove Onboarding', free: '—', basic: '—', pro: '—', council: '✓' },
      { name: 'Direct Partner Access', free: '—', basic: '—', pro: '—', council: '✓' },
    ]
  },
  {
    category: 'Support',
    features: [
      { name: 'Email Support', free: 'Basic', basic: 'Standard', pro: 'Priority', council: 'Dedicated' },
      { name: 'Response Time', free: '48h', basic: '24h', pro: '4h', council: '1h' },
    ]
  }
];

export function PricingPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentTier = profile?.tier || 'free';

  const handleSelectTier = async (tierId: string) => {
    if (!user) {
      navigate('/signup?tier=' + tierId);
      return;
    }

    setSelectedTier(tierId);
    setIsLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierId })
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setShowUpgrade(true);
      }
    } catch (e) {
      console.error('[Pricing] Checkout error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getCellContent = (value: string | boolean) => {
    if (value === true) return <Check style={{ width: 18, height: 18, color: DS.success }} />;
    if (value === false || value === '—') return <X style={{ width: 18, height: 18, color: DS.muted }} />;
    return <span style={{ fontSize: '13px', color: DS.textSecondary }}>{value}</span>;
  };

  return (
    <div style={{ minHeight: '100vh', background: DS.bg }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 16px',
            background: `${DS.accent}20`,
            borderRadius: '20px',
            marginBottom: '16px'
          }}>
            <Zap style={{ width: 16, height: 16, color: DS.accent }} />
            <span style={{ fontSize: '13px', color: DS.accent, fontWeight: 600 }}>Simple, Transparent Pricing</span>
          </div>
          <h1 style={{ fontFamily: DS.headingFont, fontSize: '48px', color: DS.text, marginBottom: '16px' }}>
            Choose Your Plan
          </h1>
          <p style={{ fontSize: '18px', color: DS.muted, maxWidth: '600px', margin: '0 auto' }}>
            Start free, upgrade when you need more. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Tier Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '64px'
        }}>
          {/* Free Tier */}
          <div style={{
            padding: '32px',
            background: DS.card,
            border: `1px solid ${DS.border}`,
            borderRadius: '16px'
          }}>
            <h3 style={{ fontFamily: DS.headingFont, fontSize: '24px', color: DS.text, marginBottom: '8px' }}>
              Free
            </h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
              <span style={{ fontSize: '40px', fontWeight: 800, color: DS.text }}>$0</span>
              <span style={{ color: DS.muted }}>/month</span>
            </div>
            <p style={{ color: DS.muted, fontSize: '14px', marginBottom: '24px' }}>
              Get started with basic features
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: DS.textSecondary }}>
                <Check style={{ width: 18, height: 18, color: DS.success }} />
                Unlimited Nexus chat
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: DS.textSecondary }}>
                <Check style={{ width: 18, height: 18, color: DS.success }} />
                1 free assessment
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: DS.textSecondary }}>
                <Check style={{ width: 18, height: 18, color: DS.success }} />
                5 credits daily
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: DS.textSecondary }}>
                <Check style={{ width: 18, height: 18, color: DS.success }} />
                Session-only memory
              </li>
            </ul>
            <button
              onClick={() => user ? null : navigate('/signup')}
              disabled={currentTier !== 'free'}
              style={{
                width: '100%',
                padding: '14px',
                background: currentTier === 'free' ? 'transparent' : DS.accent,
                border: `1px solid ${DS.border}`,
                borderRadius: '8px',
                color: currentTier === 'free' ? DS.muted : '#FFF',
                fontSize: '15px',
                fontWeight: 600,
                cursor: currentTier === 'free' ? 'default' : 'pointer',
                opacity: currentTier === 'free' ? 0.5 : 1
              }}
            >
              {currentTier === 'free' ? 'Current Plan' : user ? 'Downgrade' : 'Get Started'}
            </button>
          </div>

          {/* Paid Tiers */}
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              style={{
                padding: '32px',
                background: tier.popular ? `linear-gradient(135deg, ${DS.accent}20, ${DS.accent}05)` : DS.card,
                border: `2px solid ${tier.popular ? DS.accent : DS.border}`,
                borderRadius: '16px',
                position: 'relative'
              }}
            >
              {tier.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '6px 16px',
                  background: DS.accent,
                  color: '#FFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '14px',
                  textTransform: 'uppercase'
                }}>
                  Most Popular
                </div>
              )}

              <h3 style={{ fontFamily: DS.headingFont, fontSize: '24px', color: DS.text, marginBottom: '8px' }}>
                {tier.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
                <span style={{ fontSize: '40px', fontWeight: 800, color: DS.text }}>${tier.price}</span>
                <span style={{ color: DS.muted }}>/month</span>
              </div>
              <p style={{ color: DS.muted, fontSize: '14px', marginBottom: '24px' }}>
                {tier.credits === 999999 ? 'Unlimited' : tier.credits} credits per month
              </p>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tier.features.slice(0, 5).map((feature, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: DS.textSecondary }}>
                    <Check style={{ width: 18, height: 18, color: DS.success }} />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectTier(tier.id)}
                disabled={isLoading || currentTier === tier.id}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: tier.popular ? DS.accent : 'transparent',
                  border: `1px solid ${tier.popular ? DS.accent : DS.border}`,
                  borderRadius: '8px',
                  color: '#FFF',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: (isLoading || currentTier === tier.id) ? 'not-allowed' : 'pointer',
                  opacity: (isLoading || currentTier === tier.id) ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isLoading && selectedTier === tier.id ? (
                  <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                ) : currentTier === tier.id ? (
                  'Current Plan'
                ) : (
                  <>
                    Upgrade to {tier.name}
                    <ArrowRight style={{ width: 16, height: 16 }} />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div style={{ marginBottom: '64px' }}>
          <h2 style={{ fontFamily: DS.headingFont, fontSize: '32px', color: DS.text, marginBottom: '32px', textAlign: 'center' }}>
            Compare Plans
          </h2>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${DS.border}` }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: DS.text, fontSize: '14px', fontWeight: 600 }}>
                    Feature
                  </th>
                  <th style={{ padding: '16px', textAlign: 'center', color: DS.muted, fontSize: '13px', width: '120px' }}>
                    Free
                  </th>
                  <th style={{ padding: '16px', textAlign: 'center', color: DS.muted, fontSize: '13px', width: '120px' }}>
                    Basic
                  </th>
                  <th style={{ padding: '16px', textAlign: 'center', color: DS.accent, fontSize: '13px', width: '120px', fontWeight: 700 }}>
                    Pro
                  </th>
                  <th style={{ padding: '16px', textAlign: 'center', color: DS.muted, fontSize: '13px', width: '120px' }}>
                    Council
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_COMPARISON.map((section, si) => (
                  <React.Fragment key={si}>
                    <tr>
                      <td colSpan={5} style={{ padding: '20px 16px 8px', fontSize: '12px', fontWeight: 700, color: DS.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {section.category}
                      </td>
                    </tr>
                    {section.features.map((feature, fi) => (
                      <tr key={fi} style={{ borderBottom: `1px solid ${DS.border}` }}>
                        <td style={{ padding: '12px 16px', color: DS.textSecondary, fontSize: '14px' }}>
                          {feature.name}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {getCellContent(feature.free)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {getCellContent(feature.basic)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', background: `${DS.accent}05` }}>
                          {getCellContent(feature.pro)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {getCellContent(feature.council)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontFamily: DS.headingFont, fontSize: '32px', color: DS.text, marginBottom: '16px' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: DS.muted, marginBottom: '32px' }}>
            Still have questions? <a href="mailto:support@lycpartners.com" style={{ color: DS.accent }}>Contact our team</a>
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', textAlign: 'left' }}>
            {[
              { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time. You will retain access until the end of your billing period.' },
              { q: 'What happens to my credits if I downgrade?', a: 'You will keep any credits you have earned, but won\'t receive the monthly credit allocation for your new tier.' },
              { q: 'Do unused credits roll over?', a: 'Credits in paid tiers roll over month-to-month. Free tier credits reset daily.' },
              { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, debit cards, and PayPal through our secure Stripe integration.' },
            ].map((faq, i) => (
              <div key={i} style={{ padding: '20px', background: DS.card, borderRadius: '12px', border: `1px solid ${DS.border}` }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: DS.text, marginBottom: '8px' }}>{faq.q}</h4>
                <p style={{ fontSize: '14px', color: DS.muted, lineHeight: 1.6 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
