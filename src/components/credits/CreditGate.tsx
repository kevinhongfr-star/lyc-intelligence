import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { UpgradeModal } from './UpgradeModal';

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

export type ActionType =
  | 'assessment'
  | 'match_single'
  | 'match_batch'
  | 'linkedin_audit'
  | 'cv_optimization'
  | 'pdf_report'
  | 'document_upload';

type GateUnit = 'credits' | 'miles';

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
  match_single: 'Match Analysis (1 candidate)',
  match_batch: 'Match Analysis Batch (5 candidates)',
  linkedin_audit: 'LinkedIn Profile Audit',
  cv_optimization: 'CV Optimization',
  pdf_report: 'Branded PDF Report',
  document_upload: 'Document Upload'
};

const ASSESSMENT_ACTIONS: ActionType[] = ['assessment', 'pdf_report'];

interface CreditGateProps {
  action: ActionType;
  children: React.ReactNode;
  onSuccess?: () => void;
  disabled?: boolean;
  unit?: GateUnit;
}

export function CreditGate({ action, children, onSuccess, disabled = false, unit }: CreditGateProps) {
  const effectiveUnit: GateUnit = unit ?? 'miles';
  const { user, profile } = useAuthStore();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasCredits, setHasCredits] = useState(false);
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);

  const credits = profile?.credits?.balance ?? 0;
  const cost = CREDIT_COSTS[action];
  // #1320: Default to executive_introduction; accept legacy 'free'/'member' aliases.
  const tier = profile?.tier || 'executive_introduction';
  const isComplimentary = tier === 'executive_introduction' || tier === 'free' || tier === 'member';

  const unitNoun = effectiveUnit === 'miles' ? 'Miles' : 'Credits';
  const unitNounLower = effectiveUnit === 'miles' ? 'miles' : 'credits';
  const unitShort = effectiveUnit === 'miles' ? 'mi' : 'credits';

  useEffect(() => {
    checkCredits();
  }, [credits, cost, tier, disabled]);

  const checkCredits = () => {
    if (disabled) {
      setHasCredits(false);
      return;
    }

    // Paid-tier users have a monthly allowance (or effectively unlimited)
    // so the "not enough credits" paywall is only applied to complimentary-tier users.
    if (!isComplimentary) {
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
      const spendApi = effectiveUnit === 'miles' ? '/api/miles/spend' : '/api/credits/spend';
      const response = await fetch(spendApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          action,
          cost,
          unit: effectiveUnit,
        })
      });

      const data = await response.json();

      if (data.success) {
        if (onSuccess) onSuccess();
      } else {
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
            textAlign: 'center'
          }}>
            {showInsufficientCredits ? (
              <>
                <AlertCircle style={{ width: 48, height: 48, color: DS.warning, margin: '0 auto 16px' }} />
                <h3 style={{ fontFamily: DS.headingFont, fontSize: '18px', color: DS.text, marginBottom: '8px' }}>
                  Insufficient {unitNoun}
                </h3>
                <p style={{ color: DS.textSecondary, marginBottom: '16px' }}>
                  This action requires <strong>{cost} {unitShort}</strong>, but you only have <strong>{credits}</strong>.
                </p>
              </>
            ) : (
              <>
                <Lock style={{ width: 48, height: 48, color: DS.muted, margin: '0 auto 16px' }} />
                <h3 style={{ fontFamily: DS.headingFont, fontSize: '18px', color: DS.text, marginBottom: '8px' }}>
                  Premium Feature
                </h3>
                <p style={{ color: DS.textSecondary, marginBottom: '16px' }}>
                  This action requires {cost} {unitShort}
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
              fontSize: '14px',
              fontWeight: 600
            }}>
              {credits >= cost ? `Use ${unitNoun}` : 'Upgrade to Continue'}
            </div>
          </div>
        )}
      </div>

      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          requiredCredits={cost}
          currentCredits={credits}
          unit={effectiveUnit}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
