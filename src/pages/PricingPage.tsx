import React, { useState } from 'react';
import { Check, Crown, Zap, Shield, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface PricingPageProps {
  onUpgradeSuccess?: () => void;
}

export function PricingPage({ onUpgradeSuccess }: PricingPageProps) {
  const { user, profile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tiers = [
    {
      id: 'member',
      name: 'Member',
      price: '$0',
      period: '',
      description: 'Free tier with basic access',
      features: [
        '2 credits per day',
        'Basic chat with Nexus',
        'Career insights',
        'Community forum',
      ],
      cta: 'Get Started',
      popular: false,
      icon: Zap,
      color: 'bg-gray-500',
      borderColor: 'border-gray-300',
    },
    {
      id: 'council',
      name: 'Council',
      price: '$29',
      period: '/month',
      description: 'Premium leadership development',
      features: [
        '5 credits per day',
        'All SHIFT assessments',
        'Premium insights',
        'Priority support',
        'Unlimited reports',
        'Exclusive content',
      ],
      cta: 'Upgrade to Council',
      popular: true,
      icon: Crown,
      color: 'bg-accent',
      borderColor: 'border-accent',
    },
  ];

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_COUNCIL || '',
          successUrl: `${window.location.origin}/settings?upgraded=true`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (e: any) {
      console.error('Upgrade error:', e);
      setError(e.message || 'Failed to start upgrade');
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    if (!user) {
      window.location.href = '/auth/signin';
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-text-primary mb-4">
          Choose Your Plan
        </h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto">
          Select the right tier for your leadership journey. Upgrade anytime as your needs grow.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-8">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isCurrentTier = profile?.tier === tier.id;
            
            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl border-2 ${tier.borderColor} p-8 ${
                  tier.popular ? 'bg-gradient-to-b from-accent/5 to-white' : 'bg-white'
                } shadow-lg hover:shadow-xl transition-shadow`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-accent text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrentTier && (
                  <div className="absolute -top-4 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 ${tier.color} rounded-none flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">{tier.name}</h3>
                    <p className="text-sm text-text-muted">{tier.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-text-primary">{tier.price}</span>
                  {tier.period && (
                    <span className="text-text-muted">{tier.period}</span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={tier.id === 'council' ? handleUpgrade : handleGetStarted}
                  disabled={loading}
                  className={`w-full py-3 px-6 rounded-none font-medium flex items-center justify-center gap-2 transition-all ${
                    tier.popular
                      ? 'bg-accent text-white hover:bg-accent-hover'
                      : 'bg-bg-tertiary text-text-primary hover:bg-bg-secondary'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {tier.cta}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {error && tier.id === 'council' && (
                  <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Comparison */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
          Feature Comparison
        </h2>
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-bg-tertiary">
                <th className="px-6 py-4 text-left font-medium text-text-secondary">Feature</th>
                <th className="px-6 py-4 text-center font-medium text-text-secondary">Member</th>
                <th className="px-6 py-4 text-center font-medium text-accent">Council</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Daily Credits', member: '2', council: '5' },
                { feature: 'Nexus Chat', member: 'Basic', council: 'Premium' },
                { feature: 'SHIFT Assessments', member: '✗', council: '✓' },
                { feature: 'Career Reports', member: 'Basic', council: 'Unlimited' },
                { feature: 'Priority Support', member: '✗', council: '✓' },
                { feature: 'Exclusive Content', member: '✗', council: '✓' },
                { feature: 'Team Insights', member: '✗', council: '✓' },
              ].map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-bg-tertiary/50'}>
                  <td className="px-6 py-4 text-text-secondary">{row.feature}</td>
                  <td className="px-6 py-4 text-center">
                    {row.member === '✓' ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : row.member === '✗' ? (
                      <span className="text-text-muted">—</span>
                    ) : (
                      <span className="text-text-primary font-medium">{row.member}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {row.council === '✓' ? (
                      <Check className="w-5 h-5 text-accent mx-auto" />
                    ) : row.council === '✗' ? (
                      <span className="text-text-muted">—</span>
                    ) : (
                      <span className="text-accent font-medium">{row.council}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-text-primary text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            {
              question: 'Can I cancel my subscription at any time?',
              answer: 'Yes, you can cancel your Council subscription at any time. You will continue to have access until the end of your current billing period.',
            },
            {
              question: 'How do credits work?',
              answer: 'Credits are used for premium features like SHIFT assessments and advanced insights. Member accounts get 2 credits per day, while Council members get 5 credits per day. Unused credits do not roll over.',
            },
            {
              question: 'Can I upgrade or downgrade my plan?',
              answer: 'Absolutely! You can upgrade to Council at any time. If you downgrade from Council to Member, your change will take effect at the end of your current billing cycle.',
            },
            {
              question: 'What payment methods are accepted?',
              answer: 'We accept all major credit cards (Visa, Mastercard, American Express) through Stripe. We also support Apple Pay and Google Pay where available.',
            },
          ].map((faq, i) => (
            <div key={i} className="bg-white rounded-none border border-border p-6">
              <h3 className="font-semibold text-text-primary mb-2">{faq.question}</h3>
              <p className="text-text-muted text-sm">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-r from-accent to-purple-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to Elevate Your Leadership?</h2>
          <p className="mb-6 opacity-90">
            Join Council today and unlock premium features designed for ambitious leaders.
          </p>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="bg-white text-accent px-8 py-3 rounded-none font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2 mx-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Upgrade to Council
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}