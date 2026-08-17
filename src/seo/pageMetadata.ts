/**
 * Phase 17 / T01 (#1287) — Centralized page metadata registry.
 * Phase 17 / P1-1 — Per-page SEO / OG / Twitter card metadata for route patterns.
 *
 * Single source of truth for ALL SEO metadata.
 * - PAGE_META keyed object: used by <SEO /> component for explicit marketing pages.
 * - PAGE_METADATA_REGISTRY pattern array: used by usePageMetadata() hook for router-level
 *   pattern-matching (covers 140+ routes, noindex portals, and long-tail SEO assets).
 *
 * Title tags: 50-60 chars, keyword front-loaded.
 * Descriptions: 150-160 chars, unique per page.
 */

export const SITE_URL = 'https://lyc-intelligence.app';
export const SITE_NAME = 'LYC Intelligence';
export const SITE_TAGLINE = 'Know where you stand. Know where to go.';
// Static OG fallback kept at public/og-image.png for crawlers that don't hit the edge runtime

// ─────────────────────────────────────────────────────────────────────
// 1. <SEO /> component metadata (explicit pages)
// ─────────────────────────────────────────────────────────────────────

export interface PageMeta {
  /** Full <title> tag (50-60 chars target) */
  title: string;
  /** Meta description (150-160 chars target) */
  description: string;
  /** Path relative to SITE_URL, e.g. /pricing */
  path: string;
  /** OG image path — uses /api/og?title=... for dynamic generation */
  ogImage?: string;
  /** og:type — website for most, product for assessment pages */
  type?: 'website' | 'product' | 'article';
  /** JSON-LD structured data object, or null for none */
  structuredData?: object | null;
}

/** Build OG image URL from a title string */
export function ogImageUrl(title: string, subtitle?: string): string {
  const params = new URLSearchParams({ title });
  if (subtitle) params.set('subtitle', subtitle);
  return `${SITE_URL}/api/og?${params.toString()}`;
}

// ── Static page metadata (keyed by page name for <SEO page="..." />) ─

