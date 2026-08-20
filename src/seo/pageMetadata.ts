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
    title: 'LYC Intelligence — Executive Intelligence',
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
        'Executive intelligence — advisory, assessments, and talent search for high-achieving leaders.',
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
      'Mandates, candidate scoring, and organizational intelligence for search firms and enterprises. Candidate pipeline, leader scoring, organizational analytics. 500+ placements across 47 markets.',
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
    // V5.2 Cutover: canonical SEO path is /nexus/lenses/[code] (the new marketing
    // landing). Old /assessments/[code] and /assessment/[code] URLs both 301
    // here via vercel.json redirects.
    path: `/nexus/lenses/${code.toLowerCase()}`,
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
        url: `${SITE_URL}/nexus/lenses/${code.toLowerCase()}`,
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
        'The intelligence layer for China operating leaders. NEXUS advisory copilot, CPI diagnostics, and leader matching — in one seat.',
      canonical: u('/'),
      keywords: [
        'LYC CPI flagship assessment APAC',
        'NEXUS executive thinking partner',
        'China-APAC leadership benchmark 2026',
        'executive career positioning C-suite',
        'LYC leader matching algorithm',
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
        'LYC candidate scoring China search firms',
        'organisational diagnostics enterprise',
        'executive mandate intelligence dashboard',
        'retained search candidate matching tool',
        'APAC talent mapping analytics',
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
  // V5.2 Cutover: canonical SEO URLs are /nexus/lenses/[code].
  // Old /assessment/[code] and /assessments/[code] URLs continue to
  // work as 301 redirects in vercel.json and keep the legacy meta
  // entries listed here so any crawler landing via a legacy URL
  // still gets a canonical hint (then follows the 301).
  // ─────────────────────────────────────────────────────────────
  // ── /nexus/lenses/* (canonical new SEO assets for V3.0)
  {
    pattern: '/nexus/lenses/cpi',
    meta: {
      title: 'CPI Diagnostic | China Leadership Pipeline Index',
      description:
        'The CPI Diagnostic benchmarks your leadership readiness for China market roles across 4 axes. 15 minutes, 200+ data points, actionable report.',
      canonical: u('/nexus/lenses/cpi'),
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
    pattern: '/nexus/lenses/prism',
    meta: {
      title: 'PRISM — Professional Branding Assessment | LYC Intelligence',
      description:
        'PRISM maps how the world sees your professional brand across positioning, influence, and executive presence. Validated against 500+ APAC placements.',
      canonical: u('/nexus/lenses/prism'),
      keywords: [
        'PRISM executive branding assessment APAC',
        'professional positioning diagnostic C-suite',
        'executive presence scorecard China',
      ],
    },
  },
  {
    pattern: '/nexus/lenses/spark',
    meta: {
      title: 'SPARK — AI Leadership Readiness | LYC Intelligence',
      description:
        'SPARK benchmarks your AI leadership readiness: strategy fluency, change management, and governance maturity. 15-minute diagnostic.',
      canonical: u('/nexus/lenses/spark'),
      keywords: [
        'SPARK AI readiness diagnostic 2026',
        'AI leadership benchmark executive',
        'China AI governance readiness assessment',
      ],
    },
  },
  {
    pattern: '/nexus/lenses/leap',
    meta: {
      title: 'LEAP — Competitive Positioning | LYC Intelligence',
      description:
        'LEAP maps your adjacent career moves across industry, function, and stage — 5 ranked paths with likelihood scores. 12 minutes, data-driven.',
      canonical: u('/nexus/lenses/leap'),
      keywords: [
        'LEAP leadership transition profile China executive',
        'career mobility assessment APAC executive',
      ],
    },
  },
  {
    pattern: '/nexus/lenses/impact',
    meta: {
      title: 'IMPACT — Board & Stakeholder Impact | LYC Intelligence',
      description:
        'IMPACT measures your influence at the highest levels: boardroom credibility, stakeholder communication, and governance fluency.',
      canonical: u('/nexus/lenses/impact'),
      keywords: [
        'IMPACT board governance index assessment',
        'executive stakeholder influence diagnostic',
      ],
    },
  },
  {
    pattern: '/nexus/lenses/quest',
    meta: {
      title: 'QUEST — Strategic Market Positioning | LYC Intelligence',
      description:
        'QUEST benchmarks strategic market positioning: where you stand and where to play. Market segment fit, adjacency scoring, and 18-month roadmap.',
      canonical: u('/nexus/lenses/quest'),
      keywords: [
        'strategic market positioning assessment executive',
        'board readiness assessment C-suite',
      ],
    },
  },
  {
    pattern: '/nexus/lenses/bridge',
    meta: {
      title: 'BRIDGE — Cross-Cultural Relational Intelligence | LYC Intelligence',
      description:
        'BRIDGE measures cross-cultural relational intelligence for cross-border mandates. Built on 20 years of APAC placement data.',
      canonical: u('/nexus/lenses/bridge'),
      keywords: [
        'BRIDGE cross-border leadership assessment',
        'cross-cultural executive intelligence China APAC',
      ],
    },
  },
  {
    pattern: '/nexus/lenses/drive',
    meta: {
      title: 'DRIVE — Motivational Alignment | LYC Intelligence',
      description:
        'DRIVE maps what fuels you and what fades you. Motivational archetypes, demotivator mapping, and role-fit scoring.',
      canonical: u('/nexus/lenses/drive'),
      keywords: [
        'DRIVE motivational alignment diagnostic executive',
        'intrinsic vs extrinsic motivation assessment APAC',
      ],
    },
  },
  {
    pattern: '/nexus/lenses/forge',
    meta: {
      title: 'FORGE — Sales Excellence Capability | LYC Intelligence',
      description:
        'FORGE builds the sales leader your market needs. Pipeline discipline, deal strategy, and team enablement scoring across 6 dimensions.',
      canonical: u('/nexus/lenses/forge'),
      keywords: [
        'FORGE sales leadership strength matching',
        'revenue leader assessment China market',
      ],
    },
  },
  {
    pattern: '/nexus/lenses/coach',
    meta: {
      title: 'COACH — Executive Coaching Fit | LYC Intelligence',
      description:
        'COACH calibrates executive coaching fit: chemistry, focus area match, and 1–3 recommended coaches from the LYC network.',
      canonical: u('/nexus/lenses/coach'),
      keywords: [
        'executive coaching fit assessment APAC',
        'LYC coach matching diagnostic',
      ],
    },
  },
  {
    pattern: '/nexus/lenses/mosaic',
    meta: {
      title: 'MOSAIC — Institutional Trust & Relationship Velocity | LYC Intelligence',
      description:
        'MOSAIC accelerates partnership velocity: institutional trust levers, relationship capital map, and 90-day activation plan.',
      canonical: u('/nexus/lenses/mosaic'),
      keywords: [
        'MOSAIC institutional trust diagnostic executive',
        'relationship velocity assessment China',
      ],
    },
  },

  // ── /nexus/lenses (library — replaces /assessments for B2C user surface)
  {
    pattern: '/nexus/lenses',
    meta: {
      title: 'Diagnostic Lenses Library | LYC Intelligence',
      description:
        'Eleven leadership diagnostics in one place. PRISM, CPI, SPARK, LEAP, IMPACT, BRIDGE, MOSAIC, DRIVE, QUEST, COACH, FORGE — start in under 60 seconds.',
      canonical: u('/nexus/lenses'),
      keywords: [
        'PRISM SPARK FORGE executive assessment APAC',
        'CPI flagship assessment LYC',
        '11 leadership diagnostic lenses',
      ],
    },
  },
  // ── /nexus (product landing — "what is NEXUS?")
  {
    pattern: '/nexus',
    meta: {
      title: 'NEXUS — Your Executive Advisor | LYC Intelligence',
      description:
        'NEXUS is your executive advisor. It knows all 11 leadership diagnostics, interprets your results, and builds milestones. Complimentary entry tier.',
      canonical: u('/nexus'),
      keywords: [
        'NEXUS executive advisory copilot',
        'AI leadership advisor executive C-suite',
      ],
    },
  },

  // ── Legacy /assessment/* URLs (301 in vercel.json; meta kept as fallback)
  {
    pattern: '/assessment/cpi',
    meta: {
      title: 'CPI Diagnostic | China Leadership Pipeline Index',
      description:
        'The CPI Diagnostic benchmarks your leadership readiness for China market roles across 4 axes. 15 minutes, 200+ data points, actionable report.',
      canonical: u('/nexus/lenses/cpi'),
      keywords: [
        'CPI leadership assessment Singapore executive',
        'China C-suite positioning benchmark diagnostic',
      ],
    },
  },
  {
    pattern: '/assessment',
    meta: {
      title: '6 Leadership Assessments | LYC Intelligence',
      description:
        'Every LYC leadership assessment in one place. PRISM, SPARK, FORGE, BRIDGE, MOSAIC, DRIVE — start in under 60 seconds, get a personalised report.',
      canonical: u('/nexus/lenses'),
      keywords: [
        'PRISM SPARK FORGE executive assessment APAC',
        'leadership diagnostics library LYC',
      ],
    },
  },
  {
    pattern: '/assessments',
    meta: {
      title: '6 Leadership Assessments | LYC Intelligence',
      description:
        'Every LYC leadership assessment in one place. PRISM, SPARK, FORGE, BRIDGE, MOSAIC, DRIVE — start in under 60 seconds, get a personalised report.',
      canonical: u('/nexus/lenses'),
      keywords: [
        'PRISM SPARK FORGE executive assessment APAC',
        'leadership diagnostics library LYC',
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
      description: 'Retained-search consultant workspace: mandates, candidate pipeline, leader matches, and client billing.',
      noindex: true,
      keywords: [
        'executive search consultant workspace mandate pipeline',
        'LYC candidate scoring portal consultant',
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
      title: 'Admin | LYC Intelligence Control',
      description: 'Internal LYC admin — diagnostics usage, user support, billing, and compliance.',
      noindex: true,
      keywords: [
        'LYC Intelligence admin diagnostic usage reporting',
        'admin user support billing compliance',
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
        'Refer China operating leaders to LYC Intelligence and earn miles redeemable against diagnostics, leader matches, and Council membership.',
      canonical: u('/referral'),
      keywords: [
        'LYC referral miles redeem diagnostics leader matching',
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
