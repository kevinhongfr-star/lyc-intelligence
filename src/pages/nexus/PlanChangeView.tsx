import React, { useState } from 'react';
import { V1 } from '@/styles/v1-tokens';

type Tier = 'explorer' | 'professional' | 'executive';
type ConfirmView = 'none' | 'downgrade' | 'cancel';

interface PlanChangeViewProps {
  currentTier?: Tier;
  onUpgrade?: (tier: Tier) => void;
  onDowngrade?: (tier: Tier) => void;
  onCancel?: () => void;
  onDone?: () => void;
}

const TIER_ORDER: Tier[] = ['explorer', 'professional', 'executive'];

const TIERS: Record<Tier, {
  eyebrow: string;
  name: string;
  price: string;
  billed: string;
  features: { text: string; enabled: boolean }[];
}> = {
  explorer: {
    eyebrow: 'EXPLORER',
    name: 'Explorer',
    price: '$0',
    billed: 'at no cost',
    features: [
      { text: '20 NEXUS messages / day', enabled: true },
      { text: 'PRISM lens baseline', enabled: true },
      { text: 'Standard result readouts', enabled: true },
      { text: 'Lenses beyond PRISM', enabled: false },
      { text: 'DEX AI assessments', enabled: false },
      { text: 'Document uploads & coaching hours', enabled: false },
    ],
  },
  professional: {
    eyebrow: 'PROFESSIONAL',
    name: 'Professional',
    price: '$99/mo',
    billed: 'billed monthly',
    features: [
      { text: 'All the NEXUS messages you need', enabled: true },
      { text: '12 lenses / year', enabled: true },
      { text: '4 coaching hours / month', enabled: true },
      { text: 'DEX AI assessments', enabled: true },
      { text: 'Document uploads & storage', enabled: true },
      { text: 'Quarterly executive workshops', enabled: false },
    ],
  },
  executive: {
    eyebrow: 'EXECUTIVE',
    name: 'Executive',
    price: '$299/mo',
    billed: 'billed monthly',
    features: [
      { text: 'Everything in Professional', enabled: true },
      { text: 'All available lenses', enabled: true },
      { text: '12 coaching hours / month', enabled: true },
      { text: 'Quarterly executive workshops', enabled: true },
      { text: 'Priority NEXUS response queue', enabled: true },
      { text: 'Dedicated account contact', enabled: true },
    ],
  },
};

const CANCEL_REASONS = [
  'Too expensive',
  'Not using enough',
  'Switching to a competitor',
  'Other',
];

