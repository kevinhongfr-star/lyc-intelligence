/**
 * V1 VISUAL SYSTEM FOUNDATION — TS token mirror.
 *
 * Mirrors the `--v1-*` CSS custom properties declared in `src/index.css`.
 * V2 surfaces (landing + chat) consume these so TS inline styles and CSS
 * classes stay in sync.
 *
 * Brand hard rules (V1):
 *  - Zero border radius everywhere. No rounded corners.
 *  - No box shadows. No gradients. All dividers = 1px solid rules.
 *  - Cream (#FAFAFA) is default page background.
 *  - Dark sections use teal-900 (#062926), not black.
 *  - Fuchsia (#C108AB) ONLY for recommended/flagship accents — sparingly.
 *  - Mono labels: uppercase, 0.7rem, 0.08em letter-spacing.
 *  - Display text: Crimson Pro, -0.02em, 1.1 line-height.
 *  - Body: Inter. Mono: IBM Plex Mono.
 *
 * NOTE: hex values for the full teal/ink scales are defined here per spec
 * (teal-900 #062926 + teal-600 #00897B + fuchsia-600 #C108AB + cream
 * #FAFAFA are spec-locked; intermediate steps form a coherent scale).
 */

/* ── Teal scale 900→50 (primary brand) ── */
export const TEAL_900 = '#062926'; // dark sections (spec-locked)
export const TEAL_800 = '#0A3D38';
export const TEAL_700 = '#0F5F57'; // brand wordmark
export const TEAL_600 = '#00897B'; // primary teal — interactive (spec-locked)
export const TEAL_500 = '#009688';
export const TEAL_400 = '#26A69A';
export const TEAL_300 = '#4DB6AC';
export const TEAL_200 = '#80CBC4';
export const TEAL_100 = '#B2DFDB';
export const TEAL_50 = '#E0F2F1';

/* ── Fuchsia — recommended/flagship accents ONLY ── */
export const FUCHSIA_600 = '#C108AB'; // spec-locked
export const FUCHSIA_700 = '#A00790'; // hover
export const FUCHSIA_50 = '#FCE7F7'; // light pink bg (milestone badge)

/* ── Ink scale 900→50 (neutral text/borders) ── */
export const INK_900 = '#0F1115'; // deepest text
export const INK_800 = '#1F2329';
export const INK_700 = '#2A2C33'; // soft text
export const INK_600 = '#4A4A58'; // secondary text
export const INK_500 = '#6B7280'; // muted
export const INK_400 = '#9CA3AF'; // dim metadata
export const INK_300 = '#D3D1CC'; // strong border
export const INK_200 = '#E8E7E4'; // default border
export const INK_100 = '#F0EFEB'; // subtle border
export const INK_50 = '#F5F5F3'; // surface alt

/* ── Page surfaces ── */
export const CREAM = '#FAFAFA'; // default page background (spec-locked)
export const WHITE = '#FFFFFF';
export const BG = CREAM;
export const SURFACE = WHITE;
export const SURFACE_ALT = INK_50;
export const BG_DARK = TEAL_900; // dark sections use teal-900, not black

/* ── Semantic text on light ── */
export const TEXT = INK_900;
export const TEXT_SECONDARY = INK_600;
export const TEXT_MUTED = INK_500;
export const TEXT_DIM = INK_400;
export const ON_DARK = WHITE;
export const ON_DARK_MUTED = 'rgba(255,255,255,0.66)';

/* ── Borders & dividers (all 1px solid) ── */
export const BORDER = INK_200;
export const BORDER_STRONG = INK_300;
export const BORDER_SUBTLE = INK_100;
export const DIVIDER_STRONG = INK_300;
export const DIVIDER_ROW = INK_200;
export const DIVIDER_SUBTLE = INK_100;

/* ── Typography ── */
export const FONT_DISPLAY = "'Crimson Pro', 'DejaVu Serif', Georgia, 'Times New Roman', serif";
export const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const FONT_MONO = "'IBM Plex Mono', 'SF Mono', ui-monospace, monospace";

export const FW_REGULAR = 400;
export const FW_MEDIUM = 500;
export const FW_SEMIBOLD = 600;
export const FW_BOLD = 700;

export const TEXT_DISPLAY = 56;
export const TEXT_H1 = 40;
export const TEXT_H2 = 30;
export const TEXT_H3 = 22;
export const TEXT_BODY_LG = 18;
export const TEXT_BODY = 16;
export const TEXT_BODY_SM = 14;
export const TEXT_MONO_PX = 11.2; // 0.7rem at 16px base
export const TEXT_CAPTION = 12;

