import React from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const DS = {
  accent: '#C108AB',
  bg: '#FFFFFF',
  card: '#FFFFFF',
  muted: '#666666',
  text: '#000000',
  textSecondary: '#333333',
  border: '#E5E5E5',
  success: '#00897B',
  warning: '#F59E0B',
  error: '#EF4444'
};

interface CreditBadgeProps {
  showBalance?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CreditBadge({ showBalance = true, size = 'md' }: CreditBadgeProps) {
  const { profile } = useAuthStore();
  const credits = profile?.credits?.balance ?? 0;
  const tier = profile?.tier || 'free';
  
  const isLowCredits = credits <= 5 && tier === 'free';
  const colors = isLowCredits ? { bg: `${DS.warning}20`, border: `${DS.warning}40`, text: DS.warning } : { bg: `${DS.accent}20`, border: `${DS.accent}40`, text: DS.accent };
  
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  const padding = size === 'sm' ? '4px 10px' : size === 'lg' ? '10px 16px' : '6px 12px';
  const fontSize = size === 'sm' ? '12px' : size === 'lg' ? '16px' : '14px';

  return (
    <div 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      title={`${credits} credits available`}
    >
      <CreditCard style={{ width: iconSize, height: iconSize, color: colors.text }} />
      {showBalance && (
        <span style={{ 
          fontSize, 
          fontWeight: 600, 
          color: colors.text 
        }}>
          {credits} {size !== 'sm' ? 'credits' : ''}
        </span>
      )}
      {tier !== 'free' && (
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '2px 6px',
          background: DS.accent,
          color: '#FFF',
          borderRadius: '10px',
          textTransform: 'uppercase'
        }}>
          {tier}
        </span>
      )}
    </div>
  );
}
