/**
 * Phase 17 / P1-1 — Per-page SEO / OG / Twitter card metadata for the 140+ route set.
 *
 * Strategy:
 *   - One central REGISTRY keyed by route pattern (not static 1:1, because some
 *     routes are parameterised — e.g. /candidate/:id resolves the same meta as
 *     the candidate landing until we hydrate on fetch).
 *   - Patterns are matched by a simple startsWith test; if a route isn't in the
 *     table we fall back to a DEFAULT containing Lyc brand defaults.
 *   - This file only defines SHAPES; the application of <title/>, <meta/>, and
 *     <link rel="canonical"/> is done by <SeoHelmet /> + usePageMetadata()
 *     in src/hooks/usePageMetadata.ts (called in App.tsx on every route change).
 *
 * Notes on scope:
 *   Portal interiors (member/:id, consultant/:id, client/:id, admin/:id) are
 *   marked with `noindex:true` because they are authenticated surfaces —
 *   Google would never crawl them. Only /assessment/* landing and the
 *   marketing root routes are indexed.
 */

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

const BASE_URL = 'https://lyc-intelligence.app';

export const DEFAULT_META: PageMetadata = {
  title: 'LYC Intelligence — Leadership Intelligence for China Operating Leaders',
  description:
    'LYC Intelligence delivers data-driven leadership diagnostics, mobility mapping, and executive search intelligence — purpose-built for leaders operating in China.',
  ogType: 'website',
  ogImage: `${BASE_URL}/og-image.png`,
  keywords: [
    'leadership intelligence',
    'China executives',
    'leadership diagnostic',
    'executive search China',
    'career mobility',
    'LYC',
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
      keywords: [...DEFAULT_META.keywords!, 'NEXUS', 'CPI', 'SHIFT', 'TRIDENT'],
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
  // ── NEXUS
  {
    pattern: '/nexus/chat',
    meta: {
      title: 'NEXUS | LYC Advisory Copilot for China Operating Leaders',
      description:
        'NEXUS is LYC Intelligence\'s always-on advisory copilot. Ask for market context, executive profiles, and directional guidance — grounded in our data lake.',
      canonical: u('/nexus/chat'),
      noindex: true,
      keywords: [...DEFAULT_META.keywords!, 'advisory copilot', 'AI chat', 'market intelligence'],
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
      keywords: [...DEFAULT_META.keywords!, 'pricing', 'tiers', 'subscription'],
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
      keywords: [...DEFAULT_META.keywords!, 'CPI', 'pipeline index', 'leadership benchmark'],
    },
  },
  {
    pattern: '/assessment/shift',
    meta: {
      title: 'SHIFT Mobility | Career Transition Radar for China Leaders',
      description:
        'SHIFT maps your adjacent career moves across industry, function, and stage — with 5 ranked paths and LYC likelihood scores. 12 minutes, data-driven.',
      canonical: u('/assessment/shift'),
      keywords: [...DEFAULT_META.keywords!, 'SHIFT', 'career mobility', 'career transition'],
    },
  },
  {
    pattern: '/assessment/exec-scope',
    meta: {
      title: 'Exec Scope Assessment | Span of Control & P&L Fit',
      description:
        'Exec Scope evaluates your span-of-control, P&L ownership, and strategic scope to surface the right next executive role for you in China.',
      canonical: u('/assessment/exec-scope'),
      keywords: [...DEFAULT_META.keywords!, 'exec scope', 'P&L', 'span of control'],
    },
  },
  {
    pattern: '/assessment/cross-border',
    meta: {
      title: 'Cross-Border Leader Readiness Assessment | LYC',
      description:
        'How ready are you for a cross-border executive post spanning China + HQ? Score yourself against 248 LYC cross-border placements since 2019.',
      canonical: u('/assessment/cross-border'),
      keywords: [...DEFAULT_META.keywords!, 'cross-border', 'international', 'HQ'],
    },
  },
  {
    pattern: '/assessment/geo-fit',
    meta: {
      title: 'Geo-Fit Assessment | Best China Market Geography for Your Career',
      description:
        'Geo-Fit compares your profile across Shanghai, Beijing, Shenzhen, Greater Bay Area and regional hubs — weighted by your function and industry.',
      canonical: u('/assessment/geo-fit'),
      keywords: [...DEFAULT_META.keywords!, 'geo fit', 'Shanghai', 'Shenzhen', 'Beijing'],
    },
  },
  {
    pattern: '/assessment/negotiation',
    meta: {
      title: 'Executive Compensation Negotiation Diagnostic',
      description:
        '14 questions to pressure-test your total comp package (base, long-term, retention, sign-on). Output: negotiation leverage sheet + LYC market reference.',
      canonical: u('/assessment/negotiation'),
      keywords: [...DEFAULT_META.keywords!, 'compensation', 'negotiation', 'salary'],
    },
  },
  {
    pattern: '/assessment/org-fit',
    meta: {
      title: 'Org Culture Fit Assessment | China Operating Leaders',
      description:
        'Rate your cultural preferences and match against 340 China employer archetypes in the LYC library. Output: 5 best-culture target companies.',
      canonical: u('/assessment/org-fit'),
      keywords: [...DEFAULT_META.keywords!, 'culture fit', 'org fit', 'employer brand'],
    },
  },
  {
    pattern: '/assessment/fp-radar',
    meta: {
      title: 'Founder Partner Radar | Cofounder & Investor Fit',
      description:
        'FP-Radar scores founder-partner alignment across 8 vectors for operators considering founder roles or venture partner paths in China tech.',
      canonical: u('/assessment/fp-radar'),
      keywords: [...DEFAULT_META.keywords!, 'founder', 'cofounder', 'venture partner'],
    },
  },
  {
    pattern: '/assessment/board-readiness',
    meta: {
      title: 'Board Readiness Assessment | Independent Director Path',
      description:
        'The Board Readiness Assessment surfaces your gaps vs. 160+ LYC independent director mandates — and a 90-day action plan to close them.',
      canonical: u('/assessment/board-readiness'),
      keywords: [...DEFAULT_META.keywords!, 'board readiness', 'independent director', 'NED'],
    },
  },
  {
    pattern: '/assessment/personal-governance',
    meta: {
      title: 'Personal Governance | Executive Operating System',
      description:
        'Personal Governance benchmarks your calendar, decisions, inbox, and energy system against 120 LYC Council-level executives in China.',
      canonical: u('/assessment/personal-governance'),
      keywords: [...DEFAULT_META.keywords!, 'personal governance', 'executive productivity'],
    },
  },
  {
    pattern: '/assessment',
    meta: {
      title: 'All 11 Leadership Diagnostics | LYC Intelligence',
      description:
        'Every LYC diagnostic in one place. CPI, SHIFT, Comp Negotiation, Board Readiness and 8 more — start in under 60 seconds, pay only for the ones you run.',
      canonical: u('/assessment'),
      keywords: [...DEFAULT_META.keywords!, 'diagnostics', 'assessment list'],
    },
  },

  // ── Login / Signup / Reset — noindex, sensible titles
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
    pattern: '/member',
    meta: {
      title: 'Leader Portal | LYC Intelligence',
      description: 'Your executive dashboard: saved diagnostics, matched mandates, NEXUS history, and referral credits.',
      noindex: true,
    },
  },
  {
    pattern: '/consultant',
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

  // ── Referral / share / docs — small long-tail SEO assets
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
  // Canonical defaults to BASE_URL + exact path if the rule didn't set one.
  if (!best.canonical && !best.noindex) {
    best = { ...best, canonical: u(pathname.split('?')[0]) };
  }
  return best;
}
