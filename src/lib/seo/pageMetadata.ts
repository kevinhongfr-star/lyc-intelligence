/**
 * Phase 1 / #1287 — Centralized page metadata registry.
 *
 * Single source of truth for SEO metadata on all public (marketing) pages.
 * Used by usePageMetadata() (global, called in App.tsx) and <SEO /> component
 * (per-route override, used by assessment landing pages).
 *
 * Sets title, meta description, OG, Twitter Card, canonical, robots, and
 * JSON-LD structured data.
 *
 * Brand rules enforced:
 *   - No "free" in any string — entry tier is "Executive Introduction"
 *   - "Complimentary assessment" for the no-cost assessment
 */
export const SITE_URL = 'https://lyc-intelligence.app';
export const SITE_NAME = 'LYC Intelligence';
export const SITE_TAGLINE = 'Know where you stand. Know where to go.';

// ── Types ────────────────────────────────────────────────────────────

export interface PageMetadata {
  title: string;
  description: string;
  canonical?: string;
  /** noindex hides the page from search engines (authenticated portals) */
  noindex?: boolean;
  ogType?: 'website' | 'article' | 'profile' | 'product';
  ogImage?: string;
  keywords?: string[];
  /** JSON-LD structured data object, or null/undefined for none */
  structuredData?: object | null;
}

/** Assessment-specific metadata (Product schema) */
export interface AssessmentMeta extends PageMetadata {
  code: string;
  instrumentName: string;
  milesCost: number;
}

// Backward-compat alias for components that import PageMeta
export type PageMeta = PageMetadata;

// ── Helpers ──────────────────────────────────────────────────────────

/** Build dynamic OG image URL from a title (and optional subtitle) */
export function ogImageUrl(title: string, subtitle?: string): string {
  const params = new URLSearchParams({ title });
  if (subtitle) params.set('subtitle', subtitle);
  return `${SITE_URL}/api/og?${params.toString()}`;
}

const u = (p: string) => `${SITE_URL}${p}`;

// ── Structured data (JSON-LD) ────────────────────────────────────────

const ORG_SCHEMA = {
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
    'AI Coaching',
    'Talent Matching',
  ],
};

const NEXUS_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'NEXUS AI',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Complimentary Executive Introduction tier',
  },
  publisher: {
    '@type': 'Organization',
    name: 'LYC Intelligence',
    url: SITE_URL,
  },
};

const B2B_SCHEMA = {
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
};

