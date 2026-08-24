/**
 * V3.5 MARKETING DESIGN SYSTEM — TS token mirror.
 *
 * Canon for the v3.5 landing page redesign. Replaces the previous token
 * system for the marketing surface only. App surfaces keep V1 tokens.
 *
 * Brand hard rules (V3.5):
 *  - Ocean primary (authoritative blue), Teal secondary (cyan-leaning,
 *    NOT green-leaning — never drift toward Cathay/Korn Ferry green).
 *  - Fuchsia #C108AB ONLY for punctuation / focal dots — minimal.
 *  - Zero border radius everywhere. No rounded corners.
 *  - No box shadows. No gradients (exception: hero video 60% solid black
 *    overlay, and a subtle radial glow in the final CTA section).
 *  - Editorial minimalism — rule lines (1px solid), not cards.
 *  - Display: Crimson Pro, light weight (300 hero / 400 section titles).
 *    Never bold for headlines.
 *  - Body: Inter. Meta / labels / eyebrows: IBM Plex Mono.
 *  - Wordmark "NEXUS." — NO space before the dot. Dot is fuchsia.
 *
 * Source: V6.0-1 design system spec.
 */

/* ── Ocean scale 800→50 (primary, authoritative blue) ── */
export const OCEAN_800 = '#0F2C4A';
export const OCEAN_700 = '#183F5E';
export const OCEAN_600 = '#1E537A';
export const OCEAN_500 = '#2A6A95';
export const OCEAN_400 = '#3E86B5';
export const OCEAN_300 = '#6BA8CD';
export const OCEAN_200 = '#9CC6DF';
export const OCEAN_100 = '#CFE1EE';
export const OCEAN_50 = '#EAF2F8';

/* ── Teal scale 700→50 (secondary, cyan-leaning — NOT green) ── */
export const TEAL_700 = '#0B5D6B';
export const TEAL_600 = '#0E7B8A';
export const TEAL_500 = '#1293A6';
export const TEAL_400 = '#2DB0C2';
export const TEAL_300 = '#5AC6D5';
export const TEAL_200 = '#8EDBE5';
export const TEAL_100 = '#BFE9F0';
export const TEAL_50 = '#E1F5F8';

/* ── Fuchsia — punctuation / focal dots ONLY (minimal) ── */
export const FUCHSIA_600 = '#C108AB';

/* ── Neutrals ── */
export const CREAM = '#FAFAFA';
export const WHITE = '#FFFFFF';
export const INK_900 = '#0A0A0A';
export const INK_700 = '#333333';
export const INK_500 = '#666666';
export const INK_400 = '#999999';
export const INK_200 = '#E0E0E0';

/* ── Page surfaces ── */
export const BG = CREAM;
export const SURFACE = WHITE;
export const BG_DARK = INK_900; // dark sections use ink-900, not black-teal

/* ── Semantic text ── */
export const TEXT = INK_900;
export const TEXT_SECONDARY = INK_700;
export const TEXT_MUTED = INK_500;
export const TEXT_DIM = INK_400;
export const ON_DARK = CREAM;
export const ON_DARK_MUTED = 'rgba(250,250,250,0.66)';

/* ── Borders & dividers (all 1px solid) ── */
export const BORDER = INK_200;
export const DIVIDER_ROW = INK_200;

/* ── Typography ── */
export const FONT_DISPLAY = "'Crimson Pro', 'DejaVu Serif', Georgia, 'Times New Roman', serif";
export const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const FONT_MONO = "'IBM Plex Mono', 'SF Mono', ui-monospace, monospace";

export const FW_LIGHT = 300; // hero display
export const FW_REGULAR = 400; // section titles + body
export const FW_MEDIUM = 500;
export const FW_BOLD = 700; // wordmark only

/* ── Type scale (fluid via clamp at call site) ── */
export const TEXT_HERO = 'clamp(2.2rem, 5vw, 3.8rem)';
export const TEXT_SECTION_TITLE = 'clamp(1.8rem, 4vw, 2.6rem)';
export const TEXT_BODY_SERIF = '1.25rem';

export const TRACKING_DISPLAY = '-0.01em';
export const TRACKING_MONO = '0.2em'; // eyebrows / meta / labels

export const LEADING_HERO = 1.2;
export const LEADING_SECTION_TITLE = 1.25;
export const LEADING_BODY_SERIF = 1.55;

/* ── Layout ── */
export const CONTENT_MAX = 1200;
export const MARKETING_PAD_Y = 96;
export const MARKETING_PAD_Y_SM = 64;
export const NAV_HEIGHT = 64;

/* ── Radius — zero everywhere (V3.5 brand rule) ── */
export const RADIUS = '0px';
export const RADIUS_NONE = '0px';

/* ── Motion ── */
export const DUR_NORMAL = 200;
export const DUR_SLOW = 400;
export const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * V3.5 DS object — consumed by the v3.5 landing page via
 * `import { V3 } from '@/styles/v3-tokens'`.
 */
export const V3 = {
  // fonts
  displayFont: FONT_DISPLAY,
  bodyFont: FONT_BODY,
  monoFont: FONT_MONO,
  // ocean
  ocean800: OCEAN_800,
  ocean700: OCEAN_700,
  ocean600: OCEAN_600,
  ocean500: OCEAN_500,
  ocean400: OCEAN_400,
  ocean300: OCEAN_300,
  ocean200: OCEAN_200,
  ocean100: OCEAN_100,
  ocean50: OCEAN_50,
  // teal
  teal700: TEAL_700,
  teal600: TEAL_600,
  teal500: TEAL_500,
  teal400: TEAL_400,
  teal300: TEAL_300,
  teal200: TEAL_200,
  teal100: TEAL_100,
  teal50: TEAL_50,
  // fuchsia
  fuchsia600: FUCHSIA_600,
  // neutrals
  cream: CREAM,
  white: WHITE,
  ink900: INK_900,
  ink700: INK_700,
  ink500: INK_500,
  ink400: INK_400,
  ink200: INK_200,
  // surfaces
  bg: BG,
  surface: SURFACE,
  bgDark: BG_DARK,
  // text
  text: TEXT,
  textSecondary: TEXT_SECONDARY,
  textMuted: TEXT_MUTED,
  textDim: TEXT_DIM,
  onDark: ON_DARK,
  onDarkMuted: ON_DARK_MUTED,
  // borders
  border: BORDER,
  dividerRow: DIVIDER_ROW,
  // type scale
  textHero: TEXT_HERO,
  textSectionTitle: TEXT_SECTION_TITLE,
  textBodySerif: TEXT_BODY_SERIF,
  trackingDisplay: TRACKING_DISPLAY,
  trackingMono: TRACKING_MONO,
  leadingHero: LEADING_HERO,
  leadingSectionTitle: LEADING_SECTION_TITLE,
  leadingBodySerif: LEADING_BODY_SERIF,
  // weights
  fwLight: FW_LIGHT,
  fwRegular: FW_REGULAR,
  fwMedium: FW_MEDIUM,
  fwBold: FW_BOLD,
  // layout
  contentMax: CONTENT_MAX,
  marketingPadY: MARKETING_PAD_Y,
  marketingPadYSm: MARKETING_PAD_Y_SM,
  navHeight: NAV_HEIGHT,
  // radius
  radius: RADIUS,
  radiusNone: RADIUS_NONE,
  // motion
  durNormal: DUR_NORMAL,
  durSlow: DUR_SLOW,
  ease: EASE,
} as const;
