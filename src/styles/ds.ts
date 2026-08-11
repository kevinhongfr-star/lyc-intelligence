/**
 * #1321 — LYC_SHARED_DS · Single Source of Truth for inline styles.
 *
 * Every component that previously declared `const DS = { accent, bg, ... }`
 * should instead import `LYC_SHARED_DS` from this module. This ensures every
 * page/layout uses identical token values and cannot silently drift from the
 * canonical design system (index.css) during restyles.
 *
 * Values are kept in 1:1 sync with the canonical CSS variables declared in
 * src/index.css (the LYC Design Tokens block + Phase 5 ECHO v6.0 block).
 *
 * Migration (P1+ follow-up batches):
 *   // Before (61 files do this today)
 *   const DS = { accent: '#C108AB', bg: '#FFF', ... };
 *
 *   // After (reuse the shared barrel)
 *   import { LYC_SHARED_DS as DS } from '@/styles/ds';
 */
export const LYC_SHARED_DS = {
  // ── Typography ──────────────────────────────────────────────────
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",

  // ── Accent / Brand ──────────────────────────────────────────────
  accent: '#C108AB',
  accentHover: '#A00790',

  // ── Backgrounds ─────────────────────────────────────────────────
  bg: '#FFFFFF',
  bgWarm: '#FAF8F5',
  bgAlt: '#F5F5F5',

  // ── Card / Surfaces ─────────────────────────────────────────────
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  border: '#E5E5E5',

  // ── Text ────────────────────────────────────────────────────────
  text: '#000000',
  textPrimary: '#000000',
  textSecondary: '#333333',
  muted: '#666666',

  // ── Semantic ────────────────────────────────────────────────────
  success: '#00897B',
  warning: '#F59E0B',
  error: '#DC2626',
  teal: '#00897B',

  // ── Radius (LYC brand rule = ZERO border radius) ────────────────
  radius: '0px',
  radiusSm: '0px',
  radiusNone: '0px',

  // ── Shadows ─────────────────────────────────────────────────────
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowSm: '0 1px 3px rgba(0,0,0,0.08)',
  shadowHover: '0 4px 12px rgba(0,0,0,0.1)',
  shadowMd: '0 4px 12px rgba(0,0,0,0.1)',
  shadowModal: '0 8px 32px rgba(0,0,0,0.15)',
} as const;

export type SharedDSType = typeof LYC_SHARED_DS;

/**
 * Convenience helper — re-export the nested ECHO v6 tokens bundle
 * (TYPE_SCALE, SPACING, SEMANTIC_COLORS, MOTION, etc.) for components
 * that need the more detailed scale (e.g. design-system components).
 */
export { designTokens as ECHO_DESIGN_TOKENS } from './design-tokens';
export type { ColorKey } from './design-tokens';
