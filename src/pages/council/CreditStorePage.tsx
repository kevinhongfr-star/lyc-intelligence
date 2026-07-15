import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Zap,
  Crown,
  Rocket,
  TrendingUp,
  Loader2,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * DEX AI Credit Store Page (D2) — auth required.
 *
 * Sells DEX AI credit packs (one-time purchases, USD).
 * Council membership is sold separately via the membership tiers page.
 *
 * Brand rules:
 *  - NEVER use "free" — use "Executive Introduction" or "Complimentary"
 *  - DEX AI is the product name
 */

type PackId = 'starter' | 'professional' | 'enterprise' | 'council';

interface CreditPack {
  id: PackId;
  name: string;
  credits: number;
  price: number;
  priceLabel: string;
  perCredit: string;
  icon: React.ComponentType<{ className?: string }>;
  popular: boolean;
  highlight: string;
  cta: string;
}

const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 100,
    price: 9.99,
    priceLabel: '$9.99',
    perCredit: '$0.100 / credit',
    icon: Zap,
    popular: false,
    highlight: 'Try DEX AI beyond your Executive Introduction',
    cta: 'Buy Starter',
  },
  {
    id: 'professional',
    name: 'Professional',
    credits: 500,
    price: 39.99,
    priceLabel: '$39.99',
    perCredit: '$0.080 / credit',
    icon: Rocket,
    popular: true,
    highlight: 'Best for active career strategy work',
    cta: 'Buy Professional',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 1500,
    price: 99.99,
    priceLabel: '$99.99',
    perCredit: '$0.067 / credit',
    icon: TrendingUp,
    popular: false,
    highlight: 'For power users and small teams',
    cta: 'Buy Enterprise',
  },
  {
    id: 'council',
    name: 'Council',
    credits: 5000,
    price: 179.99,
    priceLabel: '$179.99',
    perCredit: '$0.036 / credit',
    icon: Crown,
    popular: false,
    highlight: 'Best value — for ongoing advisory',
    cta: 'Buy Council Pack',
  },
];

type TxType = 'purchase' | 'usage' | 'bonus';

interface Transaction {
  id: string;
  date: string; // ISO date
  description: string;
  amount: number; // positive = credit added, negative = credit used
  type: TxType;
  status: 'completed' | 'pending' | 'refunded';
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_001',
    date: '2026-07-12',
    description: 'Professional Pack — 500 credits',
    amount: 500,
    type: 'purchase',
    status: 'completed',
  },
  {
    id: 'tx_002',
    date: '2026-07-10',
    description: 'DEX AI chat — 8 messages',
    amount: -8,
    type: 'usage',
    status: 'completed',
  },
  {
    id: 'tx_003',
    date: '2026-07-08',
    description: 'Executive Introduction — Complimentary',
    amount: 5,
    type: 'bonus',
    status: 'completed',
  },
  {
    id: 'tx_004',
    date: '2026-06-29',
    description: 'Starter Pack — 100 credits',
    amount: 100,
    type: 'purchase',
    status: 'completed',
  },
  {
    id: 'tx_005',
    date: '2026-06-22',
    description: 'DEX AI chat — 23 messages',
    amount: -23,
    type: 'usage',
    status: 'completed',
  },
  {
    id: 'tx_006',
    date: '2026-06-15',
    description: 'Council graduation bonus',
    amount: 2,
    type: 'bonus',
    status: 'completed',
  },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function txTypeBadge(type: TxType): { label: string; className: string } {
  switch (type) {
    case 'purchase':
      return {
        label: 'Purchase',
        className: 'bg-[rgba(193,8,171,0.08)] text-[#C108AB]',
      };
    case 'usage':
      return {
        label: 'Usage',
        className: 'bg-[#F7F7F7] text-[#525252]',
      };
    case 'bonus':
      return {
        label: 'Bonus',
        className: 'bg-[rgba(22,163,74,0.08)] text-[#16A34A]',
      };
  }
}

function statusBadge(status: Transaction['status']): string {
  switch (status) {
    case 'completed':
      return 'text-[#16A34A]';
    case 'pending':
      return 'text-[#CA8A04]';
    case 'refunded':
      return 'text-[#DC2626]';
  }
}

