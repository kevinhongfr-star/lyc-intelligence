/**
 * V-App — v3.5 shared UI component library.
 *
 * Pattern: inline React.CSSProperties throughout (zero radius, rule lines,
 * no shadows, no gradients). Mirrors the v3.5 design system spec.
 *
 * Components:
 *   Button (primary/secondary/ghost/dark-cta/danger — default/large/small)
 *   Badge (status variants: ready/in-progress/at-risk/draft + tier variants + count)
 *   Input + Textarea (underline-ish, ink-200 border, focus ocean-400)
 *   Select (custom chevron, 36px height)
 *   Toggle (36x20 track, 16px thumb — ocean-500/ink-200)
 *   ScoreBar (2px height — teal ≥70 / ocean-400 45-69 / fuchsia-600 <45)
 *   EmptyState (40px icon, Crimson title, description, CTA)
 *   Modal (backdrop 50% ink-900, white panel, zero radius)
 *   LoadingSkeleton (shimmer — per-component-shape variants)
 *   Wordmark (NEXUS. for app sidebar)
 *   Avatar (initials, ocean-700/white, 3 sizes)
 *   MonoLabel (IBM Plex Mono, uppercase, 10.5px/12%)
 *   PageHeader (kicker + title + description — app variant, 960px max)
 *   Breadcrumb (crumb / separator — topbar)
 *   IconButton (36px square, ink-400→700 hover, ink-50 hover bg)
 *   ListRow (flex, justify-between, border-bottom 1px)
 *   Tabs (secondary nav, bottom border active)
 *   FormRow (label / helper / control)
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { V3 } from '@/styles/v3-tokens';

/* ──────────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────────── */

/** Score color per spec § 0.1 Score bar colors */
export function scoreColor(score: number | undefined | null): string {
  if (score == null || Number.isNaN(score)) return V3.scoreLocked;
  if (score >= 70) return V3.scoreOk;
  if (score >= 45) return V3.scoreWarning;
  return V3.scoreCritical;
}

export function userInitials(name?: string | null): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'U';
}

/* ──────────────────────────────────────────────────────────────────────
   Button — § 7.1
   Variants: primary | secondary | ghost | dark-cta | danger
   Sizes:   default (36) | large (42) | small (30)
   ────────────────────────────────────────────────────────────────────── */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dark-cta' | 'danger';
type ButtonSize = 'default' | 'large' | 'small';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  block?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
  ariaLabel?: string;
  type?: 'button' | 'submit' | 'reset';
}

function _buttonSize(size: ButtonSize): { h: number; padX: number; fs: string } {
  switch (size) {
    case 'large':
      return { h: V3.sizeButtonLarge, padX: 24, fs: '14px' };
    case 'small':
      return { h: V3.sizeButtonSmall, padX: 12, fs: '12.5px' };
    default:
      return { h: V3.sizeButton, padX: 16, fs: '13.5px' };
  }
}

function _buttonStyles(v: ButtonVariant, s: ButtonSize, disabled: boolean): React.CSSProperties {
  const sz = _buttonSize(s);
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: sz.h,
    padding: `0 ${sz.padX}px`,
    borderRadius: 0,
    fontFamily: V3.bodyFont,
    fontSize: sz.fs,
    fontWeight: V3.fwMedium,
    lineHeight: 1,
    textDecoration: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: `background ${V3.durFast}ms ${V3.ease}, color ${V3.durFast}ms ${V3.ease}, border-color ${V3.durFast}ms ${V3.ease}`,
    userSelect: 'none',
    outline: 'none',
    border: 'none',
  };
  switch (v) {
    case 'primary':
      return { ...base, background: V3.ocean600, color: V3.white };
    case 'secondary':
      return { ...base, background: V3.white, color: V3.ocean700, border: `1px solid ${V3.ocean200}` };
    case 'ghost':
      return { ...base, background: 'transparent', color: V3.ink700 };
    case 'dark-cta':
      return { ...base, background: V3.fuchsia600, color: V3.white };
    case 'danger':
      return { ...base, background: V3.white, color: V3.fuchsia700, border: `1px solid ${V3.fuchsia50}` };
  }
}