export default function PlanChangeView({
  currentTier = 'professional',
  onUpgrade,
  onDowngrade,
  onCancel,
  onDone,
}: PlanChangeViewProps) {
  const [confirmView, setConfirmView] = useState<ConfirmView>('none');
  const [pendingTier, setPendingTier] = useState<Tier | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  const currentIndex = TIER_ORDER.indexOf(currentTier);

  function handleTierClick(tier: Tier) {
    const idx = TIER_ORDER.indexOf(tier);
    if (idx === currentIndex) return;
    if (idx > currentIndex) {
      onUpgrade?.(tier);
      onDone?.();
    } else {
      setPendingTier(tier);
      setConfirmView('downgrade');
    }
  }

  function confirmDowngrade() {
    if (pendingTier) {
      onDowngrade?.(pendingTier);
    }
    setConfirmView('none');
    setPendingTier(null);
    onDone?.();
  }

  function confirmCancel() {
    onCancel?.();
    setConfirmView('none');
    onDone?.();
  }

  return (
    <div
      style={{
        fontFamily: V1.bodyFont,
        color: V1.ink900,
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontFamily: V1.monoFont,
            fontSize: 11,
            letterSpacing: V1.trackingMono,
            textTransform: 'uppercase',
            color: V1.teal600,
            marginBottom: 8,
          }}
        >
          Your plan
        </div>
        <h1
          style={{
            fontFamily: V1.displayFont,
            fontSize: 32,
            letterSpacing: V1.trackingTight,
            lineHeight: 1.1,
            color: V1.ink900,
            margin: 0,
          }}
        >
          Change your plan
        </h1>
        <p
          style={{
            fontFamily: V1.displayFont,
            fontStyle: 'italic',
            fontSize: 16,
            color: V1.ink600,
            margin: '10px 0 0',
          }}
        >
          All changes take effect at the end of your billing period unless you're upgrading.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 16,
        }}
      >
        {(Object.keys(TIERS) as Tier[]).map((tierKey) => {
          const tier = TIERS[tierKey];
          const isCurrent = tierKey === currentTier;
          const idx = TIER_ORDER.indexOf(tierKey);
          const isHigher = idx > currentIndex;
          const isLower = idx < currentIndex;
          const isRecommended = tierKey === 'executive' && currentTier !== 'executive';

          return (
            <div
              key={tierKey}
              style={{
                flex: 1,
                border: isCurrent
                  ? `2px solid ${V1.teal600}`
                  : isRecommended
                    ? `2px solid ${V1.fuchsia600}`
                    : `1px solid ${V1.ink200}`,
                padding: 24,
                background: V1.white,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {isCurrent && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 14,
                    fontFamily: V1.monoFont,
                    fontSize: 10.4,
                    letterSpacing: V1.trackingMono,
                    textTransform: 'uppercase',
                    background: V1.teal50,
                    color: V1.teal700,
                    padding: '4px 8px',
                  }}
                >
                  Current plan
                </div>
              )}
              {isRecommended && !isCurrent && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 14,
                    fontFamily: V1.monoFont,
                    fontSize: 10.4,
                    letterSpacing: V1.trackingMono,
                    textTransform: 'uppercase',
                    background: V1.fuchsia50,
                    color: V1.fuchsia600,
                    padding: '4px 8px',
                  }}
                >
                  Recommended
                </div>
              )}

              <div
                style={{
                  fontFamily: V1.monoFont,
                  fontSize: 11,
                  letterSpacing: V1.trackingMono,
                  textTransform: 'uppercase',
                  color: V1.ink500,
                  marginBottom: 8,
                  marginTop: isCurrent || isRecommended ? 24 : 0,
                }}
              >
                {tier.eyebrow}
              </div>

              <div
                style={{
                  fontFamily: V1.displayFont,
                  fontSize: 22,
                  fontWeight: 600,
                  color: V1.ink900,
                  marginBottom: 12,
                }}
              >
                {tier.name}
              </div>

              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontFamily: V1.displayFont,
                    fontSize: 40,
                    fontWeight: 600,
                    lineHeight: 1,
                    letterSpacing: V1.trackingTight,
                    color: V1.ink900,
                  }}
                >
                  {tier.price}
                </div>
                <div
                  style={{
                    fontFamily: V1.monoFont,
                    fontSize: 12,
                    color: V1.ink500,
                    marginTop: 4,
                  }}
                >
                  {tier.billed}
                </div>
              </div>

              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 24px',
                  flex: 1,
                }}
              >
                {tier.features.map((f, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      padding: '6px 0',
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: f.enabled ? V1.ink700 : V1.ink400,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: V1.monoFont,
                        color: f.enabled ? V1.teal600 : V1.ink300,
                        flexShrink: 0,
                        width: 14,
                        marginTop: -1,
                      }}
                    >
                      {f.enabled ? '✓' : '−'}
                    </span>
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${V1.ink300}`,
                    background: V1.white,
                    color: V1.ink400,
                    fontFamily: V1.monoFont,
                    fontSize: 12,
                    letterSpacing: V1.trackingMono,
                    textTransform: 'uppercase',
                    cursor: 'default',
                  }}
                >
                  Current plan
                </button>
              ) : isHigher ? (
                <button
                  onClick={() => handleTierClick(tierKey)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: V1.teal800,
                    color: V1.white,
                    fontFamily: V1.monoFont,
                    fontSize: 12,
                    letterSpacing: V1.trackingMono,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Upgrade to {tier.name} →
                </button>
              ) : (
                <button
                  onClick={() => handleTierClick(tierKey)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${V1.ink300}`,
                    background: V1.white,
                    color: V1.ink700,
                    fontFamily: V1.monoFont,
                    fontSize: 12,
                    letterSpacing: V1.trackingMono,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Switch to {tier.name}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {confirmView === 'downgrade' && (
        <div
          style={{
            border: `2px solid #FECACA`,
            padding: 20,
            background: V1.white,
            marginTop: 28,
          }}
        >
          <h3
            style={{
              fontFamily: V1.displayFont,
              fontSize: 22,
              color: V1.ink900,
              fontWeight: 600,
              margin: '0 0 8px',
            }}
          >
            Downgrade to Explorer?
          </h3>
          <p style={{ fontSize: 15, color: V1.ink600, lineHeight: 1.6, margin: '0 0 12px' }}>
            You'll lose access to:
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
            {['Lenses beyond PRISM', 'DEX AI assessments', 'Document uploads', 'Coaching hours'].map((item) => (
              <li
                key={item}
                style={{
                  fontSize: 14,
                  color: V1.ink600,
                  padding: '4px 0',
                  paddingLeft: 16,
                  position: 'relative',
                }}
              >
                <span style={{ position: 'absolute', left: 0, color: V1.ink400 }}>·</span>
                {item}
              </li>
            ))}
          </ul>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 12,
              color: V1.ink500,
              marginBottom: 20,
            }}
          >
            Effective: Sep 30, 2026
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button
              onClick={confirmDowngrade}
              style={{
                padding: '12px 20px',
                border: `1px solid #DC2626`,
                background: V1.white,
                color: '#DC2626',
                fontFamily: V1.monoFont,
                fontSize: 12,
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Confirm downgrade
            </button>
            <button
              onClick={() => { setConfirmView('none'); setPendingTier(null); }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: V1.monoFont,
                fontSize: 13,
                color: V1.teal700,
                fontWeight: 500,
              }}
            >
              Keep Professional
            </button>
          </div>
        </div>
      )}

      {confirmView === 'cancel' && (
        <div
          style={{
            border: `2px solid #FECACA`,
            padding: 20,
            background: V1.white,
            marginTop: 28,
          }}
        >
          <h3
            style={{
              fontFamily: V1.displayFont,
              fontSize: 22,
              color: V1.ink900,
              fontWeight: 600,
              margin: '0 0 12px',
            }}
          >
            Are you sure you want to cancel?
          </h3>

          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontFamily: V1.monoFont,
                fontSize: 11,
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                color: V1.ink400,
                marginBottom: 8,
              }}
            >
              Reason for cancelling
            </div>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: `1px solid ${V1.ink200}`,
                background: V1.white,
                color: V1.ink700,
                fontFamily: V1.monoFont,
                fontSize: 13,
                outline: 'none',
              }}
            >
              <option value="">Select a reason</option>
              {CANCEL_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <p style={{ fontSize: 15, color: V1.ink600, lineHeight: 1.6, margin: '0 0 20px' }}>
            Your access ends on Sep 30, 2026.
          </p>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button
              onClick={confirmCancel}
              style={{
                padding: '12px 20px',
                border: `1px solid #DC2626`,
                background: V1.white,
                color: '#DC2626',
                fontFamily: V1.monoFont,
                fontSize: 12,
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Cancel my subscription
            </button>
            <button
              onClick={() => setConfirmView('none')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: V1.monoFont,
                fontSize: 13,
                color: V1.teal700,
                fontWeight: 500,
              }}
            >
              Keep my plan
            </button>
          </div>
        </div>
      )}

      {confirmView === 'none' && (
        <div
          style={{
            height: 1,
            background: V1.ink100,
            margin: '48px 0',
          }}
        />
      )}

      {confirmView === 'none' && (
        <div style={{ paddingTop: confirmView === 'none' ? 0 : 0 }}>
          <h3
            style={{
              fontFamily: V1.displayFont,
              fontSize: 18,
              color: V1.ink900,
              fontWeight: 600,
              margin: '0 0 10px',
            }}
          >
            Cancel your subscription
          </h3>
          <p
            style={{
              fontFamily: V1.bodyFont,
              fontSize: 14,
              lineHeight: 1.6,
              color: V1.ink600,
              margin: '0 0 14px',
              maxWidth: 560,
            }}
          >
            If you cancel, you'll lose access to premium features at the end of your billing period. Your data will be kept for 30 days.
          </p>
          <button
            onClick={() => setConfirmView('cancel')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: V1.monoFont,
              fontSize: 11.2,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: '#DC2626',
            }}
          >
            Cancel subscription →
          </button>
        </div>
      )}
    </div>
  );
}
