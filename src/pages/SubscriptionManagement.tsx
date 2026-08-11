import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Download,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Calendar,
  Receipt,
  Crown,
  Sparkles,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  fetchSubscriptionStatus,
  fetchInvoices,
  cancelSubscription,
  upgradeSubscription,
  createCheckoutSession,
  CANONICAL_TIER_PRICING,
  RECOMMENDED_TIER,
  type SubscriptionStatus,
  type Invoice,
  type TierKey,
  type BillingCycle,
} from '@/services/monetizationService';

export interface SubscriptionManagementProps {
  /** Additional className */
  className?: string;
  /** Current user tier */
  currentTier?: string;
}

const ACCENT = '#C108AB';

/**
 * SubscriptionManagement — subscription settings page.
 * Shows current plan, invoices, and upgrade/cancel options.
 * Zero border-radius, crimson #C108AB accent.
 */
export function SubscriptionManagement({ className, currentTier }: SubscriptionManagementProps) {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [upgrading, setUpgrading] = useState<TierKey | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      fetchSubscriptionStatus().catch(() => null),
      fetchInvoices().catch(() => []),
    ])
      .then(([statusData, invoicesData]) => {
        if (mounted) {
          setStatus(statusData);
          setInvoices(invoicesData);
        }
      })
      .catch(() => {
        if (mounted) setError('Failed to load subscription data');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your current billing period.')) {
      return;
    }

    setCancelling(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const result = await cancelSubscription();
      if (result.canceled) {
        setSuccessMsg('Subscription cancelled. You will retain access until the end of your billing period.');
        if (status) {
          setStatus({ ...status, cancelAtPeriodEnd: true });
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const handleUpgrade = async (tier: TierKey) => {
    setUpgrading(tier);
    setError(null);
    setSuccessMsg(null);

    try {
      const result = await upgradeSubscription(tier);
      if (result.upgraded) {
        setSuccessMsg(`Successfully upgraded to ${tier}!`);
        const refreshed = await fetchSubscriptionStatus();
        setStatus(refreshed);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to upgrade');
    } finally {
      setUpgrading(null);
    }
  };

  const handleCheckout = async (tier: TierKey, cycle: BillingCycle) => {
    setUpgrading(tier);
    setError(null);

    try {
      const session = await createCheckoutSession(tier, cycle);
      if (session.url) {
        window.location.href = session.url;
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to start checkout');
      setUpgrading(null);
    }
  };

  const formatDate = (ts: number | null) => {
    if (!ts) return 'N/A';
    return new Date(ts * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className={cn('max-w-3xl mx-auto p-6', className)}>
        <div
          className="h-48 animate-pulse mb-6"
          style={{ background: '#F5F5F5' }}
        />
        <div
          className="h-64 animate-pulse"
          style={{ background: '#F5F5F5' }}
        />
      </div>
    );
  }

  const isActive = status?.status === 'active';
  const isPastDue = status?.status === 'past_due';
  const isCanceled = status?.status === 'canceled' || status?.cancelAtPeriodEnd;

  return (
    <div className={cn('max-w-3xl mx-auto p-6 space-y-6', className)}>
      {/* Success message */}
      {successMsg && (
        <div
          className="p-4 flex items-center gap-3"
          style={{
            background: `${ACCENT}10`,
            border: `1px solid ${ACCENT}40`,
            color: ACCENT,
          }}
        >
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="p-4 flex items-center gap-3"
          style={{
            background: '#FEE2E2',
            border: '1px solid #EF4444',
            color: '#991B1B',
          }}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Current plan card */}
      <div
        className="bg-white p-6"
        style={{ border: '1px solid #E5E5E5' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center"
              style={{ background: ACCENT }}
            >
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#000' }}>
                Current Plan
              </h2>
              <p className="text-xs opacity-60" style={{ color: '#666' }}>
                Your subscription status
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1 text-sm font-medium"
            style={{
              background: isActive ? '#D1FAE5' : isPastDue ? '#FEF3C7' : '#F5F5F5',
              color: isActive ? '#065F46' : isPastDue ? '#92400E' : '#666',
            }}
          >
            {isActive ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : isPastDue ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            {status?.status || 'inactive'}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div
            className="p-4"
            style={{
              background: `${ACCENT}08`,
              border: `1px solid ${ACCENT}20`,
            }}
          >
            <p className="text-xs opacity-60" style={{ color: '#666' }}>Plan</p>
            <p className="text-lg font-bold" style={{ color: ACCENT }}>
              {(() => {
                const rawTier = (status?.tier || currentTier || 'explorer') as TierKey;
                const ct = CANONICAL_TIER_PRICING[rawTier];
                if (!ct) return rawTier.toUpperCase();
                return rawTier === 'explorer' ? ct.alias : ct.label;
              })()}
            </p>
          </div>
          <div
            className="p-4"
            style={{
              background: `${ACCENT}08`,
              border: `1px solid ${ACCENT}20`,
            }}
          >
            <p className="text-xs opacity-60" style={{ color: '#666' }}>
              {status?.cancelAtPeriodEnd ? 'Access ends' : 'Current period ends'}
            </p>
            <p className="text-lg font-bold" style={{ color: '#000' }}>
              {formatDate(status?.currentPeriodEnd || null)}
            </p>
          </div>
          <div
            className="p-4"
            style={{
              background: `${ACCENT}08`,
              border: `1px solid ${ACCENT}20`,
            }}
          >
            <p className="text-xs opacity-60" style={{ color: '#666' }}>Status</p>
            <p className="text-lg font-bold" style={{ color: '#000' }}>
              {status?.cancelAtPeriodEnd ? 'Cancelled' : 'Active'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-6">
          {isActive && !isCanceled && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                cancelling ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
              )}
              style={{
                background: 'white',
                border: '1px solid #E5E5E5',
                color: '#666',
              }}
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                  Cancelling...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </button>
          )}

          <button
            onClick={() => handleCheckout(RECOMMENDED_TIER, 'monthly')}
            disabled={upgrading === RECOMMENDED_TIER}
            className={cn(
              'px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors',
              upgrading === RECOMMENDED_TIER ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
            )}
            style={{
              background: ACCENT,
              color: 'white',
            }}
          >
            {upgrading === RECOMMENDED_TIER ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Upgrade to {CANONICAL_TIER_PRICING[RECOMMENDED_TIER].label}
          </button>
        </div>
      </div>

      {/* Payment method */}
      <div
        className="bg-white p-6"
        style={{ border: '1px solid #E5E5E5' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5" style={{ color: ACCENT }} />
          <h2 className="text-lg font-bold" style={{ color: '#000' }}>
            Payment Method
          </h2>
        </div>

        <div
          className="p-4 flex items-center justify-between"
          style={{
            background: `${ACCENT}08`,
            border: `1px solid ${ACCENT}20`,
          }}
        >
          <div>
            <p className="font-medium" style={{ color: '#000' }}>
              Visa ending in •••• 4242
            </p>
            <p className="text-xs opacity-60" style={{ color: '#666' }}>
              Expires 12/28
            </p>
          </div>
          <button
            className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: ACCENT }}
            onClick={() => window.open('/api/stripe/portal', '_blank')}
          >
            Update
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Invoice history */}
      <div
        className="bg-white p-6"
        style={{ border: '1px solid #E5E5E5' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Receipt className="w-5 h-5" style={{ color: ACCENT }} />
          <h2 className="text-lg font-bold" style={{ color: '#000' }}>
            Invoice History
          </h2>
        </div>

        {invoices.length === 0 ? (
          <p className="text-sm opacity-60 py-8 text-center" style={{ color: '#666' }}>
            No invoices yet.
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: '#E5E5E5' }}>
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between py-3"
                style={{ borderColor: '#E5E5E5' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 flex items-center justify-center"
                    style={{
                      background: `${ACCENT}10`,
                    }}
                  >
                    <Calendar className="w-4 h-4" style={{ color: ACCENT }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#000' }}>
                      {new Date(invoice.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs opacity-60 capitalize" style={{ color: '#666' }}>
                      {invoice.status}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: '#000' }}
                  >
                    {formatPrice(invoice.amount)}
                  </span>
                  {invoice.pdf_url && (
                    <a
                      href={invoice.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 transition-opacity hover:opacity-70"
                      aria-label="Download invoice"
                    >
                      <Download className="w-4 h-4" style={{ color: ACCENT }} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAQ */}
      <div
        className="bg-white p-6"
        style={{ border: '1px solid #E5E5E5' }}
      >
        <h2 className="text-lg font-bold mb-4" style={{ color: '#000' }}>
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {[
            {
              q: 'Can I cancel my subscription at any time?',
              a: 'Yes, you can cancel anytime. Your access continues until the end of your current billing period.',
            },
            {
              q: 'How does upgrading work?',
              a: 'When you upgrade, you are charged the prorated difference for the remainder of your billing period. Your new tier takes effect immediately.',
            },
            {
              q: 'What payment methods are accepted?',
              a: 'We accept all major credit cards (Visa, Mastercard, American Express) and mobile payment via Apple Pay and Google Pay.',
            },
          ].map((faq, i) => (
            <div key={i}>
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#000' }}>
                {faq.q}
              </h3>
              <p className="text-sm opacity-70" style={{ color: '#333' }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
