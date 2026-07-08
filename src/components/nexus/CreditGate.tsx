import React, { useState, useEffect } from 'react';
import { Crown, Zap, Sparkles, ArrowRight, X } from 'lucide-react';
import { getCreditBalance, spendCredits, checkAndGrantDailyCredits } from '@/services/creditService';
import { useAuthStore } from '@/stores/authStore';

interface CreditGateProps {
  messageCount: number;
  onApproved: (reason: 'free_trial' | 'credit_deducted') => void;
  onUpgrade: () => void;
  onCancel: () => void;
}

interface CreditCheckResult {
  allowed: boolean;
  reason: 'free_trial' | 'credit_deducted' | 'insufficient_credits';
  balance?: number;
}

export function CreditGate({ messageCount, onApproved, onUpgrade, onCancel }: CreditGateProps) {
  const { user, profile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CreditCheckResult | null>(null);
  const [showModal, setShowModal] = useState(false);

  const FREE_TRIAL_LIMIT = 5;

  useEffect(() => {
    const checkCredits = async () => {
      setLoading(true);
      
      try {
        if (messageCount <= FREE_TRIAL_LIMIT) {
          setResult({ allowed: true, reason: 'free_trial' });
          onApproved('free_trial');
          return;
        }

        if (!user?.id) {
          setResult({ allowed: false, reason: 'insufficient_credits', balance: 0 });
          setShowModal(true);
          return;
        }

        await checkAndGrantDailyCredits(user.id);
        const creditInfo = await getCreditBalance(user.id);
        
        if (!creditInfo || creditInfo.balance < 1) {
          setResult({ allowed: false, reason: 'insufficient_credits', balance: creditInfo?.balance || 0 });
          setShowModal(true);
          return;
        }

        const spendResult = await spendCredits(user.id, 1, 'chat_message');
        if (spendResult.success) {
          setResult({ allowed: true, reason: 'credit_deducted', balance: spendResult.newBalance });
          onApproved('credit_deducted');
        } else {
          setResult({ allowed: false, reason: 'insufficient_credits', balance: creditInfo.balance });
          setShowModal(true);
        }
      } catch (error) {
        console.error('[CreditGate] Error checking credits:', error);
        setResult({ allowed: false, reason: 'insufficient_credits', balance: 0 });
        setShowModal(true);
      } finally {
        setLoading(false);
      }
    };

    checkCredits();
  }, [messageCount, user?.id, onApproved]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!result?.allowed && showModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">
                {result.balance === 0 ? 'Out of Credits' : 'Low Credits'}
              </h3>
              <p className="text-text-muted text-sm">
                {result.balance === 0 
                  ? 'Your free trial has ended. Upgrade to Council for unlimited insights.'
                  : `You have ${result.balance} credit${result.balance === 1 ? '' : 's'} remaining.`
                }
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={onUpgrade}
                className="w-full py-3 px-4 bg-accent text-white rounded-none font-medium hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
              >
                <Crown className="w-5 h-5" />
                Upgrade to Council
              </button>

              <button
                onClick={onCancel}
                className="w-full py-3 px-4 bg-bg-tertiary text-text-primary rounded-none font-medium hover:bg-bg-secondary transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-accent/5 to-transparent p-6 border-t border-border">
            <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Council Benefits
            </h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                5 credits per day
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                SHIFT career assessments
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                Personalized coaching
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                Priority support
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return null;
}