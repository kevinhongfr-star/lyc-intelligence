import React from 'react';

const PLAN_TIERS = [
  {
    name: 'Free',
    price: '$0',
    cadence: '/mo',
    dailyCredits: '2 / day',
    features: ['DEX Coach (limited)', 'CQ Diagnostic', 'Market Intel Feed'],
    cta: 'Current plan',
    highlighted: false,
  },
  {
    name: 'Member',
    price: '$49',
    cadence: '/mo',
    dailyCredits: '5 / day',
    features: ['Everything in Free', 'Full assessment library', 'Career trajectory', 'Peer comparison'],
    cta: 'Upgrade',
    highlighted: true,
  },
  {
    name: 'Council',
    price: '$249',
    cadence: '/mo',
    dailyCredits: 'Unlimited',
    features: ['Everything in Member', '1:1 advisor matching', 'Private council AMAs', 'Priority support'],
    cta: 'Apply',
    highlighted: false,
  },
];

export function B2CCreditsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">Credits</h1>
        <p className="text-text-muted mt-1">Plan comparison table</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLAN_TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`bg-bg-secondary border p-6 flex flex-col ${
              tier.highlighted ? 'border-accent' : 'border-bg-tertiary'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-lg font-bold text-text-primary">{tier.name}</h3>
              {tier.highlighted && (
                <span className="text-xs uppercase tracking-wider text-accent font-semibold">
                  Recommended
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="font-serif text-3xl font-bold text-text-primary">{tier.price}</span>
              <span className="text-sm text-text-muted">{tier.cadence}</span>
            </div>
            <div className="text-sm text-accent font-medium mb-4">
              {tier.dailyCredits} credits
            </div>
            <ul className="space-y-2 mb-6 flex-1">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="w-1.5 h-1.5 bg-accent mt-1.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-2 text-sm font-medium transition-colors ${
                tier.highlighted
                  ? 'bg-accent text-white hover:bg-accent-hover'
                  : 'bg-bg-tertiary text-text-primary hover:bg-bg-hover'
              }`}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-bg-secondary border border-bg-tertiary p-12 text-center">
        <div className="max-w-md mx-auto">
          <p className="text-text-secondary text-lg mb-4">
            Usage history, top-up packs, and team credit pooling.
          </p>
          <div className="h-32 bg-bg-tertiary flex items-center justify-center">
            <span className="text-text-muted">Placeholder</span>
          </div>
        </div>
      </div>
    </div>
  );
}
