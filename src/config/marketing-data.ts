/**
 * V7.0 — Marketing data config.
 *
 * Lens + tier data for the marketing surface. Maps existing ASSESSMENT_CATALOG
 * codes to V7.0 marketing copy (names, descriptions, durations, tier access).
 *
 * Lens data is pulled from ASSESSMENT_CATALOG for canonical codes + scoring
 * metadata. Marketing-specific fields (display name, description, duration
 * label, tier access label, pillar grouping) are defined here.
 */
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';

/* ── Pillar groupings (V7.0 spec) ── */
export type LensPillar = 'positioning' | 'leadership' | 'operating' | 'narrative';

export interface PillarGroup {
  id: LensPillar;
  label: string;
  lensCodes: string[];
}

export const PILLAR_GROUPS: PillarGroup[] = [
  {
    id: 'positioning',
    label: 'Positioning',
    lensCodes: ['PRISM', 'MOSAIC'],
  },
  {
    id: 'leadership',
    label: 'Leadership',
    lensCodes: ['LEAP', 'COACH', 'BRIDGE'],
  },
  {
    id: 'operating',
    label: 'Operating',
    lensCodes: ['DRIVE', 'SPARK', 'FORGE', 'QUEST'],
  },
  {
    id: 'narrative',
    label: 'Narrative',
    lensCodes: ['IMPACT', 'CPI'],
  },
];

/* ── Marketing lens display data ── */
export interface MarketingLens {
  code: string;
  name: string;
  description: string;
  durationLabel: string;
  tierLabel: string;
  pillar: LensPillar;
  complimentary: boolean;
  flagship: boolean;
  ctaLabel: string;
  ctaDestination: string;
}

const LENS_MARKETING_DATA: Record<string, Omit<MarketingLens, 'code' | 'pillar'>> = {
  PRISM: {
    name: 'Professional Brand Intelligence',
    description: 'How you show up — the gap between who you are and how you\u2019re perceived.',
    durationLabel: '15 min',
    tierLabel: 'Pro+',
    complimentary: false,
    flagship: false,
    ctaLabel: 'Member access',
    ctaDestination: '/membership',
  },
  MOSAIC: {
    name: 'Your full capability map',
    description: '11 dimensions of professional skill and where each one sits.',
    durationLabel: '20 min',
    tierLabel: 'Pro+',
    complimentary: false,
    flagship: false,
    ctaLabel: 'Member access',
    ctaDestination: '/membership',
  },
  LEAP: {
    name: 'Leadership Emergence & Agility Profile',
    description: 'Your natural leadership style and how it evolves under pressure.',
    durationLabel: '12 min',
    tierLabel: 'All tiers',
    complimentary: true,
    flagship: false,
    ctaLabel: 'Start',
    ctaDestination: '/nexus/lenses/leap/take',
  },
  COACH: {
    name: 'Coaching style assessment',
    description: 'How you develop people and where your approach creates blind spots.',
    durationLabel: '15 min',
    tierLabel: 'Pro+',
    complimentary: false,
    flagship: false,
    ctaLabel: 'Member access',
    ctaDestination: '/membership',
  },
  BRIDGE: {
    name: 'Stakeholder alignment',
    description: 'How you navigate between competing priorities and people with different agendas.',
    durationLabel: '18 min',
    tierLabel: 'Pro+',
    complimentary: false,
    flagship: false,
    ctaLabel: 'Member access',
    ctaDestination: '/membership',
  },
  DRIVE: {
    name: 'Execution & motivation',
    description: 'What drives you forward and what stops you in your tracks.',
    durationLabel: '15 min',
    tierLabel: 'Starter+',
    complimentary: false,
    flagship: false,
    ctaLabel: 'Member access',
    ctaDestination: '/membership',
  },
  SPARK: {
    name: 'Ideation & creativity',
    description: 'How you generate insight and what kind of problems you\u2019re naturally wired to solve.',
    durationLabel: '10 min',
    tierLabel: 'All tiers',
    complimentary: true,
    flagship: false,
    ctaLabel: 'Start',
    ctaDestination: '/nexus/lenses/spark/take',
  },
  FORGE: {
    name: 'Decision-making framework',
    description: 'How you make choices under uncertainty and where your judgment is strongest.',
    durationLabel: '15 min',
    tierLabel: 'Starter+',
    complimentary: false,
    flagship: false,
    ctaLabel: 'Member access',
    ctaDestination: '/membership',
  },
  QUEST: {
    name: 'Strategic thinking profile',
    description: 'How you approach complex problems and what your strategic style actually is.',
    durationLabel: '20 min',
    tierLabel: 'Pro+',
    complimentary: false,
    flagship: false,
    ctaLabel: 'Member access',
    ctaDestination: '/membership',
  },
  IMPACT: {
    name: 'Communication & influence',
    description: 'How you persuade, how you frame arguments, how you move people.',
    durationLabel: '15 min',
    tierLabel: 'Pro+',
    complimentary: false,
    flagship: false,
    ctaLabel: 'Member access',
    ctaDestination: '/membership',
  },
  CPI: {
    name: 'Council Performance Insight',
    description: 'The full picture. A private day with an LYC advisor — by introduction only.',
    durationLabel: 'Full day',
    tierLabel: 'Council only',
    complimentary: false,
    flagship: true,
    ctaLabel: 'Enquire',
    ctaDestination: '/membership#council',
  },
};

