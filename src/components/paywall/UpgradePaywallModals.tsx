import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { V1 } from '@/styles/v1-tokens';

interface TierPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  currentTier?: string;
  upgradeToTier?: string;
  onUpgrade?: () => void;
}

interface MilesPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredMiles: number;
  currentMiles: number;
  lensName?: string;
  onAddMiles?: () => void;
  onBrowseLenses?: () => void;
}

const FEATURE_COMPARISON = [
  {
    label: 'AI coaching sessions',
    mono: 'AI COACHING',
    current: '3 per month',
    upgrade: 'Unlimited',
    currentHas: true,
    upgradeHas: true,
  },
  {
    label: 'Diagnostic lenses count',
    mono: 'LENSES',
    current: '2 per month',
    upgrade: 'All 11 lenses',
    currentHas: true,
    upgradeHas: true,
  },
  {
    label: 'Document uploads',
    mono: 'DOCUMENTS',
    current: '−',
    upgrade: '50 per month',
    currentHas: false,
    upgradeHas: true,
  },
  {
    label: 'DEX AI access',
    mono: 'DEX AI',
    current: '−',
    upgrade: 'Included',
    currentHas: false,
    upgradeHas: true,
  },
  {
    label: 'Advisory sessions',
    mono: 'ADVISORY',
    current: '−',
    upgrade: '2 per quarter',
    currentHas: false,
    upgradeHas: true,
  },
  {
    label: 'Human coaching hours',
    mono: 'COACHING',
    current: '−',
    upgrade: '6 hrs / month',
    currentHas: false,
    upgradeHas: true,
  },
];

export function TierPaywallModal({
  isOpen,
  onClose,
  featureName,
  currentTier,
  upgradeToTier,
  onUpgrade,
}: TierPaywallModalProps) {
  const displayTier = upgradeToTier || 'Professional';
  const displayCurrentTier = currentTier || 'EXPLORER';

  const title = (
    <span
      style={{
        fontFamily: V1.displayFont,
        fontSize: 28,
        lineHeight: 1.1,
        color: V1.text,
        fontWeight: V1.fwRegular,
        letterSpacing: V1.trackingTight,
      }}
    >
      This is a {displayTier} feature
    </span>
  );

  const description = (
    <span
      style={{
        fontFamily: V1.bodyFont,
        fontSize: V1.textBody,
        color: V1.ink600,
        lineHeight: V1.leadingBody,
      }}
    >
      {featureName
        ? `${featureName} is available on the ${displayTier} tier and above.`
        : `This feature is available on the ${displayTier} tier and above.`}
    </span>
  );

  const body = (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1px 1fr',
          border: `1px solid ${V1.border}`,
        }}
      >
        <div style={{ padding: '16px 20px' }}>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11.2,
              textTransform: 'uppercase',
              letterSpacing: V1.trackingMono,
              color: V1.textMuted,
              marginBottom: 4,
            }}
          >
            CURRENT · {displayCurrentTier}
          </div>
        </div>
        <div style={{ background: V1.border }} />
        <div style={{ padding: '16px 20px' }}>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11.2,
              textTransform: 'uppercase',
              letterSpacing: V1.trackingMono,
              color: V1.teal700,
              marginBottom: 4,
            }}
          >
            {displayTier.toUpperCase()}
          </div>
        </div>

        {FEATURE_COMPARISON.map((row, idx) => (
          <React.Fragment key={row.mono}>
            <div
              style={{
                padding: '14px 20px',
                borderTop: idx > 0 ? `1px solid ${V1.dividerSubtle}` : undefined,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <div
                style={{
                  fontFamily: V1.monoFont,
                  fontSize: 11.2,
                  textTransform: 'uppercase',
                  letterSpacing: V1.trackingMono,
                  color: V1.textMuted,
                  marginBottom: 4,
                }}
              >
                {row.mono}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: V1.displayFont,
                    fontSize: 15,
                    color: V1.text,
                    lineHeight: 1.3,
                    marginBottom: 2,
                  }}
                >
                  {row.label}
                </div>
                <div
                  style={{
                    fontFamily: V1.bodyFont,
                    fontSize: 13,
                    color: row.currentHas ? V1.textSecondary : V1.ink500,
                    marginTop: 4,
                  }}
                >
                  {row.current}
                </div>
                <span
                  style={{
                    color: row.currentHas ? V1.teal600 : V1.ink400,
                    fontFamily: V1.bodyFont,
                    fontSize: 14,
                    fontWeight: V1.fwMedium,
                    marginTop: 4,
                    display: 'inline-block',
                  }}
                >
                  {row.currentHas ? '✓' : '−'}
                </span>
              </div>
            </div>
            <div
              style={{
                background: idx > 0 ? V1.dividerSubtle : 'transparent',
                width: '100%',
                height: '100%',
              }}
            />
            <div
              style={{
                padding: '14px 20px',
                borderTop: idx > 0 ? `1px solid ${V1.dividerSubtle}` : undefined,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: V1.displayFont,
                    fontSize: 15,
                    color: V1.text,
                    lineHeight: 1.3,
                    marginBottom: 2,
                  }}
                >
                  {row.label}
                </div>
                <div
                  style={{
                    fontFamily: V1.bodyFont,
                    fontSize: 13,
                    color: row.upgradeHas ? V1.textSecondary : V1.ink500,
                    marginTop: 4,
                  }}
                >
                  {row.upgrade}
                </div>
                <span
                  style={{
                    color: row.upgradeHas ? V1.teal600 : V1.ink400,
                    fontFamily: V1.bodyFont,
                    fontSize: 14,
                    fontWeight: V1.fwMedium,
                    marginTop: 4,
                    display: 'inline-block',
                  }}
                >
                  {row.upgradeHas ? '✓' : '−'}
                </span>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const footer = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        width: '100%',
      }}
    >
      <button
        type="button"
        onClick={onUpgrade}
        style={{
          width: '100%',
          background: V1.teal800,
          color: V1.white,
          fontFamily: V1.monoFont,
          fontSize: 11.2,
          textTransform: 'uppercase',
          letterSpacing: V1.trackingMono,
          padding: '14px 20px',
          border: 'none',
          borderRadius: V1.radius,
          cursor: 'pointer',
          boxShadow: 'none',
          transition: `background ${V1.durFast}ms ${V1.ease}`,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = V1.teal700)}
        onMouseLeave={(e) => (e.currentTarget.style.background = V1.teal800)}
      >
        Upgrade to {displayTier} →
      </button>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: V1.ink500,
          fontFamily: V1.monoFont,
          fontSize: 11.2,
          textTransform: 'uppercase',
          letterSpacing: V1.trackingMono,
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: V1.radius,
        }}
      >
        Maybe later
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
      footer={footer}
    >
      {body}
    </Modal>
  );
}

