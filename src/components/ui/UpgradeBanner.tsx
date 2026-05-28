import React from 'react';
import { X, Zap, ArrowRight } from 'lucide-react';
import { useCredits } from '@/contexts/CreditContext';

interface UpgradeBannerProps {
  type?: 'low' | 'empty' | 'info';
  message?: string;
  onDismiss?: () => void;
}

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

export function UpgradeBanner({ type = 'empty', message, onDismiss }: UpgradeBannerProps) {
  const { credit, tier } = useCredits();

  if (tier !== 'free') return null;

  const getDefaultMessage = () => {
    if (type === 'empty') {
      return "You've used all your free credits. Upgrade for unlimited access.";
    }
    if (type === 'low') {
      return `Only ${credit.balance} credits left. Upgrade to never run out.`;
    }
    return 'Unlock unlimited assessments and matches with a paid plan.';
  };

  return (
    <div style={{
      background: `${DS.accent}15`,
      borderBottom: `1px solid ${DS.accent}30`,
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Zap style={{ width: 16, height: 16, color: DS.accent }} />
        <span style={{ fontSize: '14px', color: DS.text }}>
          {message || getDefaultMessage()}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <a
          href="/upgrade"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: DS.accent,
            color: '#FFFFFF',
            borderRadius: DS.radius,
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            minHeight: '36px',
          }}
        >
          Upgrade Now
          <ArrowRight style={{ width: 14, height: 14 }} />
        </a>
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: DS.muted,
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        )}
      </div>
    </div>
  );
}
