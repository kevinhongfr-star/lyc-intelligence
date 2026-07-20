import React from 'react';
import { TYPOGRAPHY, COLORS } from '@/styles/tokens';

interface TextProps {
  children: React.ReactNode;
  size?: keyof typeof TYPOGRAPHY.fontSize;
  weight?: keyof typeof TYPOGRAPHY.fontWeight;
  color?: keyof typeof COLORS;
  lineHeight?: keyof typeof TYPOGRAPHY.lineHeight;
  className?: string;
}

export const Text: React.FC<TextProps> = ({ 
  children, 
  size = 'base', 
  weight = 'normal',
  color = 'text',
  lineHeight = 'normal',
  className = '' 
}) => (
  <span
    className={className}
    style={{
      fontSize: `${TYPOGRAPHY.fontSize[size]}px`,
      fontWeight: TYPOGRAPHY.fontWeight[weight],
      color: COLORS[color],
      lineHeight: TYPOGRAPHY.lineHeight[lineHeight],
    }}
  >
    {children}
  </span>
);

interface HeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export const Heading: React.FC<HeadingProps> = ({ 
  children, 
  level = 1, 
  className = '' 
}) => {
  const sizes: Record<number, keyof typeof TYPOGRAPHY.fontSize> = {
    1: '4xl',
    2: '3xl',
    3: '2xl',
    4: 'xl',
    5: 'lg',
    6: 'base',
  };
  
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Tag
      className={className}
      style={{
        fontSize: `${TYPOGRAPHY.fontSize[sizes[level]]}px`,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        lineHeight: TYPOGRAPHY.lineHeight.tight,
        color: COLORS.text,
      }}
    >
      {children}
    </Tag>
  );
};

interface ParagraphProps {
  children: React.ReactNode;
  className?: string;
  color?: keyof typeof COLORS;
}

export const Paragraph: React.FC<ParagraphProps> = ({ 
  children, 
  className = '',
  color = 'text'
}) => (
  <p
    className={className}
    style={{
      fontSize: `${TYPOGRAPHY.fontSize.base}px`,
      lineHeight: TYPOGRAPHY.lineHeight.relaxed,
      color: COLORS[color],
      marginBottom: `${TYPOGRAPHY.fontSize.base}px`,
    }}
  >
    {children}
  </p>
);

interface CaptionProps {
  children: React.ReactNode;
  className?: string;
}

export const Caption: React.FC<CaptionProps> = ({ children, className = '' }) => (
  <span
    className={className}
    style={{
      fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
      fontWeight: TYPOGRAPHY.fontWeight.normal,
      color: COLORS.textMuted,
    }}
  >
    {children}
  </span>
);

interface LabelProps {
  children: React.ReactNode;
  className?: string;
}

export const Label: React.FC<LabelProps> = ({ children, className = '' }) => (
  <span
    className={className}
    style={{
      fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
      fontWeight: TYPOGRAPHY.fontWeight.medium,
      color: COLORS.text,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}
  >
    {children}
  </span>
);

interface BadgeTextProps {
  children: React.ReactNode;
  className?: string;
}

export const BadgeText: React.FC<BadgeTextProps> = ({ children, className = '' }) => (
  <span
    className={className}
    style={{
      fontSize: `${TYPOGRAPHY.fontSize.xxs}px`,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      color: COLORS.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}
  >
    {children}
  </span>
);