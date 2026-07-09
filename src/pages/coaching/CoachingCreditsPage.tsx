/**
 * CoachingCreditsPage — B2C Coaching Portal credits & plans
 * Renders inside AppShell → Outlet. Shows current credit balance, usage
 * history, and available plan tiers.
 */
import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp, Check, ArrowRight, Plus, Receipt, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Progress, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { getCoachingCredits, type CoachingCreditData } from '@/services/supabaseApi';

interface CreditBalance {
  current: number;
  reserved: number;
  expiresAt: string;
  monthlyResetAt: string;
}

interface UsageRecord {
  id: string;
  description: string;
  amount: number; // negative = spent, positive = purchased
  date: string;
  type: 'Session' | 'Assessment' | 'Top-up' | 'Workshop';
}

interface PlanTier {
  id: string;
  name: string;
  priceMonthly: number;
  creditsPerMonth: number;
  features: string[];
  highlighted?: boolean;
  current?: boolean;
}

const STATIC_USAGE: UsageRecord[] = [
  { id: 'u1', description: '1:1 Career Strategy Session', amount: -2, date: '2025-01-15', type: 'Session' },
  { id: 'u2', description: 'Monthly credit refresh', amount: 20, date: '2025-01-01', type: 'Top-up' },
  { id: 'u3', description: 'Leadership Assessment (SHIFT)', amount: -3, date: '2024-12-28', type: 'Assessment' },
  { id: 'u4', description: 'Interview Prep Workshop', amount: -2, date: '2024-12-22', type: 'Workshop' },
  { id: 'u5', description: '1:1 Target Company Mapping', amount: -2, date: '2024-12-13', type: 'Session' },
  { id: 'u6', description: 'Credit top-up purchase', amount: 10, date: '2024-12-10', type: 'Top-up' },
];

const STATIC_PLANS: PlanTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 49,
    creditsPerMonth: 8,
    features: ['8 coaching credits / month', '1 group workshop / month', 'Email support', 'Basic assessments'],
  },
  {
    id: 'growth',
    name: 'Growth',
    priceMonthly: 129,
    creditsPerMonth: 20,
    features: ['20 coaching credits / month', '2 group workshops / month', 'Priority chat support', 'All assessments included', 'Monthly 1:1 strategy review'],
    highlighted: true,
    current: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    priceMonthly: 299,
    creditsPerMonth: 50,
    features: ['50 coaching credits / month', 'Unlimited workshops', 'Dedicated coach line', 'Custom assessments', 'Weekly 1:1 sessions', 'Salary negotiation support'],
  },
];

