/**
 * V7.0 — Shared v3.5 marketing components.
 *
 * Editorial minimalism. Rule lines, not cards. Zero radius. No shadows.
 * Ocean primary, Teal secondary (cyan-leaning), Fuchsia punctuation only.
 * Display: Crimson Pro. Body: Inter. Meta: IBM Plex Mono.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { V3 } from '@/styles/v3-tokens';

/* ── Layout constants ── */
const CONTENT_MAX = 1160;

/* ── Container ── */
export function Container({
  children,
  style,
  maxWidth = CONTENT_MAX,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  maxWidth?: number;
}): React.ReactElement {
  return (
    <div style={{ maxWidth, margin: '0 auto', padding: '0 32px', ...style }}>
      {children}
    </div>
  );
}

/* ── Wordmark — "NEXUS." with fuchsia dot ── */
export function Wordmark({
  onDark = false,
  size = 'md',
}: {
  onDark?: boolean;
  size?: 'sm' | 'md' | 'lg';
}): React.ReactElement {
  const fontSize = size === 'lg' ? '1.5rem' : size === 'sm' ? '1rem' : '1.2rem';
  return (
    <span
      style={{
        fontFamily: V3.displayFont,
        fontWeight: V3.fwBold,
        fontSize,
        color: onDark ? V3.cream : V3.ink900,
        letterSpacing: '-0.02em',
        textDecoration: 'none',
      }}
    >
      NEXUS<span style={{ color: V3.fuchsia600 }}>.</span>
    </span>
  );
}

