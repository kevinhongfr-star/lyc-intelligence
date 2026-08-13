/**
 * #1351 — ECHO v1.2 Design System Foundation — Single Source of Truth.
 *
 * This module is the canonical TS source of truth for every design token on the
 * LYC Intelligence surface. It mirrors the CSS custom properties declared in
 * `src/index.css` (`:root`) so that TS consumers and CSS consumers stay in sync.
 *
 * Brand hard rules enforced here:
 *  - Radius is ALWAYS 0 (zero border radius is canonical; `radius-full` preserved
 *    only for genuinely circular elements like score rings/avatars, never on
 *    buttons/cards/inputs/modals/badges).
 *  - V1.1 FIX 1: Headings = system serif stack (DejaVu Serif / Georgia / Times),
 *    body = DM Sans, mono = IBM Plex Mono. No Crimson Pro, no custom font
 *    loading for headings — zero FOIT/FOUC, instant first paint.
 *  - One accent: LYC fuchsia #C108AB, reserved for CTAs / active nav / ≤1 key
 *    data point per section. Eyebrows use gray-500 (#616170), NEVER the accent.
 *  - Motion envelope 120–350ms, ease-out standard. No default "ease".
 *
 * Consumed by:
 *  - The marketing surface (replaces the 10+ inline `DS` objects — see `marketing`).
 *  - Shared components: Button (#1355), Card (#1390), Logo (#1356).
 *  - Motion utilities (#1367).
 */

/* ============================================================
 * 1. COLOR — ECHO v1.2 palette (the only palette)
 * ============================================================ */

/** Brand accent — fuchsia. Reserved for CTAs / active nav / key highlights. */
export const ACCENT = '#C108AB';
export const ACCENT_HOVER = '#A00790';
export const ACCENT_DARK = '#A00790';
export const ACCENT_LIGHT = '#E040C8';

/** Secondary brand — teal (success / subtle accents, data viz only). */
export const TEAL = '#00897B';

/** Semantic status colors (permitted alongside the single decorative accent). */
export const SUCCESS = '#16A34A';
export const WARNING = '#CA8A04';
export const ERROR = '#DC2626';
export const INFO = '#2563EB';

/** Neutral / text ramp. gray-500 is the canonical eyebrow color (#1353). */
export const INK = '#0F1115';        /* deepest text / dark sections */
export const TEXT = '#0A0A12';       /* primary text on light bg */
export const TEXT_SECONDARY = '#2B2B3A';
export const MUTED = '#616170';      /* gray-500 — eyebrows, secondary labels */
export const MUTED_DIM = '#9CA3AF';  /* gray-400 — fainter metadata */

/** Gray ramp (ECHO v1.2). */
export const GRAY_50 = '#FFFFFF';
export const GRAY_100 = '#FAFAFA';
export const GRAY_200 = '#F7F6F3';   /* bg-alt (warm editorial) */
export const GRAY_300 = '#E9E7E1';   /* borders / dividers */
export const GRAY_400 = '#D4D4D1';
export const GRAY_500 = '#616170';   /* eyebrow / section-label — #1353 */
export const GRAY_600 = '#4B5563';
export const GRAY_700 = '#2B2B3A';
export const GRAY_900 = '#0A0A12';

/** Surfaces. */
export const BG = '#FFFFFF';
export const BG_ALT = '#F7F6F3';
export const BG_DARK = '#0A0A12';    /* CTA sections, footers */
export const CARD = '#FFFFFF';
export const CARD_HOVER = '#FBFAF8';
export const BORDER = '#E9E7E1';
export const BORDER_STRONG = '#D4D4D1';
export const DIVIDER = '#EEECE8';
export const WHITE = '#FFFFFF';

/** Eyebrow / section-label color — light gray, NOT fuchsia (#1353). */
export const EYEBROW = GRAY_500;     /* #616170 */
/** Legacy alias retained for call sites migrated from assessment/landing/shared.ts. */
export const EYEBROW_GRAY = EYEBROW;

/** Legacy palette aliases (Palette-E consumers: NexusLanding, DexAiPage). */
export const OFF = BG_ALT;           /* #F7F6F3 */
export const G100 = GRAY_100;
export const G200 = '#E8E8E5';
export const G300 = GRAY_400;
export const G400 = MUTED_DIM;       /* #9CA3AF */
export const G600 = GRAY_600;

/* ============================================================
 * 2. TYPOGRAPHY — V1.1 FIX 1: System serif / DM Sans / IBM Plex Mono
 * ============================================================ */

// V1.1 FIX 1: System serif headings — no custom font loading. Zero FOIT/FOUC.
// Instant first paint for headings. Native OS fonts only.
export const FONT_DISPLAY = "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif";
export const FONT_BODY = "'DM Sans', system-ui, sans-serif";
export const FONT_MONO = "'IBM Plex Mono', ui-monospace, monospace";

export const FONT_WEIGHT_REGULAR = 400;
export const FONT_WEIGHT_MEDIUM = 500;
export const FONT_WEIGHT_SEMIBOLD = 600;
export const FONT_WEIGHT_BOLD = 700;

