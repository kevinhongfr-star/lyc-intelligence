/**
 * Design system: Logo / Brand wordmark (#1356).
 *
 * Single shared Logo component for the entire surface. Replaces the 6+ bespoke
 * "LYC Intelligence" wordmark treatments across navs, footers, and auth pages.
 *
 * Two context variants:
 *  - `light` : for LIGHT backgrounds — dark text (#0A0A12), accent badge.
 *  - `dark`  : for DARK backgrounds — white text, accent badge.
 *
 * Brand rules:
 *  - Zero border radius on the badge (#1349).
 *  - Crimson Pro wordmark, 700 weight (#1369).
 *  - Badge is the only place the accent appears in the logo (color discipline).
 *  - Renders a react-router <Link to="/"> by default; pass `as` for other tags.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ACCENT, FONT_DISPLAY, TEXT, WHITE } from '@/tokens';

export type LogoVariant = 'light' | 'dark';
export type LogoSize = 'sm' | 'md' | 'lg';

export interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  /** Show the "L" accent badge. Default true. */
  showBadge?: boolean;
  /** Wordmark text. Defaults to "LYC Intelligence". */
  label?: string;
  /** Destination for the link. Defaults to "/". */
  to?: string;
  /** Override the anchor — pass `as="div"` for a non-link logo. */
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
}

const BADGE_SIZE: Record<LogoSize, number> = { sm: 24, md: 32, lg: 40 };
const BADGE_FONT: Record<LogoSize, number> = { sm: 12, md: 15, lg: 18 };
const WORDMARK_FONT: Record<LogoSize, number> = { sm: 16, md: 18, lg: 22 };

export function Logo({
  variant = 'light',
  size = 'md',
  showBadge = true,
  label = 'LYC Intelligence',
  to = '/',
  as,
  className,
  style,
}: LogoProps): React.ReactElement {
  const wordmarkColor = variant === 'dark' ? WHITE : TEXT;
  const Tag: React.ElementType = as ?? Link;
  const linkProps = as ? {} : { to };

  return (
    <Tag
      {...linkProps}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        textDecoration: 'none',
        ...style,
      }}
    >
      {showBadge && (
        <span
          aria-hidden="true"
          style={{
            width: BADGE_SIZE[size],
            height: BADGE_SIZE[size],
            background: ACCENT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: WHITE,
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: BADGE_FONT[size],
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          L
        </span>
      )}
      <span
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: WORDMARK_FONT[size],
          fontWeight: 700,
          color: wordmarkColor,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </Tag>
  );
}

export default Logo;
