import React from 'react';
import { Mail, ArrowRight, Shield } from 'lucide-react';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  accentHover: '#A00790',
  bg: '#FFFFFF',
  bgAlt: '#F5F5F5',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
  border: '#E5E5E5',
  radius: '12px',
  radiusSm: '8px',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowHover: '0 4px 12px rgba(0,0,0,0.1)',
};

export function PricingPage() {
  return (
    <div style={{ minHeight: '100vh', background: DS.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          borderRadius: '50%', 
          background: `${DS.accent}15`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 24px' 
        }}>
          <Mail style={{ width: 28, height: 28, color: DS.accent }} />
        </div>

        <h1 style={{ fontFamily: DS.headingFont, fontSize: '36px', fontWeight: 700, color: DS.text, margin: '0 0 12px' }}>
          Let's Talk
        </h1>
        
        <p style={{ fontFamily: DS.bodyFont, fontSize: '16px', color: DS.textSecondary, lineHeight: 1.6, marginBottom: '32px' }}>
          Every leadership search is unique. Tell us about your needs and we'll design the right solution for you.
        </p>

        <div style={{
          background: DS.bgAlt,
          border: `1px solid ${DS.cardBorder}`,
          borderRadius: DS.radius,
          padding: '32px',
          boxShadow: DS.shadow,
        }}>
          <a 
            href="mailto:contact@lycpartners.com" 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '16px 24px',
              background: DS.accent,
              color: '#FFF',
              borderRadius: '8px',
              fontFamily: DS.bodyFont,
              fontSize: '16px',
              fontWeight: 600,
              textDecoration: 'none',
              minHeight: '44px',
              marginBottom: '20px',
              transition: 'background-color 0.2s ease, transform 0.15s ease',
            }}
          >
            contact@lycpartners.com
            <ArrowRight style={{ width: 18, height: 18 }} />
          </a>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Shield style={{ width: 14, height: 14, color: DS.muted }} />
            <span style={{ fontFamily: DS.bodyFont, fontSize: '12px', color: DS.muted }}>
              All inquiries are confidential
            </span>
          </div>
        </div>

        <p style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.muted, marginTop: '32px' }}>
          Already a partner? <a href="/" style={{ color: DS.accent, textDecoration: 'none' }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
