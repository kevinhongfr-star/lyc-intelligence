/**
 * Phase 17 / T01 (#1287) — Centralized page metadata registry.
 *
 * Single source of truth for SEO metadata on all public (marketing) pages.
 * Used by <SEO /> component to set title, meta, OG, Twitter, canonical, and
 * JSON-LD structured data.
 *
 * Title tags: 50-60 chars, keyword front-loaded.
 * Descriptions: 150-160 chars, unique per page.
 */

export const SITE_URL = 'https://lyc-intelligence.app';
export const SITE_NAME = 'LYC Intelligence';
export const SITE_TAGLINE = 'Know where you stand. Know where to go.';

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

// ── Static page metadata ────────────────────────────────────────────

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
        'Executive intelligence — advisory, diagnostics, and talent search for high-achieving leaders.',
      foundingDate: '2024',
      areaServed: 'Asia-Pacific',
      knowsAbout: [
        'Executive Search',
        'Leadership Diagnostic',
        'Career Advisory',
        'AI Coaching',
        'Talent Matching',
      ],
    },
  },

  pricing: {
    title: 'Pricing — LYC Intelligence | Miles & Subscriptions',
    description:
      'Five subscription tiers from Explorer to Council. Assessment pricing from 99 to 199 miles. USD and CNY. NEXUS AI coaching included. Start with a complimentary introduction.',
    path: '/pricing',
    type: 'website',
    structuredData: null,
  },

  nexus: {
    title: 'NEXUS AI — Executive Intelligence Coach | LYC',
    description:
      'NEXUS is your private AI leadership coach. Ask anything — career strategy, assessment insights, positioning. Powered by 11 validated instruments and APAC placement data.',
    path: '/nexus/chat',
    type: 'website',
    structuredData: {
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
    },
  },

  b2b: {
    title: 'For Firms — Executive Search & Match Analysis | LYC',
    description:
      'Mandates, candidate scoring, and organizational intelligence for search firms and enterprises. Pipeline management, candidate scoring, profile analytics. 500+ placements across 47 markets.',
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
    title: '11 Leadership Diagnostics — LYC Intelligence',
    description:
      'CPI, Career Core diagnostics, and advisory instruments. Validated against 20 years of APAC placement data. Archetype classification, dimension scorecards, and development roadmaps.',
    path: '/assessment',
    type: 'website',
    structuredData: null,
  },

  terms: {
    title: 'Terms of Service — LYC Intelligence',
    description:
      'Terms governing your use of LYC Intelligence, including diagnostic usage, NEXUS AI interactions, subscription terms, and data processing agreements.',
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
      'Cookie usage on LYC Intelligence. Essential, analytics, and marketing cookies explained. Manage your consent preferences at any time.',
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
  const title = `${b2cName} Diagnostic | LYC Intelligence`;
  const description = `${tagline || name}. ${durationMinutes} min · ${totalQuestions} questions · ${milesCost} miles. Validated against 20 years of APAC placement data. Archetype classification and development roadmap.`;

  return {
    code,
    instrumentName: name,
    milesCost,
    title,
    description,
    path: `/assessment/${code.toLowerCase()}`,
    type: 'product',
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