/* ── Build marketing lens array from catalog + marketing data ── */
export const MARKETING_LENSES: MarketingLens[] = PILLAR_GROUPS.flatMap((group) =>
  group.lensCodes.map((code) => {
    const marketing = LENS_MARKETING_DATA[code];
    const catalog = ASSESSMENT_CATALOG[code];
    return {
      code,
      name: marketing.name,
      description: marketing.description,
      durationLabel: marketing.durationLabel,
      tierLabel: marketing.tierLabel,
      pillar: group.id,
      complimentary: marketing.complimentary,
      flagship: marketing.flagship,
      ctaLabel: marketing.ctaLabel,
      ctaDestination: marketing.ctaDestination,
      // catalog provides canonical metadata (duration_minutes, total_questions, etc.)
      _catalog: catalog,
    } as MarketingLens;
  }),
);

/* ── How It Works pillar list (4 pillars with lens codes) ── */
export const HOW_PILLARS: Array<{ n: string; name: string; lenses: string }> = [
  { n: '01', name: 'Positioning', lenses: 'PRISM \u00b7 MOSAIC' },
  { n: '02', name: 'Leadership', lenses: 'LEAP \u00b7 COACH \u00b7 BRIDGE' },
  { n: '03', name: 'Operating', lenses: 'DRIVE \u00b7 SPARK \u00b7 FORGE \u00b7 QUEST' },
  { n: '04', name: 'Narrative', lenses: 'IMPACT \u00b7 BRIDGE \u00b7 CPI' },
];

/* ── Membership tiers (V7.0 spec) ── */
export interface MarketingTier {
  level: string;
  name: string;
  price: string;
  description: string;
  cta: string;
  ctaDestination: string;
  featured?: boolean;
}

