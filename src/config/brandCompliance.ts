/**
 * Brand Compliance — 5 Non-Negotiables + Premium Language Rules
 * Tickets #1335 (design system) + #1336 (premium positioning language)
 *
 * Every Phase 2 surface (assessment hub, login/onboarding, result page,
 * pricing) must pass all 5 design rules and contain zero banned words.
 */

// ── #1335: Design System 5 Non-Negotiables ──────────────────────────

export const DESIGN_RULES = [
  {
    id: 'zero-border-radius',
    rule: 'Zero border radius on ALL elements',
    acceptanceCriteria:
      'No CSS border-radius > 0 anywhere — inline styles, stylesheets, ' +
      'Tailwind classes, or HTML report templates. Use border-radius: 0 ' +
      'or omit the property. Score circles, badges, buttons, cards, ' +
      'inputs: all square corners.',
    verify: `grep -rn "border-radius\\|borderRadius\\|rounded-" src/ | grep -v ": 0\\|: '0px'\\|: '0'\\|DS.radius`,
  },
  {
    id: 'canonical-fonts',
    rule: '3-font system: System serif (DejaVu Serif/Georgia/Times, headings) + DM Sans (sans/body) + IBM Plex Mono (mono/labels)',
    acceptanceCriteria:
      'No Inter, JetBrains Mono, Fira Code, or system-ui as primary. ' +
      'Headings use system serif (DejaVu Serif / Georgia / Times). Body uses DM Sans. Code/labels/' +
      'metadata use IBM Plex Mono. All three families self-hosted ' +
      'as woff2 files in /public/fonts/ — zero Google Fonts CDN ' +
      'references anywhere in the bundled app or report HTML output.',
    verify: 'grep -rn "Inter\\|JetBrains\\|Fira Code\\|fonts.googleapis\\|fonts.gstatic" src/ index.html public/ | grep -v node_modules | grep -v akira_source',
  },
  {
    id: 'one-accent-per-page',
    rule: 'One accent color per page',
    acceptanceCriteria:
      'Default accent is #C108AB (crimson). A page may override to a ' +
      'single alternative accent (e.g. methodology colors) but must not ' +
      'mix 2+ accents on the same view. Semantic colors (success/warning/' +
      'error) are permitted for status indicators only, not as decorative ' +
      'accents.',
    verify: 'Visual inspection — no more than 1 decorative accent per route.',
  },
  {
    id: 'premium-not-saas',
    rule: 'Premium visual tone, not SaaS',
    acceptanceCriteria:
      'Generous whitespace (24-48px between sections). Serif headings at ' +
      'large sizes (22px+). Mono labels with wide letter-spacing (0.1em+). ' +
      'No gradient buttons, no glassmorphism, no drop shadows beyond ' +
      'subtle elevation (0 1px 2px rgba). Dark text on light backgrounds. ' +
      'No playful illustrations or emoji in UI chrome.',
    verify: 'Visual inspection against premium brand references.',
  },
  {
    id: 'functional-animation',
    rule: 'Functional animation only, 120-350ms envelope. Exceptions only for loading states (skeleton shimmer, load spinners, progress bars), state-feedback pulses, and scroll-reveal staggers.',
    acceptanceCriteria:
      'Transitions for hover states, reveals, and state changes. Durations ' +
      'MUST be one of: 120ms (micro-interactions), 150ms, 200ms (standard), 250ms, 300ms, 350ms (reveals). ' +
      'Reveal motion: opacity 350ms + translateY(24px) with --ease-out-expo; use the ' +
      'global .reveal/.reveal.visible classes; reveal delays (80/160/240ms) for staggers. ' +
      'Easing for interactions: cubic-bezier(0.4, 0, 0.2, 1) (standard) or the named ' +
      '.ease-standard/.ease-emphasized classes from motion.css. ' +
      'Decorative animations are banned: no infinite bouncing (animate-bounce), ' +
      'no spinning logos, no slow ambient float/drift. ' +
      'Allowed exceptions > 350ms: skeleton shimmer (1.5s), spinner rotation, ' +
      'assessment-icon micro-animations (.anim-* in index.css), pulse/CTA glow, ' +
      'progress bar fill, milestone celebration, toast/modal enter+exit.',
    verify:
      'grep -rnE "animate-bounce|bouncing|\\.5s|500ms|700ms|duration-[5-9]00|duration-1000" src/ | ' +
      'grep -v node_modules | grep -v "debounce\\|debounceMs\\|shimmer\\|skeleton\\|spinner\\|spin\\|pulse\\|progress\\|bar-f"',
  },
] as const;