export function MilesPaywallModal({
  isOpen,
  onClose,
  requiredMiles,
  currentMiles,
  lensName,
  onAddMiles,
  onBrowseLenses,
}: MilesPaywallModalProps) {
  const shortfall = Math.max(0, requiredMiles - currentMiles);

  const title = (
    <span
      style={{
        fontFamily: V1.displayFont,
        fontSize: 28,
        lineHeight: 1.1,
        color: V1.text,
        fontWeight: V1.fwRegular,
        letterSpacing: V1.trackingTight,
      }}
    >
      You need {shortfall} more mi
    </span>
  );

  const body = (
    <div>
      <p
        style={{
          fontFamily: V1.displayFont,
          fontStyle: 'italic',
          fontSize: 18,
          color: V1.textSecondary,
          lineHeight: 1.5,
          margin: '0 0 16px',
        }}
      >
        Starting {lensName || 'this lens'} costs {requiredMiles} mi.
      </p>
      <p
        style={{
          fontFamily: V1.bodyFont,
          fontSize: V1.textBody,
          color: V1.textSecondary,
          lineHeight: V1.leadingBody,
          margin: '0 0 24px',
        }}
      >
        You currently have {currentMiles} mi available. Add miles to your account or try another lens from the library.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1px 1fr',
          border: `1px solid ${V1.ink200}`,
        }}
      >
        <div style={{ padding: '20px' }}>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11.2,
              textTransform: 'uppercase',
              letterSpacing: V1.trackingMono,
              color: V1.textMuted,
              marginBottom: 8,
            }}
          >
            Available
          </div>
          <div
            style={{
              fontFamily: V1.displayFont,
              fontSize: 36,
              lineHeight: 1,
              color: V1.text,
              fontWeight: V1.fwRegular,
              letterSpacing: V1.trackingTight,
            }}
          >
            {currentMiles} mi
          </div>
        </div>
        <div style={{ background: V1.ink200 }} />
        <div style={{ padding: '20px' }}>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11.2,
              textTransform: 'uppercase',
              letterSpacing: V1.trackingMono,
              color: V1.textMuted,
              marginBottom: 8,
            }}
          >
            Required
          </div>
          <div
            style={{
              fontFamily: V1.displayFont,
              fontSize: 36,
              lineHeight: 1,
              color: V1.text,
              fontWeight: V1.fwRegular,
              letterSpacing: V1.trackingTight,
            }}
          >
            {requiredMiles} mi
          </div>
        </div>
      </div>
    </div>
  );

  const footer = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        gap: 16,
      }}
    >
      <button
        type="button"
        onClick={onBrowseLenses}
        style={{
          background: 'transparent',
          border: 'none',
          color: V1.ink500,
          fontFamily: V1.monoFont,
          fontSize: 11.2,
          textTransform: 'uppercase',
          letterSpacing: V1.trackingMono,
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: V1.radius,
        }}
      >
        Browse other lenses
      </button>
      <button
        type="button"
        onClick={onAddMiles}
        style={{
          background: V1.teal800,
          color: V1.white,
          fontFamily: V1.monoFont,
          fontSize: 11.2,
          textTransform: 'uppercase',
          letterSpacing: V1.trackingMono,
          padding: '12px 20px',
          border: 'none',
          borderRadius: V1.radius,
          cursor: 'pointer',
          boxShadow: 'none',
          transition: `background ${V1.durFast}ms ${V1.ease}`,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = V1.teal700)}
        onMouseLeave={(e) => (e.currentTarget.style.background = V1.teal800)}
      >
        Add miles →
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      footer={footer}
    >
      {body}
    </Modal>
  );
}

export default { TierPaywallModal, MilesPaywallModal };
