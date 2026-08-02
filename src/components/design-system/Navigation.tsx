import React from 'react';
import { COLORS, SPACING, RADII, TRANSITIONS } from '@/styles/tokens';

type SpacingInput = keyof typeof SPACING | number | (string & {});

const spacingPx = (val: SpacingInput | undefined): number | undefined => {
  if (val === undefined) return undefined;
  if (typeof val === 'number') {
    return SPACING[val] ?? val;
  }
  return SPACING[val] ?? parseInt(val, 10);
};

interface NavItemProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  href?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const NavItem: React.FC<NavItemProps> = ({ 
  children, 
  href,
  active = false,
  onClick,
  className = '',
  style,
  ...rest
}) => {
  const Component: any = href ? 'a' : 'button';

  return (
    <Component
      href={href}
      onClick={onClick}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${SPACING[3]}px`,
        padding: `${SPACING[2]}px ${SPACING[4]}px`,
        fontSize: `${SPACING[4]}px`,
        fontWeight: 500,
        color: active ? COLORS.primary : COLORS.textSecondary,
        backgroundColor: active ? COLORS.primaryLight : 'transparent',
        borderRadius: `${RADII.md}px`,
        textDecoration: 'none',
        cursor: 'pointer',
        border: 'none',
        transition: TRANSITIONS.all,
        ...style,
      }}
      onMouseEnter={(e: any) => {
        e.currentTarget.style.backgroundColor = COLORS.bgHover;
      }}
      onMouseLeave={(e: any) => {
        e.currentTarget.style.backgroundColor = active ? COLORS.primaryLight : 'transparent';
      }}
      {...rest}
    >
      {children}
    </Component>
  );
};

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Tabs: React.FC<TabsProps> = ({ children, className = '', style, ...rest }) => (
  <div
    className={className}
    style={{
      display: 'flex',
      borderBottom: `1px solid ${COLORS.border}`,
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
);

interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Tab: React.FC<TabProps> = ({ 
  children, 
  active = false,
  onClick,
  className = '',
  style,
  ...rest
}) => (
  <button
    onClick={onClick}
    className={className}
    style={{
      padding: `${SPACING[3]}px ${SPACING[4]}px`,
      fontSize: `${SPACING[4]}px`,
      fontWeight: active ? 600 : 500,
      color: active ? COLORS.primary : COLORS.textSecondary,
      backgroundColor: 'transparent',
      border: 'none',
      borderBottom: active ? `2px solid ${COLORS.primary}` : 'none',
      cursor: 'pointer',
      transition: TRANSITIONS.all,
      marginBottom: '-1px',
      ...style,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.color = COLORS.primary;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.color = active ? COLORS.primary : COLORS.textSecondary;
    }}
    {...rest}
  >
    {children}
  </button>
);

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: { label: string; href?: string }[];
  className?: string;
  style?: React.CSSProperties;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '', style, ...rest }) => (
  <nav
    className={className}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: `${SPACING[2]}px`,
      fontSize: `${SPACING[4]}px`,
      color: COLORS.textMuted,
      ...style,
    }}
    {...rest}
  >
    {items.map((item, index) => (
      <React.Fragment key={index}>
        {index > 0 && (
          <span style={{ marginRight: `${SPACING[1]}px` }}>/</span>
        )}
        {item.href ? (
          <a
            href={item.href}
            style={{
              color: COLORS.textSecondary,
              textDecoration: 'none',
              transition: TRANSITIONS.colors,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.textSecondary;
            }}
          >
            {item.label}
          </a>
        ) : (
          <span style={{ color: COLORS.text }}>{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);
