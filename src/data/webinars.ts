/**
 * Webinar Data (T-204) — 24 webinar entries from CD18
 */

export interface WebinarEntry {
  slug: string;
  title: string;
  month: string;
  year: number;
  date: string; // YYYY-MM-DD
  time: string;
  linkedDiagnostic: string;
  linkedProgramme?: string;
  linkedWorkshop?: string;
  speaker: string;
  guest?: string;
  description: string;
  learnings: string[];
  status: 'upcoming' | 'past';
}

export const WEBINARS: WebinarEntry[] = [
  { slug: 'governance-shift-aug-2026', title: 'The Governance Shift', month: 'August', year: 2026, date: '2026-08-20', time: '10:00 SGT', linkedDiagnostic: 'BRIDGE', linkedProgramme: '/programmes/governance', linkedWorkshop: '/workshops/force-1-discovery', speaker: 'Kevin Hong', description: 'How board governance is fundamentally changing in APAC — and what it means for leaders navigating cross-border complexity.', learnings: ['The 3 governance models reshaping APAC boards', 'How to assess your board readiness', 'Cultural intelligence as a governance imperative', 'Building effective cross-border board structures'], status: 'upcoming' },
  { slug: 'board-governance-aug-2026-b', title: 'Building Board Resilience', month: 'August', year: 2026, date: '2026-08-27', time: '10:00 SGT', linkedDiagnostic: 'IMPACT', speaker: 'Kevin Hong', description: 'Practical frameworks for building board resilience in times of uncertainty.', learnings: ['Board composition strategies', 'Crisis governance playbooks', 'Succession planning at board level'], status: 'upcoming' },
  { slug: 'cross-border-teams-sep-2026', title: 'Leading Cross-Border Teams', month: 'September', year: 2026, date: '2026-09-17', time: '10:00 SGT', linkedDiagnostic: 'MOSAIC', linkedProgramme: '/programmes/cross-border', linkedWorkshop: '/workshops/team-cohesion', speaker: 'Kevin Hong', description: 'The art and science of leading teams that span cultures, time zones, and organizational boundaries.', learnings: ['Cultural intelligence frameworks for team leaders', 'Communication protocols for cross-border teams', 'Building trust across cultural divides'], status: 'upcoming' },
  { slug: 'cultural-integration-sep-2026', title: 'Cultural Integration in M&A', month: 'September', year: 2026, date: '2026-09-24', time: '10:00 SGT', linkedDiagnostic: 'BRIDGE', speaker: 'Kevin Hong', description: 'Why cultural integration determines M&A success — and how to get it right.', learnings: ['Cultural due diligence frameworks', 'Integration timeline strategies', 'Measuring cultural fit'], status: 'upcoming' },
  { slug: 'ai-ready-leadership-oct-2026', title: 'AI-Ready Leadership', month: 'October', year: 2026, date: '2026-10-15', time: '10:00 SGT', linkedDiagnostic: 'SPARK', linkedProgramme: '/programmes/ai-leadership', speaker: 'Kevin Hong', description: 'What AI-ready leadership looks like — and how to develop it in your organization.', learnings: ['AI leadership competencies', 'Building an AI-ready culture', 'Ethics and governance frameworks', 'Practical AI adoption roadmap'], status: 'upcoming' },
  { slug: 'ai-governance-oct-2026', title: 'AI Governance for Boards', month: 'October', year: 2026, date: '2026-10-22', time: '10:00 SGT', linkedDiagnostic: 'SPARK', speaker: 'Kevin Hong', description: 'Board-level AI governance — what directors need to know and ask.', learnings: ['AI risk frameworks for boards', 'Regulatory landscape overview', 'Questions directors should be asking'], status: 'upcoming' },
  { slug: 'revenue-architect-nov-2026', title: 'The Revenue Architect', month: 'November', year: 2026, date: '2026-11-19', time: '10:00 SGT', linkedDiagnostic: 'FORGE', linkedWorkshop: '/workshops/revenue-leadership', speaker: 'Kevin Hong', description: 'Moving from rainmaker to revenue architect — building predictable, scalable revenue engines.', learnings: ['Revenue architecture frameworks', 'From deal-by-deal to predictable pipeline', 'Team scaling strategies'], status: 'upcoming' },
  { slug: 'gtm-strategy-nov-2026', title: 'GTM Strategy for APAC', month: 'November', year: 2026, date: '2026-11-26', time: '10:00 SGT', linkedDiagnostic: 'FORGE', speaker: 'Kevin Hong', description: 'Designing go-to-market strategy for APAC\'s diverse markets.', learnings: ['Market prioritization frameworks', 'Channel strategy for APAC', 'Pricing across markets'], status: 'upcoming' },
  { slug: 'board-effectiveness-dec-2026', title: 'Board Effectiveness Masterclass', month: 'December', year: 2026, date: '2026-12-17', time: '10:00 SGT', linkedDiagnostic: 'IMPACT', speaker: 'Kevin Hong', description: 'What separates effective boards from ceremonial ones — and how to drive the shift.', learnings: ['Board effectiveness metrics', 'Driving board culture change', 'Strategic vs. compliance governance'], status: 'upcoming' },
  { slug: 'year-in-review-dec-2026', title: '2026 Leadership Year in Review', month: 'December', year: 2026, date: '2026-12-24', time: '10:00 SGT', linkedDiagnostic: 'SHIFT', speaker: 'Kevin Hong', description: 'Reflecting on the year\'s key leadership shifts and what they mean for 2027.', learnings: ['Key leadership trends of 2026', 'Emerging patterns for 2027', 'Strategic reflection framework'], status: 'upcoming' },
  { slug: 'leading-the-shift-jan-2027', title: 'Leading the SHIFT', month: 'January', year: 2027, date: '2027-01-21', time: '10:00 SGT', linkedDiagnostic: 'SHIFT', linkedProgramme: '/programmes/advisory', linkedWorkshop: '/workshops/shift-facilitation', speaker: 'Kevin Hong', description: 'The SHIFT composite profile — understanding your integrated leadership signature.', learnings: ['Composite leadership assessment', 'Cross-instrument pattern recognition', 'Integration strategies'], status: 'upcoming' },
  { slug: 'new-year-strategy-jan-2027', title: 'New Year, New Strategy', month: 'January', year: 2027, date: '2027-01-28', time: '10:00 SGT', linkedDiagnostic: 'QUEST', speaker: 'Kevin Hong', description: 'Strategic planning for the new year — with archetype-informed leadership.', learnings: ['Strategic planning frameworks', 'Aligning strategy with leadership style', 'Execution planning'], status: 'upcoming' },
  { slug: 'exec-presence-ai-age-feb-2027', title: 'Executive Presence in the AI Age', month: 'February', year: 2027, date: '2027-02-18', time: '10:00 SGT', linkedDiagnostic: 'QUEST', linkedProgramme: '/programmes/advisory', speaker: 'Kevin Hong', description: 'How AI is reshaping executive presence — and what leaders need to adapt.', learnings: ['Executive presence in digital-first environments', 'AI as a leadership amplifier', 'Authenticity in the age of AI'], status: 'upcoming' },
  { slug: 'personal-brand-feb-2027', title: 'Personal Brand for Technical Leaders', month: 'February', year: 2027, date: '2027-02-25', time: '10:00 SGT', linkedDiagnostic: 'PRISM', speaker: 'Kevin Hong', description: 'Building a personal brand when your expertise is technical and your audience is business.', learnings: ['Translation strategies', 'Content positioning', 'Building authority beyond your domain'], status: 'upcoming' },
  { slug: 'succession-illusion-mar-2027', title: 'The Succession Illusion', month: 'March', year: 2027, date: '2027-03-18', time: '10:00 SGT', linkedDiagnostic: 'DRIVE', linkedWorkshop: '/workshops/career-resilience', speaker: 'Kevin Hong', description: 'Why most succession plans fail — and what to build instead.', learnings: ['Why succession plans fail', 'Talent development alternatives', 'Building organizational resilience'], status: 'upcoming' },
  { slug: 'motivation-mastery-mar-2027', title: 'Motivation Mastery', month: 'March', year: 2027, date: '2027-03-25', time: '10:00 SGT', linkedDiagnostic: 'DRIVE', speaker: 'Kevin Hong', description: 'Understanding and harnessing motivational patterns for sustained performance.', learnings: ['Motivational pattern recognition', 'Sustaining drive without burnout', 'Team motivation strategies'], status: 'upcoming' },
  { slug: 'brand-identity-borderless-apr-2027', title: 'Brand Identity Borderless', month: 'April', year: 2027, date: '2027-04-15', time: '10:00 SGT', linkedDiagnostic: 'PRISM', linkedProgramme: '/programmes/advisory', speaker: 'Kevin Hong', description: 'Building a brand that works across borders, cultures, and contexts.', learnings: ['Cross-cultural brand adaptation', 'Consistency vs. localization', 'Digital brand strategy'], status: 'upcoming' },
  { slug: 'narrative-power-apr-2027', title: 'The Power of Executive Narrative', month: 'April', year: 2027, date: '2027-04-22', time: '10:00 SGT', linkedDiagnostic: 'PRISM', speaker: 'Kevin Hong', description: 'How to build and deploy a compelling executive narrative.', learnings: ['Narrative architecture', 'Story structures for leaders', 'Deploying narrative across channels'], status: 'upcoming' },
  { slug: 'integrated-leader-may-2027', title: 'The Integrated Leader', month: 'May', year: 2027, date: '2027-05-20', time: '10:00 SGT', linkedDiagnostic: 'SHIFT', linkedProgramme: '/programmes/advisory', speaker: 'Kevin Hong', description: 'What it means to lead with integration — across functions, cultures, and identities.', learnings: ['Integration as leadership capability', 'Breaking functional silos', 'Identity integration for leaders'], status: 'upcoming' },
  { slug: 'leap-framework-may-2027', title: 'The LEAP Framework', month: 'May', year: 2027, date: '2027-05-27', time: '10:00 SGT', linkedDiagnostic: 'SHIFT', speaker: 'Kevin Hong', description: 'Introducing the LEAP framework for leadership development.', learnings: ['LEAP framework overview', 'Application to personal development', 'Team implementation'], status: 'upcoming' },
  { slug: 'career-resilience-jun-2027', title: 'Career Resilience in Uncertain Times', month: 'June', year: 2027, date: '2027-06-17', time: '10:00 SGT', linkedDiagnostic: 'DRIVE', linkedWorkshop: '/workshops/career-resilience', speaker: 'Kevin Hong', description: 'Building career resilience when the ground keeps shifting.', learnings: ['Resilience frameworks', 'Career portfolio thinking', 'Network as resilience infrastructure'], status: 'upcoming' },
  { slug: 'navigating-change-jun-2027', title: 'Navigating Organizational Change', month: 'June', year: 2027, date: '2027-06-24', time: '10:00 SGT', linkedDiagnostic: 'QUEST', speaker: 'Kevin Hong', description: 'Leading organizational change when you are also changing.', learnings: ['Change leadership models', 'Personal change management', 'Organizational change architecture'], status: 'upcoming' },
  { slug: 'council-launch-jul-2027', title: 'The Invitation Council Launch', month: 'July', year: 2027, date: '2027-07-15', time: '10:00 SGT', linkedDiagnostic: 'All 9', speaker: 'Kevin Hong', description: 'Introducing The Invitation Council — a peer network for APAC\'s most impactful leaders.', learnings: ['Council vision and mission', 'Membership model', 'Founding member benefits', 'How to apply'], status: 'upcoming' },
  { slug: 'community-roundtable-jul-2027', title: 'Community & Roundtable Preview', month: 'July', year: 2027, date: '2027-07-22', time: '10:00 SGT', linkedDiagnostic: 'SHIFT', speaker: 'Kevin Hong', description: 'Preview of the community offerings and roundtable format.', learnings: ['Community model', 'Roundtable format', 'Engagement opportunities'], status: 'upcoming' },
];

export function getWebinarBySlug(slug: string): WebinarEntry | undefined {
  return WEBINARS.find(w => w.slug === slug);
}

export function getUpcomingWebinars(): WebinarEntry[] {
  return WEBINARS.filter(w => w.status === 'upcoming');
}

export function getNextWebinars(count: number): WebinarEntry[] {
  return getUpcomingWebinars().slice(0, count);
}
