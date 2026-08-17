/**
 * SoftGate — soft gating component for tier-limited features.
 *
 * Batch 1.5 / Ticket 2: Soft gates, not hard walls. Shows a friendly nudge
 * when a user approaches or hits a tier limit. Does NOT block access —
 * it renders children normally and overlays a non-blocking message.
 *
 * Use cases:
 *  - NEXUS message count approaching daily limit
 *  - Feature tease when user doesn't have access but can upgrade
 */
import React from 'react';
import { useTier } from './TierProvider';
import { UpgradeCTA } from './UpgradeCTA';
import { TIERS, type TierKey } from '@/config/tiers';

export interface SoftGateProps {
  /**
   * Minimum tier required to fully access this feature.
   * If user is below this tier, the tease is shown.
   */
  requiredTier: TierKey;
  /** Children to render (always rendered — soft gate, not hard wall). */
  children: React.ReactNode;
  /** Optional message override. Defaults to config-derived placeholder. */
  message?: string;
  /** Whether to show the gate inline or as an overlay. */
  variant?: 'inline' | 'overlay';
  /** Called when the upgrade CTA is clicked. */
  onUpgrade?: () => void;
}

export function SoftGate({
  requiredTier,
  children,
  message,
  variant = 'inline',
  onUpgrade,
}: SoftGateProps): React.ReactElement {
  const { meets, displayName, nextUp } = useTier();

  // User has access — render children normally.
  if (meets(requiredTier)) {
    return <>{children}</>;
  }

  const requiredMeta = TIERS[requiredTier];
  const gateMessage = message ?? `[Soft gate placeholder: ${requiredMeta.displayName} tier required. You're on ${displayName}.]`;

  if (variant === 'overlay') {
    return (
      <div style={{ position: 'relative' }}>
        {children}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 14, color: '#333', margin: 0, maxWidth: 320 }}>{gateMessage}</p>
          {nextUp && <UpgradeCTA targetTier={nextUp} onUpgrade={onUpgrade} />}
        </div>
      </div>
    );
  }

  // Inline variant: children + nudge below
  return (
    <div>
      {children}
      <div
        style={{
          marginTop: 12,
          padding: '12px 16px',
          background: '#F5F5F5',
          border: '1px solid #E5E5E5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 13, color: '#666' }}>{gateMessage}</span>
        {nextUp && <UpgradeCTA targetTier={nextUp} variant="compact" onUpgrade={onUpgrade} />}
      </div>
    </div>
  );
}

export default SoftGate;
