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
export const INK_800 = '#1A1A1A';
export const INK_700 = '#333333';
export const INK_500 = '#666666';
export const INK_400 = '#999999';
export const INK_200 = '#E0E0E0';
export const INK_100 = '#F0F0F0';
export const INK_50 = '#FAFAFA';

/* ── Score bar colors (app) ── */
export const SCORE_OK = TEAL_500;     // ≥70
export const SCORE_WARNING = OCEAN_400; // 45-69
export const SCORE_CRITICAL = FUCHSIA_600; // <45
export const SCORE_LOCKED = INK_100;

/* ── Fuchsia palette expansion (confirm bar, toggle off, etc.) ── */
export const FUCHSIA_50 = '#FCEEF9';
export const FUCHSIA_700 = '#9E0789';

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
export const ON_DARK_DIM = 'rgba(250,250,250,0.40)';

/* ── Borders & dividers (all 1px solid) ── */
export const BORDER = INK_200;
export const DIVIDER_ROW = INK_200;
export const DIVIDER_SURFACE = INK_100;
export const DIVIDER_DARK = 'rgba(250,250,250,0.06)';
export const FOCUS_RING = OCEAN_400;

/* ── Typography ── */
export const FONT_DISPLAY = "'Crimson Pro', 'DejaVu Serif', Georgia, 'Times New Roman', serif";
export const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const FONT_MONO = "'IBM Plex Mono', 'SF Mono', ui-monospace, monospace";

export const FW_LIGHT = 300; // page titles display
export const FW_REGULAR = 400; // section titles + body
export const FW_MEDIUM = 500;
export const FW_SEMIBOLD = 600; // wordmark + lens names + profile name
export const FW_BOLD = 700;

/* ── Type scale (fluid via clamp at call site) ── */
export const TEXT_HERO = 'clamp(2.2rem, 5vw, 3.8rem)';
export const TEXT_SECTION_TITLE = 'clamp(1.8rem, 4vw, 2.6rem)';
export const TEXT_BODY_SERIF = '1.25rem';
// App-specific
export const TEXT_APP_PAGE_TITLE = 'clamp(1.8rem, 3.5vw, 2.6rem)';
export const TEXT_APP_SECTION_TITLE = 'clamp(1.3rem, 2.5vw, 1.7rem)';
export const TEXT_APP_BODY = '15px';
export const TEXT_APP_BODY_SM = '13.5px';
export const TEXT_APP_MONO = '10.5px';
export const TEXT_APP_MONO_SM = '9.5px';

export const TRACKING_DISPLAY = '-0.01em';
export const TRACKING_MONO = '0.12em';

export const LEADING_HERO = 1.2;
export const LEADING_SECTION_TITLE = 1.25;
export const LEADING_BODY_SERIF = 1.55;
export const LEADING_APP_BODY = 1.6;

/* ── Layout ── */
export const CONTENT_MAX = 1200;
export const MARKETING_PAD_Y = 96;
export const MARKETING_PAD_Y_SM = 64;
export const NAV_HEIGHT = 64;
// App-specific layout
export const APP_CONTENT_MAX = 960;
export const APP_SIDEBAR_WIDTH = 272;
export const APP_TOPBAR_HEIGHT = 64;
export const APP_PAGE_HEADER_PAD = 48;
export const APP_CHAT_SIDE_WIDTH = 280;
export const APP_INFO_PANEL_WIDTH = 320;
export const APP_THREAD_MAX = 720;

/* ── Radius — zero everywhere (V3.5 brand rule) ── */
export const RADIUS = '0px';
export const RADIUS_NONE = '0px';

/* ── Sizing (components) ── */
export const SIZE_BUTTON_DEFAULT = 36;
export const SIZE_BUTTON_LARGE = 42;
export const SIZE_BUTTON_SMALL = 30;
export const SIZE_ICON_BUTTON = 36;
export const SIZE_TOGGLE_W = 36;
export const SIZE_TOGGLE_H = 20;
export const SIZE_TOGGLE_THUMB = 16;
export const SIZE_SCORE_BAR = 2;
export const SIZE_AVATAR_SM = 28;
export const SIZE_AVATAR_MD = 32;
export const SIZE_AVATAR_LG = 80;
export const SIZE_SEND_BUTTON = 36;

