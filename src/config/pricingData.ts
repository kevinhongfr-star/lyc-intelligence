export type TierKey = 'explorer' | 'starter' | 'pro' | 'executive' | 'council';

export interface PricingTier {
  tier_key: TierKey;
  display_name: string;
  order: number;
  monthlyMiles: number;
  usdMonthly: number;
  cnyMonthly: number;
  features: string[];
  alias?: string;
}

export const TIERS: PricingTier[] = [
  {
    tier_key: 'explorer',
    display_name: 'Explorer',
    order: 0,
    monthlyMiles: 0,
    usdMonthly: 0,
    cnyMonthly: 0,
    alias: 'Executive Introduction',
    features: [
      'Executive Introduction access',
      'Framework exploration and sample outputs',
      'Diagnostic previews (no personalised reports)',
      'Community forum access',
    ],
  },
  {
    tier_key: 'starter',
    display_name: 'Starter',
    order: 1,
    monthlyMiles: 50,
    usdMonthly: 25,
    cnyMonthly: 59,
    features: [
      '50 diagnostic miles monthly',
      'All 11 diagnostics unlocked',
      'Personalised diagnostic reports',
      'Miles earning through engagement',
      'PDF report export',
    ],
  },
  {
    tier_key: 'pro',
    display_name: 'Pro',
    order: 2,
    monthlyMiles: 150,
    usdMonthly: 99,
    cnyMonthly: 233,
    features: [
      '150 diagnostic miles monthly',
      'Everything in Starter',
      'Peer benchmarking across regional C-suite',
      'Deliverable workspace',
      'Priority responses',
    ],
  },
  {
    tier_key: 'executive',
    display_name: 'Executive',
    order: 3,
    monthlyMiles: 300,
    usdMonthly: 199,
    cnyMonthly: 466,
    features: [
      '300 diagnostic miles monthly',
      'Everything in Pro',
      'Executive consultant debriefs',
      'Live event access',
      'Priority support',
    ],
  },
  {
    tier_key: 'council',
    display_name: 'Council',
    order: 4,
    monthlyMiles: 600,
    usdMonthly: 499,
    cnyMonthly: 1165,
    features: [
      '600 diagnostic miles monthly',
      'Everything in Executive',
      'Council community and live sessions',
      'Quarterly executive workshops',
      'Unlimited conversations',
    ],
  },
];

export const RECOMMENDED_TIER: TierKey = 'pro';

export type InstrumentCategory = 'flagship' | 'career_core' | 'advisory';
export type MileCost = 1 | 2 | 3 | 5;

export interface InstrumentUserFacing {
  code: string;
  fullName: string;
  shortDescriptor: string;
  category: InstrumentCategory;
  milesCost: MileCost;
}

export const INSTRUMENT_USERFACING: Record<string, InstrumentUserFacing> = {
  LEAP: {
    code: 'LEAP',
    fullName: 'Leadership Executive Agility Profile',
    shortDescriptor: 'Agility & adaptability diagnostic',
    category: 'career_core',
    milesCost: 1,
  },
  PRISM: {
    code: 'PRISM',
    fullName: 'Performance Readiness Insight & Success Matrix',
    shortDescriptor: 'Performance readiness diagnostic',
    category: 'advisory',
    milesCost: 2,
  },
  IMPACT: {
    code: 'IMPACT',
    fullName: 'Influence, Management & Presence Across Career Trajectories',
    shortDescriptor: 'Executive presence diagnostic',
    category: 'career_core',
    milesCost: 2,
  },
  COACH: {
    code: 'COACH',
    fullName: 'Coaching Orientation & Assessment of Conversational Habits',
    shortDescriptor: 'Coaching aptitude diagnostic',
    category: 'career_core',
    milesCost: 2,
  },
  BRIDGE: {
    code: 'BRIDGE',
    fullName: 'Board Readiness & Integrated Director Governance Evaluation',
    shortDescriptor: 'Board readiness diagnostic',
    category: 'advisory',
    milesCost: 3,
  },
  MOSAIC: {
    code: 'MOSAIC',
    fullName: 'Multi-dimensional Occupational Success & Alignment Intelligence Composite',
    shortDescriptor: 'Role alignment diagnostic',
    category: 'advisory',
    milesCost: 3,
  },
  SPARK: {
    code: 'SPARK',
    fullName: 'Strategic Potential & Adaptive Readiness Kernel',
    shortDescriptor: 'Strategic potential diagnostic',
    category: 'advisory',
    milesCost: 3,
  },
  DRIVE: {
    code: 'DRIVE',
    fullName: 'Directorship, Resilience & Initiative for Visionary Execution',
    shortDescriptor: 'Execution resilience diagnostic',
    category: 'career_core',
    milesCost: 2,
  },
  FORGE: {
    code: 'FORGE',
    fullName: 'Foundational Operational Readiness & Governance Evaluation',
    shortDescriptor: 'Operational governance diagnostic',
    category: 'advisory',
    milesCost: 3,
  },
  QUEST: {
    code: 'QUEST',
    fullName: 'Quality of Executive Success Trajectory',
    shortDescriptor: 'Career trajectory diagnostic',
    category: 'career_core',
    milesCost: 2,
  },
  CPI: {
    code: 'CPI',
    fullName: 'China Leadership Pipeline Index',
    shortDescriptor: 'Flagship China leadership diagnostic',
    category: 'flagship',
    milesCost: 5,
  },
};

