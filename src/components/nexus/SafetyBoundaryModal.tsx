import React from 'react';
import { X, AlertTriangle, Stethoscope, Scale, Coins, Ban, Heart } from 'lucide-react';
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
  danger: '#C0392B',
  radius: '0px',
};

export type BoundaryType =
  | 'medical'
  | 'legal'
  | 'financial'
  | 'illegal_unethical'
  | 'relationship_advice';

export interface SafetyBoundaryModalProps {
  boundaryType: BoundaryType;
  message: string;
  suggestions?: string[];
  onClose: () => void;
  className?: string;
}

const BOUNDARY_ICONS: Record<BoundaryType, React.ReactNode> = {
  medical: <Stethoscope size={28} />,
  legal: <Scale size={28} />,
  financial: <Coins size={28} />,
  illegal_unethical: <Ban size={28} />,
  relationship_advice: <Heart size={28} />,
};

const BOUNDARY_LABELS: Record<BoundaryType, string> = {
  medical: 'Medical Guidance',
  legal: 'Legal Advice',
  financial: 'Financial Advice',
  illegal_unethical: 'Unsafe Request',
  relationship_advice: 'Relationship Advice',
};

const BOUNDARY_COLORS: Record<BoundaryType, string> = {
  medical: '#2C5282',
  legal: '#4A5568',
  financial: '#2D8A4E',
  illegal_unethical: DS.danger,
  relationship_advice: '#B8860B',
};

const BOUNDARY_DESCRIPTIONS: Record<BoundaryType, string> = {
  medical:
    'I am not a medical professional. I cannot provide diagnosis, treatment, or medical advice.',
  legal: 'I am not a lawyer. I cannot provide legal advice, representation, or interpretation of law.',
  financial:
    'I am not a licensed financial advisor. I cannot provide investment, tax, or financial planning advice.',
  illegal_unethical:
    'I cannot assist with requests that may be illegal or unethical. I am designed to support your career and professional development.',
  relationship_advice:
    'I am not a therapist or counselor. For relationship concerns, please seek support from a qualified professional.',
};

const CALMING_MESSAGE =
  'I understand this is important. Let me redirect you to how I can help — career strategy, professional development, and workplace dynamics are where I can provide the most value.';

export function SafetyBoundaryModal({
  boundaryType,
  message,
  suggestions = [],
  onClose,
  className,
}: SafetyBoundaryModalProps) {
  const color = BOUNDARY_COLORS[boundaryType];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="safety-boundary-title"
      aria-describedby="safety-boundary-description"
      className={cn('fixed inset-0 z-50 flex items-center justify-center', className)}
      style={{
        background: 'rgba(0,0,0,0.5)',
        padding: '20px',
      }}
    >
      <div
        role="document"
        style={{
          background: DS.bg,
          border: `2px solid ${color}`,
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: `1px solid ${DS.border}`,
            background: `${color}10`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                background: color,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {BOUNDARY_ICONS[boundaryType]}
            </div>
            <div>
              <h2
                id="safety-boundary-title"
                style={{
                  margin: 0,
                  fontFamily: DS.headingFont,
                  fontSize: '16px',
                  fontWeight: 600,
                  color: DS.text,
                }}
              >
                {BOUNDARY_LABELS[boundaryType]}
              </h2>
              <p
                id="safety-boundary-description"
                style={{
                  margin: 0,
                  fontFamily: DS.bodyFont,
                  fontSize: '12px',
                  color: DS.muted,
                  lineHeight: 1.5,
                }}
              >
                {BOUNDARY_DESCRIPTIONS[boundaryType]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close safety boundary modal"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              padding: 0,
              background: 'transparent',
              border: `1px solid ${DS.border}`,
              color: DS.muted,
              cursor: 'pointer',
              flexShrink: 0,
              marginLeft: '12px',
              transition: 'color 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = DS.text;
              e.currentTarget.style.borderColor = DS.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = DS.muted;
              e.currentTarget.style.borderColor = DS.border;
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <p
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '14px',
              color: DS.textSecondary,
              lineHeight: 1.6,
              margin: 0,
              marginBottom: '12px',
            }}
          >
            {message}
          </p>

          <div
            style={{
              padding: '12px 16px',
              background: DS.bgAlt,
              borderLeft: `3px solid ${DS.accent}`,
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <AlertTriangle size={14} style={{ color: DS.accent }} />
              <span
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: DS.accent,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Let's Try This Instead
              </span>
            </div>
            <p
              style={{
                fontFamily: DS.bodyFont,
                fontSize: '13px',
                color: DS.text,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {CALMING_MESSAGE}
            </p>
          </div>

          {suggestions.length > 0 && (
            <div>
              <p
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: DS.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '10px',
                }}
              >
                Suggested Prompts
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {suggestions.map((suggestion, i) => (
                  <li
                    key={i}
                    style={{
                      padding: '10px 14px',
                      background: DS.bgAlt,
                      border: `1px solid ${DS.border}`,
                      marginBottom: '6px',
                      fontFamily: DS.bodyFont,
                      fontSize: '13px',
                      color: DS.textSecondary,
                      cursor: 'pointer',
                      transition: 'background 0.2s ease, border-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${DS.accent}08`;
                      e.currentTarget.style.borderColor = DS.accent;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = DS.bgAlt;
                      e.currentTarget.style.borderColor = DS.border;
                    }}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${DS.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            onClick={onClose}
            autoFocus
            style={{
              padding: '10px 20px',
              background: DS.accent,
              color: '#fff',
              border: 'none',
              fontFamily: DS.bodyFont,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = DS.accentHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = DS.accent;
            }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}