export const PAGE_META: Record<string, PageMeta> = {
  landing: {
    title: 'LYC Intelligence — Executive Intelligence Platform',
    description:
      'Know where you stand. Know where to go. Leadership intelligence for every stage — from career positioning to executive matching. 500+ placements across 47 markets.',
    path: '/',
    type: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'LYC Intelligence',
      url: SITE_URL,
      logo: `${SITE_URL}/apple-touch-icon.png`,
      description:
        'Executive intelligence platform — advisory, assessments, and talent search for high-achieving leaders.',
      foundingDate: '2024',
      areaServed: 'Asia-Pacific',
      knowsAbout: [
        'Executive Search',
        'Leadership Assessment',
        'Career Advisory',
        'NEXUS Coaching',
        'Talent Matching',
      ],
    },
  },

  pricing: {
    title: 'Pricing — LYC Intelligence | Leadership Assessments',
    description:
      'Three plans from Complimentary to Council. All 6 leadership assessments, NEXUS, and personalised reports. USD and CNY. Start complimentary.',
    path: '/pricing',
    type: 'website',
    structuredData: null,
  },

  nexus: {
    title: 'NEXUS — Your Executive Advisor | LYC Intelligence',
    description:
      'NEXUS is your executive advisor. It knows all 6 leadership assessments, interprets your results, and gives you personalised leadership advice. 3 complimentary messages.',
    path: '/nexus',
    type: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'NEXUS',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Complimentary tier — 3 NEXUS messages',
      },
      publisher: {
        '@type': 'Organization',
        name: 'LYC Intelligence',
        url: SITE_URL,
      },
    },
  },

  b2b: {
    title: 'For Firms — Executive Search & Match Analysis | LYC',
    description:
      'Mandates, candidate scoring, and organizational intelligence for search firms and enterprises. GRID pipeline, TRIDENT scoring, CANVAS analytics. 500+ placements across 47 markets.',
    path: '/b2b',
    type: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'LYC Intelligence for Firms',
      serviceType: 'Executive Search & Talent Intelligence',
      provider: {
        '@type': 'Organization',
        name: 'LYC Intelligence',
        url: SITE_URL,
      },
      areaServed: 'Asia-Pacific',
    },
  },

  match: {
    title: 'Match Analysis — Executive-Firm Alignment | LYC',
    description:
      'AI-powered match analysis between executives and organizations. Cultural fit, competency alignment, and mandate readiness scoring. Built on 20 years of APAC placement data.',
    path: '/match',
    type: 'website',
    structuredData: null,
  },

  assessments: {
    title: '6 Leadership Assessments — LYC Intelligence',
    description:
      'Six focused leadership assessments — PRISM, SPARK, FORGE, BRIDGE, MOSAIC, DRIVE. Career branding, AI readiness, sales, China leadership, cultural intelligence, execution. Validated against APAC placement data.',
    path: '/assessments',
    type: 'website',
    structuredData: null,
  },

  terms: {
    title: 'Terms of Service — LYC Intelligence',
    description:
      'Terms governing your use of the LYC Intelligence platform, including assessment usage, NEXUS interactions, subscription terms, and data processing agreements.',
    path: '/terms',
    type: 'website',
    structuredData: null,
  },

  privacy: {
    title: 'Privacy Policy — LYC Intelligence',
    description:
      'How LYC Intelligence collects, uses, and protects your data. GDPR and PIPL compliant. Third-party processors: DeepSeek, Supabase, Stripe. PRC governing law.',
    path: '/privacy',
    type: 'website',
    structuredData: null,
  },

  cookies: {
    title: 'Cookie Policy — LYC Intelligence',
    description:
      'Cookie usage on the LYC Intelligence platform. Essential, analytics, and marketing cookies explained. Manage your consent preferences at any time.',
    path: '/cookies',
    type: 'website',
    structuredData: null,
  },
};

// ── Assessment-specific metadata (dynamic, per instrument) ──────────

export interface AssessmentMeta extends PageMeta {
  code: string;
  instrumentName: string;
  milesCost: number;
}

/**
 * Generate SEO metadata for an individual assessment landing page.
 * Called by CanonicalInstrumentLanding and custom landing pages (CPI, SHIFT, etc.)
 */