export function CreditStorePage() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [purchasingPack, setPurchasingPack] = useState<PackId | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Simulate initial data fetch. In production this hits /api/credits and /api/credits/transactions.
  useEffect(() => {
    let cancelled = false;
    const t1 = setTimeout(() => {
      if (!cancelled) {
        setBalance(547);
        setIsLoadingBalance(false);
      }
    }, 400);
    const t2 = setTimeout(() => {
      if (!cancelled) {
        setTransactions(MOCK_TRANSACTIONS);
        setIsLoadingHistory(false);
      }
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handlePurchase = async (pack: CreditPack) => {
    setPurchasingPack(pack.id);
    setPurchaseError(null);

    try {
      // In production: POST to /api/stripe/checkout with the pack's price id,
      // then redirect to Stripe Checkout. Simulated here for a self-contained page.
      await new Promise((r) => setTimeout(r, 800));
      // Optimistically update local balance + history.
      setBalance((b) => b + pack.credits);
      setTransactions((prev) => [
        {
          id: `tx_${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          description: `${pack.name} Pack — ${pack.credits} credits`,
          amount: pack.credits,
          type: 'purchase',
          status: 'completed',
        },
        ...prev,
      ]);
    } catch (e: any) {
      setPurchaseError(e?.message || 'Purchase failed. Please try again.');
    } finally {
      setPurchasingPack(null);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F7F7F7] text-[#1C1C1C]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Nav */}
      <nav className="bg-white border-b border-[#E5E5E5] sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="/dex/chat"
            className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline"
          >
            ← Back to DEX AI
          </a>
          <div className="flex items-center gap-3">
            <a
              href="/council/membership"
              className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline hidden sm:inline"
            >
              Council Membership
            </a>
            <Button size="sm" variant="outline" onClick={() => (window.location.href = '/dex/chat')}>
              Back to Chat
            </Button>
          </div>
        </div>
      </nav>

      {/* Header + Balance */}
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-14">
          <div className="text-xs font-bold uppercase tracking-[2.5px] text-[#C108AB] mb-3">
            DEX AI Credit Store
          </div>
          <h1
            className="text-2xl md:text-4xl font-bold tracking-tight text-[#1C1C1C] mb-3"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Buy DEX AI credits
          </h1>
          <p className="text-sm md:text-base text-[#525252] max-w-2xl leading-relaxed">
            One credit = one DEX AI message. Credits never expire for 12 months and are
            separate from Council Credits. Need ongoing access? Explore Council membership.
          </p>

          {/* Balance card */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#F7F7F7] border border-[#E5E5E5] p-5 sm:col-span-1">
              <div className="text-[11px] uppercase tracking-wider text-[#A3A3A3] mb-2 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                Current Balance
              </div>
              {isLoadingBalance ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#A3A3A3] animate-spin" />
                  <span className="text-sm text-[#A3A3A3]">Loading…</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-3xl font-bold text-[#1C1C1C]"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {balance.toLocaleString()}
                  </span>
                  <span className="text-xs text-[#A3A3A3]">credits</span>
                </div>
              )}
            </div>

            <div className="bg-[#F7F7F7] border border-[#E5E5E5] p-5">
              <div className="text-[11px] uppercase tracking-wider text-[#A3A3A3] mb-2">
                Estimated messages
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-3xl font-bold text-[#1C1C1C]"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  {isLoadingBalance ? '—' : balance.toLocaleString()}
                </span>
                <span className="text-xs text-[#A3A3A3]">messages</span>
              </div>
            </div>

            <div className="bg-[#C108AB] p-5 text-white">
              <div className="text-[11px] uppercase tracking-wider text-white/70 mb-2 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />
                Council Membership
              </div>
              <div
                className="text-base font-semibold mb-1"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Includes daily DEX AI credits
              </div>
              <button
                onClick={() => (window.location.href = '/council/membership')}
                className="text-xs text-white/85 hover:text-white inline-flex items-center gap-1 no-underline"
              >
                Explore membership
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Credit Packs */}
      <section className="py-14 md:py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <h2
              className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1C1C] mb-1"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Credit packs
            </h2>
            <p className="text-sm text-[#525252]">
              One-time purchase. Larger packs drop the per-credit price.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CREDIT_PACKS.map((pack) => {
              const Icon = pack.icon;
              const isPurchasing = purchasingPack === pack.id;
              return (
                <div
                  key={pack.id}
                  className={`relative bg-white p-6 flex flex-col transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(26,23,20,0.08)] ${
                    pack.popular
                      ? 'border-2 border-[#C108AB] shadow-[0_4px_12px_rgba(193,8,171,0.12)]'
                      : 'border border-[#E5E5E5]'
                  }`}
                >
                  {pack.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 bg-[#C108AB] text-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="w-11 h-11 bg-[rgba(193,8,171,0.08)] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#C108AB]" />
                  </div>

                  <h3
                    className="text-base font-semibold text-[#1C1C1C]"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {pack.name}
                  </h3>
                  <p className="text-xs text-[#A3A3A3] mt-1 mb-4 leading-relaxed min-h-[2.5rem]">
                    {pack.highlight}
                  </p>

                  <div className="mb-1">
                    <span
                      className="text-3xl font-bold text-[#1C1C1C]"
                      style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                    >
                      {pack.credits.toLocaleString()}
                    </span>
                    <span className="text-xs text-[#A3A3A3] ml-1.5">credits</span>
                  </div>
                  <div
                    className="text-lg font-semibold text-[#C108AB] mb-1"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {pack.priceLabel}
                  </div>
                  <div className="text-[11px] text-[#A3A3A3] mb-5">{pack.perCredit}</div>

                  <Button
                    variant={pack.popular ? 'default' : 'outline'}
                    size="default"
                    className="w-full mt-auto"
                    onClick={() => handlePurchase(pack)}
                    disabled={isPurchasing || isLoadingBalance}
                    aria-busy={isPurchasing}
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing…
                      </>
                    ) : (
                      <>
                        {pack.cta}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          {purchaseError && (
            <div className="mt-5 text-sm text-[#DC2626] bg-[rgba(220,38,38,0.06)] border border-[rgba(220,38,38,0.20)] px-4 py-3">
              {purchaseError}
            </div>
          )}

          {/* Reassurance row */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#525252]">
            <div className="flex items-start gap-2 bg-white border border-[#E5E5E5] px-4 py-3">
              <Check className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" />
              <span>Credits are valid for 12 months from purchase.</span>
            </div>
            <div className="flex items-start gap-2 bg-white border border-[#E5E5E5] px-4 py-3">
              <Check className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" />
              <span>Secure checkout via Stripe. We never store card details.</span>
            </div>
            <div className="flex items-start gap-2 bg-white border border-[#E5E5E5] px-4 py-3">
              <Check className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" />
              <span>DEX AI credits are separate from Council Credits.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Transaction History */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
            <div>
              <h2
                className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1C1C]"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Transaction history
              </h2>
              <p className="text-sm text-[#525252] mt-1">
                Every credit purchase and usage, newest first.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
              disabled={isLoadingHistory}
            >
              <Loader2
                className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : 'hidden'}`}
              />
              Refresh
            </Button>
          </div>

          <div className="bg-white border border-[#E5E5E5] overflow-x-auto">
            {isLoadingHistory ? (
              <div className="px-5 py-12 flex flex-col items-center gap-3">
                <Loader2 className="w-5 h-5 text-[#A3A3A3] animate-spin" />
                <span className="text-sm text-[#A3A3A3]">Loading transactions…</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-[#A3A3A3]">No transactions yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr className="bg-[#F7F7F7] border-b border-[#E5E5E5]">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#525252]">
                      Date
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#525252]">
                      Description
                    </th>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#525252]">
                      Type
                    </th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#525252]">
                      Credits
                    </th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#525252]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => {
                    const badge = txTypeBadge(tx.type);
                    const isPositive = tx.amount >= 0;
                    return (
                      <tr
                        key={tx.id}
                        className={`border-b border-[#F0F0F0] ${
                          i % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'
                        }`}
                      >
                        <td className="px-5 py-3.5 text-sm text-[#525252] whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#1C1C1C]">{tx.description}</td>
                        <td className="px-3 py-3.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td
                          className={`px-5 py-3.5 text-right font-semibold ${
                            isPositive ? 'text-[#16A34A]' : 'text-[#DC2626]'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {tx.amount}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span
                            className={`text-[11px] font-semibold uppercase tracking-wide capitalize ${statusBadge(
                              tx.status
                            )}`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d0a14] text-white">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div
            className="text-sm font-bold"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            DEX AI — by LYC Intelligence
          </div>
          <nav className="flex gap-6 text-xs text-white/60">
            <a href="/council" className="hover:text-white transition-colors no-underline">Council</a>
            <a href="/council/membership" className="hover:text-white transition-colors no-underline">Membership</a>
            <a href="/dex/chat" className="hover:text-white transition-colors no-underline">DEX AI</a>
            <a href="/dex/credits" className="hover:text-white transition-colors no-underline">Credit Store</a>
          </nav>
          <div className="text-[11px] text-white/40">© 2026 LYC Partners</div>
        </div>
      </footer>
    </div>
  );
}