export interface ServiceLevel {
  key: string;
  label: string;
  usd: number;
  cny: number;
  diagnostic_label: string;
}

export const SERVICE_LEVELS: ServiceLevel[] = [
  {
    key: 'executive_introduction',
    label: 'Executive Introduction',
    usd: 99,
    cny: 33,
    diagnostic_label: '1mi – 2mi cohort diagnostics',
  },
  {
    key: 'professional_deep_dive',
    label: 'Professional Deep-Dive',
    usd: 149,
    cny: 50,
    diagnostic_label: '2mi cohort diagnostics',
  },
  {
    key: 'executive_advisory',
    label: 'Executive Advisory',
    usd: 249,
    cny: 66,
    diagnostic_label: '3mi cohort diagnostics',
  },
];

export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What are diagnostic miles and how do I use them?',
    answer:
      'Diagnostic miles are the currency used to unlock and run diagnostics within your subscription. Each diagnostic costs a fixed number of miles (1, 2, 3, or 5 depending on the tier). For example, LEAP costs 1 mile, most Standard diagnostics cost 2 miles, Signature diagnostics cost 3 miles, and the CPI (China Leadership Pipeline Index) flagship costs 5 miles.',
  },
  {
    question: 'How many diagnostic miles come with each tier?',
    answer:
      'Explorer includes 0 miles (Executive Introduction only), Starter includes 50 miles, Pro includes 150 miles, Executive includes 300 miles, and Council includes 600 miles per month. With Pro, 150 miles is enough for roughly 75 Standard (2mi) diagnostics or 30 Signature (3mi) diagnostics each month.',
  },
  {
    question: 'What is the difference between Career Core and Advisory diagnostics?',
    answer:
      'Career Core diagnostics (LEAP, IMPACT, COACH, DRIVE, QUEST) focus on individual leadership capabilities and career trajectory, costing 1–2 miles each. Advisory diagnostics (PRISM, BRIDGE, MOSAIC, SPARK, FORGE) deliver deeper board-level and strategic insights, costing 2–3 miles each. The CPI flagship is a separate category at 5 miles.',
  },
  {
    question: 'Do unused diagnostic miles roll over each month?',
    answer:
      'Subscription miles do not roll over — they reset each billing period. Miles earned through engagement actions (framework exploration, reflections, referrals, workshops) persist in your balance and are available until spent. The Pro tier balances value and volume for most executives.',
  },
  {
    question: 'Can I purchase additional diagnostic miles if I run out?',
    answer:
      'Yes. Diagnostic mile packs are available in 50, 100, 250, and 500 mile increments. A 50-mile pack covers roughly 25 Standard diagnostics (2mi each) or 10 Signature diagnostics (3mi each). 500 miles covers roughly 100 CPI-equivalent runs at 5mi each.',
  },
  {
    question: 'What does the CPI diagnostic include?',
    answer:
      'CPI (China Leadership Pipeline Index) is the 5-mile flagship diagnostic. It benchmarks leaders against a proprietary China market dataset, provides a 90-minute executive debrief session, and includes a comprehensive pipeline report with regional and role-based comparisons. It is available on Starter and above.',
  },
  {
    question: 'Is the Pro tier right for me?',
    answer:
      'Pro is the recommended tier for most active executives. With 150 diagnostic miles monthly, you can run a mix of Career Core (1–2mi), Advisory (2–3mi), and occasional CPI (5mi) diagnostics, plus access peer benchmarking and deliverable workspaces. Upgrade to Executive at 300 miles if you need regular debrief sessions.',
  },
  {
    question: 'How do debrief sessions work with diagnostic miles?',
    answer:
      'Debriefs are optional sessions led by executive consultants, aligned to the diagnostic mile cost: 30-min Career Core cohort (1mi–2mi), 45-min Standard/Advisory (2mi cohort), 60-min Signature (3mi cohort), and 90-min CPI Executive (5mi cohort). Sessions are booked separately — diagnostic miles cover the report itself.',
  },
];

export interface MilePack {
  pack_key: string;
  miles: 50 | 100 | 250 | 500;
  usd: number;
  cny: number;
  valueExample: string;
}

export const MILE_PACKS: MilePack[] = [
  {
    pack_key: 'pack_50',
    miles: 50,
    usd: 25,
    cny: 59,
    valueExample: '50 miles ≈ 25 Standard diagnostics (2mi) or 10 Signature diagnostics (3mi)',
  },
  {
    pack_key: 'pack_100',
    miles: 100,
    usd: 49,
    cny: 115,
    valueExample: '100 miles ≈ 50 Standard diagnostics (2mi) or 20 CPI runs (5mi)',
  },
  {
    pack_key: 'pack_250',
    miles: 250,
    usd: 119,
    cny: 278,
    valueExample: '250 miles ≈ 125 Standard diagnostics (2mi) or 83 Signature diagnostics (3mi)',
  },
  {
    pack_key: 'pack_500',
    miles: 500,
    usd: 229,
    cny: 535,
    valueExample: '500 miles ≈ 250 Standard diagnostics (2mi) or 100 CPI runs (5mi)',
  },
];

export type PricingCurrency = 'USD' | 'CNY';
export type BillingCycle = 'monthly' | 'annual';
