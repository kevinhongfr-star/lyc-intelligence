/**
 * terminologyAuditChecklist.ts — Automated Terminology Audit Checklist.
 *
 * Batch 6 / Ticket 2: Full product surface audit checklist. Every surface
 * where text appears, mapped to: what terms to verify, common mistakes,
 * acceptance criteria, and a status template for recording results.
 *
 * Pairs with the Unified Terminology Reference (terminologyReference.ts).
 * Each audit item references the canonical term from that file — this
 * checklist never re-defines terms.
 *
 * Run: npx tsx src/tests/terminologyAuditRunner.ts
 */

import {
  ENTITY_NAME,
  BANNED_ENTITY_REFERENCES,
  PROGRESS_TERM,
  BANNED_PROGRESS_TERMS,
  APPROVED_DIAGNOSTICS,
  TIER_KEYS,
  TIERS,
  INSTRUMENT_MILE_COST,
  getTerminology,
  TERMINOLOGY,
  BANNED_WORDS_CROSS_REFERENCED,
  type TerminologyEntry,
} from './terminologyReference';
import { TIER_KEYS as CANONICAL_TIER_KEYS } from './tiers';

// ═══════════════════════════════════════════════════════════════════════
// §1 — Audit surface categories (12, per Batch 6 spec)
// ═══════════════════════════════════════════════════════════════════════

export type AuditSurfaceId =
  | 'chat_responses'        // NEXUS chat (covered by Batch 2B guardrails)
  | 'pricing_page'          // /pricing
  | 'landing_pages'         // /, instrument landings
  | 'onboarding_flow'       // signup, create-profile, wizard
  | 'assessment_pages'      // /assessment, /assessment/:code, depth pages
  | 'email_templates'       // all transactional + marketing email
  | 'error_messages'        // form errors, API errors, edge states
  | 'settings_account'      // /settings, profile, billing
  | 'mile_balance_packs'    // mile balance display, pack purchase
  | 'debrief_booking'       // session booking flow
  | 'milestones_progress'   // milestones / progress area
  | 'navigation_footer';    // nav, footer, global chrome

export interface AuditSurface {
  id: AuditSurfaceId;
  label: string;
  /** Routes / files where this surface appears. */
  locations: string[];
  /** Whether Batch 2B guardrails already cover this surface. */
  coveredBy2BGuardrails: boolean;
  description: string;
}

