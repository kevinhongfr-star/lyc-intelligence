import React, { useState } from 'react';
import { X, Check, Loader2, ArrowRight } from 'lucide-react';
import {
  CANONICAL_TIER_ORDER,
  CANONICAL_TIER_PRICING,
  RECOMMENDED_TIER,
  type TierKey,
} from '@/services/monetizationService';

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
  /** Miles required for the locked action */
  requiredCredits?: number;
  /** Current miles balance */
  currentCredits?: number;
  /** Legacy prop — accepted for backward compatibility, ignored (always miles). */
  unit?: 'credits' | 'miles';
}

/**
 * UpgradeModal — 5-tier upgrade modal.
 * Source of truth: CANONICAL_TIER_PRICING (Phase 15.5 / ticket #1303).
 * Currency = miles. Explorer = "Executive Introduction" (never "free").
 */
export function UpgradeModal({ onClose, requiredCredits, currentCredits, unit }: UpgradeModalProps) {
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (tierKey: TierKey) => {
    if (tierKey === 'explorer') {
      // Explorer = Executive Introduction — no checkout.
      onClose();
      return;
    }
    setSelectedTier(tierKey);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierKey })
      });

      const data = await response.json();

      if (data.url) {
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
        maxWidth: '1100px',
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
                You need {requiredCredits} mi (have {currentCredits} mi)
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
            aria-label="Close"
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
            color: DS.error,
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Tier Cards — 5 canonical tiers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          padding: '24px'
        }}>
          {CANONICAL_TIER_ORDER.map((tierKey) => {
            const tier = CANONICAL_TIER_PRICING[tierKey];
            const isRecommended = tierKey === RECOMMENDED_TIER;
            const isExplorer = tierKey === 'explorer';
            const label = isExplorer ? tier.alias! : tier.label;
            const priceLabel = tier.usdMonthly === 0
              ? 'Executive Introduction'
              : `$${tier.usdMonthly}/mo`;

            return (
              <div
                key={tierKey}
                style={{
                  padding: '20px',
                  background: isRecommended
                    ? `linear-gradient(135deg, ${DS.accent}20, ${DS.accent}05)`
                    : DS.bg,
                  border: `2px solid ${isRecommended ? DS.accent : DS.border}`,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {isRecommended && (
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
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap'
                  }}>
                    Recommended
                  </div>
                )}

                <div style={{ marginBottom: '16px', paddingTop: isRecommended ? '8px' : 0 }}>
                  <h3 style={{ fontFamily: DS.headingFont, fontSize: '18px', color: DS.text, marginBottom: '6px' }}>
                    {label}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '26px', fontWeight: 800, color: DS.text }}>
                      {priceLabel}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: DS.muted, marginTop: '4px' }}>
                    {tier.monthlyMiles === 0
                      ? 'Chat only · no monthly miles'
                      : `${tier.monthlyMiles} mi / month`}
                  </p>
                </div>

                <div style={{ marginBottom: '20px', flex: 1 }}>
                  <p style={{ fontSize: '11px', color: DS.muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Included
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {tier.benefits.slice(0, 4).map((feature, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <Check style={{ width: 14, height: 14, color: DS.success, flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontSize: '12px', color: DS.textSecondary }}>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleUpgrade(tierKey)}
                  disabled={isLoading && selectedTier === tierKey}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: isRecommended ? DS.accent : 'transparent',
                    border: `1px solid ${isRecommended ? DS.accent : DS.border}`,
                    color: '#FFF',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: (isLoading && selectedTier === tierKey) ? 'not-allowed' : 'pointer',
                    opacity: (isLoading && selectedTier !== tierKey) ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {isLoading && selectedTier === tierKey ? (
                    <>
                      <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                      Redirecting...
                    </>
                  ) : isExplorer ? (
                    'Get Started'
                  ) : (
                    <>
                      Upgrade to {tier.label}
                      <ArrowRight style={{ width: 14, height: 14 }} />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${DS.border}`,
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '12px', color: DS.muted }}>
            Cancel anytime. No long-term contracts. Secure payment via Stripe. Currency is miles.
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export { CANONICAL_TIER_ORDER as UPGRADE_TIERS_ORDER };
