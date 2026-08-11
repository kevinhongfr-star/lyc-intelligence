import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, History, Plus, ArrowRight, Loader2, Crown, Zap, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getCreditBalance, checkAndGrantDailyCredits } from '@/services/creditService';
import { authFetch } from '@/utils/authFetch';
import {
  CANONICAL_TIER_PRICING,
  CANONICAL_TIER_ORDER,
  RECOMMENDED_TIER,
  type TierKey,
} from '@/services/monetizationService';
import { trackBillingView, trackUpgradeAttempt, trackCTA, trackPurchaseSuccess } from '@/analytics/eventTracker';
import { reportError } from '@/analytics/errorMonitor';

interface MilesTransaction {
  id: string;
  created_at: string;
  amount: number;
  description: string;
  transaction_type: 'earn_miles' | 'spend_miles' | 'earn_credit' | 'spend_credit' | string;
  balance_after?: number;
}

interface MilesPack {
  key: string;
  name: string;
  miles: number;
  price: number;
}

/**
 * Map any legacy tier string (member/free/basic/council/...) to a canonical TierKey.
 * Defaults to 'explorer' for unknown / unmapped values.
 */
function mapToCanonicalTier(tierStr: string | null | undefined): TierKey {
  if (!tierStr) return 'explorer';
  const t = tierStr.toLowerCase();
  if (t.includes('council')) return 'council';
  if (t.includes('executive')) return 'executive';
  if (t.includes('pro')) return 'pro';
  if (t.includes('starter') || t.includes('basic')) return 'starter';
  return 'explorer';
}

