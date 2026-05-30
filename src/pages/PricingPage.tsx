import React from 'react';
import { IconSpark, IconForge, IconQuest } from '@/components/icons/LycIcons';
import { Check, ArrowRight, Shield } from 'lucide-react';

import { DS } from '@/lib/designSystem';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceDisplay: '$0',
    period: 'forever',
    credits: 5,
    description: 'Start here',
    icon: IconSpark,
    features: [
      '5 credits per day',
      'Career Positioning Diagnostic',
      'Basic Nexus chat',
      'Leadership archetype report',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    priceDisplay: '$49',
    period: '/month',
    credits: 200,
    description: 'For serious career development',
    icon: IconQuest,
    highlight: true,
    features: [
      '200 credits per month',
      'Unlimited Nexus conversations',
      'Match Analysis for job comparisons',
      'Full assessment history',
      'Priority scoring & insights',
      'PDF export of all reports',
    ],
  },
  {
    id: 'council',
    name: 'Council',
    price: 199,
    priceDisplay: '$199',
    period: '/month',
    credits: -1,
    description: 'Includes quarterly advisory call with LYC partner',
    icon: IconForge,
    features: [
      'Quarterly 1:1 call with a LYC partner who has placed executives in your target market',
      'Unlimited credits',
      'Everything in Pro',
      'Executive CV review & optimization',
      'Interview preparation sessions',
      'Board readiness assessment',
      'Private Council network access',
    ],
  },
];

export function PricingPage() {
  return (
    <div style={{ minHeight: '100vh', background: DS.bg }}>
      {/* Header */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${DS.border}` }}>
        <a href="/" style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, textDecoration: 'none' }}>LYC Intelligence</a>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>Back to site</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '64px 24px 48px', maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: `${DS.accent}15`, borderRadius: '20px', marginBottom: '20px' }}>
          <IconSpark size={14} color={DS.accent} />
          <span style={{ fontSize: '11px', color: DS.accent, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Pricing</span>
        </div>
        <h1 style={{ fontFamily: DS.headingFont, fontSize: '40px', fontWeight: 700, color: DS.text, margin: '0 0 16px' }}>
          Invest in your career trajectory
        </h1>
        <p style={{ fontFamily: DS.bodyFont, fontSize: '16px', color: DS.textSecondary, lineHeight: 1.6, margin: 0 }}>
          One in three leadership moves fails. The right intelligence changes the odds.
        </p>
      </div>

      {/* Tier Cards */}
      <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '960px', margin: '0 auto', padding: '0 24px 80px' }}>
        {TIERS.map(tier => (
          <div key={tier.id} style={{
            background: DS.card,
            border: tier.highlight ? `2px solid ${DS.accent}` : `1px solid ${DS.cardBorder}`,
            borderRadius: DS.radius,
            padding: '32px 28px',
            boxShadow: tier.highlight ? `0 4px 20px rgba(193,8,171,0.15)` : DS.shadow,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {tier.highlight && (
              <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: DS.accent, color: '#FFF', fontSize: '11px', fontWeight: 600, padding: '4px 16px', borderRadius: '12px', letterSpacing: '0.5px' }}>
                MOST POPULAR
              </div>
            )}
            <div style={{ color: DS.accent, marginBottom: '12px' }}>
              <tier.icon size={28} color={DS.accent} />
            </div>
            <h3 style={{ fontFamily: DS.headingFont, fontSize: '22px', fontWeight: 700, color: DS.text, margin: '0 0 4px' }}>{tier.name}</h3>
            <p style={{ fontSize: '13px', color: DS.muted, margin: '0 0 20px' }}>{tier.description}</p>
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontFamily: DS.headingFont, fontSize: '42px', fontWeight: 700, color: DS.text }}>{tier.priceDisplay}</span>
              <span style={{ fontSize: '14px', color: DS.muted, marginLeft: '4px' }}>{tier.period}</span>
            </div>
            <div style={{ flex: 1 }}>
              {tier.features.map((feature, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <Check style={{ width: 16, height: 16, color: i === 0 && tier.id === 'council' ? DS.accent : '#00897B', flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '13px', color: i === 0 && tier.id === 'council' ? DS.accent : DS.textSecondary, fontWeight: i === 0 && tier.id === 'council' ? 600 : 400, lineHeight: 1.5 }}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>
            <a
              href={tier.id === 'free' ? '/assessment' : '/login'}
              className={tier.highlight ? 'cta-glow' : ''}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '14px', marginTop: '24px',
                background: tier.highlight ? DS.accent : 'transparent',
                color: tier.highlight ? '#FFF' : DS.text,
                border: tier.highlight ? 'none' : `1px solid ${DS.cardBorder}`,
                borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                textDecoration: 'none', minHeight: '48px',
                transition: 'all 0.2s ease',
              }}
            >
              {tier.id === 'free' ? 'Start Free Assessment' : `Get ${tier.name}`}
              <ArrowRight style={{ width: 16, height: 16 }} />
            </a>
          </div>
        ))}
      </div>

      {/* Footer trust */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', paddingBottom: '48px' }}>
        <Shield size={14} color={DS.muted} />
        <span style={{ fontSize: '12px', color: DS.muted }}>Secure payment · Cancel anytime · 14-day money-back guarantee</span>
      </div>
    </div>
  );
}
