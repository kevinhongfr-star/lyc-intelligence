// Phase 0.5: Design Tokens
// Colors, spacing, typography, radii, shadows, breakpoints

export const COLORS = {
  // Brand
  primary: '#1a1a2e',
  primaryLight: '#2d2d44',
  primaryDark: '#0f0f1a',
  accent: '#4a90d9',
  accentLight: '#6ba3e0',
  accentDark: '#3a7bc8',

  // Semantic
  success: '#22c55e',
  successLight: '#86efac',
  successDark: '#15803d',
  warning: '#f59e0b',
  warningLight: '#fcd34d',
  warningDark: '#b45309',
  error: '#ef4444',
  errorLight: '#fca5a5',
  errorDark: '#b91c1c',
  info: '#3b82f6',
  infoLight: '#93c5fd',
  infoDark: '#1d4ed8',

  // Neutral
  text: '#1a1a2e',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  textInverse: '#ffffff',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  surface: '#ffffff',
  surfaceHover: '#f9fafb',
  surfaceActive: '#f3f4f6',
  background: '#f3f4f6',
  backgroundDark: '#e5e7eb',

  // Tier colors (for pipeline)
  tier1: '#22c55e',
  tier2: '#f59e0b',
  tier3: '#9ca3af',
  tier4: '#ef4444',

  // Methodology colors
  trident: '#4a90d9',
  shift: '#8b5cf6',
  lens: '#06b6d4',
  grid: '#f59e0b',
  canvas: '#ec4899',
  wave: '#10b981',
  benchmark: '#6366f1',
} as const;

export type ColorKey = keyof typeof COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export type SpacingKey = keyof typeof SPACING;

export const TYPOGRAPHY = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'JetBrains Mono, Fira Code, "Courier New", monospace',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
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
  },
} as const;

export const RADII = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

export type RadiusKey = keyof typeof RADII;

export const SHADOWS = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px rgba(0,0,0,0.07)',
  lg: '0 10px 15px rgba(0,0,0,0.1)',
  xl: '0 20px 25px rgba(0,0,0,0.15)',
  '2xl': '0 25px 50px rgba(0,0,0,0.25)',
  inner: 'inset 0 2px 4px rgba(0,0,0,0.06)',
  none: 'none',
} as const;

export type ShadowKey = keyof typeof SHADOWS;

export const BREAKPOINTS = {
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
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;

export const TRANSITIONS = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
  slower: '500ms ease-in-out',
} as const;

export type TransitionKey = keyof typeof TRANSITIONS;

export const OPACITY = {
  0: 0,
  25: 0.25,
  50: 0.5,
  75: 0.75,
  100: 1,
} as const;

// Methodology framework theme colors
export const METHODOLOGY_COLORS: Record<string, { primary: string; light: string; dark: string }> = {
  TRIDENT: {
    primary: COLORS.trident,
    light: '#93c5fd',
    dark: '#1e40af',
  },
  SHIFT: {
    primary: COLORS.shift,
    light: '#c4b5fd',
    dark: '#6d28d9',
  },
  LENS: {
    primary: COLORS.lens,
    light: '#67e8f9',
    dark: '#0e7490',
  },
  GRID: {
    primary: COLORS.grid,
    light: '#fcd34d',
    dark: '#b45309',
  },
  CANVAS: {
    primary: COLORS.canvas,
    light: '#f9a8d4',
    dark: '#be185d',
  },
  WAVE: {
    primary: COLORS.wave,
    light: '#6ee7b7',
    dark: '#047857',
  },
  BENCHMARK: {
    primary: COLORS.benchmark,
    light: '#a5b4fc',
    dark: '#4338ca',
  },
};

// Pipeline stage colors
export const PIPELINE_COLORS: Record<string, string> = {
  sourcing: COLORS.info,
  screening: COLORS.info,
  shortlisted: COLORS.accent,
  interview: COLORS.warning,
  offer: COLORS.success,
  placed: COLORS.success,
  rejected: COLORS.error,
  withdrawn: COLORS.textMuted,
};

export default {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  RADII,
  SHADOWS,
  BREAKPOINTS,
  Z_INDEX,
  TRANSITIONS,
  OPACITY,
  METHODOLOGY_COLORS,
  PIPELINE_COLORS,
};
