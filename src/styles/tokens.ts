/**
 * Unified Design Tokens
 * 
 * This file should ALWAYS stay in sync with tokens.css.
 * Primary source of truth: tokens.css (CSS custom properties)
 * This file provides TypeScript access to the same values.
 */

// Brand colors (synced with tokens.css)
export const COLORS = {
  // Brand
  primary: '#C108AB',
  primaryHover: '#D44FC6',
  primaryLight: 'rgba(193, 8, 171, 0.1)',
  primaryDark: '#9A0689',
  white: '#FFFFFF',
  
  // Backgrounds
  bg: '#F7F7F7',
  bgAlt: '#FFFFFF',
  
  // Text
  text: '#1C1C1C',
  textSecondary: '#666666',
  textMuted: '#999999',
  textInverse: '#FFFFFF',
  
  // Borders
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  
  // Semantic
  success: '#22C55E',
  successLight: '#DCFCE7',
  successDark: '#16A34A',
  
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningDark: '#D97706',
  
  error: '#EF4444',
  errorLight: '#FEE2E2',
  errorDark: '#DC2626',
  
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  infoDark: '#2563EB',
  
  // Tier colors (for pipeline scoring)
  tier1: '#22C55E',  // Strong Yes
  tier2: '#F59E0B',  // Yes
  tier3: '#6B7280',  // No
  tier4: '#EF4444',  // Strong No
  
  // Hover states
  bgHover: '#EDEDED',
  cardHover: '#F5F5F5',
  
  // Methodology colors
  trident: '#3B82F6',
  shift: '#8B5CF6',
  lens: '#06B6D4',
  grid: '#F59E0B',
  canvas: '#EC4899',
  wave: '#10B981',
  benchmark: '#6366F1',

  // Brand palette (scales for reports, gradients, tiering)
  brandScale: {
    50: '#FDF2FC',
    100: '#FBE2F8',
    200: '#F7BFF1',
    300: '#F08BE5',
    400: '#E44FD5',
    500: '#C108AB',
    600: '#A2088E',
    700: '#850974',
    800: '#6C0D60',
    900: '#5A0E51',
  },
  textScale: {
    base: '#1C1C1C',
    muted: '#999999',
  },
} as const;

export type ColorKey = keyof typeof COLORS;

const SPACING_NUMERIC = {
  px: 1,
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
} as const;

type SpacingValue = (typeof SPACING_NUMERIC)[keyof typeof SPACING_NUMERIC];

// Allow both string ("4") and number (4) key access
const SPACING_BASE: Record<string | number, SpacingValue> = SPACING_NUMERIC as unknown as Record<string | number, SpacingValue>;
SPACING_BASE['0'] = SPACING_NUMERIC[0];
SPACING_BASE['0.5'] = SPACING_NUMERIC[0.5];
SPACING_BASE['1'] = SPACING_NUMERIC[1];
SPACING_BASE['1.5'] = SPACING_NUMERIC[1.5];
SPACING_BASE['2'] = SPACING_NUMERIC[2];
SPACING_BASE['2.5'] = SPACING_NUMERIC[2.5];
SPACING_BASE['3'] = SPACING_NUMERIC[3];
SPACING_BASE['4'] = SPACING_NUMERIC[4];
SPACING_BASE['5'] = SPACING_NUMERIC[5];
SPACING_BASE['6'] = SPACING_NUMERIC[6];
SPACING_BASE['7'] = SPACING_NUMERIC[7];
SPACING_BASE['8'] = SPACING_NUMERIC[8];
SPACING_BASE['9'] = SPACING_NUMERIC[9];
SPACING_BASE['10'] = SPACING_NUMERIC[10];
SPACING_BASE['12'] = SPACING_NUMERIC[12];
SPACING_BASE['14'] = SPACING_NUMERIC[14];
SPACING_BASE['16'] = SPACING_NUMERIC[16];
SPACING_BASE['20'] = SPACING_NUMERIC[20];
SPACING_BASE['24'] = SPACING_NUMERIC[24];
SPACING_BASE['28'] = SPACING_NUMERIC[28];
SPACING_BASE['32'] = SPACING_NUMERIC[32];

export const SPACING = SPACING_BASE;

export type SpacingKey = keyof typeof SPACING;

