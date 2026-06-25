import React, { useState, useEffect } from 'react';
import { authFetch } from '@/utils/authFetch';
import { CreditCard, Calendar, History, Plus, ArrowRight, Loader2, Crown, Zap, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getCreditBalance, checkAndGrantDailyCredits } from '@/services/creditService';

interface CreditTransaction {
  id: string;
  created_at: string;
  amount: number;
  description: string;
  transaction_type: 'earn_credit' | 'spend_credit';
  balance_after?: number;
}

interface CreditPack {
  key: string;
  name: string;
  credits: number;
  price: number;
}

export function BillingDashboard() {
  const { user, profile } = useAuthStore();
  const [creditBalance, setCreditBalance] = useState(0);
  const [dailyCredits, setDailyCredits] = useState(2);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'past_due' | 'cancelled' | 'none'>('none');
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'credits' | 'debits'>('all');

  const creditPacks: CreditPack[] = [
    { key: 'starter', name: 'Starter Pack', credits: 100, price: 9.99 },
    { key: 'professional', name: 'Professional Pack', credits: 500, price: 39.99 },
    { key: 'enterprise', name: 'Enterprise Pack', credits: 1500, price: 99.99 },
  ];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    
    try {
      await checkAndGrantDailyCredits(user.id);
      const creditInfo = await getCreditBalance(user.id);
      if (creditInfo) {
        setCreditBalance(creditInfo.balance);
        setDailyCredits(creditInfo.tier === 'council' ? 5 : 2);
      }

      const tier = profile?.tier || 'member';
      const subStatus = profile?.stripe_subscription_status;
      
      if (tier === 'council' && subStatus === 'active') {
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

      const txResponse = await authFetch(`/api/data/credit-transactions?user_id=${user.id}&limit=30`, {
        credentials: 'include',
      });
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

  const handleBuyCredits = async (packKey: string) => {
    setLoadingPack(packKey);
    
    try {
      const response = await authFetch('/api/stripe/checkout-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          packKey,
          successUrl: `${window.location.origin}/settings/billing?success=true`,
          cancelUrl: `${window.location.origin}/settings/billing`,
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (e: any) {
      console.error('Credit pack purchase error:', e);
    } finally {
      setLoadingPack(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await authFetch('/api/stripe/portal', {
        method: 'GET',
        credentials: 'include',
      });
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error('Failed to open billing portal:', e);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
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

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-text-primary">Billing & Credits</h1>
          <p className="text-text-muted">Manage your subscription, credits, and transaction history.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Credit Balance Card */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-accent to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Current Balance</p>
                <p className="text-3xl font-bold">{creditBalance}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">
                {dailyCredits} credits/day ({profile?.tier === 'council' ? 'Council' : 'Member'})
              </span>
              <span className="text-white/60 text-xs">Next daily reset: Tomorrow</span>
            </div>
          </div>

          {/* Subscription Status Card */}
          <div className="bg-white rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
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
                  {subscriptionStatus === 'active' ? 'Council' : 
                   subscriptionStatus === 'past_due' ? 'Past Due' : 
                   subscriptionStatus === 'cancelled' ? 'Cancelled' : 'Member'}
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
                className="w-full mt-4 py-2 px-4 border border-accent text-accent rounded-xl hover:bg-accent/5 transition-colors"
              >
                Manage Subscription
              </button>
            )}

            {subscriptionStatus !== 'active' && (
              <button
                onClick={() => window.location.href = '/pricing'}
                className="w-full mt-4 py-2 px-4 bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
              >
                Upgrade to Council
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Credit Packs */}
        <div className="bg-white rounded-2xl p-6 border border-border mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Buy Additional Credits</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {creditPacks.map((pack) => (
              <div key={pack.key} className="border border-border rounded-xl p-4 hover:border-accent/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="w-4 h-4 text-accent" />
                  <span className="font-medium text-text-primary">{pack.name}</span>
                </div>
                <div className="text-2xl font-bold text-accent mb-1">+{pack.credits}</div>
                <div className="text-text-muted text-sm mb-4">${pack.price}</div>
                <button
                  onClick={() => handleBuyCredits(pack.key)}
                  disabled={loadingPack === pack.key}
                  className="w-full py-2 px-4 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors text-sm font-medium disabled:opacity-50"
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
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <History className="w-5 h-5 text-accent" />
                Transaction History
              </h2>
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'credits', label: 'Credits' },
                  { key: 'debits', label: 'Debits' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key as typeof filter)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
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
              filteredTransactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-bg-tertiary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {tx.amount > 0 ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{tx.description}</p>
                      <p className="text-sm text-text-muted">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </p>
                    {tx.balance_after !== undefined && (
                      <p className="text-xs text-text-muted">
                        Balance: {tx.balance_after}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}