function _buttonHoverStyles(v: ButtonVariant): React.CSSProperties {
  switch (v) {
    case 'primary':
      return { background: V3.ocean700 };
    case 'secondary':
      return { background: V3.ocean50 };
    case 'ghost':
      return { background: V3.ink50 };
    case 'dark-cta':
      return { background: V3.fuchsia700 };
    case 'danger':
      return { background: V3.fuchsia50 };
  }
}

export function Button(props: ButtonBaseProps & { to?: undefined | string }): React.ReactElement;
export function Button(props: ButtonBaseProps & { to: string }): React.ReactElement;

export function Button(props: ButtonBaseProps & { to?: string }): React.ReactElement {
  const {
    variant = 'primary',
    size = 'default',
    disabled = false,
    block = false,
    onClick,
    children,
    style,
    ariaLabel,
    type = 'button',
    to,
  } = props;

  const baseStyle: React.CSSProperties = {
    ..._buttonStyles(variant, size, disabled),
    width: block ? '100%' : undefined,
    ...style,
  };

  const commonProps = {
    role: 'button' as const,
    'aria-label': ariaLabel,
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;
      const hover = _buttonHoverStyles(variant);
      const el = e.currentTarget as HTMLElement;
      Object.entries(hover).forEach(([k, v]) => {
        (el.style as any)[k] = typeof v === 'string' || typeof v === 'number' ? v : '';
      });
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      const hover = _buttonHoverStyles(variant);
      const reset = _buttonStyles(variant, size, disabled);
      const el = e.currentTarget as HTMLElement;
      Object.keys(hover).forEach((k) => {
        const original = (reset as any)[k];
        (el.style as any)[k] = typeof original === 'string' || typeof original === 'number' ? original : '';
      });
    },
  };

  if (to && !disabled) {
    return (
      <Link
        to={to}
        onClick={onClick as any}
        style={baseStyle}
        {...commonProps}
      >
        {children}
      </Link>
    );
  }
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick as any}
      style={baseStyle}
      {...commonProps}
    >
      {children}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Badge — § 7.2
   All badges use IBM Plex Mono, 10px, 500 weight, uppercase, 0.1em LS.
   Zero radius. 3-8px or 4-10px padding (small/regular).
   ────────────────────────────────────────────────────────────────────── */
export type BadgeVariant =
  | 'status-ready'
  | 'status-in-progress'
  | 'status-at-risk'
  | 'status-draft'
  | 'tier-pro'
  | 'tier-executive'
  | 'tier-council'
  | 'count'
  | 'count-active'
  | 'meta';

