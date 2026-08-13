/**
 * CreditStorePage — Credit balance & plans (S2-T03 / S6-T01)
 *
 * Displays the user's current credit balance and tier, plus available
 * credit packs and the Council subscription. CTAs are wired to Stripe
 * checkout (/api/stripe/checkout-credit and /api/stripe/checkout).
 *
 * Brand rule: NEVER use "free" — "Executive Introduction" / "complimentary".
 */
import React, { useState } from 'react';
import { ArrowLeft, Zap, Check, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { useCredits } from '@/contexts/CreditContext';
import { authFetch } from '@/utils/authFetch';

interface CreditPackPlan {
  packKey: 'starter' | 'professional' | 'enterprise';
  name: string;
  price: string;
  credits: string;
  features: string[];
  featured?: boolean;
}

// Catalog mirrors the server-side getCreditPackCatalog() in stripeHandler.ts.
const CREDIT_PACKS: CreditPackPlan[] = [
  {
    packKey: 'starter',
    name: 'Starter Pack',
    price: '$9.99',
    credits: '100 mi',
    features: ['1 mile per DEX message', 'No expiry', 'Use anytime'],
  },
  {
    packKey: 'professional',
    name: 'Professional Pack',
    price: '$39.99',
    credits: '500 mi',
    features: ['1 mile per DEX message', 'Optimal miles per purchase', 'No expiry'],
    featured: true,
  },
  {
    packKey: 'enterprise',
    name: 'Enterprise Pack',
    price: '$99.99',
    credits: '1,500 mi',
    features: ['1 mile per DEX message', 'Lowest cost per mile', 'Team-friendly'],
  },
];

export function CreditStorePage() {
  const { credit, tier } = useCredits();
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectToStripe = (url: string) => {
    if (url) window.location.href = url;
  };

  const handleBuyPack = async (packKey: string) => {
    setError(null);
    setLoadingPack(packKey);
    try {
      const res = await authFetch('/api/stripe/checkout-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packKey,
          successUrl: `${window.location.origin}/account/billing?success=true`,
          cancelUrl: `${window.location.origin}/dex/credits?canceled=true`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        redirectToStripe(data.url);
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (e: any) {
      console.error('[CreditStore] pack purchase error:', e);
      setError(e?.message || 'Could not start checkout. Please try again.');
    } finally {
      setLoadingPack(null);
    }
  };

  const handleSubscribe = async () => {
    setError(null);
    setSubscribing(true);
    try {
      const priceId = import.meta.env.VITE_STRIPE_PRICE_COUNCIL as string | undefined;
      if (!priceId) {
        throw new Error('Council plan is not configured yet. Please contact support.');
      }
      const res = await authFetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/account/billing?upgraded=true`,
          cancelUrl: `${window.location.origin}/dex/credits?canceled=true`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        redirectToStripe(data.url);
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (e: any) {
      console.error('[CreditStore] subscription error:', e);
      setError(e?.message || 'Could not start subscription. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  // `tier` from useCredits() is typed as canonical CreditTier
  // ('explorer'|'starter'|'pro'|'executive'|'council'). Council members get
  // unlimited miles — check the canonical value.
  const isCouncil = (tier as string) === 'council';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        <a href="/dex-ai" className="flex items-center gap-1 text-sm text-gray-500 hover:text-fuchsia mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to DEX
        </a>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia/10 text-fuchsia text-xs font-semibold uppercase tracking-wide mb-3">
            <Zap className="w-3 h-3" /> Miles & Plans
          </div>
          <h1
            className="text-3xl font-bold text-[#1A1A2E] mb-2"
            style={{ fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif" }}
          >
            Miles & Plans
          </h1>
          <p className="text-sm text-gray-600">
            Use miles to message DEX AI or book coaching sessions. Begin with your complimentary Executive Introduction.
          </p>
        </div>

        {/* Balance card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-fuchsia/10 text-fuchsia flex items-center justify-center">
                  <Zap className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Current Balance</div>
                  <div className="text-3xl font-bold text-[#1A1A2E]">{credit.balance} mi</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Tier</span>
                <Badge className="bg-fuchsia/10 text-fuchsia border-fuchsia/20 capitalize">{tier}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Total Earned</div>
                <div className="text-lg font-semibold text-[#1A1A2E]">{credit.totalEarned}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Total Spent</div>
                <div className="text-lg font-semibold text-[#1A1A2E]">{credit.totalSpent}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-6 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Credit packs */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">Buy Miles Packs</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {CREDIT_PACKS.map(p => (
              <Card
                key={p.packKey}
                className={`p-6 flex flex-col ${p.featured ? 'border-fuchsia ring-1 ring-fuchsia' : ''}`}
              >
                {p.featured && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-fuchsia text-white text-[10px] font-semibold uppercase tracking-wide mb-3 self-start">
                    <Sparkles className="w-3 h-3" /> Popular
                  </div>
                )}
                <h3 className="font-semibold text-[#1A1A2E] mb-1">{p.name}</h3>
                <div className="text-fuchsia font-bold text-2xl mb-1">{p.price}</div>
                <div className="text-xs text-gray-500 mb-4">{p.credits}</div>
                <ul className="space-y-2 mb-6 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={p.featured ? 'default' : 'outline'}
                  className="w-full"
                  disabled={loadingPack === p.packKey}
                  onClick={() => handleBuyPack(p.packKey)}
                >
                  {loadingPack === p.packKey ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing…
                    </>
                  ) : (
                    'Buy Now'
                  )}
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Council subscription */}
        <Card className={`p-6 mb-8 ${isCouncil ? 'border-green-300' : 'border-fuchsia ring-1 ring-fuchsia'}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-[240px]">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-fuchsia text-white text-[10px] font-semibold uppercase tracking-wide mb-2">
                <Sparkles className="w-3 h-3" /> Membership
              </div>
              <h3 className="font-semibold text-[#1A1A2E] mb-1">Council Membership</h3>
              <div className="text-fuchsia font-bold text-2xl mb-1">$29<span className="text-sm font-normal text-gray-500">/month</span></div>
              <ul className="space-y-2 mt-3">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> 5 miles per day
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> All SHIFT assessments
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Priority support & exclusive content
                </li>
              </ul>
            </div>
            <div className="flex flex-col items-stretch gap-2 min-w-[180px]">
              {isCouncil ? (
                <Button variant="outline" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button
                  variant="default"
                  disabled={subscribing}
                  onClick={handleSubscribe}
                >
                  {subscribing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing…
                    </>
                  ) : (
                    'Upgrade to Council'
                  )}
                </Button>
              )}
              <a
                href="/account/billing"
                className="text-center text-xs text-fuchsia hover:underline mt-1"
              >
                Manage billing →
              </a>
            </div>
          </div>
        </Card>

        <div className="text-center text-xs text-gray-400">
          Your Executive Introduction is available now —{''}
          <a href="/dex/chat" className="text-fuchsia hover:underline">start chatting</a>.
        </div>
      </div>
    </div>
  );
}

export default CreditStorePage;
