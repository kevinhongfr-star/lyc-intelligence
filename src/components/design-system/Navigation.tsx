import React from 'react';
import { COLORS, SPACING, RADII, TRANSITIONS } from '@/styles/tokens';

interface NavItemProps {
  children: React.ReactNode;
  href?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const NavItem: React.FC<NavItemProps> = ({ 
  children, 
  href,
  active = false,
  onClick,
  className = '',
}) => {
  const Component = href ? 'a' : 'button';

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
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = COLORS.bgHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = active ? COLORS.primaryLight : 'transparent';
      }}
    >
      {children}
    </Component>
  );
};

interface TabsProps {
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ children, className = '' }) => (
  <div
    className={className}
    style={{
      display: 'flex',
      borderBottom: `1px solid ${COLORS.border}`,
    }}
  >
    {children}
  </div>
);

interface TabProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const Tab: React.FC<TabProps> = ({ 
  children, 
  active = false,
  onClick,
  className = '',
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
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.color = COLORS.primary;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.color = active ? COLORS.primary : COLORS.textSecondary;
    }}
  >
    {children}
  </button>
);

interface BreadcrumbProps {
  items: { label: string; href?: string }[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => (
  <nav
    className={className}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: `${SPACING[2]}px`,
      fontSize: `${SPACING[4]}px`,
      color: COLORS.textMuted,
    }}
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