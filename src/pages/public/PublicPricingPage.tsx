/**
 * Public Pricing Page — LYC Intelligence marketing site
 * Spec 18: Public Site & Activation Flows
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ArrowRight, Sparkles, Users, Building2 } from 'lucide-react';
import { Button, Card, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';

const TIERS = [
  {
    name: 'Individual',
    price: 199,
    description: 'For executives exploring new opportunities',
    features: [
      { text: '5 executive introductions/month', included: true },
      { text: 'Basic intelligence signals', included: true },
      { text: 'DEX AI chat (limited)', included: true },
      { text: 'Career profile', included: true },
      { text: 'SHIFT assessment', included: false },
      { text: 'Priority matching', included: false },
      { text: 'Council community access', included: false },
      { text: 'Personal coaching', included: false },
    ],
    cta: 'Start Free Trial',
    highlight: false,
  },
  {
    name: 'Council Member',
    price: 499,
    period: '/month',
    description: 'For active executive leaders',
    features: [
      { text: 'Unlimited introductions', included: true },
      { text: 'Full intelligence suite', included: true },
      { text: 'DEX AI chat (unlimited)', included: true },
      { text: 'Career profile + SHIFT', included: true },
      { text: 'Priority matching', included: true },
      { text: 'Council community access', included: true },
      { text: 'Quarterly coaching session', included: true },
      { text: 'Exclusive events', included: true },
    ],
    cta: 'Join Council',
    highlight: true,
  },
  {
    name: 'Council Fellow',
    price: 999,
    period: '/month',
    description: 'For senior executives seeking premium access',
    features: [
      { text: 'Everything in Council Member', included: true },
      { text: 'Personal career strategist', included: true },
      { text: 'Board placement support', included: true },
      { text: 'Monthly 1:1 coaching', included: true },
      { text: 'Executive assistant access', included: true },
      { text: 'Private dinners & retreats', included: true },
      { text: 'Spouse/partner inclusion', included: true },
      { text: 'VIP concierge service', included: true },
    ],
    cta: 'Apply for Fellowship',
    highlight: false,
  },
];

const ENTERPRISE_FEATURES = [
  'Unlimited user seats',
  'Dedicated account manager',
  'Custom intelligence reports',
  'API access',
  'SSO/SAML',
  'Priority support',
  'Custom training',
  'SLA guarantees',
];

const FAQ_ITEMS = [
  {
    q: 'How does the free trial work?',
    a: 'You get 14 days of Individual tier access. No credit card required. Cancel anytime.',
  },
  {
    q: 'Can I switch tiers later?',
    a: 'Yes, you can upgrade or downgrade at any time. Changes take effect on your next billing cycle.',
  },
  {
    q: 'What is the Council?',
    a: 'The Council is our exclusive community of verified executives. Members get peer introductions, private events, and premium career support.',
  },
  {
    q: 'How are executives verified?',
    a: 'We verify through LinkedIn, company email, and optional reference checks. This ensures a trusted peer network.',
  },
  {
    q: 'Is there a refund policy?',
    a: 'Yes, full refund within 7 days of purchase. After that, you can cancel anytime but no refunds for partial months.',
  },
];

export function PublicPricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#C108AB]" style={{ borderRadius: 0 }} />
            <span className="font-serif font-bold text-lg text-[#171717]">LYC Intelligence</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm text-[#737373] hover:text-[#171717] transition-colors">Features</Link>
            <Link to="/pricing" className="text-sm text-[#171717] font-medium">Pricing</Link>
            <Link to="/council" className="text-sm text-[#737373] hover:text-[#171717] transition-colors">Council</Link>
            <Link to="/faq" className="text-sm text-[#737373] hover:text-[#171717] transition-colors">FAQ</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/signup"><Button size="sm">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-4 bg-[#C108AB]/10 text-[#C108AB]">Simple, Transparent Pricing</Badge>
          <h1 className="font-serif font-bold text-4xl md:text-5xl text-[#171717] mb-4">
            Choose Your Executive Journey
          </h1>
          <p className="text-[#737373] max-w-xl mx-auto mb-8">
            From career exploration to board placement. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-2 bg-[#F5F5F5] p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white text-[#171717] shadow-sm'
                  : 'text-[#737373]'
              }`}
              style={{ borderRadius: 0 }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-white text-[#171717] shadow-sm'
                  : 'text-[#737373]'
              }`}
              style={{ borderRadius: 0 }}
            >
              Annual
              <Badge className="ml-2 bg-green-100 text-green-700 text-xs">Save 20%</Badge>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((tier, i) => (
              <Card
                key={i}
                className={`p-6 relative ${tier.highlight ? 'ring-2 ring-[#C108AB] shadow-lg' : ''}`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#C108AB] text-white">Most Popular</Badge>
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="font-semibold text-[#171717] text-lg mb-1">{tier.name}</h3>
                  <p className="text-xs text-[#737373] mb-4">{tier.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif font-bold text-3xl text-[#171717]">
                      ${billingCycle === 'annual' ? Math.round(tier.price * 0.8) : tier.price}
                    </span>
                    <span className="text-[#737373] text-sm">{tier.period || '/mo'}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-[#D4D4D4] mt-0.5 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-[#171717]' : 'text-[#A3A3A3]'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link to="/signup" className="block">
                  <Button
                    variant={tier.highlight ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {tier.cta}
                    {tier.highlight && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise */}
      <section className="py-16 px-6 bg-[#171717]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-white/10 text-white">Enterprise</Badge>
              <h2 className="font-serif font-bold text-3xl text-white mb-4">
                For Search Firms & Corporations
              </h2>
              <p className="text-[#A3A3A3] mb-6">
                Deploy LYC Intelligence across your organization. Custom pricing, dedicated support,
                and enterprise-grade security.
              </p>
              <Link to="/book-demo">
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  Contact Sales
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ENTERPRISE_FEATURES.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                  <Check className="w-4 h-4 text-[#C108AB]" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif font-bold text-2xl text-[#171717] mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, i) => (
              <Card key={i} className="p-4">
                <h3 className="font-medium text-[#171717] mb-2">{item.q}</h3>
                <p className="text-sm text-[#737373]">{item.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs text-[#A3A3A3]">© 2026 LYC Partners. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default PublicPricingPage;