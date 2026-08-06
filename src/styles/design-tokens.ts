/**
 * Phase 5: ECHO v6.0 Design Tokens
 *
 * Single source of truth for the design system. Every component
 * and style file imports from here — never hard-code a color,
 * spacing value, or shadow.
 *
 * Brand rules:
 *   - Zero border-radius everywhere
 *   - Crimson #C108AB is the sole accent
 *   - All other tokens derive from these two axioms
 */

// ── Spacing (4 px base scale) ──────────────────────────────────

export const SPACING = {
  px: '1px',
  '2xs': '2px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
  '5xl': '96px',
} as const;

export type SpacingKey = keyof typeof SPACING;

// ── Type Scale ─────────────────────────────────────────────────

export const TYPE_SCALE = {
  font: {
    sans: "'DM Sans', system-ui, -apple-system, sans-serif",
    serif: "'Libre Baskerville', Georgia, serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  },
  size: {
    'xxs': '10px',
    'xs': '12px',
    'sm': '14px',
    'base': '16px',
    'lg': '18px',
    'xl': '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
    '6xl': '60px',
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 1.75,
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

export type TypeScaleKey = keyof typeof TYPE_SCALE.size;

// ── Colors — ECHO v6.0 ────────────────────────────────────────

export const COLORS = {
  // Brand
  accent: '#C108AB',
  accentHover: '#A00790',
  accentSoft: 'rgba(193, 8, 171, 0.08)',
  accentSubtle: 'rgba(193, 8, 171, 0.04)',

  // Light theme
  light: {
    background: '#FFFFFF',
    surface: '#FAFAFA',
    surfaceHover: '#F5F5F5',
    surfaceActive: '#EDEDED',
    border: '#E5E5E5',
    borderStrong: '#D4D4D4',
    textPrimary: '#0A0A0A',
    textSecondary: '#333333',
    textMuted: '#666666',
    textSubtle: '#999999',
  },

  // Dark theme
  dark: {
    background: '#0D0A14',
    surface: '#1A0F1E',
    surfaceHover: '#281530',
    surfaceActive: '#3A2040',
    border: '#281530',
    borderStrong: '#3A2040',
    textPrimary: '#FFFFFF',
    textSecondary: '#CCCCCC',
    textMuted: '#888888',
    textSubtle: '#666666',
  },

  // Semantic (identical across themes where possible)
  success: '#2D8A4E',
  successSoft: 'rgba(45, 138, 78, 0.12)',
  warning: '#B8860B',
  warningSoft: 'rgba(184, 134, 11, 0.12)',
  error: '#C0392B',
  errorSoft: 'rgba(192, 57, 43, 0.12)',
  info: '#2C5282',
  infoSoft: 'rgba(44, 82, 130, 0.12)',

  // Data viz
  teal: '#00897B',
  ocean: '#4FC3F7',
  slate: '#607D8B',
} as const;

export type ColorKey = keyof typeof COLORS;

// ── Motion Durations ───────────────────────────────────────────

export const MOTION = {
  duration: {
    fastest: '80ms',
    faster: '120ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
    slowest: '500ms',
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    emphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

export type MotionDurationKey = keyof typeof MOTION.duration;
export type MotionEasingKey = keyof typeof MOTION.easing;

// ── Shadows ───────────────────────────────────────────────────

export const SHADOWS = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.04)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.08)',
  md: '0 4px 12px rgba(0, 0, 0, 0.1)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
  xl: '0 16px 48px rgba(0, 0, 0, 0.16)',
  '2xl': '0 24px 64px rgba(0, 0, 0, 0.2)',
  accent: '0 0 0 3px rgba(193, 8, 171, 0.25)',
} as const;

export type ShadowKey = keyof typeof SHADOWS;

// ── Z-Index Scale ─────────────────────────────────────────────

export const Z_INDEX = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;

// ── Breakpoints ────────────────────────────────────────────────

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

// ── Opacity Scale ─────────────────────────────────────────────

export const OPACITY = {
  0: 0,
  5: 0.05,
  8: 0.08,
  10: 0.1,
  12: 0.12,
  15: 0.15,
  20: 0.2,
  25: 0.25,
  40: 0.4,
  50: 0.5,
  60: 0.6,
  75: 0.75,
  80: 0.8,
  100: 1,
} as const;

// ── Export bundle ──────────────────────────────────────────────

export const designTokens = {
  SPACING,
  TYPE_SCALE,
  COLORS,
  MOTION,
  SHADOWS,
  Z_INDEX,
  BREAKPOINTS,
  OPACITY,
};

export default designTokens;