// ── #1336: Premium Positioning Language ─────────────────────────────

export const BANNED_WORDS: Record<string, string> = {
  // Tier / pricing language
  free: 'complimentary',
  'free trial': 'Executive Introduction',
  'free tier': 'Executive Introduction',
  'free plan': 'Executive Introduction',
  freemium: 'tiered access',
  'sign up': 'create your profile',
  signup: 'create your profile',
  'sign up free': 'begin your Executive Introduction',
  'get started': 'begin exploration',
  'get started free': 'begin exploration',
  'try for free': 'experience the Executive Introduction',
  'start free': 'begin exploration',
  unlimited: 'extensive',
  'unlimited access': 'full access',
  'no credit card': '—',
  'no credit card required': '—',
  'cancel anytime': '—',
  'money back': '—',
  'best value': 'most chosen',
  'most popular': 'most chosen',
  'best price': '—',
  'cheap': '—',
  'affordable': 'considered',
  'pricing plan': 'tier',
  'subscription plan': 'membership',
  'upgrade now': 'elevate your membership',
  'buy now': '—',
  'add to cart': '—',
  // SaaS jargon
  'platform': 'system',        // except in "LYC Intelligence platform" brand ref
  'dashboard': 'overview',      // except in technical admin contexts
  'users': 'members',
  'user account': 'profile',
  'user dashboard': 'member overview',
  'feature': 'capability',
  'features': 'capabilities',
  'powered by': '—',
  'seamless': 'integrated',
  'leverage': 'apply',
  'synergy': '—',
  'streamline': 'refine',
  'empower': 'equip',
  'revolutionize': 'transform',
  'cutting-edge': 'distinguished',
  'state-of-the-art': 'distinguished',
  'world-class': 'distinguished',
  'game changer': '—',
  'next generation': '—',
  'disruptive': '—',
  // Casual / informal
  'hey': '—',
  'hi there': '—',
  'cool': '—',
  'awesome': '—',
  'super': '—',
  'super easy': '—',
  'easy peasy': '—',
  'no worries': '—',
  'boom': '—',
  'voila': '—',
  'ta-da': '—',
} as const;

/** Required terminology substitutions (canonical → display) */
export const REQUIRED_SUBSTITUTIONS: Record<string, string> = {
  'explorer': 'Executive Introduction',      // entry tier display name
  'free_assessment': 'complimentary assessment',
  'free preview': 'assessment preview',
  'trial user': 'Executive Introduction member',
  'trial period': 'Executive Introduction period',
  'basic plan': 'Starter tier',
  'enterprise plan': 'Executive tier',
  'premium plan': 'Pro tier',
  'sign up': 'create your profile',
  'log in': 'access your account',
  'login': 'access your account',
  'register': 'create your profile',
  'onboarding': 'profile setup',
  'user': 'member',
  'customer': 'client',
  'subscriber': 'member',
  'product': 'offering',
  'service': 'offering',
  'tool': 'instrument',
  'test': 'assessment',
  'quiz': 'assessment',
  'survey': 'assessment',
  'questionnaire': 'assessment',
  'score': 'result',
  'result page': 'assessment report',
  'report': 'assessment report',
} as const;

/** Pages that must pass brand compliance for Phase 2 */
export const PHASE2_SURFACES = [
  'assessment hub (/assessment, /assessment/:code)',
  'login / onboarding (/login, /signup → /create-profile)',
  'result page (/assessment/:code/results)',
  'pricing (/pricing)',
  'landing (/)',
  'NEXUS chat (/nexus/chat)',
] as const;

/**
 * Scan a string for banned words. Returns array of violations.
 * Usage: const violations = scanForBannedWords(someCopyText);
 */
export function scanForBannedWords(text: string): Array<{ word: string; suggestion: string }> {
  const lower = text.toLowerCase();
  const violations: Array<{ word: string; suggestion: string }> = [];
  for (const [banned, suggestion] of Object.entries(BANNED_WORDS)) {
    if (suggestion === '—') continue; // skip pure-ban words with no substitution
    const regex = new RegExp(`\\b${banned.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lower)) {
      violations.push({ word: banned, suggestion });
    }
  }
  return violations;
}
