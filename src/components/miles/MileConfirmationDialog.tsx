/**
 * MileConfirmationDialog — Confirmation before spending miles.
 *
 * Batch 2 / Ticket 4: "This assessment costs 3 miles. You have 5 miles
 * remaining. Continue?"
 *
 * Soft gate — user can always cancel. If insufficient miles, shows
 * upgrade / buy miles options instead of blocking.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { MileCostBadge } from './MileCostBadge';
import { UpgradeCTA } from '@/components/tier/UpgradeCTA';
import { getInstrumentMileCost } from '@/config/miles';

export interface MileConfirmationDialogProps {
  instrumentCode: string;
  instrumentName: string;
  userBalance: number;
  /** If true, this is a free Explorer token (0 miles). */
  isFreeToken?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function MileConfirmationDialog({
  instrumentCode,
  instrumentName,
  userBalance,
  isFreeToken,
  onConfirm,
  onCancel,
}: MileConfirmationDialogProps): React.ReactElement {
  const cost = isFreeToken ? 0 : getInstrumentMileCost(instrumentCode);
  const canAfford = isFreeToken || userBalance >= cost;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onCancel}>
      <div
        style={{
          background: '#fff',
          padding: '32px',
          maxWidth: 440,
          width: '90%',
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{
          fontSize: 20, fontWeight: 700, margin: '0 0 8px',
          fontFamily: "'DejaVu Serif', 'Georgia', serif",
        }}>
          {instrumentName}
        </h3>

        {isFreeToken ? (
          <p style={{ fontSize: 14, color: '#2D7A3E', margin: '0 0 24px' }}>
            This is a complimentary assessment included with your Explorer signup. No miles will be charged.
          </p>
        ) : (
          <p style={{ fontSize: 14, color: '#333', margin: '0 0 24px' }}>
            This assessment costs <strong>{cost} {cost === 1 ? 'mile' : 'miles'}</strong>.
            You have <strong>{userBalance} {userBalance === 1 ? 'mile' : 'miles'}</strong> remaining.
          </p>
        )}

        {canAfford ? (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
            <button onClick={onConfirm} style={confirmBtnStyle}>
              {isFreeToken ? 'Start Assessment' : `Continue (${cost} miles)`}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 14, color: '#666' }}>
              You need {cost - userBalance} more {cost - userBalance === 1 ? 'mile' : 'miles'} to take this assessment.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/pricing?tab=packs" style={buyMilesBtnStyle}>Buy Miles</Link>
              <UpgradeCTA targetTier="starter" variant="compact" />
            </div>
            <button onClick={onCancel} style={cancelBtnStyle}>Not now</button>
          </div>
        )}
      </div>
    </div>
  );
}

const confirmBtnStyle: React.CSSProperties = {
  padding: '12px 24px', fontSize: 14, fontWeight: 600,
  background: '#C108AB', color: '#fff', border: 'none', cursor: 'pointer',
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '12px 24px', fontSize: 14, fontWeight: 500,
  background: 'transparent', color: '#666', border: '1px solid #E5E5E5', cursor: 'pointer',
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

const buyMilesBtnStyle: React.CSSProperties = {
  padding: '8px 14px', fontSize: 13, fontWeight: 600,
  background: '#000', color: '#fff', textDecoration: 'none',
  display: 'inline-flex', alignItems: 'center',
};

export default MileConfirmationDialog;
