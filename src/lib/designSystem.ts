/**
 * LYC Design System Tokens
 *
 * Single source of truth for all design tokens used across the app.
 * Previously, 33 files copy-pasted their own `const DS = {...}` — this module
 * replaces all of them. If you need a new token, add it here and re-export.
 *
 * Usage:  import { DS } from '@/lib/designSystem';
 */

export const DS = {
  // Typography
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",

  // Brand colors
  accent: '#C108AB',
  accentHover: '#A00790',
  teal: '#00897B',

  // Surfaces (light)
  bg: '#FFFFFF',
  bgAlt: '#F5F5F5',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',

  // Text
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',

  // Borders & shapes
  border: '#E5E5E5',
  radius: '12px',
  radiusSm: '8px',

  // Elevation
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowHover: '0 4px 12px rgba(0,0,0,0.1)',

  // Semantic
  success: '#00897B',
  warning: '#F59E0B',
  error: '#EF4444',
} as const;

/**
 * Dark variant — used by ShareCard and DocumentUploader
 * which render on dark backgrounds.
 */
export const DS_DARK = {
  ...DS,
  bg: '#0A0A0A',
  bgAlt: '#111111',
  card: '#111111',
  cardBorder: '#222222',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  muted: '#888888',
  border: '#222222',
} as const;

export type DesignTokens = typeof DS;