export const TYPOGRAPHY = {
  fontFamily: {
    serif: '"Libre Baskerville", Georgia, serif',
    sans: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
  },
  fontSize: {
    xxs: 10,
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

export const RADII = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
  pill: 9999,
  card: 16,
  button: 0, // Sharp buttons per design
} as const;

export type RadiusKey = keyof typeof RADII;

export const SHADOWS = {
  none: 'none',
  xs: '0 1px 2px rgba(28, 28, 28, 0.04)',
  sm: '0 2px 4px rgba(28, 28, 28, 0.06)',
  md: '0 4px 12px rgba(28, 28, 28, 0.08)',
  lg: '0 8px 24px rgba(28, 28, 28, 0.12)',
  xl: '0 16px 48px rgba(28, 28, 28, 0.16)',
  card: '0 4px 24px rgba(28, 28, 28, 0.06)',
  cardHover: '0 8px 32px rgba(28, 28, 28, 0.12)',
  modal: '0 8px 32px rgba(28, 28, 28, 0.2)',
  button: '0 4px 12px rgba(193, 8, 171, 0.25)',
} as const;

export type ShadowKey = keyof typeof SHADOWS;

export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

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
  max: 9999,
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;

export const TRANSITIONS = {
  none: 'none',
  all: 'all 200ms ease-out',
  fast: '150ms ease-out',
  normal: '200ms ease-out',
  slow: '300ms ease-out',
  slower: '500ms ease-out',
  colors: 'color, background-color, border-color 200ms ease-out',
  transform: 'transform 200ms ease-out',
  opacity: 'opacity 200ms ease-out',
} as const;

export type TransitionKey = keyof typeof TRANSITIONS;

// Methodology framework theme colors
export const METHODOLOGY_COLORS: Record<string, { primary: string; light: string; dark: string }> = {
  TRIDENT: {
    primary: COLORS.trident,
    light: '#93C5FD',
    dark: '#1E40AF',
  },
  SHIFT: {
    primary: COLORS.shift,
    light: '#C4B5FD',
    dark: '#6D28D9',
  },
  LENS: {
    primary: COLORS.lens,
    light: '#67E8F9',
    dark: '#0E7490',
  },
  GRID: {
    primary: COLORS.grid,
    light: '#FCD34D',
    dark: '#B45309',
  },
  CANVAS: {
    primary: COLORS.canvas,
    light: '#F9A8D4',
    dark: '#BE185D',
  },
  WAVE: {
    primary: COLORS.wave,
    light: '#6EE7B7',
    dark: '#047857',
  },
  BENCHMARK: {
    primary: COLORS.benchmark,
    light: '#A5B4FC',
    dark: '#4338CA',
  },
};

// Pipeline stage colors
export const PIPELINE_COLORS: Record<string, string> = {
  sourcing: COLORS.info,
  screening: COLORS.info,
  shortlisted: COLORS.primary,
  interview: COLORS.warning,
  offer: COLORS.success,
  placed: COLORS.success,
  rejected: COLORS.error,
  withdrawn: COLORS.textMuted,
};

// Duration values for animations
export const DURATION = {
  instant: 0,
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 500,
} as const;

// ── T01: Report Engine tokens (EPIC #60, v6 report foundation) ──
export const REPORT_TOKENS = {
  brand: COLORS.primary,
  accent: COLORS.shift,
  background: COLORS.white,
  ink: '#0A0A0A',
  inkMuted: COLORS.textMuted,
  border: COLORS.border,
  paperSize: 'A4',
  marginMm: 18,
  headerHeight: 72,
  footerHeight: 48,
  watermark: 'LYC Intelligence · Confidential',
  primaryFont: TYPOGRAPHY.fontFamily.sans,
  displayFont: TYPOGRAPHY.fontFamily.serif,
  monoFont: TYPOGRAPHY.fontFamily.mono,
  scoreBarHeight: 8,
  borderRadius: RADII.lg,
  sectionSpacing: SPACING[6],
  brands: {
    LYC: {
      logoPath: '/favicon.ico',
      tagline: 'Building Leadership That Works Across Borders',
      primary: COLORS.primary,
      secondary: COLORS.shift,
      pageBg: COLORS.white,
      footerText: '© LYC Partners · Confidential',
    },
    CO_BRANDED: {
      logoPath: '/favicon.ico',
      tagline: 'LYC × Client Co-Branded Report',
      primary: COLORS.primary,
      secondary: COLORS.info,
      pageBg: COLORS.white,
      footerText: '© LYC Partners & Client · Confidential',
    },
    WHITE_LABEL: {
      logoPath: '',
      tagline: '',
      primary: '#1C1C1C',
      secondary: '#666666',
      pageBg: COLORS.white,
      footerText: '',
    },
  },
} as const;

export type ReportBrandKey = keyof typeof REPORT_TOKENS.brands;

export default {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  RADII,
  SHADOWS,
  BREAKPOINTS,
  Z_INDEX,
  TRANSITIONS,
  DURATION,
  METHODOLOGY_COLORS,
  PIPELINE_COLORS,
  REPORT_TOKENS,
};