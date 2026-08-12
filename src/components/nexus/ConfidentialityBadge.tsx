import React from 'react';
import { Shield, Lock, Eye, EyeOff, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';

const DS = {
  headingFont: "'Crimson Pro', Georgia, serif",
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
  success: '#00897B',
  radius: '0px',
};

export type TrustTier = 'cold' | 'warm' | 'trusted' | 'veteran';
export type ConfidentialityStatus = 'active' | 'signed' | 'anonymous';

export interface ConfidentialityBadgeProps {
  tier: TrustTier;
  confidentiality: ConfidentialityStatus;
  onSignOut?: () => void;
  className?: string;
}

const TIER_CONFIG: Record<TrustTier, { label: string; color: string; bg: string; description: string }> = {
  cold: {
    label: 'Cold',
    color: '#6B7280',
    bg: 'rgba(107,114,128,0.1)',
    description: 'New relationship. Limited personalization. General career guidance only.',
  },
  warm: {
    label: 'Warm',
    color: '#CA8A04',
    bg: 'rgba(202,138,4,0.1)',
    description: 'Developing trust. Tactical advice available. Some personalization.',
  },
  trusted: {
    label: 'Trusted',
    color: '#2D8A4E',
    bg: 'rgba(45,138,78,0.1)',
    description: 'High trust. Prescriptive advice available. Deep personalization.',
  },
  veteran: {
    label: 'Veteran',
    color: DS.accent,
    bg: `${DS.accent}15`,
    description: 'Deep trust. Intimate guidance available. Full personalization.',
  },
};

const CONFIDENTIALITY_CONFIG: Record<ConfidentialityStatus, { label: string; icon: React.ReactNode; description: string }> = {
  active: {
    label: 'Active',
    icon: <Shield size={14} />,
    description: 'Your session is protected by end-to-end confidentiality.',
  },
  signed: {
    label: 'Signed',
    icon: <Lock size={14} />,
    description: 'You have signed a confidentiality agreement. Full privacy protection.',
  },
  anonymous: {
    label: 'Anonymous',
    icon: <EyeOff size={14} />,
    description: 'You are in anonymous mode. Your identity is not stored.',
  },
};

export function ConfidentialityBadge({
  tier,
  confidentiality,
  onSignOut,
  className,
}: ConfidentialityBadgeProps) {
  const tierConfig = TIER_CONFIG[tier];
  const confConfig = CONFIDENTIALITY_CONFIG[confidentiality];

  return (
    <div
      className={cn('relative inline-flex items-center', className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span
        title={tierConfig.description}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 10px',
          background: tierConfig.bg,
          color: tierConfig.color,
          fontSize: '11px',
          fontWeight: 600,
          fontFamily: DS.bodyFont,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          border: `1px solid ${tierConfig.color}40`,
          cursor: 'help',
          transition: 'background 0.2s ease',
        }}
      >
        <Shield size={12} />
        {tierConfig.label}
      </span>

      <span
        title={confConfig.description}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 10px',
          background: DS.bgAlt,
          color: DS.textSecondary,
          fontSize: '11px',
          fontWeight: 500,
          fontFamily: DS.bodyFont,
          letterSpacing: '0.3px',
          border: `1px solid ${DS.border}`,
          cursor: 'help',
          transition: 'background 0.2s ease',
        }}
      >
        {confConfig.icon}
        {confConfig.label}
      </span>

      {onSignOut && (
        <button
          onClick={onSignOut}
          title="Sign out of confidentiality"
          aria-label="Sign out of confidentiality"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '22px',
            height: '22px',
            padding: 0,
            background: 'transparent',
            border: `1px solid ${DS.border}`,
            color: DS.muted,
            cursor: 'pointer',
            transition: 'color 0.2s ease, border-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = DS.accent;
            e.currentTarget.style.borderColor = DS.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = DS.muted;
            e.currentTarget.style.borderColor = DS.border;
          }}
        >
          <LogOut size={12} />
        </button>
      )}
    </div>
  );
}