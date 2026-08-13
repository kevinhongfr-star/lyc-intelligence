/**
 * V1.1 FIX 2: Design system — Official LYC wordmark image (#1356).
 *
 * Single shared Logo component. Replaces 6+ bespoke wordmark treatments.
 *
 * BRAND RULE (non-negotiable):
 *  Official LYC wordmark image ONLY — exact same as lyc-partners.ai.
 *  NO custom product logo. NO "LYC Intelligence" lockup. NO L badge icon mark.
 *  Wordmark says "LYC" only. Renders as <img>, NOT text.
 *
 * Two context variants:
 *  - `light` : for LIGHT backgrounds — dark wordmark (lyc_wordmark.svg)
 *  - `dark`  : for DARK backgrounds — white/reverse wordmark (lyc_wordmark_reverse.svg)
 *
 * Sizes are image heights:
 *  - sm: 20px
 *  - md: 28px (default — nav/footer standard)
 *  - lg: 40px
 *
 * Renders a react-router <Link to="/"> by default; pass `as` for other tags
 * (e.g. `as="a"` for external hrefs, `as="div"` for non-link decorative).
 */
import React from 'react';
import { Link } from 'react-router-dom';

export type LogoVariant = 'light' | 'dark';
export type LogoSize = 'sm' | 'md' | 'lg';

export interface LogoProps {
  /** Wordmark variant — light = dark wordmark on light bg; dark = white wordmark on dark bg */
  variant?: LogoVariant;
  /** Size controls image height in px (sm=20, md=28, lg=40). Aspect ratio preserved automatically. */
  size?: LogoSize;
  /** Destination for the link. Defaults to "/". */
  to?: string;
  /** Override the link tag — pass `as="a"` for external href, `as="div"` for non-link. */
  as?: React.ElementType;
  /** href for `as="a"` external links */
  href?: string;
  className?: string;
  style?: React.CSSProperties;
}

/** Wordmark image heights (px). */
const IMAGE_HEIGHT: Record<LogoSize, number> = { sm: 20, md: 28, lg: 40 };

/** Wordmark aspect ratio from the SVG viewBox (120 / 28 ≈ 4.286). */
const WORDSMARK_ASPECT = 120 / 28;

const WORDMARK_SRC: Record<LogoVariant, string> = {
  light: '/brand/lyc_wordmark.svg',
  dark: '/brand/lyc_wordmark_reverse.svg',
};

const WORDMARK_ALT = 'LYC';

export function Logo({
  variant = 'light',
  size = 'md',
  to = '/',
  as,
  href,
  className,
  style,
}: LogoProps): React.ReactElement {
  const imgHeight = IMAGE_HEIGHT[size];
  const imgWidth = Math.round(imgHeight * WORDSMARK_ASPECT);

  // Build the <img> — the official wordmark
  const img = React.createElement('img', {
    src: WORDMARK_SRC[variant],
    alt: WORDMARK_ALT,
    height: imgHeight,
    width: imgWidth,
    style: {
      display: 'block',
      height: `${imgHeight}px`,
      width: `${imgWidth}px`,
      maxWidth: '100%',
    },
    loading: 'eager' as const,   // Wordmark is always above the fold
    fetchPriority: 'high' as const,
  });

  // Wrap in caller-specified tag (or Link by default)
  const Tag: React.ElementType = as ?? Link;
  const linkProps: Record<string, unknown> = as
    ? (as === 'a' && href ? { href } : {})
    : { to };

  return React.createElement(
    Tag,
    {
      ...linkProps,
      className,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        ...style,
      },
      'aria-label': WORDMARK_ALT,
    },
    img,
  );
}

export default Logo;