export const MARKETING_TIERS: MarketingTier[] = [
  {
    level: 'Entry',
    name: 'Explorer',
    price: 'Complimentary',
    description:
      'Your first conversation. Get a baseline sense of how it works with two introductory lenses and a first conversation. No card required. No follow-up.',
    cta: 'Start here',
    ctaDestination: '/auth',
  },
  {
    level: 'Foundational',
    name: 'Starter',
    price: '$49 / month',
    description:
      'For leaders who want a steady thinking partner. Unlimited conversation, six lenses per month, milestones tracking. Enough to build a real picture over time.',
    cta: 'Start',
    ctaDestination: '/auth',
  },
  {
    level: 'Recommended',
    name: 'Pro',
    price: '$149 / month',
    description:
      'The full instrument set. All eleven lenses, unlimited. Two advisor debriefs per quarter. Document uploads. Multi-context memory. This is where most members land.',
    cta: 'Choose Pro',
    ctaDestination: '/auth',
    featured: true,
  },
  {
    level: 'Senior',
    name: 'Executive',
    price: '$399 / month',
    description:
      'For senior leaders who want the full picture. Council Performance Insight access. Monthly advisor debriefs. Dedicated workspaces. Priority human support.',
    cta: 'Go Executive',
    ctaDestination: '/auth',
  },
  {
    level: 'Private',
    name: 'Council',
    price: 'By introduction',
    description:
      'The full service. Private CPI day with an LYC partner. Weekly advisor sessions. Full access to the LYC network. Concierge onboarding. For the small group that needs the very best.',
    cta: 'Enquire',
    ctaDestination: '/membership#council',
  },
];

/* ── Home page tier summary (compact for home page grid) ── */
export const HOME_TIERS: Array<{
  level: string;
  name: string;
  price: string;
  features: string[];
  cta: string;
  featured?: boolean;
}> = [
  {
    level: 'Entry',
    name: 'Explorer',
    price: 'Complimentary',
    features: ['Conversation access', 'PRISM and LEAP lenses', 'Starter credits to begin'],
    cta: 'Start here',
  },
  {
    level: 'Foundational',
    name: 'Starter',
    price: '$49 / month',
    features: ['Everything in Explorer', 'Six lenses per month', 'Milestone tracking'],
    cta: 'Start',
  },
  {
    level: 'Recommended',
    name: 'Pro',
    price: '$149 / month',
    features: ['All eleven lenses', 'Unlimited conversation', 'Two advisor debriefs per quarter', 'Document uploads'],
    cta: 'Choose Pro',
    featured: true,
  },
  {
    level: 'Senior',
    name: 'Executive',
    price: '$399 / month',
    features: ['Everything in Pro', 'CPI access', 'Monthly advisor debriefs', 'Dedicated workspaces'],
    cta: 'Go Executive',
  },
  {
    level: 'Private',
    name: 'Council',
    price: 'By introduction',
    features: ['CPI flagship assessment', 'Dedicated LYC advisor', 'Full LYC network access', 'Concierge onboarding'],
    cta: 'Enquire',
  },
];

/* ── Journal articles (static placeholder for CMS integration) ── */
export interface JournalArticle {
  date: string;
  title: string;
  excerpt: string;
  tag: string;
}

export const JOURNAL_ARTICLES: JournalArticle[] = [
  {
    date: 'Aug 18',
    title: 'The Leader\u2019s Unshared Thought',
    excerpt: 'The things executives never say out loud are often the ones that matter most.',
    tag: 'Leadership',
  },
  {
    date: 'Aug 11',
    title: 'Decision Quality Is Not Decision Speed',
    excerpt: 'Fast decisions feel good. Good decisions feel slow. Here\u2019s why the difference matters.',
    tag: 'Operating',
  },
  {
    date: 'Aug 04',
    title: 'You Already Know What Your Brand Is',
    excerpt: 'Your professional brand isn\u2019t what you say. It\u2019s what others say when you leave the room.',
    tag: 'Positioning',
  },
  {
    date: 'Jul 28',
    title: 'The Board Meeting Before the Board Meeting',
    excerpt: 'The real conversation always happens before the agenda. Here\u2019s how to prepare for both.',
    tag: 'Narrative',
  },
  {
    date: 'Jul 21',
    title: 'When Your Strength Becomes Your Blind Spot',
    excerpt: 'The thing that got you here is often the thing that stops you from going further.',
    tag: 'Leadership',
  },
  {
    date: 'Jul 14',
    title: 'The Quiet Work of Building Something',
    excerpt: 'The most important work leaders do is invisible. Here\u2019s how to make it count.',
    tag: 'Operating',
  },
];