/** Type scale (desktop px). */
export const TEXT_DISPLAY = 48;
export const TEXT_H1 = 36;
export const TEXT_H2 = 28;
export const TEXT_H3 = 22;
export const TEXT_BODY_LG = 18;
export const TEXT_BODY = 16;
export const TEXT_BODY_SM = 14;
export const TEXT_CAPTION = 12;

/* ============================================================
 * 3. SPACING — 9-step scale (#1389). No arbitrary px on the surface.
 *    4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96
 * ============================================================ */

export const SPACE_1 = 4;
export const SPACE_2 = 8;
export const SPACE_3 = 12;
export const SPACE_4 = 16;
export const SPACE_6 = 24;
export const SPACE_8 = 32;
export const SPACE_12 = 48;
export const SPACE_16 = 64;
export const SPACE_24 = 96;

/** Section / hero rhythm targets (#1389). */
export const SECTION_GAP = SPACE_24;   /* 96px between major sections */
export const SECTION_PAD_Y = SPACE_16; /* 64px vertical section padding */
export const HERO_PAD_Y = SPACE_24;    /* 96px hero top/bottom */
export const CARD_PAD = SPACE_6;       /* 24–32px card padding */

/* ============================================================
 * 4. MOTION — 120/200/350ms envelope, ease-out standard (#1367)
 * ============================================================ */

export const DURATION_FAST = 120;     /* micro-interactions, button press */
export const DURATION_NORMAL = 200;   /* hover states, color transitions */
export const DURATION_SLOW = 350;     /* page transitions, modals, reveals */

/** Easing. `EASE_STANDARD` (ease-out) is the default for all motion. */
export const EASE_STANDARD = 'cubic-bezier(0.16, 1, 0.3, 1)';   /* ease-out (expo) */
export const EASE_IN_OUT = 'cubic-bezier(0.4, 0, 0.2, 1)';
export const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
export const EASE_SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

/* ============================================================
 * 5. SHADOW — subtle / medium / elevated
 * ============================================================ */

export const SHADOW_SUBTLE = '0 1px 2px rgba(10,10,18,0.06), 0 1px 1px rgba(10,10,18,0.04)';
export const SHADOW_MEDIUM = '0 4px 12px rgba(10,10,18,0.08)';
export const SHADOW_ELEVATED = '0 12px 30px rgba(10,10,18,0.08)';
export const SHADOW_OVERLAY = '0 16px 40px rgba(15,17,21,0.12)';

/* ============================================================
 * 6. RADIUS — BRAND RULE: zero border radius everywhere (#1349)
 * ============================================================ */

export const RADIUS = '0px';
export const RADIUS_SM = '0px';
export const RADIUS_NONE = '0px';
/** Reserved ONLY for genuinely circular elements (score rings, avatars). */
export const RADIUS_FULL = '9999px';

/* ============================================================
 * 7. MARKETING DS — canonical object consumed by the B2C surface.
 *    Replaces the 10+ inline `DS` objects (Palette drift A/B/C/D/E).
 *    Superset of every key any marketing page references, so any page can
 *    `import { DS } from '@/tokens'` and keep `DS.<key>` access unchanged.
 * ============================================================ */

export interface DesignSystem {
  headingFont: string;
  bodyFont: string;
  monoFont: string;
  accent: string;
  accentHover: string;
  accentDark: string;
  accentLight: string;
  bg: string;
  bgAlt: string;
  bgDark: string;
  card: string;
  cardBorder: string;
  cardHover: string;
  text: string;
  textSecondary: string;
  muted: string;
  mutedDim: string;
  border: string;
  borderStrong: string;
  radius: string;
  radiusSm: string;
  shadow: string;
  shadowHover: string;
  shadowLg: string;
  eyebrow: string;
  transition: string;
}

export const DS: DesignSystem = {
  headingFont: FONT_DISPLAY,
  bodyFont: FONT_BODY,
  monoFont: FONT_MONO,
  accent: ACCENT,
  accentHover: ACCENT_HOVER,
  accentDark: ACCENT_DARK,
  accentLight: ACCENT_LIGHT,
  bg: BG,
  bgAlt: BG_ALT,
  bgDark: BG_DARK,
  card: CARD,
  cardBorder: BORDER,
  cardHover: CARD_HOVER,
  text: TEXT,
  textSecondary: TEXT_SECONDARY,
  muted: MUTED,
  mutedDim: MUTED_DIM,
  border: BORDER,
  borderStrong: BORDER_STRONG,
  radius: RADIUS,
  radiusSm: RADIUS_SM,
  shadow: SHADOW_SUBTLE,
  shadowHover: SHADOW_ELEVATED,
  shadowLg: SHADOW_OVERLAY,
  eyebrow: EYEBROW,
  transition: `${DURATION_NORMAL}ms ${EASE_STANDARD}`,
};

/** Shared marketing brand constants (re-exported for Palette-E consumers). */
export const BRAND_ACCENT = ACCENT;
