/**
 * PublicTopBar — SINGLE source of truth for the pre-login / public top bar.
 *
 * After the 2026-09 auth-chrome fixes the same dark translucent bar had been
 * hand-copied into SignupPage, LoginPage, ResetPasswordPage AND Landing.tsx.
 * This component collapses those four copies into one.
 *
 * Visual contract (matches the homepage V6.0-2a treatment):
 *   fixed, V3.navHeight, rgba(10,10,10,~0.5-0.72) + backdrop-blur,
 *   NEXUS. wordmark = Crimson Pro bold 1.4rem cream + fuchsia dot.
 *
 * Brand note: the LYC Partners wordmark IMAGE (<Logo>) is the canonical
 * corporate mark and lives in footers; the product-facing NEXUS wordmark
 * above is a text lockup per product brand rules. Do not hand-roll a third
 * treatment — extend this component instead.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { V3 } from '@/styles/v3-tokens';

export function NexusWordmark({ onDark = true }: { onDark?: boolean }): React.ReactElement {
  return (
    <span
      style={{
        fontFamily: V3.displayFont,
        fontWeight: V3.fwBold,
        fontSize: '1.4rem',
        letterSpacing: '-0.01em',
        color: onDark ? V3.cream : V3.ink900,
      }}
    >
      NEXUS
      <span style={{ color: V3.fuchsia600 }}>.</span>
    </span>
  );
}

/** Shared style for the right-hand text action link (auth pages). */
export const publicNavTextAction: React.CSSProperties = {
  fontFamily: V3.bodyFont,
  fontSize: '0.875rem',
  color: V3.cream,
  opacity: 0.82,
  textDecoration: 'none',
};

/** Shared style for the outlined CTA button (homepage). */
export const publicNavOutlineCta: React.CSSProperties = {
  fontFamily: V3.bodyFont,
  fontSize: '0.8rem',
  color: V3.cream,
  textDecoration: 'none',
  padding: '10px 20px',
  border: `1px solid ${V3.cream}`,
  transition: `background ${V3.durNormal}ms ${V3.ease}, color ${V3.durNormal}ms ${V3.ease}`,
};

/** Center anchor link style (homepage section links). */
export const publicNavLink: React.CSSProperties = {
  fontFamily: V3.bodyFont,
  fontSize: '0.875rem',
  color: V3.cream,
  textDecoration: 'none',
  opacity: 0.82,
  transition: `opacity ${V3.durNormal}ms ${V3.ease}`,
};

export interface PublicTopBarProps {
  /**
   * 'home'  = marketing homepage bar: translucent over hero, solidifies on
   *           scroll; renders center links (hidden on mobile via CSS).
   * 'auth'  = auth pages: fixed 0.72 black + hairline border, no scroll
   *           behaviour (pages don't scroll meaningfully).
   */
  variant?: 'home' | 'auth';
  /** Center links ({to|href} + label). href renders an <a> (anchor links). */
  centerLinks?: Array<{ to?: string; href?: string; label: string; onClick?: () => void }>;
  /** Right-side node — CTA button or text link. */
  right?: React.ReactNode;
  /** className for the <header> (e.g. v3-fixed-nav v3-nav-scrolled CSS hooks). */
  className?: string;
}

export function PublicTopBar({
  variant = 'auth',
  centerLinks,
  right,
  className,
}: PublicTopBarProps): React.ReactElement {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (variant !== 'home') return;
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [variant]);

  const solid = variant === 'auth' || scrolled;

  return (
    <header
      className={
        variant === 'home'
          ? `${className ?? 'v3-fixed-nav'}${scrolled ? ' v3-nav-scrolled' : ''}`
          : className
      }
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: V3.navHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        background: solid ? 'rgba(10, 10, 10, 0.72)' : 'rgba(10, 10, 10, 0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom:
          variant === 'auth'
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid transparent',
        transition: `background ${V3.durNormal}ms ${V3.ease}, border-color ${V3.durNormal}ms ${V3.ease}`,
      }}
    >
      <Link to="/" style={{ textDecoration: 'none' }} aria-label="NEXUS home">
        <NexusWordmark onDark />
      </Link>

      {centerLinks && centerLinks.length > 0 && (
        <nav style={{ display: 'flex', gap: 40 }} className="v3-nav-links">
          {centerLinks.map((l) =>
            l.href ? (
              <a key={l.label} href={l.href} style={publicNavLink} onClick={l.onClick}>
                {l.label}
              </a>
            ) : (
              <Link key={l.label} to={l.to ?? '/'} style={publicNavLink} onClick={l.onClick}>
                {l.label}
              </Link>
            ),
          )}
        </nav>
      )}

      {right ?? <span />}
    </header>
  );
}

export default PublicTopBar;