/* ── Motion ── */
export const DUR_NORMAL = 200;
export const DUR_SLOW = 400;
export const DUR_FAST = 150;
export const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * V3.5 DS object — consumed by marketing surface AND app shell.
 *
 * Prefer using these properties instead of importing individual constants
 * so that rebranding is a one-file change.
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
  fuchsia50: FUCHSIA_50,
  fuchsia600: FUCHSIA_600,
  fuchsia700: FUCHSIA_700,
  // neutrals
  cream: CREAM,
  white: WHITE,
  ink900: INK_900,
  ink800: INK_800,
  ink700: INK_700,
  ink500: INK_500,
  ink400: INK_400,
  ink200: INK_200,
  ink100: INK_100,
  ink50: INK_50,
  // score
  scoreOk: SCORE_OK,
  scoreWarning: SCORE_WARNING,
  scoreCritical: SCORE_CRITICAL,
  scoreLocked: SCORE_LOCKED,
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
  onDarkDim: ON_DARK_DIM,
  // borders
  border: BORDER,
  dividerRow: DIVIDER_ROW,
  dividerSurface: DIVIDER_SURFACE,
  dividerDark: DIVIDER_DARK,
  focusRing: FOCUS_RING,
  // type scale (marketing)
  textHero: TEXT_HERO,
  textSectionTitle: TEXT_SECTION_TITLE,
  textBodySerif: TEXT_BODY_SERIF,
  // type scale (app)
  textAppPageTitle: TEXT_APP_PAGE_TITLE,
  textAppSectionTitle: TEXT_APP_SECTION_TITLE,
  textAppBody: TEXT_APP_BODY,
  textAppBodySm: TEXT_APP_BODY_SM,
  textAppMono: TEXT_APP_MONO,
  textAppMonoSm: TEXT_APP_MONO_SM,
  // tracking
  trackingDisplay: TRACKING_DISPLAY,
  trackingMono: TRACKING_MONO,
  // leading
  leadingHero: LEADING_HERO,
  leadingSectionTitle: LEADING_SECTION_TITLE,
  leadingBodySerif: LEADING_BODY_SERIF,
  leadingAppBody: LEADING_APP_BODY,
  // weights
  fwLight: FW_LIGHT,
  fwRegular: FW_REGULAR,
  fwMedium: FW_MEDIUM,
  fwSemibold: FW_SEMIBOLD,
  fwBold: FW_BOLD,
  // layout (marketing)
  contentMax: CONTENT_MAX,
  marketingPadY: MARKETING_PAD_Y,
  marketingPadYSm: MARKETING_PAD_Y_SM,
  navHeight: NAV_HEIGHT,
  // layout (app)
  appContentMax: APP_CONTENT_MAX,
  appSidebarWidth: APP_SIDEBAR_WIDTH,
  appTopbarHeight: APP_TOPBAR_HEIGHT,
  appPageHeaderPad: APP_PAGE_HEADER_PAD,
  appChatSideWidth: APP_CHAT_SIDE_WIDTH,
  appInfoPanelWidth: APP_INFO_PANEL_WIDTH,
  appThreadMax: APP_THREAD_MAX,
  // component sizing
  sizeButton: SIZE_BUTTON_DEFAULT,
  sizeButtonLarge: SIZE_BUTTON_LARGE,
  sizeButtonSmall: SIZE_BUTTON_SMALL,
  sizeIconButton: SIZE_ICON_BUTTON,
  sizeToggleW: SIZE_TOGGLE_W,
  sizeToggleH: SIZE_TOGGLE_H,
  sizeToggleThumb: SIZE_TOGGLE_THUMB,
  sizeScoreBar: SIZE_SCORE_BAR,
  sizeAvatarSm: SIZE_AVATAR_SM,
  sizeAvatarMd: SIZE_AVATAR_MD,
  sizeAvatarLg: SIZE_AVATAR_LG,
  sizeSendButton: SIZE_SEND_BUTTON,
  // radius
  radius: RADIUS,
  radiusNone: RADIUS_NONE,
  // motion
  durNormal: DUR_NORMAL,
  durSlow: DUR_SLOW,
  durFast: DUR_FAST,
  ease: EASE,
} as const;
