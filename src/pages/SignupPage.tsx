import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  bg: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  text: '#000000',
  muted: '#666666',
  border: '#E5E5E5',
  radius: '12px',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
};

export function SignupPage() {
  return (
    <div style={{ minHeight: '100vh', background: DS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${DS.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Shield style={{ width: 24, height: 24, color: DS.accent }} />
        </div>
        <h1 style={{ fontFamily: DS.headingFont, fontSize: '24px', fontWeight: 600, color: DS.text, margin: '0 0 12px' }}>
          Invite Only
        </h1>
        <p style={{ fontFamily: DS.bodyFont, fontSize: '15px', color: DS.muted, lineHeight: 1.6, margin: '0 0 24px' }}>
          The LYC Intelligence Platform is currently available by invitation only. If you have credentials, please sign in.
        </p>
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: DS.accent, color: '#FFF', borderRadius: '8px', fontFamily: DS.bodyFont, fontSize: '15px', fontWeight: 600, textDecoration: 'none', minHeight: '44px', transition: 'background-color 0.2s' }}>
          Sign In
        </Link>
      </div>
    </div>
  );
}