export function CoachingCreditsPage() {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useTenantContext();

  const usage = STATIC_USAGE;
  const plans = STATIC_PLANS;

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }

    const fetchCredits = async () => {
      try {
        setError(null);
        const data = await getCoachingCredits(user.id);
        if (data) {
          setBalance({
            current: data.current_credits,
            reserved: 0,
            expiresAt: '',
            monthlyResetAt: '',
          });
        } else {
          setBalance(null);
        }
      } catch (e) {
        console.error('[CoachingCreditsPage] Error:', e);
        setError('Failed to load credits');
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [user?.id]);

  const available = balance ? balance.current - balance.reserved : 0;
  const usageRatio = balance ? Math.min(100, ((balance.current + 0) / 20) * 100) : 0;

  const displayName = profile?.name || 'Coachee';
  const tier = profile?.tier || 'Professional';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Credits & Plans</h1>
            <p className="text-text-secondary text-sm mt-1">Manage your coaching credits and subscription plan.</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted">{tier}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5">
          {loading ? (
            <EmptyState title="Loading credits..." description="Fetching your credit balance." />
          ) : error ? (
            <EmptyState title="Error loading credits" description={error} />
          ) : !balance ? (
            <EmptyState title="No credit data" description="Purchase a plan to get started with coaching credits." actionLabel="View Plans" onAction={() => {}} />
          ) : (
          <>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-fuchsia flex items-center justify-center">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-3xl font-bold text-text-primary">
                  {balance.current}
                </div>
                <div className="text-xs text-text-muted">Credits available</div>
              </div>
            </div>
            <Button variant="default" size="sm">
              <Plus className="w-4 h-4" /> Buy Credits
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            <div>
              <div className="flex justify-between text-xs text-text-secondary mb-1.5">
                <span>Monthly balance</span>
                <span>{`${balance.current} / 20`}</span>
              </div>
              <Progress value={usageRatio} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-bg-warm border border-border">
                <div className="text-sm font-semibold text-text-primary">{available}</div>
                <div className="text-xs text-text-muted">Spendable now</div>
              </div>
              <div className="p-3 bg-bg-warm border border-border">
                <div className="text-sm font-semibold text-text-primary">{balance.reserved}</div>
                <div className="text-xs text-text-muted">Reserved</div>
              </div>
              <div className="p-3 bg-bg-warm border border-border">
                <div className="text-sm font-semibold text-text-primary">{balance.monthlyResetAt}</div>
                <div className="text-xs text-text-muted">Next reset</div>
              </div>
            </div>
          </div>
          </>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-fuchsia" />
            <span className="text-sm font-medium text-text-primary">This Month</span>
          </div>
          {loading || !balance ? (
            <div className="py-4 text-center text-text-muted text-sm">Loading stats...</div>
          ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Sessions used</span>
              <span className="text-sm font-semibold text-text-primary">4</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Assessments used</span>
              <span className="text-sm font-semibold text-text-primary">1</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Credits spent</span>
              <span className="text-sm font-semibold text-fuchsia">9</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-text-muted">Expires</span>
              <span className="text-xs font-medium text-text-secondary">{balance.expiresAt}</span>
            </div>
          </div>
          )}
        </Card>
      </div>

      {/* Usage history */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-fuchsia" />
            <CardTitle>Usage History</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {usage.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-sm">No usage records yet.</div>
          ) : (
            <div className="space-y-1">
              {usage.map((record) => {
                const spent = record.amount < 0;
                return (
                  <div key={record.id} className="flex items-center gap-4 py-3 border-b border-border last:border-b-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        spent ? 'bg-fuchsia-light' : 'bg-green/10'
                      }`}
                    >
                      <Coins className={`w-4 h-4 ${spent ? 'text-fuchsia' : 'text-green'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">{record.description}</span>
                        <Badge variant="default">{record.type}</Badge>
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">{record.date}</div>
                    </div>
                    <div className={`text-sm font-semibold flex-shrink-0 ${spent ? 'text-fuchsia' : 'text-green'}`}>
                      {spent ? '' : '+'}{record.amount}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan tiers */}
      <div>
        <h2 className="font-serif font-semibold text-lg text-text-primary mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`p-5 relative ${
                    plan.highlighted ? 'border-fuchsia shadow-card' : ''
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-2.5 left-5">
                      <Badge className="bg-fuchsia text-white">Most Popular</Badge>
                    </div>
                  )}
                  <div className="mb-4">
                    <div className="font-serif font-semibold text-text-primary">{plan.name}</div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold text-text-primary">${plan.priceMonthly}</span>
                      <span className="text-xs text-text-muted">/month</span>
                    </div>
                    <div className="text-xs text-fuchsia mt-1">{plan.creditsPerMonth} credits / month</div>
                  </div>

                  <ul className="space-y-2 mb-5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-text-secondary">
                        <Check className="w-3.5 h-3.5 text-fuchsia flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.current ? (
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant={plan.highlighted ? 'default' : 'outline'}
                      size="sm"
                      className="w-full"
                    >
                      {plan.id === 'elite' ? 'Upgrade' : 'Switch Plan'} <ArrowRight className="w-3 h-3" />
                    </Button>
                  )}
                </Card>
              ))}
        </div>
      </div>
    </div>
  );
}

export default CoachingCreditsPage;
