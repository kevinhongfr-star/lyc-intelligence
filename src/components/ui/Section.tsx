/**
 * #1360 — Section primitives for the ECHO v1.2 design system.
 *
 * Adds the three layout/typography primitives the marketing surface was
 * missing: Container (max-width + padding), SectionHeading (eyebrow + title +
 * optional subtitle), and Text (semantic typographic variants).
 *
 * Brand rules enforced:
 *   - Zero border radius (global `* { border-radius: 0 !important }` already covers this)
 *   - System serif headings (DejaVu Serif / Georgia / Times), DM Sans body, IBM Plex Mono eyebrows
 *   - Eyebrow labels default to light gray #9CA3AF (brand v1.2) — accent reserved
 *     for CTAs + key emphasis only
 *   - Functional motion 120–350ms only
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { EYEBROW } from '@/tokens';

// ── Container ────────────────────────────────────────────────────────
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max-width preset. Defaults to `base` (940px) — the marketing default. */
  width?: 'sm' | 'md' | 'base' | 'lg' | 'xl';
  as?: React.ElementType;
}

const WIDTH_CLASS: Record<NonNullable<ContainerProps['width']>, string> = {
  sm: 'max-w-[640px]',
  md: 'max-w-[768px]',
  base: 'max-w-[940px]',
  lg: 'max-w-[1120px]',
  xl: 'max-w-[1280px]',
};

export function Container({
  width = 'base',
  as: Tag = 'div',
  className,
  children,
  ...rest
}: ContainerProps) {
  return (
    <Tag
      className={cn('mx-auto px-5 md:px-8', WIDTH_CLASS[width], className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// ── SectionHeading ───────────────────────────────────────────────────
export interface SectionHeadingProps {
  /** Small uppercase eyebrow label. Defaults to light gray #9CA3AF per brand v1.2. */
  eyebrow?: string;
  /** Optional accent override for the eyebrow — use sparingly (brand rule: gray default). */
  eyebrowAccent?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Heading level for semantics. Defaults to h2. */
  as?: 'h1' | 'h2' | 'h3';
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  eyebrowAccent,
  title,
  subtitle,
  as: Tag = 'h2',
  align = 'left',
  className,
}: SectionHeadingProps) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left';
  return (
    <div className={cn(alignClass, className)}>
      {eyebrow && (
        <span
          className="block font-mono uppercase tracking-[0.12em] text-[11px] font-medium mb-5"
          style={{ color: eyebrowAccent ?? EYEBROW }}
        >
          {eyebrow}
        </span>
      )}
      <Tag
        className="font-serif font-bold text-text-primary leading-[1.15]"
        style={{ fontSize: Tag === 'h1' ? 'clamp(32px,5vw,56px)' : Tag === 'h3' ? 22 : 'clamp(22px,3.2vw,34px)' }}
      >
        {title}
      </Tag>
      {subtitle && (
        <p className="mt-4 text-body-lg text-text-secondary leading-[1.6] max-w-[640px]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ── Text ─────────────────────────────────────────────────────────────
export type TextVariant =
  | 'display' | 'h1' | 'h2' | 'h3'
  | 'body-lg' | 'body' | 'body-sm' | 'caption' | 'eyebrow' | 'mono';

const TEXT_CLASS: Record<TextVariant, string> = {
  display: 'font-serif font-bold text-[48px] leading-[1.1]',
  h1: 'font-serif font-bold text-[36px] leading-[1.2]',
  h2: 'font-serif font-semibold text-[28px] leading-[1.2]',
  h3: 'font-serif font-semibold text-[22px] leading-[1.25]',
  'body-lg': 'font-sans text-[18px] leading-[1.6]',
  body: 'font-sans text-[16px] leading-[1.6]',
  'body-sm': 'font-sans text-[14px] leading-[1.5]',
  caption: 'font-sans text-[12px] leading-[1.4]',
  eyebrow: 'font-mono uppercase tracking-[0.12em] text-[11px] font-medium',
  mono: 'font-mono text-[13px] leading-[1.5]',
};

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  as?: React.ElementType;
}

export function Text({
  variant = 'body',
  as: Tag = 'p',
  className,
  children,
  ...rest
}: TextProps) {
  return (
    <Tag className={cn(TEXT_CLASS[variant], className)} {...rest}>
      {children}
    </Tag>
  );
}

/** Eyebrow label — light gray (#616170, gray-500) default per brand v1.2 (#1353). */
export function Eyebrow({
  children,
  accent,
  className,
}: {
  children: React.ReactNode;
  accent?: string;
  className?: string;
}) {
  return (
    <span
      className={cn('block font-mono uppercase tracking-[0.12em] text-[11px] font-medium mb-5', className)}
      style={{ color: accent ?? EYEBROW }}
    >
      {children}
    </span>
  );
}
