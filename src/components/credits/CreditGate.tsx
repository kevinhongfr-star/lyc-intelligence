import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { UpgradeModal } from './UpgradeModal';

import { DS } from '@/lib/designSystem';

export type ActionType = 
  | 'assessment'
  | 'match_single'
  | 'match_batch'
  | 'linkedin_audit'
  | 'cv_optimization'
  | 'pdf_report'
  | 'document_upload';

export const CREDIT_COSTS: Record<ActionType, number> = {
  assessment: 1,
  match_single: 3,
  match_batch: 8,
  linkedin_audit: 5,
  cv_optimization: 3,
  pdf_report: 3,
  document_upload: 1
};

export const ACTION_LABELS: Record<ActionType, string> = {
  assessment: 'Assessment (CPD)',
  match_single: 'TRIDENT Match (1 candidate)',
  match_batch: 'TRIDENT Batch (5 candidates)',
  linkedin_audit: 'LinkedIn Profile Audit',
  cv_optimization: 'CV Optimization',
  pdf_report: 'Branded PDF Report',
  document_upload: 'Document Upload'
};

interface CreditGateProps {
  action: ActionType;
  children: React.ReactNode;
  onSuccess?: () => void;
  disabled?: boolean;
}

export function CreditGate({ action, children, onSuccess, disabled = false }: CreditGateProps) {
  const { user, profile } = useAuthStore();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasCredits, setHasCredits] = useState(false);
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);

  const credits = profile?.credits?.balance ?? 0;
  const cost = CREDIT_COSTS[action];
  const tier = profile?.tier || 'free';

  useEffect(() => {
    checkCredits();
  }, [credits, cost, tier, disabled]);

  const checkCredits = () => {
    if (disabled) {
      setHasCredits(false);
      return;
    }

    if (tier !== 'free') {
      setHasCredits(true);
      return;
    }

    setHasCredits(credits >= cost);
  };

  const handleClick = async () => {
    if (!hasCredits) {
      setShowUpgrade(true);
      return;
    }

    if (disabled) return;

    setIsProcessing(true);
    
    try {
      // Attempt to spend credits via API
      const response = await fetch('/api/credits/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.id,
          action,
          amount: cost 
        })
      });

      const data = await response.json();

      if (data.success) {
        // Credits spent successfully
        if (onSuccess) onSuccess();
      } else {
        // Insufficient credits
        setShowInsufficientCredits(true);
        setShowUpgrade(true);
      }
    } catch (e) {
      console.error('[CreditGate] Spend error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '8px',
        padding: '16px',
        background: `${DS.accent}20`,
        border: `1px solid ${DS.accent}40`,
        borderRadius: '12px',
        color: DS.text
      }}>
        <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
        Processing...
      </div>
    );
  }

  return (
    <>
      <div onClick={handleClick} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
        {hasCredits ? (
          children
        ) : (
          <div style={{
            padding: '32px',
            background: showInsufficientCredits ? `${DS.warning}10` : `${DS.muted}10`,
            border: `1px solid ${showInsufficientCredits ? DS.warning : DS.muted}`,
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            {showInsufficientCredits ? (
              <>
                <AlertCircle style={{ width: 48, height: 48, color: DS.warning, margin: '0 auto 16px' }} />
                <h3 style={{ fontFamily: DS.headingFont, fontSize: '18px', color: DS.text, marginBottom: '8px' }}>
                  Insufficient Credits
                </h3>
                <p style={{ color: DS.textSecondary, marginBottom: '16px' }}>
                  This action requires <strong>{cost} credits</strong>, but you only have <strong>{credits}</strong>.
                </p>
              </>
            ) : (
              <>
                <Lock style={{ width: 48, height: 48, color: DS.muted, margin: '0 auto 16px' }} />
                <h3 style={{ fontFamily: DS.headingFont, fontSize: '18px', color: DS.text, marginBottom: '8px' }}>
                  Premium Feature
                </h3>
                <p style={{ color: DS.textSecondary, marginBottom: '16px' }}>
                  This action requires {cost} credits
                </p>
              </>
            )}
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '12px 24px',
              background: DS.accent,
              color: '#FFF',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600
            }}>
              {credits >= cost ? 'Use Credits' : 'Upgrade to Continue'}
            </div>
          </div>
        )}
      </div>

      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          requiredCredits={cost}
          currentCredits={credits}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
