import React from 'react';
import { SPACING, BREAKPOINTS } from '@/styles/tokens';

interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
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
  maxWidth = '2xl', 
  className = '' 
}) => (
  <div 
    className={`mx-auto px-${SPACING[4]} ${className}`}
    style={{ maxWidth: maxWidths[maxWidth] }}
  >
    {children}
  </div>
);

interface StackProps {
  children: React.ReactNode;
  gap?: keyof typeof SPACING;
  direction?: 'row' | 'column';
  className?: string;
}

export const Stack: React.FC<StackProps> = ({ 
  children, 
  gap = '4', 
  direction = 'column',
  className = '' 
}) => (
  <div 
    className={`flex flex-${direction} ${className}`}
    style={{ gap: `${SPACING[gap]}px` }}
  >
    {children}
  </div>
);

interface GridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: keyof typeof SPACING;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({ 
  children, 
  columns = 1, 
  gap = '4',
  className = '' 
}) => (
  <div 
    className={`grid ${className}`}
    style={{ 
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: `${SPACING[gap]}px` 
    }}
  >
    {children}
  </div>
);

interface FlexProps {
  children: React.ReactNode;
  justify?: 'start' | 'end' | 'center' | 'between' | 'around';
  align?: 'start' | 'end' | 'center' | 'stretch';
  gap?: keyof typeof SPACING;
  className?: string;
}

export const Flex: React.FC<FlexProps> = ({ 
  children, 
  justify = 'start', 
  align = 'stretch',
  gap = '0',
  className = '' 
}) => {
  const justifyMap: Record<string, string> = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
  };
  
  const alignMap: Record<string, string> = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center',
    stretch: 'items-stretch',
  };
  
  return (
    <div 
      className={`flex ${justifyMap[justify]} ${alignMap[align]} ${className}`}
      style={{ gap: `${SPACING[gap]}px` }}
    >
      {children}
    </div>
  );
};

interface BoxProps {
  children: React.ReactNode;
  padding?: keyof typeof SPACING;
  margin?: keyof typeof SPACING;
  className?: string;
}

export const Box: React.FC<BoxProps> = ({ 
  children, 
  padding, 
  margin,
  className = '' 
}) => (
  <div 
    className={className}
    style={{
      padding: padding ? `${SPACING[padding]}px` : undefined,
      margin: margin ? `${SPACING[margin]}px` : undefined,
    }}
  >
    {children}
  </div>
);

interface SpacerProps {
  size?: keyof typeof SPACING;
  axis?: 'vertical' | 'horizontal';
}

export const Spacer: React.FC<SpacerProps> = ({ size = '4', axis = 'vertical' }) => (
  <div 
    style={{
      [axis === 'vertical' ? 'height' : 'width']: `${SPACING[size]}px`,
    }}
  />
);

interface ResponsiveProps {
  children: React.ReactNode;
  breakpoint?: keyof typeof BREAKPOINTS;
  display?: 'block' | 'none';
}

export const Responsive: React.FC<ResponsiveProps> = ({ 
  children, 
  breakpoint = 'md', 
  display = 'none' 
}) => (
  <div 
    style={{
      display: display === 'block' ? 'none' : 'block',
      [`@media (min-width: ${BREAKPOINTS[breakpoint]}px)`]: {
        display: display,
      },
    }}
  >
    {children}
  </div>
);