import React, { useState } from 'react';
import { X, Check, Loader2, Zap, ArrowRight } from 'lucide-react';

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
  warning: '#F59E0B',
  error: '#EF4444'
};

interface UpgradeModalProps {
  onClose: () => void;
  requiredCredits?: number;
  currentCredits?: number;
}

export const TIERS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 19,
    credits: 50,
    features: [
      '50 credits/month',
      'Unlimited assessment retries',
      '20 TRIDENT matches/month',
      '3 document uploads',
      '90-day memory persistence',
      'Standard AI model'
    ],
    notIncluded: [
      'Priority AI model',
      'Quarterly advisory call',
      'Custom branding'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    credits: 200,
    popular: true,
    features: [
      '200 credits/month',
      'Unlimited assessment retries',
      'Unlimited TRIDENT matches',
      '10 document uploads',
      'Permanent memory',
      'Priority AI model',
      'Custom branding'
    ],
    notIncluded: [
      'Quarterly advisory call'
    ]
  },
  {
    id: 'council',
    name: 'Council',
    price: 199,
    credits: 999999,
    features: [
      'Unlimited credits',
      'Unlimited everything',
      'Priority AI model (Claude)',
      'Quarterly advisory call',
      'Custom branding',
      'White-glove onboarding',
      'Direct LYC partner access'
    ],
    notIncluded: []
  }
];

export function UpgradeModal({ onClose, requiredCredits, currentCredits }: UpgradeModalProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (tierId: string) => {
    setSelectedTier(tierId);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierId })
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else if (data.error) {
        setError(data.error);
      }
    } catch (e) {
      console.error('[UpgradeModal] Checkout error:', e);
      setError('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 1000,
        overflow: 'auto'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: DS.card,
        border: `1px solid ${DS.border}`,
        borderRadius: '0px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px',
          borderBottom: `1px solid ${DS.border}`
        }}>
          <div>
            <h2 style={{ fontFamily: DS.headingFont, fontSize: '24px', color: DS.text, marginBottom: '4px' }}>
              Unlock Premium Features
            </h2>
            {requiredCredits && currentCredits !== undefined && (
              <p style={{ color: DS.muted, fontSize: '14px' }}>
                You need {requiredCredits} credits (have {currentCredits})
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: DS.muted,
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            <X style={{ width: 24, height: 24 }} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            margin: '16px 24px',
            padding: '12px',
            background: `${DS.error}20`,
            border: `1px solid ${DS.error}40`,
            borderRadius: '0px',
            color: DS.error,
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Tier Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          padding: '24px'
        }}>
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              style={{
                padding: '24px',
                background: tier.popular ? `linear-gradient(135deg, ${DS.accent}20, ${DS.accent}05)` : DS.bg,
                border: `2px solid ${tier.popular ? DS.accent : DS.border}`,
                borderRadius: '0px',
                position: 'relative'
              }}
            >
              {tier.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '4px 12px',
                  background: DS.accent,
                  color: '#FFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '0px',
                  textTransform: 'uppercase'
                }}>
                  Most Popular
                </div>
              )}

              <div style={{ marginBottom: '20px', paddingTop: tier.popular ? '8px' : 0 }}>
                <h3 style={{ fontFamily: DS.headingFont, fontSize: '20px', color: DS.text, marginBottom: '8px' }}>
                  {tier.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: DS.text }}>
                    ${tier.price}
                  </span>
                  <span style={{ color: DS.muted }}>/month</span>
                </div>
                <p style={{ fontSize: '13px', color: DS.muted, marginTop: '4px' }}>
                  {tier.credits === 999999 ? 'Unlimited' : tier.credits} credits/month
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', color: DS.muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Included
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tier.features.map((feature, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Check style={{ width: 16, height: 16, color: DS.success, flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '13px', color: DS.textSecondary }}>{feature}</span>
                    </div>
                  ))}
                  {tier.notIncluded.map((feature, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', opacity: 0.5 }}>
                      <X style={{ width: 16, height: 16, color: DS.muted, flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '13px', color: DS.muted }}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleUpgrade(tier.id)}
                disabled={isLoading && selectedTier === tier.id}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: tier.popular ? DS.accent : 'transparent',
                  border: `1px solid ${tier.popular ? DS.accent : DS.border}`,
                  borderRadius: '0px',
                  color: '#FFF',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: (isLoading && selectedTier === tier.id) ? 'not-allowed' : 'pointer',
                  opacity: (isLoading && selectedTier !== tier.id) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isLoading && selectedTier === tier.id ? (
                  <>
                    <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                    Redirecting...
                  </>
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

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${DS.border}`,
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '12px', color: DS.muted }}>
            Cancel anytime. No long-term contracts. Secure payment via Stripe.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