const ASSESSMENT_CATALOG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'LYC Leadership Diagnostic Catalog',
  numberOfItems: 12,
  itemListElement: [
    'cpi', 'shift', 'prism', 'spark', 'leap', 'quest',
    'impact', 'forge', 'drive', 'coach', 'bridge', 'mosaic',
  ].map((code, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${SITE_URL}/assessment/${code}`,
  })),
};

// ── Default metadata ─────────────────────────────────────────────────

export const DEFAULT_META: PageMetadata = {
  title: 'LYC Intelligence — Leadership Intelligence for China Operating Leaders',
  description:
    'LYC Intelligence delivers data-driven leadership diagnostics, mobility mapping, and executive search intelligence — purpose-built for leaders operating in China.',
  ogType: 'website',
  ogImage: `${SITE_URL}/og-image.jpg`,
  keywords: [
    'leadership intelligence',
    'China executives',
    'leadership diagnostic',
    'executive search China',
    'career mobility',
    'LYC',
  ],
  structuredData: ORG_SCHEMA,
};

// ── Registry ─────────────────────────────────────────────────────────

/** Ordered by specificity — longer, more specific prefixes match first. */
export const PAGE_METADATA_REGISTRY: { pattern: string; meta: PageMetadata }[] = [
  // ── Marketing root
  {
    pattern: '/',
    meta: {
      title: 'LYC Intelligence — Leadership Intelligence for China Operating Leaders',
      description:
        'The intelligence layer for China operating leaders. NEXUS advisory copilot, CPI & SHIFT diagnostics, and TRIDENT leader matching — in one seat.',
      canonical: u('/'),
      keywords: [...DEFAULT_META.keywords!, 'NEXUS', 'CPI', 'SHIFT', 'TRIDENT'],
      structuredData: ORG_SCHEMA,
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
      keywords: [...DEFAULT_META.keywords!, 'about us', 'founder', 'team'],
    },
  },
  // ── NEXUS (public marketing page — indexable)
  {
    pattern: '/nexus/chat',
    meta: {
      title: 'NEXUS | LYC Advisory Copilot for China Operating Leaders',
      description:
        'NEXUS is LYC Intelligence\'s always-on advisory copilot. Ask for market context, executive profiles, and directional guidance — grounded in our data lake.',
      canonical: u('/nexus/chat'),
      keywords: [...DEFAULT_META.keywords!, 'advisory copilot', 'AI chat', 'market intelligence'],
      structuredData: NEXUS_SCHEMA,
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
      keywords: [...DEFAULT_META.keywords!, 'executive search', 'client portal', 'consultant portal'],
      structuredData: B2B_SCHEMA,
    },
  },
  // ── Pricing (brand: "Executive Introduction" not "Explorer", never "free")
  {
    pattern: '/pricing',
    meta: {
      title: 'Pricing | LYC Intelligence — 5 Tiers from Executive Introduction to Council',
      description:
        'Five subscription tiers: Executive Introduction (complimentary), Starter, Pro, Executive, and Council. Assessment pricing from 99 to 199 miles. USD and CNY.',
      canonical: u('/pricing'),
      keywords: [...DEFAULT_META.keywords!, 'pricing', 'tiers', 'subscription', 'miles'],
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
      keywords: [...DEFAULT_META.keywords!, 'contact', 'support', 'sales'],
    },
  },
  // ── Match
  {
    pattern: '/match',
    meta: {
      title: 'Match Analysis — Executive-Firm Alignment | LYC Intelligence',
      description:
        'AI-powered match analysis between executives and organizations. Cultural fit, competency alignment, and mandate readiness scoring. Built on 20 years of APAC placement data.',
      canonical: u('/match'),
      keywords: [...DEFAULT_META.keywords!, 'match analysis', 'alignment', 'cultural fit'],
    },
  },
  // ── DEX
  {
    pattern: '/dex',
    meta: {
      title: 'DEX — Diagnostic Explorer | LYC Intelligence',
      description:
        'Browse all 12 LYC leadership diagnostics in one explorer. Compare instruments, dimensions, and pricing before you commit.',
      canonical: u('/dex'),
      keywords: [...DEFAULT_META.keywords!, 'DEX', 'diagnostic explorer', 'catalog'],
    },
  },

  // ─────────────────────────────────────────────────────────────
  // 12 ASSESSMENT LANDINGS (each is its own SEO asset)
  // Real route codes: cpi, shift, prism, spark, leap, quest, impact,
  // forge, drive, coach, bridge, mosaic
  // ─────────────────────────────────────────────────────────────
  {
    pattern: '/assessment/cpi',
    meta: {
      title: 'CPI Diagnostic | China Leadership Pipeline Index — LYC',
      description:
        'The CPI Diagnostic benchmarks your leadership readiness for China market roles across 4 axes. 15 minutes, 200+ data points, actionable report.',
      canonical: u('/assessment/cpi'),
      keywords: [...DEFAULT_META.keywords!, 'CPI', 'pipeline index', 'leadership benchmark'],
    },
  },
  {
    pattern: '/assessment/shift',
    meta: {
      title: 'SHIFT Mobility | Career Transition Radar for China Leaders — LYC',
      description:
        'SHIFT maps your adjacent career moves across industry, function, and stage — with 5 ranked paths and LYC likelihood scores. 12 minutes, data-driven.',
      canonical: u('/assessment/shift'),
      keywords: [...DEFAULT_META.keywords!, 'SHIFT', 'career mobility', 'career transition'],
    },
  },
  {
    pattern: '/assessment/prism',
    meta: {
      title: 'PRISM Career & Professional Branding | LYC Intelligence',
      description:
        'PRISM maps your professional brand across 6 dimensions — visibility, narrative, network, differentiation, digital presence, and market positioning.',
      canonical: u('/assessment/prism'),
      keywords: [...DEFAULT_META.keywords!, 'PRISM', 'career branding', 'professional brand'],
    },
  },
  {
    pattern: '/assessment/spark',
    meta: {
      title: 'SPARK AI Leadership Readiness | LYC Intelligence',
      description:
        'SPARK evaluates your readiness to lead in an AI-native organisation. 8 dimensions, 40 questions, actionable development roadmap.',
      canonical: u('/assessment/spark'),
      keywords: [...DEFAULT_META.keywords!, 'SPARK', 'AI leadership', 'readiness'],
    },
  },
  {
    pattern: '/assessment/leap',
    meta: {
      title: 'LEAP Leadership Excellence Assessment | LYC Intelligence',
      description:
        'LEAP benchmarks your leadership excellence across 8 competencies. Identify strengths, close gaps, and build your 90-day development plan.',
      canonical: u('/assessment/leap'),
      keywords: [...DEFAULT_META.keywords!, 'LEAP', 'leadership excellence', 'competency'],
    },
  },
  {
    pattern: '/assessment/quest',
    meta: {
      title: 'QUEST Strategic Thinking Diagnostic | LYC Intelligence',
      description:
        'QUEST assesses your strategic thinking and decision-making patterns. 6 dimensions, scenario-based questions, and a strategic agility profile.',
      canonical: u('/assessment/quest'),
      keywords: [...DEFAULT_META.keywords!, 'QUEST', 'strategic thinking', 'decision making'],
    },
  },
  {
    pattern: '/assessment/impact',
    meta: {
      title: 'IMPACT Influence & Stakeholder Diagnostic | LYC Intelligence',
      description:
        'IMPACT measures your influence patterns and stakeholder management capability. 7 dimensions, 360-style self-assessment, actionable report.',
      canonical: u('/assessment/impact'),
      keywords: [...DEFAULT_META.keywords!, 'IMPACT', 'influence', 'stakeholder management'],
    },
  },
  {
    pattern: '/assessment/forge',
    meta: {
      title: 'FORGE Sales Excellence Diagnostic | LYC Intelligence',
      description:
        'FORGE benchmarks your sales leadership across 8 dimensions — pipeline, coaching, forecasting, strategy, and team building.',
      canonical: u('/assessment/forge'),
      keywords: [...DEFAULT_META.keywords!, 'FORGE', 'sales excellence', 'sales leadership'],
    },
  },
  {
    pattern: '/assessment/drive',
    meta: {
      title: 'DRIVE Execution Capability Framework | LYC Intelligence',
      description:
        'DRIVE assesses your execution capability across 8 dimensions. From strategy to delivery, benchmark your operational leadership.',
      canonical: u('/assessment/drive'),
      keywords: [...DEFAULT_META.keywords!, 'DRIVE', 'execution', 'operational leadership'],
    },
  },
  {
    pattern: '/assessment/coach',
    meta: {
      title: 'COACH Coaching Effectiveness Diagnostic | LYC Intelligence',
      description:
        'COACH measures your coaching effectiveness across 6 dimensions. Identify your coaching archetype and build a development plan.',
      canonical: u('/assessment/coach'),
      keywords: [...DEFAULT_META.keywords!, 'COACH', 'coaching', 'mentoring'],
    },
  },
  {
    pattern: '/assessment/bridge',
    meta: {
      title: 'BRIDGE China Leadership Readiness | LYC Intelligence',
      description:
        'BRIDGE assesses your readiness to lead in China across cultural, strategic, and operational dimensions. 8 axes, scenario-based, data-driven.',
      canonical: u('/assessment/bridge'),
      keywords: [...DEFAULT_META.keywords!, 'BRIDGE', 'China leadership', 'cross-cultural'],
    },
  },
  {
    pattern: '/assessment/mosaic',
    meta: {
      title: 'MOSAIC Cultural Intelligence Diagnostic | LYC Intelligence',
      description:
        'MOSAIC measures your cultural intelligence across 6 dimensions. Built on 20 years of APAC cross-border placement data.',
      canonical: u('/assessment/mosaic'),
      keywords: [...DEFAULT_META.keywords!, 'MOSAIC', 'cultural intelligence', 'CQ'],
    },
  },
  // Assessment catalog root
  {
    pattern: '/assessment',
    meta: {
      title: '12 Leadership Diagnostics | LYC Intelligence',
      description:
        'Every LYC diagnostic in one place. CPI, SHIFT, PRISM, SPARK, and 8 more — start in under 60 seconds, pay only for the ones you run.',
      canonical: u('/assessment'),
      keywords: [...DEFAULT_META.keywords!, 'diagnostics', 'assessment list', 'catalog'],
      structuredData: ASSESSMENT_CATALOG_SCHEMA,
    },
  },

  // ── Legal pages
  {
    pattern: '/terms',
    meta: {
      title: 'Terms of Service | LYC Intelligence',
      description:
        'Terms governing your use of the LYC Intelligence platform, including assessment usage, NEXUS AI interactions, subscription terms, and data processing agreements.',
      canonical: u('/terms'),
    },
  },
  {
    pattern: '/privacy',
    meta: {
      title: 'Privacy Policy | LYC Intelligence',
      description:
        'How LYC Intelligence collects, uses, and protects your data. GDPR and PIPL compliant. Third-party processors: DeepSeek, Supabase, Stripe.',
      canonical: u('/privacy'),
    },
  },
  {
    pattern: '/cookies',
    meta: {
      title: 'Cookie Policy | LYC Intelligence',
      description:
        'Cookie usage on the LYC Intelligence platform. Essential, analytics, and marketing cookies explained. Manage your consent preferences at any time.',
      canonical: u('/cookies'),
    },
  },

  // ── Login / Signup / Reset — noindex
  {
    pattern: '/login',
    meta: {
      title: 'Log in | LYC Intelligence',
      description: 'Sign in to LYC Intelligence to access diagnostics, NEXUS, and your matched leaders.',
      noindex: true,
    },
  },
  {
    pattern: '/signup',
    meta: {
      title: 'Create account | LYC Intelligence',
      description: 'Create a LYC Intelligence account. 45-second signup, no card until you run your first paid diagnostic.',
      noindex: true,
    },
  },
  {
    pattern: '/reset-password',
    meta: {
      title: 'Reset password | LYC Intelligence',
      description: 'Reset your LYC Intelligence password. Secure email link sent in under 30 seconds.',
      noindex: true,
    },
  },

  // ── PORTAL SURFACES — noindex: they require auth + render per-role
  {
    pattern: '/app',
    meta: {
      title: 'Leader Portal | LYC Intelligence',
      description: 'Your executive dashboard: saved diagnostics, matched mandates, NEXUS history, and referral credits.',
      noindex: true,
    },
  },
  {
    pattern: '/portal',
    meta: {
      title: 'Consultant Portal | LYC Intelligence',
      description: 'Retained-search consultant workspace: mandates, candidate pipeline, TRIDENT matches, and client billing.',
      noindex: true,
    },
  },
  {
    pattern: '/client',
    meta: {
      title: 'Client Portal | LYC Intelligence',
      description: 'Client command centre — open mandates, shortlists, pipeline diagnostics, and organisation health.',
      noindex: true,
    },
  },
  {
    pattern: '/candidate',
    meta: {
      title: 'Candidate Portal | LYC Intelligence',
      description: 'Candidate workspace: active mandates, NDA history, shortlist status, and assessment results.',
      noindex: true,
    },
  },
  {
    pattern: '/admin',
    meta: {
      title: 'Admin | LYC Intelligence Platform Control',
      description: 'Internal LYC admin — diagnostics usage, user support, billing, and compliance.',
      noindex: true,
    },
  },

  // ── Referral / share — small long-tail SEO assets
  {
    pattern: '/referral',
    meta: {
      title: 'Refer Leaders, Earn Miles | LYC Intelligence',
      description:
        'Refer China operating leaders to LYC Intelligence and earn miles redeemable against diagnostics, TRIDENT matches, and Council membership.',
      canonical: u('/referral'),
      keywords: [...DEFAULT_META.keywords!, 'referral', 'miles', 'refer-a-leader'],
    },
  },
  {
    pattern: '/share',
    meta: {
      title: 'Shared Insight Card | LYC Intelligence',
      description: 'A shared insight, assessment result, or leader card from LYC Intelligence. Log in to see the full context.',
      noindex: true,
    },
  },
];

// ── Assessment metadata factory ──────────────────────────────────────

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
  const description = `${tagline || name}. ${durationMinutes} min · ${totalQuestions} questions · ${milesCost} miles. Validated against 20 years of APAC placement data. Archetype classification and development roadmap.`;

  return {
    code,
    instrumentName: name,
    milesCost,
    title,
    description,
    canonical: u(`/assessment/${code.toLowerCase()}`),
    ogType: 'product',
    ogImage: ogImageUrl(b2cName, `${code} · ${milesCost} miles`),
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
        priceCurrency: 'MILES',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/assessment/${code.toLowerCase()}`,
      },
    },
  };
}

