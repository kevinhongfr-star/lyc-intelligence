/**
 * tokens.ts — #33 Design System Tokens (TS mirror of CSS variables)
 *
 * Canonical design tokens as constants — consumed by components.
 * Single source of truth lives in index.css CSS custom properties.
 * These TS constants are:
 *   1. Explicit documentation for allowed variant/style values
 *   2. Used by inline-style components to avoid magic strings
 *   3. Consumed by layout primitives (PageLayout, DashboardGrid)
 *
 * If you add a token here, add its CSS var to index.css :root block.
 */

// ── Typography ─────────────────────────────────────────────────────

export const TYPOGRAPHY = {
  fontDisplay: "var(--font-display)",
  fontBody: "var(--font-body)",
  fontMono: "var(--font-mono)",

  weightLight: "var(--font-weight-light)",
  weightRegular: "var(--font-weight-regular)",
  weightMedium: "var(--font-weight-medium)",
  weightSemibold: "var(--font-weight-semibold)",
  weightBold: "var(--font-weight-bold)",

  textDisplay: "var(--text-display)",
  textH1: "var(--text-h1)",
  textH2: "var(--text-h2)",
  textH3: "var(--text-h3)",
  textBodyLg: "var(--text-body-lg)",
  textBody: "var(--text-body)",
  textBodySm: "var(--text-body-sm)",
  textCaption: "var(--text-caption)",

  leadingDisplay: "var(--leading-display)",
  leadingHeading: "var(--leading-heading)",
  leadingSubhead: "var(--leading-subhead)",
  leadingBody: "var(--leading-body)",
  leadingLabel: "var(--leading-label)",

  trackingTight: "var(--tracking-tight)",
  trackingNormal: "var(--tracking-normal)",
  trackingWide: "var(--tracking-wide)",
} as const;

// ── Colors ─────────────────────────────────────────────────────────

export const COLORS = {
  accent: "var(--color-accent)",
  accentHover: "var(--color-accent-hover)",
  accentPressed: "var(--color-accent-pressed)",
  accent5: "var(--color-accent-5)",
  accent10: "var(--color-accent-10)",
  accent20: "var(--color-accent-20)",

  bg: "var(--color-bg)",
  bgWarm: "var(--color-bg-warm)",
  bgAlt: "var(--color-bg-alt)",
  bgCanvas: "var(--color-bg-canvas)",
  bgDark: "var(--color-bg-dark)",
  card: "var(--color-card)",
  cardHover: "var(--color-card-hover)",

  border: "var(--color-border)",
  borderStrong: "var(--color-border-strong)",
  borderSubtle: "var(--color-border-subtle)",
  divider: "var(--color-divider)",

  ink: "var(--color-ink)",
  inkSoft: "var(--color-ink-soft)",
  text: "var(--color-text)",
  textSecondary: "var(--color-text-secondary)",
  muted: "var(--color-muted)",
  mutedDim: "var(--color-muted-dim)",
  onAccent: "var(--color-on-accent)",
  onDark: "var(--color-on-dark)",

  success: "var(--color-success)",
  teal: "var(--color-teal)",
  warning: "var(--color-warning)",
  error: "var(--color-error)",
  info: "var(--color-info)",

  sky: "var(--color-sky)",
  mist: "var(--color-mist)",
  lavender: "var(--color-lavender)",
  cream: "var(--color-cream)",
} as const;

// ── Spacing ────────────────────────────────────────────────────────

export const SPACE = {
  _0: "var(--space-0)",
  _1: "var(--space-1)",
  _2: "var(--space-2)",
  _3: "var(--space-3)",
  _4: "var(--space-4)",
  _5: "var(--space-5)",
  _6: "var(--space-6)",
  _7: "var(--space-7)",
  _8: "var(--space-8)",
  _10: "var(--space-10)",
  _12: "var(--space-12)",
  _14: "var(--space-14)",
  _16: "var(--space-16)",
  _20: "var(--space-20)",
  _24: "var(--space-24)",
} as const;

export const CONTENT_WIDTH = {
  sm: "var(--content-width-sm)",
  md: "var(--content-width-md)",
  base: "var(--content-width-base)",
  lg: "var(--content-width-lg)",
  xl: "var(--content-width-xl)",
} as const;

// ── Motion ─────────────────────────────────────────────────────────

export const MOTION = {
  durFastest: "var(--dur-fastest)",
  durFaster: "var(--dur-faster)",
  durFast: "var(--dur-fast)",
  durNormal: "var(--dur-normal)",
  durSlow: "var(--dur-slow)",
  durSlower: "var(--dur-slower)",
  durSlowest: "var(--dur-slowest)",

  easeStandard: "var(--ease-standard)",
  easeEmphasized: "var(--ease-emphasized)",
  easeOutExpo: "var(--ease-out-expo)",
  easeOut: "var(--ease-out)",
  easeIn: "var(--ease-in)",
  easeSpring: "var(--ease-spring)",
} as const;

// ── Elevation (layers) ─────────────────────────────────────────────

export const ZINDEX = {
  base: 0,
  card: 10,
  navigation: 40,
  overlay: 80,
  modal: 100,
  popover: 120,
  toast: 160,
  tooltip: 180,
} as const;

// ── Shadows ────────────────────────────────────────────────────────

export const SHADOW = {
  none: "var(--shadow-none)",
  xs: "var(--shadow-xs)",
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
  xl: "var(--shadow-xl)",
  overlay: "var(--shadow-overlay)",
} as const;

// ── Radius (ALL ZERO per brand rule — legacy via var only) ─────────

export const RADIUS = {
  none: "var(--radius-none)",
  base: "var(--radius)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  full: "var(--radius-full)",   // ONLY for circular elements (rings, avatars)
} as const;

// ── Breakpoints ────────────────────────────────────────────────────

export const BREAKPOINTS = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
} as const;

// ── UI Component Variants (allowed values) ─────────────────────────

export type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success';
export type Size = 'sm' | 'md' | 'lg' | 'xl';
