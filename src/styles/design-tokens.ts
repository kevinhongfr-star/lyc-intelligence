/**
 * Phase 5: ECHO v6.0 Design System v2 — Design Tokens
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

// ── Type Scale (12-step) ───────────────────────────────────────

export const TYPE_SCALE = {
  font: {
    sans: "'DM Sans', system-ui, -apple-system, sans-serif",
    serif: "'Crimson Pro', Georgia, serif",
    mono: "'IBM Plex Mono', ui-monospace, 'Courier New', monospace",
  },
  scale: {
    display: {
      fontSize: '72px',
      lineHeight: '1.1',
      letterSpacing: '-0.02em',
      fontWeight: 700,
    },
    h1: {
      fontSize: '48px',
      lineHeight: '1.125',
      letterSpacing: '-0.02em',
      fontWeight: 700,
    },
    h2: {
      fontSize: '36px',
      lineHeight: '1.15',
      letterSpacing: '-0.015em',
      fontWeight: 600,
    },
    h3: {
      fontSize: '30px',
      lineHeight: '1.2',
      letterSpacing: '-0.01em',
      fontWeight: 600,
    },
    h4: {
      fontSize: '24px',
      lineHeight: '1.25',
      letterSpacing: '-0.005em',
      fontWeight: 600,
    },
    subtitle: {
      fontSize: '20px',
      lineHeight: '1.4',
      letterSpacing: '0',
      fontWeight: 500,
    },
    bodyLarge: {
      fontSize: '18px',
      lineHeight: '1.5',
      letterSpacing: '0',
      fontWeight: 400,
    },
    body: {
      fontSize: '16px',
      lineHeight: '1.5',
      letterSpacing: '0',
      fontWeight: 400,
    },
    bodySmall: {
      fontSize: '14px',
      lineHeight: '1.5',
      letterSpacing: '0.01em',
      fontWeight: 400,
    },
    caption: {
      fontSize: '12px',
      lineHeight: '1.5',
      letterSpacing: '0.02em',
      fontWeight: 500,
    },
    overline: {
      fontSize: '10px',
      lineHeight: '1.2',
      letterSpacing: '0.08em',
      fontWeight: 600,
    },
    code: {
      fontSize: '13px',
      lineHeight: '1.5',
      letterSpacing: '0',
      fontWeight: 400,
    },
  },
} as const;

export type TypeScaleRole = keyof typeof TYPE_SCALE.scale;

// ── Density Presets ────────────────────────────────────────────

export const DENSITY_PRESETS = {
  comfortable: {
    padding: {
      compact: '12px',
      regular: '16px',
      spacious: '24px',
    },
    lineHeight: 1.6,
    iconSize: {
      sm: '16px',
      md: '20px',
      lg: '24px',
    },
  },
  regular: {
    padding: {
      compact: '8px',
      regular: '12px',
      spacious: '16px',
    },
    lineHeight: 1.5,
    iconSize: {
      sm: '14px',
      md: '16px',
      lg: '20px',
    },
  },
  compact: {
    padding: {
      compact: '4px',
      regular: '8px',
      spacious: '12px',
    },
    lineHeight: 1.4,
    iconSize: {
      sm: '12px',
      md: '14px',
      lg: '16px',
    },
  },
} as const;

export type DensityMode = keyof typeof DENSITY_PRESETS;

// ── Spacing (8 px base scale) ──────────────────────────────────

export const SPACING = {
  '4': '4px',
  '8': '8px',
  '12': '12px',
  '16': '16px',
  '24': '24px',
  '32': '32px',
  '48': '48px',
  '64': '64px',
  '96': '96px',
} as const;

export type SpacingKey = keyof typeof SPACING;

// ── Semantic Color Scales (10-step: 50–900) ────────────────────

export const SEMANTIC_COLORS = {
  primary: {
    50:  '#FDF4FC',
    100: '#FBE8F9',
    200: '#F5CEF2',
    300: '#EFB3EC',
    400: '#E586DF',
    500: '#D847CD',
    600: '#C108AB',
    700: '#9A0688',
    800: '#740566',
    900: '#4E0344',
  },
  success: {
    50:  '#F2FAF4',
    100: '#E3F4E8',
    200: '#C3E8D0',
    300: '#9EDAB3',
    400: '#6DCA8C',
    500: '#2D8A4E',
    600: '#257542',
    700: '#1D5E36',
    800: '#15462A',
    900: '#0D2E1C',
  },
  warning: {
    50:  '#FBF8EF',
    100: '#F6EFDA',
    200: '#EDDFB3',
    300: '#E3CE8C',
    400: '#D4B559',
    500: '#B8860B',
    600: '#996F09',
    700: '#7A5707',
    800: '#5B4005',
    900: '#3D2A03',
  },
  error: {
    50:  '#FBF3F2',
    100: '#F7E4E2',
    200: '#EEBEB9',
    300: '#E4968E',
    400: '#D66358',
    500: '#C0392B',
    600: '#A02E23',
    700: '#7F241C',
    800: '#5E1A14',
    900: '#3E100C',
  },
  info: {
    50:  '#F2F6FB',
    100: '#E3ECF6',
    200: '#C3D5EC',
    300: '#9EBDE0',
    400: '#6E9BCF',
    500: '#2C5282',
    600: '#25446C',
    700: '#1D3556',
    800: '#152740',
    900: '#0D182A',
  },
  neutral: {
    50:  '#FAFAFA',
    100: '#F5F5F5',
    200: '#EDEDED',
    300: '#E5E5E5',
    400: '#D4D4D4',
    500: '#A3A3A3',
    600: '#737373',
    700: '#525252',
    800: '#404040',
    900: '#262626',
  },
} as const;

export type SemanticColorFamily = keyof typeof SEMANTIC_COLORS;
export type SemanticColorStep = keyof (typeof SEMANTIC_COLORS)[SemanticColorFamily];

// ── Semantic Token Layer (Light) ───────────────────────────────

export const SEMANTIC_TOKENS = {
  bg: {
    page: '#FFFFFF',
    surface: '#FAFAFA',
    surfaceHover: '#F5F5F5',
    surfacePressed: '#EDEDED',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  text: {
    primary: '#0A0A0A',
    secondary: '#333333',
    tertiary: '#666666',
    inverse: '#FFFFFF',
    disabled: 'rgba(10, 10, 10, 0.38)',
  },
  border: {
    default: '#E5E5E5',
    subtle: '#F5F5F5',
    strong: '#D4D4D4',
    focus: '#C108AB',
  },
  accent: {
    DEFAULT: '#C108AB',
    hover: '#A00790',
    soft: 'rgba(193, 8, 171, 0.08)',
    subtle: 'rgba(193, 8, 171, 0.04)',
  },
  status: {
    success: '#2D8A4E',
    warning: '#B8860B',
    error: '#C0392B',
    info: '#2C5282',
  },
} as const;

// ── Dark Mode Semantic Tokens ──────────────────────────────────

export const DARK_MODE_SEMANTIC = {
  bg: {
    page: '#0D0A14',
    surface: '#1A0F1E',
    surfaceHover: '#281530',
    surfacePressed: '#3A2040',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#CCCCCC',
    tertiary: '#888888',
    inverse: '#0D0A14',
    disabled: 'rgba(255, 255, 255, 0.38)',
  },
  border: {
    default: '#281530',
    subtle: '#1A0F1E',
    strong: '#3A2040',
    focus: '#E040C8',
  },
  accent: {
    DEFAULT: '#E040C8',
    hover: '#C108AB',
    soft: 'rgba(224, 64, 200, 0.12)',
    subtle: 'rgba(224, 64, 200, 0.06)',
  },
  status: {
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',
  },
} as const;

// ── Alpha Channel Tokens ───────────────────────────────────────

export const ALPHA_CHANNELS = {
  overlay: {
    light: 'rgba(0, 0, 0, 0.5)',
    dark: 'rgba(0, 0, 0, 0.6)',
  },
  shadow: {
    xs: 'rgba(0, 0, 0, 0.04)',
    sm: 'rgba(0, 0, 0, 0.08)',
    md: 'rgba(0, 0, 0, 0.10)',
    lg: 'rgba(0, 0, 0, 0.12)',
    xl: 'rgba(0, 0, 0, 0.16)',
    '2xl': 'rgba(0, 0, 0, 0.20)',
  },
  glass: {
    light: 'rgba(255, 255, 255, 0.72)',
    dark: 'rgba(26, 15, 30, 0.72)',
  },
  focusRing: {
    light: 'rgba(193, 8, 171, 0.25)',
    dark: 'rgba(224, 64, 200, 0.35)',
  },
  accent: {
    '5':  'rgba(193, 8, 171, 0.05)',
    '8':  'rgba(193, 8, 171, 0.08)',
    '12': 'rgba(193, 8, 171, 0.12)',
    '15': 'rgba(193, 8, 171, 0.15)',
    '20': 'rgba(193, 8, 171, 0.20)',
    '25': 'rgba(193, 8, 171, 0.25)',
    '40': 'rgba(193, 8, 171, 0.40)',
    '60': 'rgba(193, 8, 171, 0.60)',
    '80': 'rgba(193, 8, 171, 0.80)',
  },
} as const;

// ── Motion Tokens ──────────────────────────────────────────────

export const MOTION = {
  duration: {
    micro: {
      fastest: '80ms',
      fast: '120ms',
    },
    standard: {
      fast: '200ms',
      base: '250ms',
      slow: '300ms',
    },
    complex: {
      fast: '300ms',
      base: '350ms',
      slow: '350ms',
    },
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    emphasize: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export type MotionDurationTier = keyof typeof MOTION.duration;
export type MotionEasingName = keyof typeof MOTION.easing;

// ── Shadow Tokens ─────────────────────────────────────────────

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

// ── Z-Index Tokens ──────────────────────────────────────────────

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

// ── Opacity Scale ──────────────────────────────────────────────

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

// ── Legacy Exports (backward compat) ──────────────────────────

export const COLORS = {
  accent: '#C108AB',
  accentHover: '#A00790',
  accentSoft: 'rgba(193, 8, 171, 0.08)',
  accentSubtle: 'rgba(193, 8, 171, 0.04)',
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
  success: '#2D8A4E',
  successSoft: 'rgba(45, 138, 78, 0.12)',
  warning: '#B8860B',
  warningSoft: 'rgba(184, 134, 11, 0.12)',
  error: '#C0392B',
  errorSoft: 'rgba(192, 57, 43, 0.12)',
  info: '#2C5282',
  infoSoft: 'rgba(44, 82, 130, 0.12)',
  teal: '#00897B',
  ocean: '#4FC3F7',
  slate: '#607D8B',
} as const;

export type ColorKey = keyof typeof COLORS;

export type SpacingKeyLegacy = string;

// ── Export bundle ──────────────────────────────────────────────

export const designTokens = {
  TYPE_SCALE,
  DENSITY_PRESETS,
  SPACING,
  SEMANTIC_COLORS,
  SEMANTIC_TOKENS,
  DARK_MODE_SEMANTIC,
  ALPHA_CHANNELS,
  MOTION,
  COLORS,
  SHADOWS,
  Z_INDEX,
  BREAKPOINTS,
  OPACITY,
};

export default designTokens;