// ── Resolver ─────────────────────────────────────────────────────────

/**
 * Match a raw pathname (e.g. /assessment/cpi/run or /app/123/settings) to
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
  // Canonical defaults to SITE_URL + exact path if the rule didn't set one.
  if (!best.canonical && !best.noindex) {
    best = { ...best, canonical: u(pathname.split('?')[0]) };
  }
  return best;
}

// Backward-compat: PAGE_META lookup (used by <SEO> component fallback)
export const PAGE_META: Record<string, PageMetadata> = {
  landing: PAGE_METADATA_REGISTRY[0].meta,
  pricing: PAGE_METADATA_REGISTRY.find((r) => r.pattern === '/pricing')!.meta,
  nexus: PAGE_METADATA_REGISTRY.find((r) => r.pattern === '/nexus/chat')!.meta,
  b2b: PAGE_METADATA_REGISTRY.find((r) => r.pattern === '/b2b')!.meta,
  match: PAGE_METADATA_REGISTRY.find((r) => r.pattern === '/match')!.meta,
  assessments: PAGE_METADATA_REGISTRY.find((r) => r.pattern === '/assessment')!.meta,
  terms: PAGE_METADATA_REGISTRY.find((r) => r.pattern === '/terms')!.meta,
  privacy: PAGE_METADATA_REGISTRY.find((r) => r.pattern === '/privacy')!.meta,
  cookies: PAGE_METADATA_REGISTRY.find((r) => r.pattern === '/cookies')!.meta,
};
