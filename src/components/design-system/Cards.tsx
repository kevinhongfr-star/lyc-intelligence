import React from 'react';
import { COLORS, SPACING, RADII, SHADOWS, TRANSITIONS } from '@/styles/tokens';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outline';
  padding?: keyof typeof SPACING;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'default', 
  padding = '6',
  className = '' 
}) => {
  const variants: Record<string, {
    backgroundColor: string;
    borderColor: string;
    shadow: string;
  }> = {
    default: {
      backgroundColor: COLORS.white,
      borderColor: 'transparent',
      shadow: SHADOWS.card,
    },
    elevated: {
      backgroundColor: COLORS.white,
      borderColor: 'transparent',
      shadow: SHADOWS.md,
    },
    outline: {
      backgroundColor: COLORS.white,
      borderColor: COLORS.border,
      shadow: SHADOWS.none,
    },
  };

  const style = variants[variant];

  return (
    <div
      className={className}
      style={{
        backgroundColor: style.backgroundColor,
        border: `1px solid ${style.borderColor}`,
        borderRadius: `${RADII.card}px`,
        boxShadow: style.shadow,
        padding: `${SPACING[padding]}px`,
        transition: TRANSITIONS.all,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = SHADOWS.cardHover || SHADOWS.lg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = style.shadow;
      }}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div
    className={className}
    style={{
      paddingBottom: `${SPACING[4]}px`,
      marginBottom: `${SPACING[4]}px`,
      borderBottom: `1px solid ${COLORS.border}`,
    }}
  >
    {children}
  </div>
);

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  <div
    className={className}
    style={{
      paddingTop: `${SPACING[4]}px`,
      marginTop: `${SPACING[4]}px`,
      borderTop: `1px solid ${COLORS.border}`,
    }}
  >
    {children}
  </div>
);

interface StatCardProps {
  title: string;
  value: string | number;
  change?: { value: string | number; positive?: boolean };
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  icon,
  className = '' 
}) => (
  <Card className={className}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div
          style={{
            fontSize: `${SPACING[3]}px`,
            color: COLORS.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: `${SPACING[2]}px`,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: `${SPACING[8]}px`,
            fontWeight: 700,
            color: COLORS.text,
            lineHeight: 1.2,
          }}
        >
          {value}
        </div>
        {change && (
          <div
            style={{
              fontSize: `${SPACING[3]}px`,
              fontWeight: 500,
              color: change.positive ? COLORS.success : COLORS.error,
              marginTop: `${SPACING[1]}px`,
            }}
          >
            {change.positive ? '+' : ''}{change.value}
          </div>
        )}
      </div>
      {icon && (
        <div
          style={{
            width: `${SPACING[12]}px`,
            height: `${SPACING[12]}px`,
            backgroundColor: COLORS.primaryLight,
            borderRadius: `${RADII.lg}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      )}
    </div>
  </Card>
);