/* ── MonoLabel — eyebrows / meta / labels ── */
export function MonoLabel({
  children,
  color = V3.ocean600,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <span
      style={{
        fontFamily: V3.monoFont,
        fontSize: '0.68rem',
        letterSpacing: V3.trackingMono,
        textTransform: 'uppercase',
        fontWeight: V3.fwMedium,
        color,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ── RuleLine — 1px solid divider ── */
export function RuleLine({
  color = V3.ink200,
  style,
}: {
  color?: string;
  style?: React.CSSProperties;
}): React.ReactElement {
  return <div style={{ borderTop: `1px solid ${color}`, ...style }} />;
}

/* ── NumberedItem — grid layout: number + body ── */
export function NumberedItem({
  n,
  children,
  style,
}: {
  n: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '80px 1fr',
        gap: 32,
        padding: '32px 0',
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: V3.monoFont,
          fontSize: '0.9rem',
          color: V3.ink400,
          letterSpacing: V3.trackingMono,
        }}
      >
        {n}
      </span>
      <div
        style={{
          fontFamily: V3.displayFont,
          fontSize: V3.textBodySerif,
          lineHeight: V3.leadingBodySerif,
          fontWeight: V3.fwRegular,
          color: V3.ink700,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── PageHeader — mono eyebrow + h1 + lead paragraph ── */
export function PageHeader({
  eyebrow,
  title,
  lead,
  onDark = false,
  style,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
  onDark?: boolean;
  style?: React.CSSProperties;
}): React.ReactElement {
  const titleColor = onDark ? V3.cream : V3.ink900;
  const leadColor = onDark ? V3.onDarkMuted : V3.ink700;
  return (
    <Container style={{ textAlign: 'left', ...style }}>
      <MonoLabel color={onDark ? V3.teal400 : V3.ocean600} style={{ display: 'block', margin: '0 0 20px 0' }}>
        {eyebrow}
      </MonoLabel>
      <h1
        style={{
          fontFamily: V3.displayFont,
          fontSize: V3.textSectionTitle,
          lineHeight: V3.leadingSectionTitle,
          fontWeight: V3.fwRegular,
          color: titleColor,
          letterSpacing: V3.trackingDisplay,
          margin: '0 0 24px 0',
          maxWidth: 800,
        }}
      >
        {title}
      </h1>
      {lead && (
        <p
          style={{
            fontFamily: V3.displayFont,
            fontSize: V3.textBodySerif,
            lineHeight: V3.leadingBodySerif,
            fontWeight: V3.fwRegular,
            color: leadColor,
            maxWidth: 680,
            margin: 0,
          }}
        >
          {lead}
        </p>
      )}
    </Container>
  );
}

/* ── ContentSection — wrapper with bg variants ── */
export function ContentSection({
  children,
  bg = 'cream',
  paddingY = V3.marketingPadY,
  style,
}: {
  children: React.ReactNode;
  bg?: 'cream' | 'white' | 'dark';
  paddingY?: number;
  style?: React.CSSProperties;
}): React.ReactElement {
  const bgMap = {
    cream: V3.cream,
    white: V3.white,
    dark: V3.ink900,
  };
  return (
    <section
      style={{
        background: bgMap[bg],
        padding: `${paddingY}px 0`,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

/* ── TwoCol — side-label (mono, left) + main-text (body, right) ── */
export function TwoCol({
  label,
  children,
  onDark = false,
  style,
}: {
  label: string;
  children: React.ReactNode;
  onDark?: boolean;
  style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <Container
      style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr',
        gap: 64,
        alignItems: 'start',
        ...style,
      }}
    >
      <div>
        <MonoLabel
          color={onDark ? V3.teal400 : V3.ocean600}
          style={{ display: 'block', paddingTop: 8 }}
        >
          {label}
        </MonoLabel>
      </div>
      <div
        style={{
          fontFamily: V3.displayFont,
          fontSize: V3.textBodySerif,
          lineHeight: V3.leadingBodySerif,
          fontWeight: V3.fwRegular,
          color: onDark ? V3.onDarkMuted : V3.ink700,
          maxWidth: 720,
        }}
      >
        {children}
      </div>
    </Container>
  );
}

/* ── PullQuote ── */
export function PullQuote({
  quote,
  attribution,
  onDark = false,
  style,
}: {
  quote: string;
  attribution: string;
  onDark?: boolean;
  style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <Container style={{ maxWidth: 800, ...style }}>
      <blockquote style={{ margin: 0 }}>
        <p
          style={{
            fontFamily: V3.displayFont,
            fontSize: '1.6rem',
            lineHeight: 1.4,
            fontWeight: V3.fwLight,
            color: onDark ? V3.cream : V3.ink900,
            margin: '0 0 20px 0',
            fontStyle: 'italic',
          }}
        >
          &ldquo;{quote}&rdquo;
        </p>
        <MonoLabel color={onDark ? V3.teal300 : V3.ink500}>
          {attribution}
        </MonoLabel>
      </blockquote>
    </Container>
  );
}

/* ── Button — primary / secondary / text-link variants ── */
export function Button({
  children,
  to,
  variant = 'primary',
  onDark = false,
  onClick,
  style,
}: {
  children: React.ReactNode;
  to: string;
  variant?: 'primary' | 'secondary' | 'text';
  onDark?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}): React.ReactElement {
  if (variant === 'text') {
    return (
      <Link
        to={to}
        onClick={onClick}
        style={{
          fontFamily: V3.bodyFont,
          fontSize: '0.85rem',
          color: onDark ? V3.teal300 : V3.ocean600,
          textDecoration: 'none',
          borderBottom: `1px solid ${onDark ? V3.teal300 : V3.ocean600}`,
          paddingBottom: 2,
          ...style,
        }}
      >
        {children}
      </Link>
    );
  }

  const base: React.CSSProperties = {
    display: 'inline-block',
    fontFamily: V3.bodyFont,
    fontSize: '0.9rem',
    fontWeight: V3.fwMedium,
    textDecoration: 'none',
    padding: '14px 32px',
    transition: `transform ${V3.durNormal}ms ${V3.ease}, background ${V3.durNormal}ms ${V3.ease}, color ${V3.durNormal}ms ${V3.ease}`,
    cursor: 'pointer',
  };

  if (variant === 'primary') {
    return (
      <Link
        to={to}
        onClick={onClick}
        className="v3-cta-primary"
        style={{
          ...base,
          background: onDark ? V3.cream : V3.ink900,
          color: onDark ? V3.ink900 : V3.cream,
          ...style,
        }}
      >
        {children}
      </Link>
    );
  }

  // secondary
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        ...base,
        background: 'transparent',
        color: onDark ? V3.cream : V3.ink900,
        border: `1px solid ${onDark ? V3.cream : V3.ink900}`,
        ...style,
      }}
    >
      {children}
    </Link>
  );
}

/* ── SectionTitle — h2 with serif display ── */
export function SectionTitle({
  children,
  onDark = false,
  style,
}: {
  children: React.ReactNode;
  onDark?: boolean;
  style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <h2
      style={{
        fontFamily: V3.displayFont,
        fontSize: V3.textSectionTitle,
        lineHeight: V3.leadingSectionTitle,
        fontWeight: V3.fwRegular,
        color: onDark ? V3.cream : V3.ink900,
        letterSpacing: V3.trackingDisplay,
        margin: 0,
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

/* ── BodySerif — body text in serif ── */
export function BodySerif({
  children,
  onDark = false,
  style,
}: {
  children: React.ReactNode;
  onDark?: boolean;
  style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <p
      style={{
        fontFamily: V3.displayFont,
        fontSize: V3.textBodySerif,
        lineHeight: V3.leadingBodySerif,
        fontWeight: V3.fwRegular,
        color: onDark ? V3.onDarkMuted : V3.ink700,
        margin: 0,
        ...style,
      }}
    >
      {children}
    </p>
  );
}