export function Badge({
  children,
  variant = 'count',
  size = 'regular',
  style,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'small' | 'regular';
  style?: React.CSSProperties;
}): React.ReactElement {
  const pad = size === 'small' ? '3px 8px' : '4px 10px';
  let bg = V3.ink100;
  let color = V3.ink500;
  switch (variant) {
    case 'status-ready':
      bg = V3.teal50; color = V3.teal700; break;
    case 'status-in-progress':
      bg = V3.ocean50; color = V3.ocean700; break;
    case 'status-at-risk':
      bg = V3.fuchsia50; color = V3.fuchsia700; break;
    case 'status-draft':
      bg = V3.ink100; color = V3.ink500; break;
    case 'tier-pro':
      bg = V3.ocean50; color = V3.ocean700; break;
    case 'tier-executive':
      bg = V3.teal50; color = V3.teal700; break;
    case 'tier-council':
      bg = V3.ink900; color = V3.cream; break;
    case 'count-active':
      bg = V3.ocean100; color = V3.ocean700; break;
    case 'meta':
      bg = 'transparent'; color = V3.ink400; break;
    case 'count':
    default:
      bg = V3.ink100; color = V3.ink500; break;
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: V3.monoFont,
        fontSize: '10px',
        fontWeight: V3.fwMedium,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: pad,
        borderRadius: 0,
        background: bg,
        color,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Input + Textarea — § 7.3
   36px height (input), auto (textarea). 1px ink-200 border.
   Focus → border ocean-400, 0 outline. Zero radius.
   ────────────────────────────────────────────────────────────────────── */
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>): React.ReactElement {
  const { style, ...rest } = props;
  return (
    <input
      {...rest}
      style={{
        width: '100%',
        height: 36,
        padding: '0 12px',
        background: V3.white,
        border: `1px solid ${V3.ink200}`,
        borderRadius: 0,
        fontFamily: V3.bodyFont,
        fontSize: '13.5px',
        color: V3.ink700,
        outline: 'none',
        transition: `border-color ${V3.durFast}ms ${V3.ease}`,
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = V3.ocean400;
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = V3.ink200;
        props.onBlur?.(e);
      }}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>): React.ReactElement {
  const { style, ...rest } = props;
  return (
    <textarea
      {...rest}
      style={{
        width: '100%',
        padding: '10px 12px',
        background: V3.white,
        border: `1px solid ${V3.ink200}`,
        borderRadius: 0,
        fontFamily: V3.bodyFont,
        fontSize: '13.5px',
        lineHeight: 1.6,
        color: V3.ink700,
        outline: 'none',
        resize: 'vertical',
        transition: `border-color ${V3.durFast}ms ${V3.ease}`,
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = V3.ocean400;
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = V3.ink200;
        props.onBlur?.(e);
      }}
    />
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Select — § 7.3 (custom chevron)
   Same sizing as input, custom appearance-none, 14px chevron.
   ────────────────────────────────────────────────────────────────────── */
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>): React.ReactElement {
  const { style, children, ...rest } = props;
  return (
    <div style={{ position: 'relative', ...(props as any).containerStyle }}>
      <select
        {...rest}
        style={{
          width: '100%',
          height: 36,
          padding: '0 36px 0 12px',
          background: V3.white,
          border: `1px solid ${V3.ink200}`,
          borderRadius: 0,
          fontFamily: V3.bodyFont,
          fontSize: '13.5px',
          color: V3.ink700,
          outline: 'none',
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          transition: `border-color ${V3.durFast}ms ${V3.ease}`,
          cursor: 'pointer',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = V3.ocean400;
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = V3.ink200;
          props.onBlur?.(e);
        }}
      >
        {children}
      </select>
      <svg
        width="14" height="14" viewBox="0 0 14 14" fill="none"
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: V3.ink400,
        }}
        aria-hidden
      >
        <path d="M3 5.5L7 9.5L11 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Toggle — § 7.3 / § 5.4
   36 × 20 track, 16px thumb.
   Off: ink-200 / white. On: ocean-500 / white. Transition bg 0.2s.
   ────────────────────────────────────────────────────────────────────── */
export function Toggle({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}): React.ReactElement {
  const trackBg = checked ? V3.ocean500 : V3.ink200;
  const thumbLeft = checked ? V3.sizeToggleW - V3.sizeToggleThumb - 2 : 2;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: 'relative',
        width: V3.sizeToggleW,
        height: V3.sizeToggleH,
        background: trackBg,
        borderRadius: 0,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: `background ${V3.durNormal}ms ${V3.ease}`,
        opacity: disabled ? 0.5 : 1,
        padding: 0,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: thumbLeft,
          width: V3.sizeToggleThumb,
          height: V3.sizeToggleThumb,
          background: V3.white,
          transition: `left ${V3.durNormal}ms ${V3.ease}`,
          display: 'block',
        }}
      />
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   ScoreBar — § 7.4
   2px height, ink-100 track, colored fill. Color based on score band.
   Width transitions 0.3s ease (prefers-reduced-motion handled in CSS).
   ────────────────────────────────────────────────────────────────────── */
export function ScoreBar({
  score,
  locked,
  style,
}: {
  score: number | undefined | null;
  locked?: boolean;
  style?: React.CSSProperties;
}): React.ReactElement {
  const color = locked ? V3.scoreLocked : scoreColor(score);
  const pct = locked ? 0 : Math.max(0, Math.min(100, typeof score === 'number' ? score : 0));
  return (
    <div
      aria-hidden={locked}
      style={{
        width: '100%',
        height: V3.sizeScoreBar,
        background: locked ? V3.white : V3.ink100,
        ...style,
      }}
    >
      <div
        style={{
          height: V3.sizeScoreBar,
          width: `${pct}%`,
          background: color,
          transition: `width 0.3s ${V3.ease}, background ${V3.durSlow}ms ${V3.ease}`,
        }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   EmptyState — § 7.5
   40px icon line SVG, Crimson title, ink-400 desc, margin-top 20px CTA.
   ────────────────────────────────────────────────────────────────────── */
export function EmptyState({
  iconSvg,
  title,
  description,
  action,
}: {
  iconSvg: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '64px 32px',
      }}
    >
      <div style={{ color: V3.ink200, width: 40, height: 40 }}>{iconSvg}</div>
      <div
        style={{
          fontFamily: V3.displayFont,
          fontSize: '18px',
          fontWeight: V3.fwMedium,
          color: V3.ink700,
          marginTop: 16,
        }}
      >
        {title}
      </div>
      {description && (
        <div
          style={{
            fontFamily: V3.bodyFont,
            fontSize: '13.5px',
            color: V3.ink400,
            marginTop: 8,
            maxWidth: 360,
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>
      )}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Modal — § 7.6
   Backdrop 0.5 ink-900, panel 480px width, 32px padding, zero radius.
   ────────────────────────────────────────────────────────────────────── */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}): React.ReactElement | null {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        background: 'rgba(10,10,10,0.5)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: V3.white,
          border: `1px solid ${V3.ink200}`,
          borderRadius: 0,
          maxWidth: 480,
          width: '100%',
          padding: 32,
        }}
      >
        <div
          style={{
            fontFamily: V3.displayFont,
            fontSize: '19px',
            fontWeight: V3.fwSemibold,
            color: V3.ink900,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: V3.bodyFont,
            fontSize: '14px',
            lineHeight: 1.6,
            color: V3.ink500,
            marginTop: 12,
          }}
        >
          {children}
        </div>
        {footer && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 24,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   LoadingSkeleton — generic shimmer placeholder for text/cards.
   Uses CSS class .v3-skeleton-shimmer (defined in index.css).
   ────────────────────────────────────────────────────────────────────── */
export function Skeleton({
  width = '100%',
  height = 14,
  style,
}: {
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <div
      className="v3-skeleton-shimmer"
      style={{
        width,
        height,
        background: V3.ink100,
        borderRadius: 0,
        display: 'block',
        ...style,
      }}
    />
  );
}

export function CardSkeleton({
  lines = 4,
  style,
}: {
  lines?: number;
  style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <div
      style={{
        background: V3.white,
        border: `1px solid ${V3.ink100}`,
        padding: 20,
        ...style,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Skeleton width={80} height={12} />
        <Skeleton width={30} height={24} />
      </div>
      <Skeleton height={16} style={{ marginBottom: 8 }} />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} height={12} style={{ marginTop: 10 }} />
      ))}
      <Skeleton height={2} style={{ marginTop: 12 }} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Wordmark — sidebar variant (Crimson Pro 22px / 600, cream, fuchsia dot)
   ────────────────────────────────────────────────────────────────────── */
export function Wordmark({
  onDark = false,
  size = 'md',
  tagline = false,
}: {
  onDark?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'sidebar';
  /** Show "Executive intelligence" tagline below the wordmark (mockup spec) */
  tagline?: boolean;
}): React.ReactElement {
  let fontSize = '1.2rem';
  switch (size) {
    case 'sm': fontSize = '1rem'; break;
    case 'sidebar': fontSize = '22px'; break;
    case 'lg': fontSize = '1.5rem'; break;
    case 'md':
    default: fontSize = '1.2rem';
  }
  const wordmarkEl = (
    <span
      style={{
        fontFamily: V3.displayFont,
        fontWeight: V3.fwSemibold,
        fontSize,
        color: onDark ? V3.cream : V3.ink900,
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}
    >
      NEXUS<span style={{ color: V3.fuchsia600 }}>.</span>
    </span>
  );

  if (!tagline) return wordmarkEl;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {wordmarkEl}
      <span
        style={{
          fontFamily: V3.monoFont,
          fontSize: '0.62rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: onDark ? V3.onDarkDim : V3.ink400,
          lineHeight: 1,
        }}
      >
        Executive intelligence
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Avatar — initials, ocean-700 bg / white. Sizes: sm (28) md (32) lg (80).
   ────────────────────────────────────────────────────────────────────── */
export function Avatar({
  name,
  size = 'md',
  style,
}: {
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}): React.ReactElement {
  const sz = size === 'sm' ? V3.sizeAvatarSm : size === 'lg' ? V3.sizeAvatarLg : V3.sizeAvatarMd;
  const fs = size === 'sm' ? '11px' : size === 'lg' ? '28px' : '12px';
  const fw = size === 'lg' ? V3.fwSemibold : V3.fwBold;
  return (
    <div
      style={{
        width: sz,
        height: sz,
        background: V3.ocean700,
        color: V3.white,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: V3.displayFont,
        fontSize: fs,
        fontWeight: fw,
        borderRadius: 0,
        flexShrink: 0,
        ...style,
      }}
      aria-hidden={!name}
      aria-label={name || undefined}
    >
      {userInitials(name)}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   MonoLabel — eyebrows / meta / labels.
   IBM Plex Mono, uppercase, 10.5px (default) / 9.5px (sm).
   ────────────────────────────────────────────────────────────────────── */
export function MonoLabel({
  children,
  color,
  size = 'md',
  style,
}: {
  children: React.ReactNode;
  color?: string;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <span
      style={{
        fontFamily: V3.monoFont,
        fontSize: size === 'sm' ? V3.textAppMonoSm : V3.textAppMono,
        fontWeight: V3.fwMedium,
        letterSpacing: V3.trackingMono,
        textTransform: 'uppercase',
        color: color ?? V3.ink400,
        lineHeight: 1,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   App PageHeader — § 2.3 Main Content Area / Page header.
   Kicker (mono 11px, teal-600) · title (Crimson Pro clamp(1.8..2.6rem) 300)
   · description (15px ink-500, mt 12, max 640). Max-width 960px centered.
   ────────────────────────────────────────────────────────────────────── */
export function PageHeader({
  kicker,
  title,
  description,
  right,
  style,
}: {
  kicker: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  right?: React.ReactNode;
  style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <div
      style={{
        maxWidth: V3.appContentMax,
        margin: '0 auto',
        ...style,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <MonoLabel color={V3.teal600} style={{ display: 'block', marginBottom: 12 }}>
            {kicker}
          </MonoLabel>
          <h1
            style={{
              fontFamily: V3.displayFont,
              fontSize: V3.textAppPageTitle,
              fontWeight: V3.fwLight,
              lineHeight: 1.2,
              color: V3.ink900,
              letterSpacing: V3.trackingDisplay,
              margin: 0,
            }}
          >
            {title}
          </h1>
          {description && (
            <p
              style={{
                fontFamily: V3.bodyFont,
                fontSize: V3.textAppBody,
                lineHeight: V3.leadingAppBody,
                color: V3.ink500,
                marginTop: 12,
                maxWidth: 640,
                marginBottom: 0,
              }}
            >
              {description}
            </p>
          )}
        </div>
        {right && <div style={{ flexShrink: 0 }}>{right}</div>}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Breadcrumb — topbar left. 13px, separator ink-200, active ink-800/500.
   ────────────────────────────────────────────────────────────────────── */
export function Breadcrumb({
  items,
  style,
}: {
  items: Array<{ label: string; to?: string; active?: boolean }>;
  style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <nav
      aria-label="breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: V3.bodyFont,
        fontSize: '13px',
        lineHeight: 1,
        ...style,
      }}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const content = item.active || isLast ? (
          <span style={{ color: V3.ink800, fontWeight: V3.fwMedium }}>{item.label}</span>
        ) : item.to ? (
          <Link to={item.to} style={{ color: V3.ink400, textDecoration: 'none' }}>
            {item.label}
          </Link>
        ) : (
          <span style={{ color: V3.ink400 }}>{item.label}</span>
        );
        return (
          <React.Fragment key={item.label + String(i)}>
            {content}
            {!isLast && (
              <span aria-hidden style={{ color: V3.ink200 }}>/</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   IconButton — 36x36, icon only.
   Ink-400 → ink-700 on hover, ink-50 bg on hover.
   ────────────────────────────────────────────────────────────────────── */
export function IconButton({
  label,
  onClick,
  to,
  disabled,
  children,
  onDark,
  style,
  size,
}: {
  label: string;
  onClick?: () => void;
  to?: string;
  disabled?: boolean;
  children: React.ReactNode;
  onDark?: boolean;
  style?: React.CSSProperties;
  size?: number;
}): React.ReactElement {
  const sz = size ?? V3.sizeIconButton;
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sz,
    height: sz,
    borderRadius: 0,
    background: 'transparent',
    color: onDark ? 'rgba(250,250,250,0.66)' : V3.ink400,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: `color ${V3.durFast}ms ${V3.ease}, background ${V3.durFast}ms ${V3.ease}`,
    padding: 0,
    flexShrink: 0,
    textDecoration: 'none',
    ...style,
  } as React.CSSProperties;
  const hoverBg = onDark ? 'rgba(250,250,250,0.06)' : V3.ink50;
  const hoverColor = onDark ? V3.cream : V3.ink700;
  const handlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;
      const el = e.currentTarget;
      el.style.background = hoverBg;
      el.style.color = hoverColor;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      const el = e.currentTarget;
      el.style.background = 'transparent';
      el.style.color = '';
    },
  };
  const aria = { 'aria-label': label };
  if (to && !disabled) {
    return (
      <Link to={to} onClick={onClick} style={base} {...aria} {...handlers as any}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" disabled={disabled} onClick={onClick} style={base} {...aria} {...handlers as any}>
      {children}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   ListRow — flex justify-between, bottom 1px border, pointer hover.
   ────────────────────────────────────────────────────────────────────── */
export function ListRow({
  children,
  onClick,
  style,
  borderColor,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  borderColor?: string;
}): React.ReactElement {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '16px 20px',
        borderBottom: `1px solid ${borderColor ?? V3.ink100}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: `background ${V3.durFast}ms ${V3.ease}`,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.background = V3.ink50;
      }}
      onMouseLeave={(e) => {
        if (onClick) e.currentTarget.style.background = 'transparent';
      }}
    >
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Tabs (Secondary nav) — § 5.1
   Inline-flex, gap 0. Active: ink-900/500, bottom border 2px ocean-600.
   ────────────────────────────────────────────────────────────────────── */
export function Tabs({
  tabs,
  active,
  onChange,
  style,
}: {
  tabs: Array<{ key: string; label: string; href?: string }>;
  active: string;
  onChange: (key: string) => void;
  style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <div
      role="tablist"
      style={{
        display: 'inline-flex',
        gap: 0,
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        const content = (
          <span
            style={{
              padding: '16px 0',
              marginRight: 32,
              fontFamily: V3.bodyFont,
              fontSize: '14px',
              fontWeight: isActive ? V3.fwMedium : V3.fwRegular,
              color: isActive ? V3.ink900 : V3.ink500,
              borderBottom: `2px solid ${isActive ? V3.ocean600 : 'transparent'}`,
              cursor: 'pointer',
              transition: `color ${V3.durFast}ms ${V3.ease}, border-color ${V3.durFast}ms ${V3.ease}`,
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = V3.ink700;
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = '';
            }}
          >
            {tab.label}
          </span>
        );
        return tab.href ? (
          <Link
            key={tab.key}
            to={tab.href}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            style={{ textDecoration: 'none' }}
          >
            {content}
          </Link>
        ) : (
          <div
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   FormRow — label + helper text + control.
   § 5.4 Settings & § 7.3 Form row pattern.
   ────────────────────────────────────────────────────────────────────── */
export function FormRow({
  label,
  helper,
  children,
  style,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <div style={{ ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: V3.bodyFont,
              fontSize: '14px',
              fontWeight: V3.fwMedium,
              color: V3.ink800,
              lineHeight: 1.3,
            }}
          >
            {label}
          </div>
          {helper && (
            <div
              style={{
                fontFamily: V3.bodyFont,
                fontSize: '12.5px',
                color: V3.ink400,
                marginTop: 3,
                lineHeight: 1.5,
              }}
            >
              {helper}
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0 }}>{children}</div>
      </div>
    </div>
  );
}
