import React, { useState } from 'react';
import {
  Crown,
  Coins,
  Check,
  Loader2,
  Gift,
  CalendarDays,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  Sparkles,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

/**
 * Council Benefits Hub (M7) — auth required.
 *
 * Member's benefits hub: tier benefits grid, usage tracking, and
 * available benefits that can be claimed with Council Credits.
 *
 * Brand rules:
 *  - NEVER use "free" — use "Executive Introduction" or "Complimentary"
 *  - Sharp corners only — no rounded-* classes
 */

interface TierBenefit {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  included: boolean;
}

interface UsageMetric {
  id: string;
  label: string;
  used: number;
  total: number;
  icon: React.ComponentType<{ className?: string }>;
  unit: string;
}

interface ClaimableBenefit {
  id: string;
  title: string;
  description: string;
  creditCost: number;
  icon: React.ComponentType<{ className?: string }>;
}

const MEMBER = {
  tier: 'Founding' as const,
  credits: 9,
  creditsTotal: 12,
};

const TIER_BENEFITS: TierBenefit[] = [
  { id: 'tb1', icon: GraduationCap, title: '1-on-1 coaching', description: 'Book sessions with senior LYC coaches on-demand', included: true },
  { id: 'tb2', icon: CalendarDays, title: 'All events included', description: 'Workshops, roundtables, and member dinners', included: true },
  { id: 'tb3', icon: Sparkles, title: 'DEX AI access', description: '5 Complimentary DEX AI credits per day', included: true },
  { id: 'tb4', icon: FileText, title: 'Monthly intelligence', description: 'APAC leadership and compensation briefings', included: true },
  { id: 'tb5', icon: Crown, title: 'Priority booking', description: 'Founding members book events first', included: true },
  { id: 'tb6', icon: TrendingUp, title: 'Deal flow access', description: 'Reserved for PE Partner tier', included: false },
];

const USAGE: UsageMetric[] = [
  { id: 'u1', label: 'Coaching sessions', used: 4, total: 12, icon: GraduationCap, unit: 'sessions' },
  { id: 'u2', label: 'Events attended', used: 3, total: 8, icon: CalendarDays, unit: 'events' },
  { id: 'u3', label: 'Council Credits', used: 3, total: 12, icon: Coins, unit: 'credits' },
  { id: 'u4', label: 'DEX AI (daily)', used: 2, total: 5, icon: Sparkles, unit: 'messages' },
];

const CLAIMABLE: ClaimableBenefit[] = [
  {
    id: 'cb1',
    title: 'Extra coaching session',
    description: 'Add one additional 1-on-1 coaching session beyond your annual allowance.',
    creditCost: 1,
    icon: GraduationCap,
  },
  {
    id: 'cb2',
    title: 'Executive 360 review',
    description: 'A Complimentary 360-degree leadership review with a senior LYC partner.',
    creditCost: 2,
    icon: FileText,
  },
  {
    id: 'cb3',
    title: 'Private roundtable seat',
    description: 'Reserve a seat at an invite-only partner roundtable (limited capacity).',
    creditCost: 2,
    icon: Crown,
  },
  {
    id: 'cb4',
    title: 'Custom market briefing',
    description: 'A tailored one-page market briefing on a sector of your choice.',
    creditCost: 1,
    icon: TrendingUp,
  },
];

export function CouncilBenefitsPage() {
  const [credits, setCredits] = useState(MEMBER.credits);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<string[]>([]);

  const handleClaim = (benefit: ClaimableBenefit) => {
    if (claimed.includes(benefit.id) || credits < benefit.creditCost) return;
    setClaimingId(benefit.id);
    setTimeout(() => {
      setCredits((c) => c - benefit.creditCost);
      setClaimed((prev) => [...prev, benefit.id]);
      setClaimingId(null);
    }, 800);
  };

  return (
    <div
      className="min-h-screen bg-[#F7F7F7] text-[#1C1C1C]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Member nav */}
      <nav className="bg-white border-b border-[#E5E5E5] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="/council/dashboard"
            className="font-bold text-base tracking-tight text-[#1C1C1C] no-underline"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            The Council
          </a>
          <div className="hidden md:flex items-center gap-6">
            <a href="/council/dashboard" className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline">Dashboard</a>
            <a href="/council/coaching" className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline">Coaching</a>
            <a href="/council/community" className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline">Community</a>
            <a href="/council/directory" className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline">Directory</a>
            <a href="/council/benefits" className="text-sm font-medium text-[#C108AB] no-underline">Benefits</a>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[rgba(193,8,171,0.08)] text-[#C108AB] text-xs font-semibold">
              <Coins className="w-3.5 h-3.5" />
              {credits} credits
            </div>
            <Button size="sm" variant="outline" onClick={() => (window.location.href = '/council/profile')}>
              <Crown className="w-3.5 h-3.5" />
              Sarah
            </Button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-6 py-10 md:py-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 bg-[rgba(193,8,171,0.08)] text-[#C108AB] text-[11px] font-semibold uppercase tracking-widest px-3 py-1">
                  <Crown className="w-3 h-3" />
                  {MEMBER.tier} Benefits
                </span>
              </div>
              <h1
                className="text-2xl md:text-4xl font-bold tracking-tight text-[#1C1C1C]"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Your benefits hub
              </h1>
              <p className="text-sm text-[#525252] mt-2 max-w-xl leading-relaxed">
                Everything included with your {MEMBER.tier} membership, your usage this year, and additional benefits you can claim with Council Credits.
              </p>
            </div>
            <Card className="border border-[#E5E5E5] !shadow-none px-5 py-4 bg-[#F7F7F7]">
              <div className="text-[11px] uppercase tracking-wider text-[#A3A3A3] mb-1 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5" />
                Council Credits
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-3xl font-bold text-[#C108AB]"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  {credits}
                </span>
                <span className="text-xs text-[#A3A3A3]">of {MEMBER.creditsTotal} this year</span>
              </div>
            </Card>
          </div>
        </div>
      </header>

      {/* Usage tracking */}
      <section className="px-6 pt-8">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-base font-bold text-[#1C1C1C] mb-4"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Usage this year
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {USAGE.map((metric) => {
              const Icon = metric.icon;
              const pct = Math.min(100, Math.round((metric.used / metric.total) * 100));
              return (
                <Card key={metric.id} className="border border-[#E5E5E5] bg-white p-5 !shadow-none">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 bg-[rgba(193,8,171,0.08)] flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#C108AB]" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#A3A3A3]">
                      {pct}% used
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span
                      className="text-2xl font-bold text-[#1C1C1C]"
                      style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                    >
                      {metric.used}
                    </span>
                    <span className="text-xs text-[#A3A3A3]">/ {metric.total} {metric.unit}</span>
                  </div>
                  <div className="w-full h-2 bg-[#F0F0F0] overflow-hidden">
                    <div
                      className="h-full bg-[#C108AB] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-[#A3A3A3] mt-2">
                    {metric.label}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tier benefits grid */}
      <section className="px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-base font-bold text-[#1C1C1C] mb-1"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Included with {MEMBER.tier} tier
          </h2>
          <p className="text-sm text-[#525252] mb-5">
            Core benefits bundled into your annual membership — no extra credits required.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TIER_BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <Card
                  key={b.id}
                  className={`p-5 border !shadow-none ${b.included ? 'border-[#E5E5E5] bg-white' : 'border-dashed border-[#E5E5E5] bg-[#FAFAFA] opacity-80'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-9 h-9 flex items-center justify-center ${
                        b.included ? 'bg-[rgba(193,8,171,0.08)]' : 'bg-[#F0F0F0]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${b.included ? 'text-[#C108AB]' : 'text-[#A3A3A3]'}`} />
                    </div>
                    {b.included ? (
                      <Badge variant="success">
                        <Check className="w-3 h-3 mr-1" />
                        Included
                      </Badge>
                    ) : (
                      <Badge variant="default">Higher tier</Badge>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-[#1C1C1C]">{b.title}</h3>
                  <p className="text-xs text-[#525252] mt-1 leading-relaxed">{b.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Available benefits to claim */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between gap-3 mb-5 flex-wrap">
            <div>
              <h2
                className="text-base font-bold text-[#1C1C1C]"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Claim with Council Credits
              </h2>
              <p className="text-sm text-[#525252] mt-1">
                Premium benefits beyond your annual allowance. You have {credits} credits available.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => (window.location.href = '/council/membership')}>
              Upgrade tier
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CLAIMABLE.map((benefit) => {
              const Icon = benefit.icon;
              const isClaimed = claimed.includes(benefit.id);
              const isClaiming = claimingId === benefit.id;
              const canAfford = credits >= benefit.creditCost;
              return (
                <Card key={benefit.id} className="border border-[#E5E5E5] bg-white p-5 !shadow-none">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[rgba(193,8,171,0.08)] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#C108AB]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-[#1C1C1C]">{benefit.title}</h3>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C108AB] bg-[rgba(193,8,171,0.08)] px-2 py-0.5 flex-shrink-0">
                          <Coins className="w-3 h-3" />
                          {benefit.creditCost} credit{benefit.creditCost > 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-xs text-[#525252] mt-1 leading-relaxed">{benefit.description}</p>
                      <div className="mt-4">
                        <Button
                          size="xs"
                          onClick={() => handleClaim(benefit)}
                          disabled={isClaimed || isClaiming || !canAfford}
                          aria-busy={isClaiming}
                          className={isClaimed ? '!bg-[#1A7D42] hover:!bg-[#156B36]' : ''}
                        >
                          {isClaiming ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Claiming…
                            </>
                          ) : isClaimed ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Claimed
                            </>
                          ) : !canAfford ? (
                            <>
                              <Gift className="w-3.5 h-3.5" />
                              Not enough credits
                            </>
                          ) : (
                            <>
                              <Gift className="w-3.5 h-3.5" />
                              Claim benefit
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d0a14] text-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm font-bold" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            The Council — Benefits
          </div>
          <nav className="flex gap-6 text-xs text-white/60">
            <a href="/council/dashboard" className="hover:text-white transition-colors no-underline">Dashboard</a>
            <a href="/council/coaching" className="hover:text-white transition-colors no-underline">Coaching</a>
            <a href="/council/membership" className="hover:text-white transition-colors no-underline">Upgrade</a>
          </nav>
          <div className="text-[11px] text-white/40">© 2026 LYC Partners</div>
        </div>
      </footer>
    </div>
  );
}
