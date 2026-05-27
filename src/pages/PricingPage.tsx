import React from 'react';
import { Mail, ArrowRight, Shield } from 'lucide-react';

const DS = {
  headingFont: 'Georgia, serif',
  accent: '#C108AB',
  bg: '#0A0A0A',
  card: '#111111',
  muted: '#888888',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  border: '#222222',
  radius: '12px',
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
        
        <p style={{ fontSize: '16px', color: DS.muted, lineHeight: 1.6, marginBottom: '32px' }}>
          Every leadership search is unique. Tell us about your needs and we'll design the right solution for you.
        </p>

        <div style={{
          background: DS.card,
          border: `1px solid ${DS.border}`,
          borderRadius: DS.radius,
          padding: '32px'
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
              fontSize: '16px',
              fontWeight: 600,
              textDecoration: 'none',
              minHeight: '44px',
              marginBottom: '20px'
            }}
          >
            contact@lycpartners.com
            <ArrowRight style={{ width: 18, height: 18 }} />
          </a>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Shield style={{ width: 14, height: 14, color: DS.muted }} />
            <span style={{ fontSize: '12px', color: DS.muted }}>
              All inquiries are confidential
            </span>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: DS.muted, marginTop: '32px' }}>
          Already a partner? <a href="/" style={{ color: DS.accent, textDecoration: 'none' }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}