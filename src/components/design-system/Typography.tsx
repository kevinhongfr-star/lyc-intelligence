import React from 'react';
import { TYPOGRAPHY, COLORS, SPACING } from '@/styles/tokens';

// Flexible color type: any COLORS key OR any string (for textSecondary, textMuted, etc. aliases)
type FlexColor = keyof typeof COLORS | (string & {});

interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  size?: keyof typeof TYPOGRAPHY.fontSize | (string & {});
  weight?: keyof typeof TYPOGRAPHY.fontWeight | (string & {});
  color?: FlexColor;
  lineHeight?: keyof typeof TYPOGRAPHY.lineHeight | (string & {});
  className?: string;
  muted?: boolean;
}

function resolveColor(c: FlexColor | undefined, muted = false): string {
  if (muted) return COLORS.textMuted;
  if (!c) return COLORS.text;
  // Direct COLORS key lookup
  if (c in COLORS) {
    const val = (COLORS as any)[c];
    if (typeof val === 'string') return val;
  }
  // String aliases that don't exist in COLORS keys directly
  if (c === 'textSecondary' || c === 'text_secondary') return COLORS.textSecondary;
  if (c === 'textMuted' || c === 'text_muted') return COLORS.textMuted;
  if (typeof c === 'string' && c.startsWith('#')) return c;
  return String(c);
}

export const Text: React.FC<TextProps> = ({ 
  children, 
  size = 'base', 
  weight = 'normal',
  color,
  lineHeight = 'normal',
  className = '',
  muted,
  style,
  ...rest
}) => {
  const fontSize = typeof size === 'string' && size in TYPOGRAPHY.fontSize
    ? `${(TYPOGRAPHY.fontSize as any)[size]}px`
    : size;
  const fontWeight = typeof weight === 'string' && weight in TYPOGRAPHY.fontWeight
    ? (TYPOGRAPHY.fontWeight as any)[weight]
    : weight;
  const lineHeightVal = typeof lineHeight === 'string' && lineHeight in TYPOGRAPHY.lineHeight
    ? (TYPOGRAPHY.lineHeight as any)[lineHeight]
    : lineHeight;
  
  return (
    <span
      className={className}
      style={{
        fontSize,
        fontWeight,
        color: resolveColor(color, muted),
        lineHeight: lineHeightVal,
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
};

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  mb?: keyof typeof SPACING | number | (string & {});
  mt?: keyof typeof SPACING | number | (string & {});
}

function spacingPx(v: any): string | undefined {
  if (v === undefined) return undefined;
  if (typeof v === 'number') return `${v}px`;
  if (v in SPACING) return `${(SPACING as any)[v]}px`;
  return String(v);
}

export const Heading: React.FC<HeadingProps> = ({ 
  children, 
  level = 1, 
  className = '',
  mb,
  mt,
  style,
  ...rest
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
  const TagComponent = Tag as any;
  
  return (
    <TagComponent
      className={className}
      style={{
        fontSize: `${TYPOGRAPHY.fontSize[sizes[level]]}px`,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        lineHeight: TYPOGRAPHY.lineHeight.tight,
        color: COLORS.text,
        marginBottom: spacingPx(mb),
        marginTop: spacingPx(mt),
        ...style,
      }}
      {...rest}
    >
      {children}
    </TagComponent>
  );
};

interface ParagraphProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  className?: string;
  color?: FlexColor;
  muted?: boolean;
  size?: keyof typeof TYPOGRAPHY.fontSize | (string & {});
  mb?: keyof typeof SPACING | number | (string & {});
  mt?: keyof typeof SPACING | number | (string & {});
}

export const Paragraph: React.FC<ParagraphProps> = ({ 
  children, 
  className = '',
  color,
  muted,
  size,
  mb,
  mt,
  style,
  ...rest
}) => {
  const fontSize = size
    ? (typeof size === 'string' && size in TYPOGRAPHY.fontSize
        ? `${(TYPOGRAPHY.fontSize as any)[size]}px`
        : size)
    : `${TYPOGRAPHY.fontSize.base}px`;
  
  return (
    <p
      className={className}
      style={{
        fontSize,
        lineHeight: TYPOGRAPHY.lineHeight.relaxed,
        color: resolveColor(color, muted),
        marginBottom: mb !== undefined ? spacingPx(mb) : `${TYPOGRAPHY.fontSize.base}px`,
        marginTop: spacingPx(mt),
        ...style,
      }}
      {...rest}
    >
      {children}
    </p>
  );
};

interface CaptionProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  className?: string;
  color?: FlexColor;
}

export const Caption: React.FC<CaptionProps> = ({ children, className = '', color, style, ...rest }) => (
  <span
    className={className}
    style={{
      fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
      fontWeight: TYPOGRAPHY.fontWeight.normal,
      color: resolveColor(color, false) || COLORS.textMuted,
      ...style,
    }}
    {...rest}
  >
    {children}
  </span>
);

interface LabelProps extends React.HTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

export const Label: React.FC<LabelProps> = ({ children, className = '', style, ...rest }) => (
  <label
    className={className}
    style={{
      fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
      fontWeight: TYPOGRAPHY.fontWeight.medium,
      color: COLORS.text,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      ...style,
    }}
    {...rest}
  >
    {children}
  </label>
);

interface BadgeTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  className?: string;
  color?: FlexColor;
}

export const BadgeText: React.FC<BadgeTextProps> = ({ children, className = '', color, style, ...rest }) => (
  <span
    className={className}
    style={{
      fontSize: `${TYPOGRAPHY.fontSize.xxs}px`,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      color: resolveColor(color, false) || COLORS.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      ...style,
    }}
    {...rest}
  >
    {children}
  </span>
);