export const AUDIT_SURFACES: AuditSurface[] = [
  {
    id: 'chat_responses',
    label: 'NEXUS Chat Responses',
    locations: ['/nexus/chat', 'src/nexus/*', 'src/components/nexus/NexusChat.tsx'],
    coveredBy2BGuardrails: true,
    description: 'All NEXUS conversational responses. Covered by brandGuard.ts QualityGate.audit() at runtime. This checklist verifies the guardrail config itself + any static chat copy.',
  },
  {
    id: 'pricing_page',
    label: 'Pricing Page Copy',
    locations: ['/pricing', 'src/components/portals/PricingPage.tsx'],
    coveredBy2BGuardrails: false,
    description: 'Tier cards, price formatting, benefit lists, CTAs. Premium-not-SaaS voice. Entry tier never "free".',
  },
  {
    id: 'landing_pages',
    label: 'Landing Page Copy',
    locations: ['/', 'src/pages/Landing.tsx', 'src/pages/*Landing*.tsx', 'src/pages/*TakePage.tsx'],
    coveredBy2BGuardrails: false,
    description: 'Homepage, instrument landing pages (e.g. CpiFlagshipLanding), take pages. Marketing register — uses "included assessments" not "miles".',
  },
  {
    id: 'onboarding_flow',
    label: 'Onboarding Flow Text',
    locations: ['/create-profile', '/signup', 'src/components/onboarding/*', 'src/pages/OnboardingWizard*'],
    coveredBy2BGuardrails: false,
    description: 'Signup, profile creation, wizard steps. "Create your profile" not "sign up". No banned words in microcopy.',
  },
  {
    id: 'assessment_pages',
    label: 'Assessment / Depth Pages',
    locations: ['/assessment', '/assessment/:code', '/assessment/:code/results', 'src/components/assessment/*', 'src/pages/*ResultsPage*'],
    coveredBy2BGuardrails: false,
    description: 'Assessment hub, instrument detail, results pages. Diagnostic names ALL CAPS. Mile costs correct.',
  },
  {
    id: 'email_templates',
    label: 'Email Templates',
    locations: ['src/services/emailEngine.ts', 'src/services/inviteEmailTemplate.ts', 'src/components/email/*'],
    coveredBy2BGuardrails: false,
    description: 'Transactional + marketing email. No "free", no emoji, no exclamation points. "Executive Introduction" or "complimentary".',
  },
  {
    id: 'error_messages',
    label: 'Error Messages',
    locations: ['src/components/**/Error*', 'src/services/*Error*', 'form validation messages'],
    coveredBy2BGuardrails: false,
    description: 'Form errors, API errors, edge states. Banned words apply — no exceptions for errors. No "Oops!", no emoji.',
  },
  {
    id: 'settings_account',
    label: 'Settings / Account Pages',
    locations: ['/settings', 'src/pages/Settings*', 'src/components/settings/*'],
    coveredBy2BGuardrails: false,
    description: 'Profile settings, billing, preferences. "profile" not "account". Tier display names canonical.',
  },
  {
    id: 'mile_balance_packs',
    label: 'Mile Balance + Pack Pages',
    locations: ['src/components/billing/*', 'src/components/miles/*', 'src/pages/Billing*'],
    coveredBy2BGuardrails: false,
    description: 'Mile balance display, pack purchase. "miles" not "credits". "Complimentary" for 0-cost. Pack labels correct.',
  },
  {
    id: 'debrief_booking',
    label: 'Debrief Booking Flow',
    locations: ['src/components/assessment/NexusDebriefWidget.tsx', 'src/components/scheduling/*'],
    coveredBy2BGuardrails: false,
    description: 'Session booking, debrief scheduling. "30-minute session" format. "debrief" not "walkthrough".',
  },
  {
    id: 'milestones_progress',
    label: 'Milestones / Progress Area',
    locations: ['src/components/nexus/Milestone*', 'src/components/growth/*', 'src/pages/dex/*'],
    coveredBy2BGuardrails: false,
    description: 'Progress tracking UI. "milestones" everywhere — never "bookmarks", "tasks", "todos".',
  },
  {
    id: 'navigation_footer',
    label: 'Navigation + Footer',
    locations: ['src/components/portals/TopBar*', 'src/components/portals/Footer*', 'src/components/layout/*'],
    coveredBy2BGuardrails: false,
    description: 'Global nav, footer, chrome. NEXUS name canonical. No tier names in nav.',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// §2 — Audit item schema
// ═══════════════════════════════════════════════════════════════════════

export type AuditStatus = 'pass' | 'fail' | 'pending' | 'not_applicable';

export interface AuditItem {
  /** Stable ID for tracking. */
  id: string;
  /** Surface this item belongs to. */
  surface: AuditSurfaceId;
  /** The term or concept to verify. */
  termToCheck: string;
  /** The canonical correct form (from terminologyReference.ts). */
  correctForm: string;
  /** The most common error to look for. */
  commonError: string;
  /** What a passing check looks like. */
  acceptanceCriteria: string;
  /** How to verify (grep pattern, visual check, or runtime test). */
  verifyMethod: string;
  /** Default status before audit runs. */
  status: AuditStatus;
  /** Reference to the canonical terminology entry (if applicable). */
  terminologyRef?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// §3 — Master audit checklist (per-surface items)
// ═══════════════════════════════════════════════════════════════════════

export const AUDIT_CHECKLIST: AuditItem[] = [
  // ── Chat responses (covered by 2B guardrails — verify guardrail config) ──
  {
    id: 'chat-nexus-naming',
    surface: 'chat_responses',
    termToCheck: 'NEXUS entity name',
    correctForm: ENTITY_NAME,
    commonError: '"the coach", "the AI", "your assistant"',
    acceptanceCriteria: 'No instance of banned entity references in NEXUS responses. signatureBlockEnforcer() returns zero hard violations.',
    verifyMethod: 'Runtime: QualityGate.audit() on sample responses. Grep: BANNED_ENTITY_REFERENCES in src/nexus/.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → ENTITY_NAME',
  },
  {
    id: 'chat-no-tier-names',
    surface: 'chat_responses',
    termToCheck: 'Tier names in chat',
    correctForm: 'No tier names in CASUAL chat (tier names allowed in explicit upgrade/recommendation context, pricing, billing, comparison tables)',
    commonError: '"Professional tier", "Executive tier", "Council tier" in casual chat responses',
    acceptanceCriteria: 'canonicalTierNameCheck() returns zero violations on sample responses.',
    verifyMethod: 'Runtime: brandGuard.canonicalTierNameCheck() on response corpus.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → tiers (visibility: chat never names tiers)',
  },
  {
    id: 'chat-banned-words',
    surface: 'chat_responses',
    termToCheck: 'Banned words',
    correctForm: 'See BANNED_WORDS (voiceStandard.ts)',
    commonError: '"free", "framework", "platform", "leverage", "credits"',
    acceptanceCriteria: 'bannedWordScanner() returns zero hard violations on sample responses.',
    verifyMethod: 'Runtime: brandGuard.bannedWordScanner() on response corpus.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → BANNED_WORDS_CROSS_REFERENCED',
  },
  {
    id: 'chat-mile-cost-accuracy',
    surface: 'chat_responses',
    termToCheck: 'Mile cost accuracy',
    correctForm: 'INSTRUMENT_MILE_COST values (e.g. LEAP=1, SPARK=3, CPI=5 — locked canon per Batch 6 P0-3)',
    commonError: 'Wrong mile cost stated in chat (e.g. "LEAP costs 3 miles" or "SPARK costs 1 mile")',
    acceptanceCriteria: 'Every mile cost stated in chat matches INSTRUMENT_MILE_COST exactly. Locked canon: 1mi=LEAP · 2mi=PRISM,IMPACT,COACH,DRIVE,QUEST · 3mi=BRIDGE,MOSAIC,SPARK,FORGE · 5mi=CPI.',
    verifyMethod: 'Grep responses for mile cost mentions; cross-check against miles.ts.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → INSTRUMENT_MILE_COST',
  },

  // ── Pricing page ──
  {
    id: 'pricing-entry-tier-name',
    surface: 'pricing_page',
    termToCheck: 'Entry tier display name',
    correctForm: 'Explorer (marketing alias: Executive Introduction)',
    commonError: '"Free", "Free Tier", "$0"',
    acceptanceCriteria: 'Entry tier card shows "Explorer" or "Executive Introduction" — never "Free". 0-price renders as "Complimentary".',
    verifyMethod: 'Visual: inspect PricingPage.tsx. Grep: "free" (case-insensitive) in pricing components.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → Explorer',
  },
  {
    id: 'pricing-tier-display-names',
    surface: 'pricing_page',
    termToCheck: 'Tier display names',
    correctForm: 'Explorer, Starter, Pro, Executive, Council',
    commonError: '"Professional" (instead of Pro), "Basic", "Enterprise"',
    acceptanceCriteria: 'All tier cards use canonical display names from tiers.ts. "Pro" never "Professional" in user-facing copy — "professional" is the backend tier_key only.',
    verifyMethod: 'Grep: "Pro tier|\\bPro\\b|Basic|Enterprise" in src/components/portals/PricingPage.tsx.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → tiers',
  },
  {
    id: 'pricing-price-format',
    surface: 'pricing_page',
    termToCheck: 'Price formatting',
    correctForm: '$X/mo or ¥X/mo (USD/CNY); annual = 2 months complimentary',
    commonError: 'Inconsistent currency symbols, wrong annual discount math',
    acceptanceCriteria: 'computeTierPrice() + formatPrice() used consistently. Annual shows 17% saving (10 months billed).',
    verifyMethod: 'Visual: toggle monthly/annual. Verify math against tierConfig.ts ANNUAL_MONTHS_BILLED.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → miles (currency context)',
  },
  {
    id: 'pricing-cta-language',
    surface: 'pricing_page',
    termToCheck: 'CTA button language',
    correctForm: 'TIER_CTA_LABEL values (e.g. "Start Your Complimentary Baseline", "Go Pro")',
    commonError: '"Sign Up Free", "Get Started", "Buy Now"',
    acceptanceCriteria: 'CTAs use TIER_CTA_LABEL from tierConfig.ts. No "free", no "buy now".',
    verifyMethod: 'Grep: TIER_CTA_LABEL usage. Visual: inspect buttons.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → complimentary',
  },

  // ── Landing pages ──
  {
    id: 'landing-miles-vs-marketing',
    surface: 'landing_pages',
    termToCheck: 'miles (marketing register)',
    correctForm: '"included assessments" / "premium diagnostics" (NOT "miles" in marketing)',
    commonError: '"miles" in landing page marketing copy',
    acceptanceCriteria: 'Marketing copy uses "included assessments" / "premium diagnostics". "miles" appears only in product UI contexts.',
    verifyMethod: 'Grep: "miles" in src/pages/*Landing*.tsx, src/pages/*TakePage.tsx — verify each is product-UI context.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → miles (visibility rule)',
  },
  {
    id: 'landing-nexus-name',
    surface: 'landing_pages',
    termToCheck: 'NEXUS entity name',
    correctForm: ENTITY_NAME,
    commonError: '"the AI", "our AI", "the coach", "Nexus" (wrong case)',
    acceptanceCriteria: 'NEXUS always ALL CAPS. No banned entity references.',
    verifyMethod: 'Grep: "Nexus(?!\\b)" + BANNED_ENTITY_REFERENCES in landing pages.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → NEXUS',
  },
  {
    id: 'landing-diagnostic-codes',
    surface: 'landing_pages',
    termToCheck: 'Diagnostic code capitalization',
    correctForm: 'ALL CAPS (SPARK, PRISM, MOSAIC, etc.)',
    commonError: 'Title case (Spark, Prism) or lowercase (spark, prism)',
    acceptanceCriteria: 'All 11 diagnostic codes ALL CAPS in landing copy.',
    verifyMethod: 'Grep: diagnostic codes with wrong case in src/pages/*Landing*.tsx.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → diagnostics',
  },

  // ── Onboarding flow ──
  {
    id: 'onboard-signup-language',
    surface: 'onboarding_flow',
    termToCheck: 'Signup CTA',
    correctForm: '"Create your profile"',
    commonError: '"Sign up", "Sign up free", "Register"',
    acceptanceCriteria: 'Onboarding uses "Create your profile" — never "sign up" or "register".',
    verifyMethod: 'Grep: "sign up|signup|register" (case-insensitive) in src/components/onboarding/, src/pages/Onboarding*.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → profile',
  },
  {
    id: 'onboard-no-banned-words',
    surface: 'onboarding_flow',
    termToCheck: 'Banned words in microcopy',
    correctForm: 'No banned words (see BANNED_WORDS)',
    commonError: '"free", "no credit card", "cancel anytime", "easy peasy"',
    acceptanceCriteria: 'Zero banned words in onboarding wizard text, tooltips, helper text.',
    verifyMethod: 'Grep: BANNED_WORDS_CROSS_REFERENCED terms in onboarding components.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → banned',
  },
  {
    id: 'onboard-explorer-tokens',
    surface: 'onboarding_flow',
    termToCheck: 'Explorer complimentary tokens',
    correctForm: '"complimentary assessments" / "complimentary Explorer tokens" (LEAP + PRISM)',
    commonError: '"free assessments", "free tokens"',
    acceptanceCriteria: 'Onboarding describes LEAP + PRISM as "complimentary" — never "free".',
    verifyMethod: 'Grep: "free" in onboarding components. Verify LEAP/PRISM messaging uses "complimentary".',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → complimentary',
  },

  // ── Assessment / depth pages ──
  {
    id: 'assessment-diagnostic-accuracy',
    surface: 'assessment_pages',
    termToCheck: 'Diagnostic names + descriptors',
    correctForm: 'APPROVED_DIAGNOSTICS (code + fullName + descriptor + tagline)',
    commonError: 'Wrong descriptor, wrong tagline, misspelled code',
    acceptanceCriteria: 'Every instrument page matches APPROVED_DIAGNOSTICS exactly (fullName, descriptor, tagline, mileCost).',
    verifyMethod: 'Cross-check assessment catalog against voiceStandard.ts APPROVED_DIAGNOSTICS.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → diagnostics',
  },
  {
    id: 'assessment-mile-cost-display',
    surface: 'assessment_pages',
    termToCheck: 'Mile cost display',
    correctForm: '"X miles" (e.g. "3 miles") or "Complimentary" for 0',
    commonError: '"credits", "points", "Free" for 0-cost',
    acceptanceCriteria: 'MileCostBadge renders "X miles" or "Complimentary". Never "Free" or "credits".',
    verifyMethod: 'Visual: inspect MileCostBadge.tsx. Grep: "Free|credits|points" in assessment components.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → miles, complimentary',
  },
  {
    id: 'assessment-cost-tier-labels',
    surface: 'assessment_pages',
    termToCheck: 'Cost tier labels',
    correctForm: 'MILE_COST_TIERS (Light, Standard, Signature, Flagship)',
    commonError: 'Wrong tier label, invented tier names',
    acceptanceCriteria: 'Cost tier labels match MILE_COST_TIERS in miles.ts.',
    verifyMethod: 'Grep: cost tier labels in assessment components; cross-check miles.ts.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → INSTRUMENT_MILE_COST',
  },

  // ── Email templates ──
  {
    id: 'email-no-free',
    surface: 'email_templates',
    termToCheck: '"free" in email copy',
    correctForm: '"complimentary" / "Executive Introduction"',
    commonError: '"free", "free trial", "sign up free"',
    acceptanceCriteria: 'Zero "free" variants in any email template. Use "complimentary" or "Executive Introduction".',
    verifyMethod: 'Grep: "free" (case-insensitive) in src/services/emailEngine.ts, src/components/email/*, src/services/*Email*.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → complimentary',
  },
  {
    id: 'email-no-emoji-exclamation',
    surface: 'email_templates',
    termToCheck: 'Emoji + exclamation points',
    correctForm: 'No emoji, no exclamation points',
    commonError: '🎉, !, !!!',
    acceptanceCriteria: 'Zero emoji, zero exclamation points in email subject lines + body.',
    verifyMethod: 'Grep: "!" + emoji regex in email templates.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → STYLE_RULES (noEmoji, noExclamationPoints)',
  },
  {
    id: 'email-nexus-name',
    surface: 'email_templates',
    termToCheck: 'NEXUS entity name',
    correctForm: ENTITY_NAME,
    commonError: '"the AI", "your assistant", "the bot"',
    acceptanceCriteria: 'NEXUS referenced as "NEXUS" — never banned entity references.',
    verifyMethod: 'Grep: BANNED_ENTITY_REFERENCES in email templates.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → NEXUS',
  },

  // ── Error messages ──
  {
    id: 'error-no-banned-words',
    surface: 'error_messages',
    termToCheck: 'Banned words in errors',
    correctForm: 'No banned words — applies to errors with no exceptions',
    commonError: '"Oops!", "free", emoji, "Oops, something went wrong"',
    acceptanceCriteria: 'Error messages contain zero banned words. No emoji, no "Oops", no exclamation.',
    verifyMethod: 'Grep: BANNED_WORDS + "oops|uh oh|whoops" + emoji in error components.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → banned',
  },
  {
    id: 'error-nexus-name',
    surface: 'error_messages',
    termToCheck: 'NEXUS in errors',
    correctForm: '"NEXUS encountered an issue" / "NEXUS is unavailable"',
    commonError: '"the AI is having trouble", "the chatbot broke"',
    acceptanceCriteria: 'Errors referencing the entity use "NEXUS" — never banned entity references.',
    verifyMethod: 'Grep: BANNED_ENTITY_REFERENCES in error message strings.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → NEXUS',
  },
  {
    id: 'error-mile-terms',
    surface: 'error_messages',
    termToCheck: 'Mile-related errors',
    correctForm: '"miles" / "complimentary"',
    commonError: '"credits", "tokens", "Free"',
    acceptanceCriteria: 'Mile balance errors use "miles". Insufficient-balance errors never say "Free token".',
    verifyMethod: 'Grep: "credits|tokens|Free" in mile/billing error strings.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → miles, complimentary',
  },

  // ── Settings / account ──
  {
    id: 'settings-profile-not-account',
    surface: 'settings_account',
    termToCheck: '"profile" vs "account"',
    correctForm: '"profile"',
    commonError: '"account", "user account"',
    acceptanceCriteria: 'Settings pages use "profile" — never "account" or "user account".',
    verifyMethod: 'Grep: "\\baccount\\b" in src/pages/Settings*, src/components/settings/*.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → profile',
  },
  {
    id: 'settings-member-not-user',
    surface: 'settings_account',
    termToCheck: '"member" vs "user"',
    correctForm: '"member"',
    commonError: '"user" in user-facing copy',
    acceptanceCriteria: 'User-facing settings copy uses "member" — never "user".',
    verifyMethod: 'Grep: "\\buser\\b" in settings components (exclude internal analytics).',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → member',
  },
  {
    id: 'settings-tier-display',
    surface: 'settings_account',
    termToCheck: 'Tier display in settings',
    correctForm: 'Canonical tier display names (Explorer, Starter, Pro, Executive, Council)',
    commonError: 'Raw tier_key ("explorer"), "Professional", "Enterprise"',
    acceptanceCriteria: 'Settings shows canonical display name via tierDisplayName() — never raw key. "Pro" IS canonical (never "Professional" in user-facing copy — "professional" is the backend tier_key only).',
    verifyMethod: 'Visual: inspect settings page. Grep: raw tier keys in user-facing settings copy.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → tiers',
  },

  // ── Mile balance + pack pages ──
  {
    id: 'miles-currency-term',
    surface: 'mile_balance_packs',
    termToCheck: 'Currency term',
    correctForm: '"miles"',
    commonError: '"credits", "tokens", "points"',
    acceptanceCriteria: 'Balance display + pack pages use "miles" — never "credits"/"tokens"/"points".',
    verifyMethod: 'Grep: "credits|tokens|points" in src/components/miles/, src/components/billing/*.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → miles',
  },
  {
    id: 'miles-zero-cost-label',
    surface: 'mile_balance_packs',
    termToCheck: 'Zero-cost label',
    correctForm: '"Complimentary"',
    commonError: '"Free", "$0"',
    acceptanceCriteria: '0-mile assessments render as "Complimentary" — never "Free" or "$0".',
    verifyMethod: 'Visual: MileCostBadge with cost=0. Grep: "Free|\\$0" in mile/billing components.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → complimentary',
  },
  {
    id: 'miles-pack-labels',
    surface: 'mile_balance_packs',
    termToCheck: 'Pack labels',
    correctForm: 'MILE_PACKS labels ("1 mile", "5 miles", "15 miles")',
    commonError: '"credit pack", "token pack", wrong pluralization',
    acceptanceCriteria: 'Pack labels match MILE_PACKS in miles.ts. Singular "mile" for 1, plural "miles" otherwise.',
    verifyMethod: 'Grep: pack labels in billing components; cross-check miles.ts MILE_PACKS.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → mile pack',
  },

  // ── Debrief booking ──
  {
    id: 'debrief-session-format',
    surface: 'debrief_booking',
    termToCheck: 'Session duration format',
    correctForm: '"30-minute session" / "45-minute session" / "60-minute session" / "90-minute session"',
    commonError: '"30 min", "30min", "30-min", "1 hour session"',
    acceptanceCriteria: 'All session durations use hyphenated "X-minute session" format.',
    verifyMethod: 'Grep: "\\d+\\s*min" in debrief/scheduling components.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → session',
  },
  {
    id: 'debrief-term',
    surface: 'debrief_booking',
    termToCheck: '"debrief" term',
    correctForm: '"debrief"',
    commonError: '"walkthrough", "review session", "consultation", "read-out", "debriefing"',
    acceptanceCriteria: 'Post-assessment review called "debrief" — never synonyms.',
    verifyMethod: 'Grep: "walkthrough|review session|consultation|read-out|debriefing" in debrief components.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → debrief',
  },

  // ── Milestones / progress ──
  {
    id: 'milestones-term',
    surface: 'milestones_progress',
    termToCheck: 'Progress term',
    correctForm: PROGRESS_TERM, // 'milestones'
    commonError: BANNED_PROGRESS_TERMS.join(', '),
    acceptanceCriteria: 'Progress UI uses "milestones" everywhere — zero instances of banned progress terms.',
    verifyMethod: `Grep: ${BANNED_PROGRESS_TERMS.map((t) => `"${t}"`).join('|')} in src/components/nexus/Milestone*, src/components/growth/*.`,
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → milestones',
  },
  {
    id: 'milestones-cross-tier-consistency',
    surface: 'milestones_progress',
    termToCheck: 'Cross-tier terminology consistency',
    correctForm: '"milestones" at ALL tiers',
    commonError: '"bookmarks" at Explorer, "milestones" at Professional (parallel systems)',
    acceptanceCriteria: 'Same term ("milestones") at every tier. Platform handles quantity limits; terminology constant.',
    verifyMethod: 'Visual: check milestones UI at each tier. Verify no tier-gated terminology switch.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → milestones (build rule)',
  },

  // ── Navigation + footer ──
  {
    id: 'nav-nexus-name',
    surface: 'navigation_footer',
    termToCheck: 'NEXUS in nav/footer',
    correctForm: ENTITY_NAME,
    commonError: '"Nexus", "the AI", logo without name',
    acceptanceCriteria: 'Nav/footer references "NEXUS" (ALL CAPS) — never wrong case or banned references.',
    verifyMethod: 'Grep: "Nexus" (wrong case) + BANNED_ENTITY_REFERENCES in nav/footer components.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → NEXUS',
  },
  {
    id: 'nav-no-tier-names',
    surface: 'navigation_footer',
    termToCheck: 'Tier names in nav',
    correctForm: 'No tier names in global nav',
    commonError: '"Professional", "Executive" as nav items',
    acceptanceCriteria: 'Global nav does not list tier names as navigation items.',
    verifyMethod: 'Visual: inspect TopBar/nav. Grep: tier display names in nav component.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → tiers',
  },
  {
    id: 'nav-milestone-term',
    surface: 'navigation_footer',
    termToCheck: 'Milestones nav label',
    correctForm: PROGRESS_TERM,
    commonError: '"Bookmarks", "Tasks", "Saved"',
    acceptanceCriteria: 'Nav item for progress uses "Milestones" — never synonyms.',
    verifyMethod: 'Grep: nav labels for progress-related items.',
    status: 'pending',
    terminologyRef: 'terminologyReference.ts → milestones',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// §4 — Cross-surface consistency checks
// ═══════════════════════════════════════════════════════════════════════

export interface CrossSurfaceCheck {
  id: string;
  check: string;
  correctForm: string;
  commonError: string;
  surfaces: AuditSurfaceId[];
  acceptanceCriteria: string;
  verifyMethod: string;
  status: AuditStatus;
}

export const CROSS_SURFACE_CHECKS: CrossSurfaceCheck[] = [
  {
    id: 'xsurf-nexus-naming',
    check: 'NEXUS naming consistency (no "the coach" / "the AI")',
    correctForm: ENTITY_NAME,
    commonError: '"the coach" in chat, "the AI" in email, "your assistant" in onboarding',
    surfaces: ['chat_responses', 'pricing_page', 'landing_pages', 'onboarding_flow', 'assessment_pages', 'email_templates', 'error_messages', 'settings_account', 'mile_balance_packs', 'debrief_booking', 'milestones_progress', 'navigation_footer'],
    acceptanceCriteria: 'Zero banned entity references across ALL surfaces. NEXUS = entity name everywhere.',
    verifyMethod: 'Codebase-wide grep for BANNED_ENTITY_REFERENCES across all 12 surface locations.',
    status: 'pending',
  },
  {
    id: 'xsurf-milestones-vs-bookmarks',
    check: '"milestones" vs "bookmarks" consistency',
    correctForm: PROGRESS_TERM,
    commonError: '"bookmarks" in some surfaces, "milestones" in others',
    surfaces: ['milestones_progress', 'navigation_footer', 'settings_account', 'chat_responses'],
    acceptanceCriteria: '"milestones" used uniformly. Zero instances of BANNED_PROGRESS_TERMS anywhere.',
    verifyMethod: 'Codebase-wide grep for BANNED_PROGRESS_TERMS.',
    status: 'pending',
  },
  {
    id: 'xsurf-miles-vs-credits',
    check: '"miles" vs "assessments" vs "credits" usage context',
    correctForm: '"miles" (product/UI/chat) · "included assessments" (marketing) · never "credits"',
    commonError: '"credits" anywhere; "miles" in marketing landing copy',
    surfaces: ['chat_responses', 'pricing_page', 'landing_pages', 'assessment_pages', 'mile_balance_packs', 'settings_account', 'error_messages'],
    acceptanceCriteria: '"credits" never appears. "miles" only in product/UI/chat contexts. Marketing uses "included assessments".',
    verifyMethod: 'Grep: "credits" codebase-wide. Grep: "miles" in landing pages — verify each is product context.',
    status: 'pending',
  },
  {
    id: 'xsurf-tier-display-names',
    check: 'Tier display name consistency',
    correctForm: 'Explorer, Starter, Pro, Executive, Council',
    commonError: '"Professional" in pricing, "Pro" in settings; "Enterprise" in nav',
    surfaces: ['pricing_page', 'settings_account', 'onboarding_flow', 'landing_pages', 'email_templates', 'navigation_footer'],
    acceptanceCriteria: 'Canonical display names from tiers.ts used everywhere. "Pro" IS the canonical display name (per Batch 6 P0-7). "Professional" NEVER user-facing (it is the backend tier_key only). "Enterprise" never (collapsed into Council).',
    verifyMethod: 'Grep: "Professional tier|\\bProfessional\\b|Enterprise" across surface locations.',
    status: 'pending',
  },
  {
    id: 'xsurf-complimentary-vs-free',
    check: '"complimentary" vs "free" consistency',
    correctForm: '"complimentary"',
    commonError: '"free" in any surface',
    surfaces: ['chat_responses', 'pricing_page', 'landing_pages', 'onboarding_flow', 'assessment_pages', 'email_templates', 'error_messages', 'mile_balance_packs'],
    acceptanceCriteria: 'Zero "free" in user-facing copy. "complimentary" everywhere a zero-cost concept appears.',
    verifyMethod: 'Codebase-wide grep for "\\bfree\\b" in user-facing string literals (exclude banned-word lists + comments documenting the ban).',
    status: 'pending',
  },
  {
    id: 'xsurf-diagnostic-capitalization',
    check: 'Diagnostic code capitalization',
    correctForm: 'ALL CAPS (SPARK, PRISM, MOSAIC, BRIDGE, IMPACT, DRIVE, FORGE, LEAP, QUEST, COACH, CPI)',
    commonError: 'Title case or lowercase in some surfaces',
    surfaces: ['chat_responses', 'pricing_page', 'landing_pages', 'assessment_pages', 'email_templates', 'milestones_progress'],
    acceptanceCriteria: 'All 11 diagnostic codes ALL CAPS in every surface.',
    verifyMethod: 'Grep: diagnostic codes with wrong case across surface locations.',
    status: 'pending',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// §5 — Banned word enforcement checklist (per surface)
// ═══════════════════════════════════════════════════════════════════════

export interface BannedWordSurfaceCheck {
  surface: AuditSurfaceId;
  /** High-priority banned words most likely to leak into this surface. */
  highRiskBannedWords: string[];
  enforcementNotes: string;
}

export const BANNED_WORD_PER_SURFACE: BannedWordSurfaceCheck[] = [
  {
    surface: 'chat_responses',
    highRiskBannedWords: ['free', 'credits', 'framework', 'platform', 'leverage', 'the coach', 'the AI', 'Explorer tier', 'Professional tier'],
    enforcementNotes: 'Runtime enforcement via brandGuard.ts QualityGate.audit(). Hardest surface to keep clean — automated.',
  },
  {
    surface: 'pricing_page',
    highRiskBannedWords: ['free', 'Free', 'no credit card', 'cancel anytime', 'best value', 'unlimited', 'Pro tier', 'Enterprise'],
    enforcementNotes: 'Manual + grep. Pricing copy historically prone to "free" and SaaS framing.',
  },
  {
    surface: 'landing_pages',
    highRiskBannedWords: ['free', 'cutting-edge', 'world-class', 'revolutionize', 'game changer', 'disrupt', 'miles (in marketing register)'],
    enforcementNotes: 'Marketing register — prone to hype words. Verify "miles" not used in marketing prose.',
  },
  {
    surface: 'onboarding_flow',
    highRiskBannedWords: ['free', 'sign up', 'register', 'no credit card', 'easy peasy', 'super easy', 'cool'],
    enforcementNotes: 'Microcopy prone to casual tone + "sign up" instead of "create your profile".',
  },
  {
    surface: 'assessment_pages',
    highRiskBannedWords: ['free', 'Free', 'credits', 'test', 'quiz', 'survey', 'questionnaire'],
    enforcementNotes: '"diagnostic" is the canonical USER-FACING term — "assessment" is technical/internal only (per Batch 6 P0-5). Never "test"/"quiz"/"survey"/"questionnaire". User-facing copy: "run a diagnostic", "diagnostic results". Internal/technical: "assessment engine", "assessment service" OK.',
  },
  {
    surface: 'email_templates',
    highRiskBannedWords: ['free', 'Free', 'deal', 'sale', 'bargain', 'amazing', '!', 'emoji'],
    enforcementNotes: 'emailEngine.ts forbidden_words lists enforce this. Verify subject + preheader + body.',
  },
  {
    surface: 'error_messages',
    highRiskBannedWords: ['Oops', 'oops', 'uh oh', 'whoops', '!', 'emoji', 'free', 'the AI'],
    enforcementNotes: 'No exceptions for errors. No casual apologetics, no emoji, no exclamation.',
  },
  {
    surface: 'settings_account',
    highRiskBannedWords: ['user', 'account', 'customer', 'subscriber', 'Pro tier', 'Enterprise'],
    enforcementNotes: '"member" + "profile" canonical. Raw tier keys must not display.',
  },
  {
    surface: 'mile_balance_packs',
    highRiskBannedWords: ['credits', 'tokens', 'points', 'Free', '$0', 'top-up', 'refill'],
    enforcementNotes: '"miles" + "complimentary" + "mile pack" canonical.',
  },
  {
    surface: 'debrief_booking',
    highRiskBannedWords: ['walkthrough', 'review session', 'consultation', 'read-out', 'debriefing', '30 min', '1 hour'],
    enforcementNotes: '"debrief" + "X-minute session" format canonical.',
  },
  {
    surface: 'milestones_progress',
    highRiskBannedWords: ['bookmarks', 'tasks', 'todo', 'checklist', 'dashboard items'],
    enforcementNotes: 'PROGRESS_TERM = "milestones". BANNED_PROGRESS_TERMS enforced.',
  },
  {
    surface: 'navigation_footer',
    highRiskBannedWords: ['Nexus (wrong case)', 'the AI', 'Enterprise', 'Bookmarks', 'Tasks'],
    enforcementNotes: 'Global chrome — high visibility. NEXUS ALL CAPS. No tier names as nav items.',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// §6 — Audit result schema + helpers
// ═══════════════════════════════════════════════════════════════════════

export interface AuditResult {
  itemId: string;
  status: AuditStatus;
  evidence?: string;
  notes?: string;
  auditedAt?: string;
  auditedBy?: string;
}

export interface SurfaceAuditReport {
  surface: AuditSurfaceId;
  results: AuditResult[];
  totalItems: number;
  passed: number;
  failed: number;
  pending: number;
  notApplicable: number;
  summary: string;
}

/**
 * Get all audit items for a surface.
 */
export function getAuditItemsForSurface(surface: AuditSurfaceId): AuditItem[] {
  return AUDIT_CHECKLIST.filter((item) => item.surface === surface);
}

/**
 * Get the banned-word risk profile for a surface.
 */
export function getBannedWordRiskForSurface(surface: AuditSurfaceId): BannedWordSurfaceCheck | null {
  return BANNED_WORD_PER_SURFACE.find((c) => c.surface === surface) ?? null;
}

/**
 * Compile a surface audit report from a set of results.
 */
export function compileSurfaceReport(
  surface: AuditSurfaceId,
  results: AuditResult[],
): SurfaceAuditReport {
  const items = getAuditItemsForSurface(surface);
  const resultMap = new Map(results.map((r) => [r.itemId, r]));

  let passed = 0;
  let failed = 0;
  let pending = 0;
  let notApplicable = 0;

  for (const item of items) {
    const result = resultMap.get(item.id);
    const status = result?.status ?? 'pending';
    if (status === 'pass') passed++;
    else if (status === 'fail') failed++;
    else if (status === 'not_applicable') notApplicable++;
    else pending++;
  }

  const totalItems = items.length;
  const summary = failed > 0
    ? `FAIL — ${failed} of ${totalItems} items failed (${passed} passed, ${pending} pending)`
    : pending > 0
      ? `INCOMPLETE — ${pending} of ${totalItems} items pending (${passed} passed)`
      : `PASS — ${passed} of ${totalItems} items passed`;

  return {
    surface,
    results,
    totalItems,
    passed,
    failed,
    pending,
    notApplicable,
    summary,
  };
}

/**
 * Compile a full audit report across all surfaces.
 */
export function compileFullAuditReport(
  resultsBySurface: Record<AuditSurfaceId, AuditResult[]>,
): {
  surfaces: SurfaceAuditReport[];
  totalItems: number;
  totalPassed: number;
  totalFailed: number;
  totalPending: number;
  overallSummary: string;
} {
  const surfaces = AUDIT_SURFACES.map((s) => compileSurfaceReport(s.id, resultsBySurface[s.id] ?? []));
  const totalItems = surfaces.reduce((sum, s) => sum + s.totalItems, 0);
  const totalPassed = surfaces.reduce((sum, s) => sum + s.passed, 0);
  const totalFailed = surfaces.reduce((sum, s) => sum + s.failed, 0);
  const totalPending = surfaces.reduce((sum, s) => sum + s.pending, 0);

  const overallSummary = totalFailed > 0
    ? `FAIL — ${totalFailed} of ${totalItems} items failed across ${AUDIT_SURFACES.length} surfaces`
    : totalPending > 0
      ? `INCOMPLETE — ${totalPending} of ${totalItems} items pending`
      : `PASS — ${totalPassed} of ${totalItems} items passed across ${AUDIT_SURFACES.length} surfaces`;

  return { surfaces, totalItems, totalPassed, totalFailed, totalPending, overallSummary };
}

// ═══════════════════════════════════════════════════════════════════════
// §7 — Audit checklist summary (for dashboards)
// ═══════════════════════════════════════════════════════════════════════

export const AUDIT_CHECKLIST_SUMMARY = {
  totalSurfaces: AUDIT_SURFACES.length,
  surfacesCoveredBy2B: AUDIT_SURFACES.filter((s) => s.coveredBy2BGuardrails).length,
  totalAuditItems: AUDIT_CHECKLIST.length,
  totalCrossSurfaceChecks: CROSS_SURFACE_CHECKS.length,
  itemsPerSurface: AUDIT_SURFACES.map((s) => ({
    surface: s.id,
    label: s.label,
    itemCount: getAuditItemsForSurface(s.id).length,
    coveredBy2B: s.coveredBy2BGuardrails,
  })),
};
