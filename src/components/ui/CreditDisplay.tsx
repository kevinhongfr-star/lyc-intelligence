import React from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { useCredits } from '@/contexts/CreditContext';

import { DS } from '@/lib/designSystem';
interface CreditDisplayProps {
  showTier?: boolean;
}


export function CreditDisplay({ showTier = false }: CreditDisplayProps) {
  const { credit } = useCredits();

  const getTierColor = () => {
    switch (credit.tier) {
      case 'pro':
        return DS.accent;
      case 'basic':
        return DS.success;
      case 'enterprise':
        return DS.accent;
      default:
        return DS.textSecondary;
    }
  };

  const getBalanceColor = () => {
    if (credit.tier === 'enterprise') return DS.accent;
    if (credit.tier === 'pro' || credit.tier === 'basic') return DS.success;
    if (credit.balance <= 0) return '#DC2626';
    if (credit.balance <= 2) return DS.warning;
    return DS.text;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      background: DS.card,
      border: `1px solid ${DS.border}`,
      borderRadius: DS.radius,
    }}>
      <Zap style={{ width: 14, height: 14, color: getBalanceColor() }} />
      {credit.isLoading ? (
        <Loader2 style={{ width: 14, height: 14, color: DS.muted, animation: 'spin 1s linear infinite' }} />
      ) : (
        <>
          <span style={{ fontSize: '13px', fontWeight: 600, color: getBalanceColor() }}>
            {credit.tier === 'enterprise' ? '∞' : credit.balance}
          </span>
          <span style={{ fontSize: '11px', color: DS.muted }}>
            credits
          </span>
          {showTier && (
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              color: getTierColor(),
              textTransform: 'uppercase',
              padding: '2px 6px',
              background: `${getTierColor()}15`,
              borderRadius: '4px',
            }}>
              {credit.tier}
            </span>
          )}
        </>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