export const TRACKING_TIGHT = '-0.02em'; // display
export const TRACKING_MONO = '0.08em'; // mono labels
export const TRACKING_WIDE = '0.05em';

export const LEADING_DISPLAY = 1.1;
export const LEADING_HEADING = 1.2;
export const LEADING_BODY = 1.6;
export const LEADING_LABEL = 1.4; // mono labels

/* ── Layout primitives ── */
export const SHELL_SIDEBAR_W = 220;
export const SHELL_RAIL_W = 280;
export const SHELL_MAX = 1320;
export const SHELL_PAD = 32;
export const SHELL_GAP = 32;
export const CONTENT_MAX = 1120;
export const MARKETING_PAD_Y = 96;
export const MARKETING_PAD_Y_SM = 64;

/* ── Radius — zero everywhere (V1 brand rule) ── */
export const RADIUS = '0px';
export const RADIUS_NONE = '0px';
export const RADIUS_FULL = '9999px'; // circular-only (avatars/rings)

/* ── Motion ── */
export const DUR_FAST = 120;
export const DUR_NORMAL = 200;
export const DUR_SLOW = 300;
export const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

export const NAV_HEIGHT = 64;

/**
 * V1 DS object — superset consumed by V2 pages via `import { V1 } from
 * '@/styles/v1-tokens'`. Mirrors the legacy `DS` shape so call sites can
 * migrate with minimal churn, plus V1-specific keys.
 */
export const V1 = {
  // fonts
  displayFont: FONT_DISPLAY,
  bodyFont: FONT_BODY,
  monoFont: FONT_MONO,
  // palette
  teal900: TEAL_900,
  teal800: TEAL_800,
  teal700: TEAL_700,
  teal600: TEAL_600,
  teal500: TEAL_500,
  teal400: TEAL_400,
  teal300: TEAL_300,
  teal200: TEAL_200,
  teal100: TEAL_100,
  teal50: TEAL_50,
  fuchsia600: FUCHSIA_600,
  fuchsia700: FUCHSIA_700,
  fuchsia50: FUCHSIA_50,
  ink900: INK_900,
  ink800: INK_800,
  ink700: INK_700,
  ink600: INK_600,
  ink500: INK_500,
  ink400: INK_400,
  ink300: INK_300,
  ink200: INK_200,
  ink100: INK_100,
  ink50: INK_50,
  // surfaces
  cream: CREAM,
  white: WHITE,
  bg: BG,
  surface: SURFACE,
  surfaceAlt: SURFACE_ALT,
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
  borderStrong: BORDER_STRONG,
  borderSubtle: BORDER_SUBTLE,
  dividerStrong: DIVIDER_STRONG,
  dividerRow: DIVIDER_ROW,
  dividerSubtle: DIVIDER_SUBTLE,
  // typography — type scale
  textDisplay: TEXT_DISPLAY,
  textH1: TEXT_H1,
  textH2: TEXT_H2,
  textH3: TEXT_H3,
  textBodyLg: TEXT_BODY_LG,
  textBody: TEXT_BODY,
  textBodySm: TEXT_BODY_SM,
  textMonoPx: TEXT_MONO_PX,
  textCaption: TEXT_CAPTION,
  // typography — weights
  fwRegular: FW_REGULAR,
  fwMedium: FW_MEDIUM,
  fwSemibold: FW_SEMIBOLD,
  fwBold: FW_BOLD,
  // typography — tracking & leading
  trackingTight: TRACKING_TIGHT,
  trackingMono: TRACKING_MONO,
  trackingWide: TRACKING_WIDE,
  leadingDisplay: LEADING_DISPLAY,
  leadingHeading: LEADING_HEADING,
  leadingBody: LEADING_BODY,
  leadingLabel: LEADING_LABEL,
  // layout
  shellSidebarW: SHELL_SIDEBAR_W,
  shellRailW: SHELL_RAIL_W,
  shellMax: SHELL_MAX,
  shellPad: SHELL_PAD,
  shellGap: SHELL_GAP,
  contentMax: CONTENT_MAX,
  marketingPadY: MARKETING_PAD_Y,
  marketingPadYSm: MARKETING_PAD_Y_SM,
  // radius / motion
  radius: RADIUS,
  radiusFull: RADIUS_FULL,
  navHeight: NAV_HEIGHT,
  durFast: DUR_FAST,
  durNormal: DUR_NORMAL,
  durSlow: DUR_SLOW,
  ease: EASE,
};