export function getAssessmentMeta(
  code: string,
  name: string,
  b2cName: string,
  tagline: string,
  milesCost: number,
  durationMinutes: number,
  totalQuestions: number,
): AssessmentMeta {
  const title = `${b2cName} Assessment | LYC Intelligence`;
  const description = `${tagline || name}. ${durationMinutes} min · ${totalQuestions} questions. Validated against APAC placement data. Archetype classification and development roadmap.`;

  return {
    code,
    instrumentName: name,
    milesCost,
    title,
    description,
    path: `/assessments/${code.toLowerCase()}`,
    type: 'product',
    ogImage: ogImageUrl(b2cName, `${code} Assessment`),
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `${b2cName} Assessment`,
      description: tagline || name,
      brand: {
        '@type': 'Brand',
        name: 'LYC Intelligence',
      },
      offers: {
        '@type': 'Offer',
        price: String(milesCost),
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/assessments/${code.toLowerCase()}`,
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// 2. Router-level metadata (pattern-matching for usePageMetadata hook)
// ─────────────────────────────────────────────────────────────────────

export interface PageMetadata {
  title: string;
  description: string;
  canonical?: string;
  /** noindex hides the page from search engines (authenticated portals) */
  noindex?: boolean;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  keywords?: string[];
}

const BASE_URL = SITE_URL;

export const DEFAULT_META: PageMetadata = {
  title: 'LYC Intelligence — Leadership Intelligence for China Operating Leaders',
  description:
    'LYC Intelligence delivers data-driven leadership diagnostics, mobility mapping, and executive search intelligence — purpose-built for leaders operating in China.',
  ogType: 'website',
  ogImage: `${BASE_URL}/api/og`,
  keywords: [
    'CPI leadership benchmark APAC',
    'executive assessment China',
    'SHENZHEN C-suite diagnostic',
    'LYC executive intelligence',
    'Singapore leadership placement data',
  ],
};

const u = (p: string) => `${BASE_URL}${p}`;

/** Ordered by specificity — longer, more specific prefixes match first when iterating. */
export const PAGE_METADATA_REGISTRY: { pattern: string; meta: PageMetadata }[] = [
  // ── Marketing root
  {
    pattern: '/',
    meta: {
      title: 'LYC Intelligence — Leadership Intelligence for China Operating Leaders',
      description:
        'The intelligence layer for China operating leaders. NEXUS advisory copilot, CPI & SHIFT diagnostics, and TRIDENT leader matching — in one seat.',
      canonical: u('/'),
      keywords: [
        'LYC CPI flagship assessment APAC',
        'NEXUS executive thinking partner',
        'China-APAC leadership benchmark 2026',
        'executive career positioning C-suite',
        'TRIDENT leader matching algorithm',
        'Shanghai executive placement data',
      ],
    },
  },
  // ── About
  {
    pattern: '/about',
    meta: {
      title: 'About LYC Intelligence | Our Mission, Founder & Network',
      description:
        'LYC Intelligence was founded to close the leadership intelligence gap for global leaders operating in China. Meet the team and understand our method.',
      canonical: u('/about'),
      keywords: [
        'LYC Intelligence founder background',
        'executive search firm APAC heritage',
        'leadership assessment methodology 20-year data',
        'China leadership advisory team',
        'LYC Partners executive search spin-off',
      ],
    },
  },
  // ── NEXUS
  {
    pattern: '/nexus/chat',
    meta: {
      title: 'NEXUS | LYC Advisory Copilot for China Operating Leaders',
      description:
        "NEXUS is LYC Intelligence's always-on advisory copilot. Ask for market context, executive profiles, and directional guidance — grounded in our data lake.",
      canonical: u('/nexus/chat'),
      noindex: true,
      keywords: [
        'NEXUS thinking partner executive',
        'AI leadership advisory copilot China',
        'executive market intelligence chatbot APAC',
        'CPI results AI interpretation tool',
        'leadership positioning AI assistant',
      ],
    },
  },
  // ── B2B landing
  {
    pattern: '/b2b',
    meta: {
      title: 'Executive Search Intelligence (B2B) | LYC Intelligence',
      description:
        'Client and consultant portal for retained executive search, mandate pipeline, and organisational diagnostics — built on a decade of China market data.',
      canonical: u('/b2b'),
      keywords: [
        'GRID executive search pipeline APAC',
        'TRIDENT candidate scoring China search firms',
        'CANVAS organisational diagnostics enterprise',
        'executive mandate intelligence dashboard',
        'retained search candidate matching tool',
        'APAC talent mapping analytics platform',
      ],
    },
  },
  // ── Pricing
  {
    pattern: '/pricing',
    meta: {
      title: 'Pricing | LYC Intelligence — Explorer, Executive, Council Tiers',
      description:
        'Transparent pricing for every leader. Explorer (self-serve), Executive (diagnostics + matching), and Council (dedicated advisory) — annual billing, cancel anytime.',
      canonical: u('/pricing'),
      keywords: [
        'CPI executive assessment cost 2026',
        'transparent leadership diagnostic pricing USD',
        'executive NEXUS subscription cost',
        'LYC Council tier advisory pricing',
        'leadership assessment à la carte $99 USD',
        'APAC executive diagnostic subscription',
      ],
    },
  },
  // ── Contact
  {
    pattern: '/contact',
    meta: {
      title: 'Contact LYC Intelligence | Talk to the Team',
      description:
        'Questions about diagnostics, enterprise mandates, or NEXUS? Reach the LYC Intelligence team — average first response under one business day.',
      canonical: u('/contact'),
      keywords: [
        'LYC Intelligence APAC contact sales',
        'executive assessment inquiry Shanghai',
        'enterprise mandate consultation APAC',
        'NEXUS enterprise pricing contact',
        'leadership advisory team enquiry Singapore',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────
  // 11 ASSESSMENT LANDINGS (each is its own SEO asset)
  // ─────────────────────────────────────────────────────────────
  {
    pattern: '/assessment/cpi',
    meta: {
      title: 'CPI Diagnostic | China Leadership Pipeline Index',
      description:
        'The CPI Diagnostic benchmarks your leadership readiness for China market roles across 4 axes. 15 minutes, 200+ data points, actionable report.',
      canonical: u('/assessment/cpi'),
      keywords: [
        'CPI leadership assessment Singapore executive',
        'China C-suite positioning benchmark diagnostic',
        'executive pipeline index 5 dimensions APAC',
        'CPI 12 archetypes leadership profile',
        'APAC executive readiness assessment CPI',
        'Shanghai CPI leadership diagnostic 2026',
      ],
    },
  },
  {
    pattern: '/assessment/shift',
    meta: {
      title: 'SHIFT Mobility | Career Transition Radar for China Leaders',
      description:
        'SHIFT maps your adjacent career moves across industry, function, and stage — with 5 ranked paths and LYC likelihood scores. 12 minutes, data-driven.',
      canonical: u('/assessment/shift'),
      keywords: [
        'SHIFT career mobility assessment APAC executive',
        'China leader career transition radar 5 paths',
        'executive industry pivot likelihood score',
        'cross-functional move assessment C-suite',
        'career stage transition diagnostic Shenzhen',
        'LYC SHIFT mobility benchmark executive',
      ],
    },
  },
  {
    pattern: '/assessment',
    meta: {
      title: '6 Leadership Assessments | LYC Intelligence',
      description:
        'Every LYC leadership assessment in one place. PRISM, SPARK, FORGE, BRIDGE, MOSAIC, DRIVE — start in under 60 seconds, get a personalised report.',
      canonical: u('/assessment'),
      keywords: [
        'PRISM SPARK FORGE executive assessment APAC',
        'LEAP leadership transition profile China executive',
        'SPARK AI readiness diagnostic 2026',
        'IMPACT board governance index assessment',
        'BRIDGE cross-border leadership assessment',
        'FORGE sales leadership strength matching',
      ],
    },
  },

  // ── Login / Signup / Reset — noindex, sensible titles
  {
    pattern: '/login',
    meta: {
      title: 'Log in | LYC Intelligence',
      description: 'Sign in to LYC Intelligence to access diagnostics, NEXUS, and your matched leaders.',
      noindex: true,
      keywords: [
        'LYC Intelligence sign in executive',
        'leadership assessment dashboard login',
        'NEXUS chat portal access',
      ],
    },
  },
  {
    pattern: '/signup',
    meta: {
      title: 'Create account | LYC Intelligence',
      description: 'Create a LYC Intelligence account. 45-second signup, no card until you run your first paid diagnostic.',
      noindex: true,
      keywords: [
        'LYC Intelligence executive account register',
        'leadership assessment free sign up APAC',
        'NEXUS complimentary account create',
      ],
    },
  },
  {
    pattern: '/reset-password',
    meta: {
      title: 'Reset password | LYC Intelligence',
      description: 'Reset your LYC Intelligence password. Secure email link sent in under 30 seconds.',
      noindex: true,
      keywords: [
        'LYC Intelligence password recovery executive',
        'leadership assessment account reset APAC',
        'executive diagnostic portal forgot password',
      ],
    },
  },

  // ── PORTAL SURFACES — noindex: they require auth + render per-role
  {
    pattern: '/member',
    meta: {
      title: 'Leader Portal | LYC Intelligence',
      description: 'Your executive dashboard: saved diagnostics, matched mandates, NEXUS history, and referral miles.',
      noindex: true,
      keywords: [
        'executive member dashboard LYC assessment results',
        'leader portal NEXUS chat history diagnostics',
        'executive matched mandates referral miles',
      ],
    },
  },
  {
    pattern: '/consultant',
    meta: {
      title: 'Consultant Portal | LYC Intelligence',
      description: 'Retained-search consultant workspace: mandates, candidate pipeline, TRIDENT matches, and client billing.',
      noindex: true,
      keywords: [
        'executive search consultant workspace mandate pipeline',
        'TRIDENT candidate scoring portal consultant',
        'LYC search firm consultant billing analytics',
      ],
    },
  },
  {
    pattern: '/client',
    meta: {
      title: 'Client Portal | LYC Intelligence',
      description: 'Client command centre — open mandates, shortlists, pipeline diagnostics, and organisation health.',
      noindex: true,
      keywords: [
        'executive search client portal mandate shortlist',
        'organisation health diagnostics enterprise client',
        'LYC enterprise client pipeline analytics dashboard',
      ],
    },
  },
  {
    pattern: '/candidate',
    meta: {
      title: 'Candidate Portal | LYC Intelligence',
      description: 'Candidate workspace: active mandates, NDA history, shortlist status, and assessment results.',
      noindex: true,
      keywords: [
        'executive candidate portal active mandates NDA',
        'candidate shortlist status assessment results',
        'LYC executive placement candidate dashboard',
      ],
    },
  },
  {
    pattern: '/admin',
    meta: {
      title: 'Admin | LYC Intelligence Platform Control',
      description: 'Internal LYC admin — diagnostics usage, user support, billing, and compliance.',
      noindex: true,
      keywords: [
        'LYC Intelligence admin diagnostic usage reporting',
        'platform admin user support billing compliance',
        'internal LYC admin portal operations dashboard',
      ],
    },
  },

  // ── Referral / share / docs — small long-tail SEO assets
  {
    pattern: '/referral',
    meta: {
      title: 'Refer Leaders, Earn Miles | LYC Intelligence',
      description:
        'Refer China operating leaders to LYC Intelligence and earn miles redeemable against diagnostics, TRIDENT matches, and Council membership.',
      canonical: u('/referral'),
      keywords: [
        'LYC referral miles redeem diagnostics TRIDENT',
        'executive refer-a-leader program APAC',
        'China operating leader referral reward miles',
        'Council membership referral discount LYC',
        'earn assessment credits executive referrals',
      ],
    },
  },
  {
    pattern: '/share',
    meta: {
      title: 'Shared Insight Card | LYC Intelligence',
      description: 'A shared insight, assessment result, or leader card from LYC Intelligence. Log in to see the full context.',
      noindex: true,
      keywords: [
        'LYC shared insight card executive assessment',
        'shared leader card LYC Intelligence dashboard',
        'executive assessment result share link APAC',
      ],
    },
  },
];

/**
 * Match a raw pathname (e.g. /assessment/cpi/run or /member/123/settings) to
 * the most specific registered pattern by longest prefix match.
 */
export function resolveMetadata(pathname: string): PageMetadata {
  let best: PageMetadata = DEFAULT_META;
  let bestLen = -1;
  for (const { pattern, meta } of PAGE_METADATA_REGISTRY) {
    if (pathname === pattern || pathname.startsWith(pattern + '/') || pathname.startsWith(pattern + '?')) {
      if (pattern.length > bestLen) {
        best = meta;
        bestLen = pattern.length;
      }
    }
  }
  if (!best.canonical && !best.noindex) {
    best = { ...best, canonical: u(pathname.split('?')[0]) };
  }
  return best;
}