export function BillingDashboard() {
  const { user, profile } = useAuthStore();
  const [milesBalance, setMilesBalance] = useState(0);
  const [transactions, setTransactions] = useState<MilesTransaction[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'past_due' | 'cancelled' | 'none'>('none');
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'credits' | 'debits'>('all');

  // Canonical tier derived from the profile (fallback: explorer).
  const canonicalTier: TierKey = mapToCanonicalTier(profile?.tier);
  const tierPricing = CANONICAL_TIER_PRICING[canonicalTier];

  // Top-up packs — flat miles purchases (prices in USD).
  const milesPacks: MilesPack[] = [
    { key: 'starter', name: 'Starter Pack', miles: 100, price: 99 },
    { key: 'professional', name: 'Professional Pack', miles: 500, price: 449 },
    { key: 'enterprise', name: 'Enterprise Pack', miles: 1500, price: 1299 },
    { key: 'council', name: 'Council Pack', miles: 5000, price: 3999 },
  ];

  useEffect(() => {
    loadData();
  }, [user]);

  // Track billing view mount (page viewed under /app/billing)
  useEffect(() => {
    trackBillingView('nav');
  }, []);

  const loadData = async () => {
    if (!user?.id) return;

    setLoading(true);

    try {
      await checkAndGrantDailyCredits(user.id);
      const creditInfo = await getCreditBalance(user.id);
      if (creditInfo) {
        setMilesBalance(creditInfo.balance);
      }

      // #1320: Canonical default tier = executive_introduction (Explorer/complimentary).
      //         Accept legacy aliases 'member' and 'free' for backward compatibility.
      const tier = profile?.tier || 'executive_introduction';
      const isComplimentaryTier =
        tier === 'executive_introduction' || tier === 'member' || tier === 'free';
      const subStatus = profile?.stripe_subscription_status;

      if (!isComplimentaryTier && subStatus === 'active') {
        setSubscriptionStatus('active');
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 30);
        setNextBillingDate(nextDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }));
      } else if (subStatus === 'past_due') {
        setSubscriptionStatus('past_due');
      } else if (subStatus === 'cancelled') {
        setSubscriptionStatus('cancelled');
      } else {
        setSubscriptionStatus('none');
      }

      const txResponse = await authFetch(`/api/data/credit-transactions?user_id=${user.id}&limit=30`);
      if (txResponse.ok) {
        const txData = await txResponse.json();
        setTransactions(txData.data || []);
      }
    } catch (e) {
      console.error('Failed to load billing data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyMiles = async (packKey: string) => {
    const pack = milesPacks.find(p => p.key === packKey);
    setLoadingPack(packKey);
    trackCTA({ location: 'billing', label: `Buy Miles: ${pack?.name || packKey}`, context_id: packKey });

    try {
      const response = await authFetch('/api/stripe/checkout-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packKey,
          successUrl: `${window.location.origin}/account/billing?success=true`,
          cancelUrl: `${window.location.origin}/account/billing?canceled=true`,
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Mark purchase initiated; purchase_success is fired post-redirect via query param on success
        if (pack) {
          trackPurchaseSuccess(packKey, pack.price, 'usd', 'miles_pack');
        }
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (e: any) {
      console.error('Miles pack purchase error:', e);
      reportError(e, { scope: 'billing:checkout-credit', severity: 'error', extra: { packKey } });
    } finally {
      setLoadingPack(null);
    }
  };

  const handleManageSubscription = async () => {
    trackCTA({ location: 'billing', label: 'Manage Subscription', destination: 'stripe_portal' });
    try {
      const response = await authFetch('/api/stripe/portal', {
        method: 'GET',
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error('Failed to open billing portal:', e);
      reportError(e, { scope: 'billing:stripe-portal', severity: 'warning' });
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'credits') return tx.amount > 0;
    if (filter === 'debits') return tx.amount < 0;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const tierLabel = canonicalTier === 'explorer' ? tierPricing.alias! : tierPricing.label;

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-text-primary">Billing & Miles</h1>
          <p className="text-text-muted">
            Manage your subscription, miles balance, and transaction history.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Miles Balance Card */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-accent to-purple-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Miles Balance</p>
                <p className="text-3xl font-bold">{milesBalance} mi</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">
                {tierPricing.monthlyMiles > 0
                  ? `${tierPricing.monthlyMiles} mi / month · ${tierLabel}`
                  : `${tierLabel} · no monthly allowance`}
              </span>
              <span className="text-white/60 text-xs">
                {tierPricing.earnsMiles ? 'Earns miles via NEXUS' : 'Upgrade to earn miles'}
              </span>
            </div>
          </div>

          {/* Subscription Status Card */}
          <div className="bg-white p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 flex items-center justify-center ${
                subscriptionStatus === 'active' ? 'bg-green-100' :
                subscriptionStatus === 'past_due' ? 'bg-amber-100' : 'bg-gray-100'
              }`}>
                {subscriptionStatus === 'active' ? (
                  <Crown className="w-6 h-6 text-green-600" />
                ) : subscriptionStatus === 'past_due' ? (
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                ) : (
                  <Zap className="w-6 h-6 text-gray-600" />
                )}
              </div>
              <div>
                <p className="text-text-muted text-sm">Subscription Status</p>
                <p className="text-lg font-bold text-text-primary">
                  {subscriptionStatus === 'active' ? tierLabel :
                   subscriptionStatus === 'past_due' ? 'Past Due' :
                   subscriptionStatus === 'cancelled' ? 'Cancelled' : 'Executive Introduction'}
                </p>
              </div>
            </div>

            {subscriptionStatus === 'active' && nextBillingDate && (
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-text-muted" />
                  <span className="text-text-secondary">Next billing:</span>
                </div>
                <span className="font-medium text-text-primary">{nextBillingDate}</span>
              </div>
            )}

            {subscriptionStatus === 'active' && (
              <button
                onClick={handleManageSubscription}
                className="w-full mt-4 py-2 px-4 border border-accent text-accent hover:bg-accent/5 transition-colors"
              >
                Manage Subscription
              </button>
            )}

            {subscriptionStatus !== 'active' && (
              <button
                onClick={() => {
                  trackUpgradeAttempt(RECOMMENDED_TIER, 'billing');
                  trackCTA({ location: 'billing', label: `Upgrade to ${CANONICAL_TIER_PRICING[RECOMMENDED_TIER].label}`, destination: '/pricing', context_id: RECOMMENDED_TIER });
                  window.location.href = '/pricing';
                }}
                className="w-full mt-4 py-2 px-4 bg-accent text-white hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
              >
                Upgrade to {CANONICAL_TIER_PRICING[RECOMMENDED_TIER].label}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Current Tier Overview */}
        <div className="bg-white p-6 border border-border mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Current Tier</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {CANONICAL_TIER_ORDER.map((tk) => {
              const t = CANONICAL_TIER_PRICING[tk];
              const isCurrent = tk === canonicalTier;
              const isRecommended = tk === RECOMMENDED_TIER;
              const label = tk === 'explorer' ? t.alias! : t.label;
              return (
                <div
                  key={tk}
                  className={`p-3 border-2 ${
                    isCurrent
                      ? 'border-accent bg-accent/5'
                      : isRecommended
                        ? 'border-accent/40'
                        : 'border-border'
                  }`}
                >
                  <div className="text-xs text-text-muted uppercase tracking-wide">{label}</div>
                  <div className="text-lg font-bold text-text-primary">
                    {t.usdMonthly === 0 ? '—' : `$${t.usdMonthly}`}
                  </div>
                  <div className="text-xs text-accent font-medium">
                    {t.monthlyMiles === 0 ? 'Chat only' : `${t.monthlyMiles} mi / mo`}
                  </div>
                  {isCurrent && (
                    <div className="text-xs text-accent font-semibold mt-1">Your plan</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Miles Packs */}
        <div className="bg-white p-6 border border-border mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-1">Buy Additional Miles</h2>
          <p className="text-text-muted text-sm mb-4">
            Top up your miles balance. One-time purchase, no subscription required.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {milesPacks.map((pack) => (
              <div key={pack.key} className="border border-border p-4 hover:border-accent/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="w-4 h-4 text-accent" />
                  <span className="font-medium text-text-primary">{pack.name}</span>
                </div>
                <div className="text-2xl font-bold text-accent mb-1">+{pack.miles} mi</div>
                <div className="text-text-muted text-sm mb-4">${pack.price}</div>
                <button
                  onClick={() => handleBuyMiles(pack.key)}
                  disabled={loadingPack === pack.key}
                  className="w-full py-2 px-4 bg-accent text-white hover:bg-accent-hover transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {loadingPack === pack.key ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Buy Now'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <History className="w-5 h-5 text-accent" />
                Transaction History
              </h2>
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'credits', label: 'Earned' },
                  { key: 'debits', label: 'Spent' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key as typeof filter)}
                    className={`px-3 py-1.5 text-sm transition-colors ${
                      filter === f.key
                        ? 'bg-accent text-white'
                        : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y divide-border">
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <History className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-muted">No transactions found</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const desc = (tx.description || '').replace(/credits?/gi, (m) =>
                  m[0] === m[0].toUpperCase() ? 'Miles' : 'miles',
                );
                return (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-bg-tertiary/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 flex items-center justify-center ${
                        tx.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {tx.amount > 0 ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{desc}</p>
                        <p className="text-sm text-text-muted">{formatDate(tx.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount} mi
                      </p>
                      {tx.balance_after !== undefined && (
                        <p className="text-xs text-text-muted">
                          Balance: {tx.balance_after} mi
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
