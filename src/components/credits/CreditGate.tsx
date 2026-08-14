import React, { useState, useEffect } from 'react';
import { Lock, Loader2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { UpgradeModal } from './UpgradeModal';
// W3.1 Fix 3: share the canonical system serif stack — NO Crimson Pro, no custom font loading.
import { DS as GLOBAL_DS, ACCENT, AMBER } from '@/tokens';

const DS = {
  headingFont: GLOBAL_DS.headingFont,
  bodyFont: GLOBAL_DS.bodyFont,
  monoFont: GLOBAL_DS.monoFont,
  accent: ACCENT,
  accentSoft: `${ACCENT}14`,
  accentBorder: `${ACCENT}40`,
  bg: '#FAFAF8',
  card: '#FFFFFF',
  muted: '#8A8A8A',
  text: '#0A0A0A',
  textSecondary: '#555555',
  border: '#E8E8E5',
  warning: AMBER,
  warningSoft: '#FEF3C7',
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

  const credits = profile?.credits?.balance ?? profile?.miles_balance ?? 0;
  const cost = CREDIT_COSTS[action];
  const tier = profile?.tier || 'explorer';

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

    if (tier !== 'explorer' && tier !== 'executive_introduction') {
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
        gap: '10px',
        padding: '20px 24px',
        background: DS.accentSoft,
        border: `1px solid ${DS.accentBorder}`,
        borderRadius: 10,
        color: DS.text,
        fontFamily: DS.bodyFont,
        fontSize: 14,
      }}>
        <Loader2 style={{ width: 18, height: 18, color: DS.accent, animation: 'spin 1s linear infinite' }} />
        Processing...
      </div>
    );
  }

  const accent = DS.accent;

  return (
    <>
      <div onClick={handleClick} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
        {hasCredits ? (
          children
        ) : (
          <div style={{
            padding: '36px 28px',
            background: showInsufficientCredits ? DS.warningSoft : DS.bg,
            border: `1px solid ${showInsufficientCredits ? DS.warning : DS.border}`,
            borderRadius: 14,
            textAlign: 'center',
            color: DS.text,
          }}>
            {showInsufficientCredits ? (
              <>
                <AlertCircle style={{ width: 44, height: 44, color: DS.warning, margin: '0 auto 14px' }} />
                <h3 style={{
                  fontFamily: DS.headingFont,
                  fontSize: '22px',
                  color: DS.text,
                  marginBottom: '8px',
                  fontWeight: 500,
                }}>
                  Insufficient {unitNoun}
                </h3>
                <p style={{
                  fontFamily: DS.bodyFont,
                  color: DS.textSecondary,
                  marginBottom: '22px',
                  fontSize: 14,
                  lineHeight: 1.55,
                }}>
                  This action requires <strong>{cost} {unitShort}</strong>, but you only have <strong>{credits}</strong>.
                  Top up or upgrade your tier to continue.
                </p>
              </>
            ) : (
              <>
                <Lock style={{ width: 40, height: 40, color: accent, margin: '0 auto 14px' }} />
                <h3 style={{
                  fontFamily: DS.headingFont,
                  fontSize: '22px',
                  color: DS.text,
                  marginBottom: '8px',
                  fontWeight: 500,
                }}>
                  Premium Feature
                </h3>
                <p style={{
                  fontFamily: DS.bodyFont,
                  color: DS.textSecondary,
                  marginBottom: '22px',
                  fontSize: 14,
                  lineHeight: 1.55,
                }}>
                  {ACTION_LABELS[action]} requires <strong>{cost} {unitShort}</strong>.
                  Executive Introduction covers one complimentary leadership assessment (CPI).
                  Upgrade for unlimited access to the full suite.
                </p>
              </>
            )}

            <div style={{
              display: 'inline-flex',
              gap: 10,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              <a
                href="/pricing"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '12px 22px',
                  background: accent,
                  color: '#FFFFFF',
                  fontFamily: DS.bodyFont,
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 8,
                  textDecoration: 'none',
                  border: `1.5px solid ${accent}`,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                View Pricing
                <ArrowUpRight style={{ width: 14, height: 14 }} />
              </a>
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
