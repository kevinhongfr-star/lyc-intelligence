import React from 'react';
import { SPACING, BREAKPOINTS } from '@/styles/tokens';

type FlexSpacing = keyof typeof SPACING | number | (string & {});

function flexSpacing(v: any): string | undefined {
  if (v === undefined) return undefined;
  if (typeof v === 'number') return `${v}px`;
  if (String(v) in SPACING) return `${(SPACING as any)[v]}px`;
  return String(v);
}

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | (string & {});
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | (string & {});
  className?: string;
}

const maxWidths: Record<string, string> = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const Container: React.FC<ContainerProps> = ({ 
  children, 
  maxWidth,
  size,
  className = '',
  style,
  ...rest
}) => {
  const mw = maxWidth || size || '2xl';
  const widthVal = (maxWidths as any)[mw] || (typeof mw === 'string' && mw.startsWith('#') ? undefined : String(mw));
  return (
    <div 
      className={`mx-auto ${className}`}
      style={{ 
        maxWidth: widthVal,
        paddingLeft: `${SPACING[4]}px`,
        paddingRight: `${SPACING[4]}px`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gap?: FlexSpacing;
  direction?: 'row' | 'column';
  className?: string;
}

export const Stack: React.FC<StackProps> = ({ 
  children, 
  gap = 4, 
  direction = 'column',
  className = '',
  style,
  ...rest
}) => (
  <div 
    className={`flex ${className}`}
    style={{ 
      flexDirection: direction,
      gap: flexSpacing(gap),
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
);

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: number;
  gap?: FlexSpacing;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({ 
  children, 
  columns = 1, 
  gap = 4,
  className = '',
  style,
  ...rest
}) => (
  <div 
    className={`grid ${className}`}
    style={{ 
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: flexSpacing(gap),
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
);

interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  justify?: 'start' | 'end' | 'center' | 'between' | 'around';
  align?: 'start' | 'end' | 'center' | 'stretch';
  gap?: FlexSpacing;
  wrap?: boolean | 'nowrap' | 'wrap' | 'wrap-reverse';
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  className?: string;
}

export const Flex: React.FC<FlexProps> = ({ 
  children, 
  justify = 'start', 
  align = 'stretch',
  gap = 0,
  wrap,
  direction,
  className = '',
  style,
  ...rest
}) => {
  const justifyMap: Record<string, string> = {
    start: 'flex-start',
    end: 'flex-end',
    center: 'center',
    between: 'space-between',
    around: 'space-around',
  };
  
  const alignMap: Record<string, string> = {
    start: 'flex-start',
    end: 'flex-end',
    center: 'center',
    stretch: 'stretch',
  };

  const flexWrap = wrap === true ? 'wrap' : wrap === false ? 'nowrap' : wrap;
  
  return (
    <div 
      className={`flex ${className}`}
      style={{ 
        justifyContent: justifyMap[justify] || justify,
        alignItems: alignMap[align] || align,
        gap: flexSpacing(gap),
        flexWrap: flexWrap,
        flexDirection: direction,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: FlexSpacing;
  p?: FlexSpacing;
  margin?: FlexSpacing;
  m?: FlexSpacing;
  className?: string;
}

export const Box: React.FC<BoxProps> = ({ 
  children, 
  padding,
  p,
  margin,
  m,
  className = '',
  style,
  ...rest
}) => {
  const actualPadding = padding ?? p;
  const actualMargin = margin ?? m;
  return (
    <div 
      className={className}
      style={{
        padding: flexSpacing(actualPadding),
        margin: flexSpacing(actualMargin),
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

interface SpacerProps {
  size?: FlexSpacing;
  axis?: 'vertical' | 'horizontal';
}

export const Spacer: React.FC<SpacerProps> = ({ size = 4, axis = 'vertical' }) => (
  <div 
    style={{
      [axis === 'vertical' ? 'height' : 'width']: flexSpacing(size),
    }}
  />
);

interface ResponsiveProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  breakpoint?: keyof typeof BREAKPOINTS;
  display?: 'block' | 'none';
}

export const Responsive: React.FC<ResponsiveProps> = ({ 
  children, 
  breakpoint = 'md', 
  display = 'none',
  style,
  ...rest
}) => {
  const bpVal = (BREAKPOINTS as any)[breakpoint] || 768;
  return (
    <div 
      style={{
        display: display === 'block' ? 'none' : 'block',
        ...style,
        ...({
          [`@media (min-width: ${bpVal}px)`]: {
            display: display,
          },
        } as any),
      }}
      {...rest}
    >
      {children}
    </div>
  );
};
