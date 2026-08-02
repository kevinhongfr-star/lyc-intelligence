import React from 'react';
import { COLORS, SPACING, RADII, SHADOWS, TRANSITIONS } from '@/styles/tokens';

type SpacingInput = keyof typeof SPACING | number | (string & {});

const spacingPx = (val: SpacingInput | undefined): number | undefined => {
  if (val === undefined) return undefined;
  if (typeof val === 'number') {
    return SPACING[val] ?? val;
  }
  return SPACING[val] ?? parseInt(val, 10);
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outline';
  padding?: SpacingInput;
  className?: string;
  mb?: SpacingInput;
  mt?: SpacingInput;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'default', 
  padding = '6',
  className = '',
  mb,
  mt,
  style,
  ...rest
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

  const v = variants[variant];
  const paddingPx = spacingPx(padding);
  const marginBottom = spacingPx(mb);
  const marginTop = spacingPx(mt);

  return (
    <div
      className={className}
      style={{
        backgroundColor: v.backgroundColor,
        border: `1px solid ${v.borderColor}`,
        borderRadius: `${RADII.card}px`,
        boxShadow: v.shadow,
        padding: `${paddingPx}px`,
        transition: TRANSITIONS.all,
        ...(marginBottom !== undefined ? { marginBottom: `${marginBottom}px` } : {}),
        ...(marginTop !== undefined ? { marginTop: `${marginTop}px` } : {}),
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = SHADOWS.cardHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = v.shadow;
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', style, ...rest }) => (
  <div
    className={className}
    style={{
      paddingBottom: `${SPACING[4]}px`,
      marginBottom: `${SPACING[4]}px`,
      borderBottom: `1px solid ${COLORS.border}`,
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
);

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '', style, ...rest }) => (
  <div className={className} style={style} {...rest}>
    {children}
  </div>
);

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '', style, ...rest }) => (
  <div
    className={className}
    style={{
      paddingTop: `${SPACING[4]}px`,
      marginTop: `${SPACING[4]}px`,
      borderTop: `1px solid ${COLORS.border}`,
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
);

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  change?: { value: string | number; positive?: boolean };
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  icon,
  className = '',
  style,
  ...rest
}) => (
  <Card className={className} style={style} {...rest}>
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
