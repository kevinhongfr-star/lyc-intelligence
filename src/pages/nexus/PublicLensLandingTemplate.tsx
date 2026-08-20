import React from 'react';
import { Link } from 'react-router-dom';
import { V1 } from '@/styles/v1-tokens';

type LensSEOContent = {
  code: string;
  name: string;
  pillar: string;
  tagline: string;
  whatItMeasures: string[];
  howItWorks: { num: string; title: string; body: string }[];
  whatYouGet: string[];
  sampleInsight: string;
  dimensionTeaser: { name: string; description: string }[];
  whoItsFor: string[];
  cta: string;
};

const LENS_DATA: Record<string, LensSEOContent> = {
  prism: {
    code: 'PRISM',
    name: 'Professional Branding',
    pillar: 'Strategic & Organizational Impact',
    tagline: 'See how the world sees your professional brand — and close the gap between perception and ambition.',
    whatItMeasures: [
      'PRISM maps five core dimensions of your professional brand: Brand Clarity, Market Legibility, Identity Consistency, Narrative Power, and Visibility Level. Together these form a complete picture of how you present yourself to the world — and how that world receives you.',
      'The diagnostic is grounded in a 3×3 grid model with Visibility on the vertical axis and Brand Consistency / Narrative Alignment on the horizontal. Your responses position you within this grid, surfacing one of ten distinct professional brand archetypes.',
      'Unlike self-report personality instruments, PRISM focuses on external perception and market positioning. The questions ask not who you are, but how you show up — in meetings, on LinkedIn, in client conversations, and across the channels where your professional brand lives.',
    ],
    howItWorks: [
      { num: '1', title: 'Answer 30 situational questions', body: 'Each question presents a real professional scenario — a board meeting, a LinkedIn post, a client conversation. You rate your current behavior on a 5-point Likert scale. There are no right answers; the goal is an honest baseline.' },
      { num: '2', title: 'Dimension scoring across five axes', body: 'Your responses are aggregated per dimension (six questions each) to produce percentile scores. The algorithm normalizes for response bias and cross-checks internal consistency so the readout reflects a coherent profile, not random noise.' },
      { num: '3', title: 'Archetype mapping on the 3×3 grid', body: 'Your Visibility score and Consistency / Narrative score place you on the structural grid. The nearest archetype cell is selected, and if you sit between cells, the readout surfaces both your primary archetype and adjacent tendencies.' },
      { num: '4', title: 'Prioritized actions delivered as a readout', body: 'Within minutes you receive a structured readout: dimension scores, archetype narrative, the three moves that will move your position most, and channel-specific playbooks. You can revisit, share, or discuss the readout with a coach at any time.' },
    ],
    whatYouGet: [
      'Your five-dimension brand profile with percentile scores across all dimensions',
      'Your personal brand archetype (one of ten) with a narrative profile and quadrant position',
      'Three high-priority growth moves tailored to your archetype and dimension gaps',
      'A visibility × consistency 2×2 matrix plot showing your current position',
      'A shareable one-page readout you can send to your coach, mentor, or team',
    ],
    sampleInsight: 'Your narrative consistency scores in the 72nd percentile, but your Visibility lands at the 28th — meaning the quality of what you communicate is high, but too few people are hearing it. The single most impactful move for your brand is not refining your message, but multiplying its reach.',
    dimensionTeaser: [
      { name: 'Brand Clarity', description: 'How crisp and unambiguous your core positioning is across contexts.' },
      { name: 'Market Legibility', description: 'How easily an outsider can place your value proposition and level.' },
      { name: 'Identity Consistency', description: 'The alignment between how you show up across different channels and audiences.' },
    ],
    whoItsFor: [
      'Mid-to-senior professionals who want to understand and shape how they are perceived by peers, reports, and the broader market',
      'Founders and consultants whose personal brand is a core business asset — where positioning directly drives pipeline and pricing',
      'Leaders in career transition who need to reframe their narrative for a new role, industry, or geography',
    ],
    cta: 'Start this lens',
  },
  cpi: {
    code: 'CPI',
    name: 'China Presence Index',
    pillar: 'Geographic & Market Expansion',
    tagline: 'A diagnostic for leaders and firms building a credible, sustainable position in the China market.',
    whatItMeasures: [
      'CPI measures four dimensions of China market readiness: Entity & Regulatory Footprint, Stakeholder Network Density, Localized Value Proposition, and Operational China Capability. Together they describe how real, how deep, and how defensible your China position actually is.',
      'The index uses a weighted scoring model benchmarked against 200+ foreign firms operating in China across professional services, industrials, consumer, and tech. Scores are benchmarked by sector so you understand your position relative to peers, not against an abstract absolute.',
      'Beyond the headline index, CPI surfaces the specific binding constraint — the single dimension where incremental investment unlocks disproportionate gains. For many firms this is not entity structure or licensing, but stakeholder network density.',
    ],
    howItWorks: [
      { num: '1', title: '42 structured questions across four pillars', body: 'Questions are factual wherever possible — entity type, years onshore, headcount, client roster, advisor network — combined with judgment items on localization depth and regulatory posture. Estimated completion: 18–22 minutes.' },
      { num: '2', title: 'Weighted scoring with sector benchmarks', body: 'Responses are scored against the CPI reference dataset. Your raw score is normalized to a 0–100 index, then compared against the sector peer band so you know whether a 62 is strong, average, or weak for your industry.' },
      { num: '3', title: 'Binding constraint identification', body: 'The model runs a constraint analysis across the four pillars, identifying which dimension — if improved by 15 points — would move the overall index furthest. This becomes the primary focus of the action plan.' },
      { num: '4', title: 'Readout with a 12-month roadmap', body: 'The deliverable is a structured readout: headline index, four-dimension breakdown, peer comparison chart, binding constraint diagnosis, and a sequenced 12-month roadmap with specific, costed actions.' },
    ],
    whatYouGet: [
      'Headline CPI score (0–100) with sector percentile and peer band positioning',
      'Four-dimension breakdown with sub-scores, gap flags, and benchmark notes',
      'Binding constraint diagnosis with a why-this-matters explanation',
      'A sequenced 12-month action roadmap with specific milestones and budget estimates',
      'A printable one-page board summary for internal stakeholder alignment',
    ],
    sampleInsight: 'Your entity and regulatory footprint scores 71 — well above the sector median of 53 — but your Localized Value Proposition lands at 34, making it the binding constraint. The market sees a compliant foreign firm, not a firm that understands Chinese customers. Redesigning three core service lines for onshore context will move your overall index further than adding two more cities or a second WFOE.',
    dimensionTeaser: [
      { name: 'Entity & Regulatory Footprint', description: 'The depth, structure, and compliance posture of your onshore legal presence.' },
      { name: 'Stakeholder Network Density', description: 'The quality and connectedness of your client, advisor, and institutional relationships.' },
      { name: 'Localized Value Proposition', description: 'How adapted your core offering is to domestic demand patterns and decision cycles.' },
    ],
    whoItsFor: [
      'Foreign firms with an existing China presence that want a structured assessment of their position relative to peers and competitors',
      'Leadership teams planning a first China entry who need a baseline before committing capital or structure',
      'Regional heads and GMs preparing for a board review, strategy reset, or investment case for China',
    ],
    cta: 'Start this lens',
  },
  leap: {
    code: 'LEAP',
    name: 'Leadership Execution Agility Profile',
    pillar: 'Executive Performance',
    tagline: 'Measure how well your leadership style converts intent into action, under pressure and across contexts.',
    whatItMeasures: [
      'LEAP examines four pillars of execution agility: Decision Velocity vs. Rigor, Stakeholder Alignment Speed, Course-Correction Resilience, and Operational Follow-Through Cadence. The profile contrasts intent with actual execution patterns, surfacing where friction lives.',
      'The diagnostic uses a paired-response model: self-assessment plus, where available, a rater view from a direct report or peer. The delta between self-perception and observed behavior is often the most useful output — and a reliable predictor of derailment risk.',
      'LEAP is benchmarked against a dataset of 450+ executives in PE-backed, founder-led, and large-cap organizations. Different archetypes score differently by context; what constitutes "agile" for a Series B founder is not the same as for a Fortune 500 SVP.',
    ],
    howItWorks: [
      { num: '1', title: 'Self-assessment + optional rater input', body: 'You complete 36 questions across the four LEAP pillars. Optionally, invite up to three raters — a direct report, a peer, a boss — for a 12-question observer version. The instrument is designed so self-only still produces a valid readout.' },
      { num: '2', title: 'Agility scoring with archetype classification', body: 'Raw responses are normalized and classified into one of seven LEAP archetypes: The Decider, The Architect, The Orchestrator, The Closer, The Experimenter, The Stabilizer, and The Unaligned. Archetypes are descriptive, not evaluative.' },
      { num: '3', title: 'Friction map across the execution chain', body: 'The model constructs a step-by-step execution chain — signal → decision → alignment → action → review — and identifies which step currently generates the most friction for your style. This is your primary intervention point.' },
      { num: '4', title: 'Readout with a targeted development plan', body: 'Within five business days you receive the full readout: archetype narrative, four-pillar scores, self-rater delta if applicable, friction map, and a 90-day development plan with three specific practice changes and two accountability mechanisms.' },
    ],
    whatYouGet: [
      'Your LEAP archetype with a narrative profile and context-fit assessment',
      'Four-pillar percentile scores with commentary on strengths and liabilities',
      'Execution chain friction map highlighting your primary bottleneck step',
      'Self-rater gap analysis if observer input was included',
      'A 90-day development plan with specific practices, not generic advice',
    ],
    sampleInsight: 'You classify as The Architect — strong on Decision Rigor (89th percentile) but Stakeholder Alignment Speed lands at the 23rd. Your decisions are right more often than not, but the organization moves on them slowly because people were not brought along early enough. Shifting three decision points from "decide then announce" to "align then decide" will move your execution throughput more than any improvement to analysis quality.',
    dimensionTeaser: [
      { name: 'Decision Velocity × Rigor', description: 'How you trade off speed and analytical depth, and whether the tradeoff fits your context.' },
      { name: 'Stakeholder Alignment Speed', description: 'How quickly you get the right people bought in before and after a decision.' },
      { name: 'Course-Correction Resilience', description: 'How readily you revise a plan once new information arrives, vs. committing to the sunk path.' },
    ],
    whoItsFor: [
      'Executives at the director-to-partner level who know their execution has friction but cannot pinpoint where',
      'Founders scaling through the 50–200 headcount band, where their personal execution style is becoming a bottleneck for the organization',
      'Leaders preparing for a promotion into a larger role, wanting to understand which execution habits will carry forward and which will need to change',
    ],
    cta: 'Start this lens',
  },
  impact: {
    code: 'IMPACT',
    name: 'Influence & Presence Audit',
    pillar: 'Interpersonal & Stakeholder Leadership',
    tagline: 'A precise diagnostic of how your presence lands in high-stakes rooms — and where to invest to move the needle.',
    whatItMeasures: [
      'IMPACT measures five dimensions of interpersonal influence: Gravitas & Room Presence, Verbal Command & Framing, Listening & Attunement, Written Persuasion Quality, and Reputational Preceding. These combine to describe not just how you come across, but how decisively your input shapes outcomes.',
      'The diagnostic is unique in that it asks for specific behavioral recall rather than self-rating. Rather than "Are you a good listener?" the question describes a recent meeting scenario and asks what you actually did. This reduces self-enhancement bias substantially.',
      'IMPACT is benchmarked against a senior-executive sample. What reads as "strong" for an individual contributor is often the middle of the distribution at partner / MD / board level. The readout is anchored to the room you actually operate in, not the one you came from.',
    ],
    howItWorks: [
      { num: '1', title: '40 behaviorally anchored questions', body: 'Questions reference concrete situations: a board presentation, a difficult 1:1, a written memo to the exec team, a meeting where you were the most junior person. Estimated completion time: 14–18 minutes. Optionally, invite two raters.' },
      { num: '2', title: 'Five-dimension scoring with benchmarking', body: 'Each dimension produces a raw score, then benchmark percentiles against the senior-executive reference sample. Benchmarking adjusts for role level, industry, and typical meeting size so comparisons are meaningful.' },
      { num: '3', title: 'Signature strength + primary blind spot', body: 'The model identifies your single strongest dimension — the one that reliably opens doors for you — and the dimension where self-perception most outruns likely observer perception. This pair is the core of the development readout.' },
      { num: '4', title: 'Structured readout + coaching prompt set', body: 'The deliverable includes the dimension profile, signature strength narrative, primary blind spot diagnosis, and a set of 12 specific prompts to use with an executive coach or trusted peer to turn the readout into action.' },
    ],
    whatYouGet: [
      'Five-dimension IMPACT profile with benchmark percentiles and written interpretation',
      'Signature strength narrative — the interpersonal asset that most consistently works for you',
      'Primary blind spot diagnosis with likely observer reactions and cost-to-career estimate',
      'Three high-impact micro-practices for the next 90 days, each testable in a single meeting',
      'A 12-question coaching prompt set to structure a debrief conversation',
    ],
    sampleInsight: 'Verbal Command & Framing is your signature strength — 91st percentile. But Written Persuasion Quality lands at the 38th, and this is the gap that matters. People leave the room persuaded by what you said, then read the memo afterward and soften their position because the written case does not carry the same weight. Rebuilding your memo template around the same framing structure you use verbally will extend your influence well beyond the rooms you are actually in.',
    dimensionTeaser: [
      { name: 'Gravitas & Room Presence', description: 'How your physical bearing, silence, and timing shape a room independent of what you say.' },
      { name: 'Verbal Command & Framing', description: 'The structure, economy, and rhetorical force of your spoken contributions.' },
      { name: 'Listening & Attunement', description: 'How accurately you read a room and adjust your position based on what is not being said.' },
    ],
    whoItsFor: [
      'Senior leaders who regularly operate in high-stakes rooms — boards, investment committees, client pitches — and want a precise read on how they land',
      'Partners and MDs preparing for a specific high-stakes moment: a fundraising round, a regulatory hearing, a keynote',
      'Professionals who have been told "great presence, hard to describe" and want something more specific to work with',
    ],
    cta: 'Start this lens',
  },
  spark: {
    code: 'SPARK',
    name: 'Innovation Readiness',
    pillar: 'Strategic & Organizational Impact',
    tagline: 'Measure your organization\'s actual capacity to innovate — not stated intent, but structural capability.',
    whatItMeasures: [
      'SPARK measures four pillars of innovation readiness: Idea Flow Quality, Experimentation Infrastructure, Resource Slack & Allocation, and Top-Team Innovation Sponsorship. Unlike culture surveys, SPARK asks about observable structures and behaviors, not feelings or aspirations.',
      'The diagnostic distinguishes between "innovation theater" and genuine capability. Many organizations score well on stated intent — workshops, hackathons, mission statements — but poorly on the structural enablers that actually let new ideas survive: protected budgets, safe-to-fail experiments, governance that tolerates early-stage ambiguity.',
      'SPARK is benchmarked across 300+ organizations from pre-Series-B to F500, with sector-specific bands. Innovation readiness means very different things for a semiconductor firm than for a consumer brand; the readout accounts for this.',
    ],
    howItWorks: [
      { num: '1', title: '48 questions across four structural pillars', body: 'Questions are concrete and disprovable: "In the last 12 months, how many experiments were killed early with no career consequence?" "What proportion of this year\'s budget was allocated to initiatives without a fully-baked ROI case?" Estimated completion: 22–28 minutes.' },
      { num: '2', title: 'Pillar scoring with theater vs. capability split', body: 'Within each pillar, responses are separated into "signal items" (structural things that reliably correlate with innovation output) and "theater items" (activities frequently mistaken for capability). The readout shows both your true score and your apparent score — the delta is usually the most interesting part.' },
      { num: '3', title: 'Innovation phase mapping', body: 'The model classifies your organization into one of five innovation maturity phases: Dormant, Aspirational, Experimental, Systematic, Scaling. The phase classification determines which interventions are actually viable now vs. which feel appealing but will fail because the ground is not prepared.' },
      { num: '4', title: 'Readout with a sequenced build plan', body: 'You receive the four-pillar profile, theater-vs-capability delta, phase classification, and an 18-month build plan sequenced by phase prerequisite — the things that have to be in place before the things you probably want to do first.' },
    ],
    whatYouGet: [
      'Four-pillar SPARK profile with benchmark scores and interpretation',
      'Theater vs. capability delta — the gap between what looks like innovation and what actually produces it',
      'Phase classification with a "what is viable right now" checklist',
      'Sequenced 18-month build plan with specific structural moves, ordered by prerequisite',
      'A board-level summary deck template for presenting the case internally',
    ],
    sampleInsight: 'Your Idea Flow Quality scores 74 — well above the sector median. Experimentation Infrastructure is at 19, and this is the binding constraint. Ideas are plentiful; what you lack are the safe containers for them to fail cheaply. Before you run another ideation offsite or hire a Chief Innovation Officer, stand up three experiment cells with protected budget, explicit kill criteria, and career cover for the people running them. That single structural change will move output more than anything else you can do this year.',
    dimensionTeaser: [
      { name: 'Idea Flow Quality', description: 'How readily good ideas surface from the edges, and whether they reach decision-makers intact.' },
      { name: 'Experimentation Infrastructure', description: 'The structural containers — budgets, governance, kill criteria — that let ideas be tested cheaply.' },
      { name: 'Resource Slack & Allocation', description: 'Whether time and money are actually available for unproven things, or are fully consumed by BAU.' },
    ],
    whoItsFor: [
      'CEOs and COOs who know their organization under-innovates but have not been able to pinpoint why past initiatives fizzled',
      'Chief Innovation Officers and heads of R&D who need a structured baseline before proposing the next round of investment',
      'Boards and investors conducting diligence on the innovation capacity of a portfolio company or acquisition target',
    ],
    cta: 'Start this lens',
  },
  bridge: {
    code: 'BRIDGE',
    name: 'Cross-Cultural Competence',
    pillar: 'Interpersonal & Stakeholder Leadership',
    tagline: 'Understand how well you operate across cultural boundaries — and where the most costly missteps happen.',
    whatItMeasures: [
      'BRIDGE measures four dimensions of cross-cultural effectiveness: Contextual Frame Switching, Hierarchy & Form Tuning, Communication Style Adaptation, and Trust-Building Across Thresholds. The profile describes not just awareness but demonstrated behavioral flexibility.',
      'A core finding of cross-cultural research is that intelligence and competence do not transfer across contexts automatically. A person who is a high-performing negotiator in one setting can be a below-average negotiator in another simply because they misread silence, pace, or the role of relationship-building. BRIDGE surfaces these specific patterns.',
      'The diagnostic uses scenario-based questions grounded in real executive situations: a first meeting in Tokyo, a budget negotiation in Berlin, a project kickoff in Lagos, a conflict resolution call with a team in Bangalore. The responses reveal default patterns rather than stated values.',
    ],
    howItWorks: [
      { num: '1', title: '36 scenario-based questions across 12 cultural contexts', body: 'Each question describes a specific cross-cultural situation and asks what you would actually do, not what you believe. The instrument balances East / West / Global South contexts and covers both in-person and remote interactions.' },
      { num: '2', title: 'Dimension scoring with cultural gap analysis', body: 'Your responses produce scores across the four BRIDGE dimensions. The model then compares your default behaviors against the modal norms in three contexts you indicate you operate in most. The specific gaps become the focus of the readout.' },
      { num: '3', title: 'Costliest-misstep identification', body: 'The model identifies the single most costly misstep pattern you are likely to make — not the one you are worst at broadly, but the one that carries the highest downside in the contexts you actually work in.' },
      { num: '4', title: 'Readout with per-context action cards', body: 'You receive the dimension profile, your cultural gap analysis, the costliest-misstep diagnosis, and a set of action cards — one for each of your primary operating contexts — with concrete pre-meeting prompts and in-meeting heuristics.' },
    ],
    whatYouGet: [
      'Four-dimension BRIDGE profile with interpretation relative to the executive reference sample',
      'Context-specific gap analysis for up to three of your primary operating cultures',
      'Costliest-misstep identification with specific scenario examples and downside estimates',
      'A set of action cards with pre-meeting and in-meeting prompts for each context',
      'A 60-day practice plan with one behavioral experiment per week',
    ],
    sampleInsight: 'In your US / UK operating contexts, your Communication Style Adaptation is in the 78th percentile — direct, concise, appropriately confrontational. In your Japan context, the same style maps to the 12th percentile of locally appropriate behavior. Specifically, your default pattern of surfacing disagreement openly in a first meeting is reliably read as disrespect rather than rigor. A three-second pause before responding and shifting disagreement to after-meeting channels will change outcomes in Japan more than any content-level adjustment you can make.',
    dimensionTeaser: [
      { name: 'Contextual Frame Switching', description: 'How readily you shift the implicit assumptions you use to interpret a situation.' },
      { name: 'Hierarchy & Form Tuning', description: 'How appropriately you adjust your deference, directness, and protocol by context.' },
      { name: 'Communication Style Adaptation', description: 'How you adjust pace, directness, silence, and storytelling to match the room.' },
    ],
    whoItsFor: [
      'Leaders who manage distributed teams across three or more cultural contexts and feel something is getting lost in translation but cannot name what',
      'Professionals relocating for an international assignment who want concrete pre-departure grounding beyond generic country briefings',
      'Global account managers and business development leads whose hit rate varies dramatically by region, suggesting a cultural fit issue',
    ],
    cta: 'Start this lens',
  },
  mosaic: {
    code: 'MOSAIC',
    name: 'Team & Stakeholder Dynamics',
    pillar: 'Organizational & Team Performance',
    tagline: 'Map the real political and relational structure of your team — beyond the org chart.',
    whatItMeasures: [
      'MOSAIC produces a network map of your team or stakeholder group across four dimensions: Information Flow Centrality, Decision Influence Clusters, Trust & Psychological Safety Bands, and Alignment Fracture Lines. The output is a structural map, not a survey summary.',
      'Most team interventions are based on org charts and stated values. MOSAIC starts from the premise that real influence, information, and trust follow informal networks that rarely match the formal structure. An org chart tells you who reports to whom; a MOSAIC map tells you who actually talks to whom, who people trust, and where decisions really get made.',
      'The diagnostic is a multi-respondent instrument. A single leader can complete a version for a baseline, but the full value comes when 8–24 members of a team or stakeholder group each complete the 22-question network survey, and the readout aggregates the responses.',
    ],
    howItWorks: [
      { num: '1', title: 'Single-leader baseline or full multi-respondent network survey', body: 'You can run MOSAIC as a 28-question leader-only instrument for a baseline, or set up a multi-respondent survey for 8–24 team / stakeholder members. The multi-respondent version asks each person about their actual communication, decision, and trust relationships with every other person.' },
      { num: '2', title: 'Network graph construction across four dimensions', body: 'Responses are aggregated into a directed graph for each dimension. Nodes are people; edges are relationships with strength and direction. The graphs are layered to produce the composite MOSAIC map, with algorithms to identify central nodes, bridges, isolates, and fracture lines.' },
      { num: '3', title: 'Structural diagnosis: bottlenecks, bridges, silos', body: 'The model identifies the specific structural patterns that are shaping outcomes: a single information bottleneck, two trust clusters with no bridge, an influence node that does not match the formal role, an isolate carrying a critical function.' },
      { num: '4', title: 'Readout + a team offsite agenda template', body: 'You receive the full MOSAIC map (presented as anonymized structural findings unless the group opts for attribution), a structural diagnosis, three recommended interventions, and a half-day team-offsite agenda template designed to surface and address the findings productively.' },
    ],
    whatYouGet: [
      'A composite MOSAIC network map plus four individual dimension maps (information, decision, trust, alignment)',
      'Structural pattern diagnosis: bottleneck nodes, bridge roles, trust clusters, fracture lines, isolates',
      'Three prioritized structural interventions with expected impact and implementation guidance',
      'A half-day team-offsite agenda template with scripts, exercises, and facilitation notes',
      'A 90-day check-in protocol to measure whether the structural patterns have actually shifted',
    ],
    sampleInsight: 'The MOSAIC map identifies Person C as the single information bottleneck for the group — 71% of all cross-silo communication routes through them, even though they are not the most senior person. This is not a trust problem and not a decision-structure problem; it is an information flow problem. The most consequential intervention is not training or a restructure — it is moving two recurring meetings from C-facilitated to rotating-facilitated, and adding C to the CC list of four existing report streams. This reduces C\'s betweenness centrality by an estimated 38% without changing anyone\'s role.',
    dimensionTeaser: [
      { name: 'Information Flow Centrality', description: 'Who sits on the shortest path between any two people who need to share information.' },
      { name: 'Decision Influence Clusters', description: 'The informal groups within which decisions actually crystallize, which may cross formal lines.' },
      { name: 'Trust & Psychological Safety Bands', description: 'The sub-groupings within which people will say what they actually think before the meeting ends.' },
    ],
    whoItsFor: [
      'Team leads and functional heads who sense their team underperforms not for lack of talent but because of how people do or do not connect',
      'Executives inheriting an existing team and wanting a structural map before making changes, rather than relying on 1:1 first impressions',
      'Program managers coordinating a cross-functional initiative with 8–24 stakeholders and recurring alignment failures',
    ],
    cta: 'Start this lens',
  },
  drive: {
    code: 'DRIVE',
    name: 'Motivation & Decision Style',
    pillar: 'Executive Performance',
    tagline: 'A precise map of what actually drives you — and how your decision pattern shapes every outcome.',
    whatItMeasures: [
      'DRIVE combines two reference models: a six-factor motivation profile derived from self-determination theory and regulatory focus, and a four-quadrant decision style model. The result is a profile that explains both why you choose what you choose, and how you go about choosing it.',
      'The six motivation factors are: Autonomy, Mastery, Purpose, Security, Status, and Social Bonding. Everyone draws on all six, but the weighting — and the internal tradeoffs you default to under pressure — varies enormously between high performers and predicts career satisfaction far better than competence alone.',
      'The decision style quadrant crosses Reflective × Impulsive on the horizontal axis with Maximizer × Satisficer on the vertical. Most people know intuitively whether they are fast or slow deciders; far fewer know their maximizer-satisficer axis and how it interacts with speed to create specific failure modes.',
    ],
    howItWorks: [
      { num: '1', title: '42 forced-choice and scenario questions', body: 'The instrument combines forced-choice motivation tradeoff questions ("Would you rather take a role with more autonomy but less security, or the reverse?") with scenario-based decision-style items. Estimated completion: 14–18 minutes.' },
      { num: '2', title: 'Six-factor motivation profile + style quadrant plot', body: 'Responses produce a six-bar motivation profile with relative weights and a 2×2 quadrant plot for decision style. Pressure-test items reveal how both profiles shift under stress — the stressed profile is usually the more accurate predictor of real behavior.' },
      { num: '3', title: 'Motivation-decision interaction diagnosis', body: 'The model analyzes how your decision style interacts with your dominant motivation factors to create characteristic patterns. A maximizer driven by Status fails differently from a maximizer driven by Mastery; the corrective action is different for each.' },
      { num: '4', title: 'Readout with a career-alignment + decision-tuning plan', body: 'You receive both profiles, the interaction diagnosis, a current-role alignment check (how well your role feeds your dominant motivators), a decision-tuning plan with specific de-biasing prompts, and a set of career direction questions to work through with a mentor or coach.' },
    ],
    whatYouGet: [
      'Six-factor DRIVE motivation profile with baseline and under-stress weightings',
      '2×2 decision style quadrant plot with pressure-shift commentary',
      'Motivation-decision interaction diagnosis with your characteristic success and failure patterns',
      'Current-role alignment check with quantified gap and specific rebalancing levers',
      'A set of decision-tuning prompts pre-populated to your specific bias combination',
    ],
    sampleInsight: 'Your dominant motivation factors are Mastery (34% weighting) and Autonomy (28%). Status is fourth at 11%. On the decision axis you are a Reflective Maximizer. The interaction: your Mastery drive makes you an unusually thorough analyst, but your Maximizer pattern in combination means you defer close decisions waiting for information that, in reality, would not change your choice. Under stress, Autonomy rises further — you pull decisions inward rather than delegating. The adjustment: for decisions above a certain threshold, impose a self-enforced "decide at 70% information" rule, and for decisions below it, explicitly delegate to someone with a Satisficer default.',
    dimensionTeaser: [
      { name: 'Motivation Factors', description: 'Relative weighting of Autonomy, Mastery, Purpose, Security, Status, Social Bonding — baseline and under stress.' },
      { name: 'Decision Speed Axis', description: 'Reflective × Impulsive — how you trade off time-to-decision against information completeness.' },
      { name: 'Decision Thoroughness Axis', description: 'Maximizer × Satisficer — how close to "optimal" you need a decision to be before you can live with it.' },
    ],
    whoItsFor: [
      'High achievers who are objectively successful but feel a persistent misalignment between what they do and what actually energizes them',
      'Professionals facing a career crossroad — stay, change, step back, start something — who want a structured profile rather than going on intuition',
      'Executives working with an executive coach who want to accelerate the self-understanding phase of the engagement',
    ],
    cta: 'Start this lens',
  },
  quest: {
    code: 'QUEST',
    name: 'Narrative & Personal Storytelling',
    pillar: 'Personal & Professional Identity',
    tagline: 'Map the stories you tell about yourself — their coherence, their power, and where they are holding you back.',
    whatItMeasures: [
      'QUEST measures four dimensions of personal narrative: Origin Story Coherence, Arc Definition & Tension, Audience Resonance Tuning, and Value / Mission Integration. Together they describe whether the story you tell about yourself does the work you need it to do — for hiring, fundraising, promotion, or leadership.',
      'The diagnostic is built on the finding that narrative coherence is a stronger predictor of perceived leadership ability than any single content element. People do not judge your story by whether it is impressive on paper; they judge it by whether it hangs together — whether there is a through-line, a tension, a choice, and an arc from past to present to future.',
      'QUEST distinguishes between Internal and External narrative. Your internal narrative is the story you tell yourself about why you do what you do. Your external narrative is the version you present to others. Misalignment between the two creates the specific feeling of "faking it" that many high achievers experience regardless of objective success.',
    ],
    howItWorks: [
      { num: '1', title: 'Written response + structured prompts', body: 'QUEST opens with three open-ended written prompts — tell the story of how you got here, describe a turning point, describe where you are going — followed by 30 structured items about audience, tension, coherence, and value integration. Writing time: 25–35 minutes total.' },
      { num: '2', title: 'Written response analysis + structured scoring', body: 'The open-ended responses are analyzed for coherence markers, arc structure, tension presence, character voice, and value language. This is combined with the structured items to produce the four-dimension profile. A trained narrative analyst reviews every full QUEST submission.' },
      { num: '3', title: 'Internal-external alignment diagnosis', body: 'The structured items include matched internal and external pairs, allowing the readout to quantify alignment between the story you tell yourself and the story you present to the world. The specific misalignments are usually more actionable than the overall score.' },
      { num: '4', title: 'Readout + a narrative revision playbook', body: 'You receive the four-dimension profile, a line-level annotated excerpt of your own writing, the internal-external alignment diagnosis, and a narrative revision playbook with four specific rewrites — two for internal clarity, two for external presentation.' },
    ],
    whatYouGet: [
      'Four-dimension QUEST profile with written interpretation of strengths and gaps',
      'Annotated excerpts of your written responses with specific line-level commentary',
      'Internal-external narrative alignment score with identified specific misalignments',
      'A narrative revision playbook: four specific rewriting exercises tailored to your profile',
      'A two-version template: a 90-second verbal story for interviews, and a one-paragraph written story for bios and cover letters',
    ],
    sampleInsight: 'Your Origin Story Coherence scores in the 83rd percentile — there is a clear, believable through-line from your early choices to today. But Arc Definition & Tension lands at the 31st. The story you tell is coherent but flat; it describes a sequence of events without a central struggle or choice that readers or listeners can invest in. The single most consequential revision is to pull one specific turning-point decision — where you chose a harder path over an easier one — into the opening of every version of the story, before the chronology begins. This one structural change will change how people experience the rest of it.',
    dimensionTeaser: [
      { name: 'Origin Story Coherence', description: 'How believably and clearly the early parts of your story connect to who you are now.' },
      { name: 'Arc Definition & Tension', description: 'Whether the story has a shape — struggle, choice, turning — rather than being a flat chronology.' },
      { name: 'Audience Resonance Tuning', description: 'How well you tailor story specificity, vulnerability, and jargon to the audience you are speaking to.' },
    ],
    whoItsFor: [
      'Leaders preparing for a specific high-stakes narrative moment — a CEO transition, a fundraising round, a keynote, a book proposal',
      'Professionals in career transition who know their current story no longer fits where they are going but are not sure what to replace it with',
      'Founders who give the same pitch ten times a week and sense it is technically accurate but not moving people',
    ],
    cta: 'Start this lens',
  },
  coach: {
    code: 'COACH',
    name: 'Coachability & Feedback Orientation',
    pillar: 'Personal & Professional Identity',
    tagline: 'A diagnostic of how well you receive, process, and act on input — the single highest ROI skill for long-term growth.',
    whatItMeasures: [
      'COACH measures four dimensions of coachability: Feedback Receptivity (defensiveness profile), Translation Speed (input to action), Seeking Proactivity (how you find input beyond what comes to you), and Source Weighting (how you weigh feedback by who it comes from). Together these predict how much value you will extract from any development intervention — coaching, mentoring, 360s, training.',
      'Coachability is the most powerful meta-skill for executive development because it amplifies everything else. A highly coachable B performer will outgrow a less coachable A performer over almost any time horizon longer than 18 months. Yet coachability is almost never explicitly measured or developed; it is treated as a personality trait rather than a learnable skill set.',
      'The diagnostic distinguishes between stated coachability — nearly everyone says they want feedback — and behavioral coachability, measured through reactions to specific negative-feedback scenarios. The gap is usually large, and the specific shape of the gap is the most actionable part of the readout.',
    ],
    howItWorks: [
      { num: '1', title: '32 scenario-based questions including negative-feedback simulations', body: 'Questions describe specific situations: "Your boss gives you feedback that surprises and, privately, you disagree with. What do you do in the moment? Twenty-four hours later? A week later?" The instrument measures reactions, stated intentions, and actual follow-through patterns.' },
      { num: '2', title: 'Four-dimension profile + defensiveness signature', body: 'Responses produce percentile scores on the four COACH dimensions plus a defensiveness signature — a classification into one of six common defensive patterns (Righteous Deflection, Silent Withdrawal, Over-Apologetic Compliance, Intellectualization, Counterattack, Shutdown).' },
      { num: '3', title: 'Stated × behavioral gap analysis', body: 'Questions include matched pairs where one item asks about your stated belief about feedback and another asks about your behavior in a concrete scenario. The specific gaps reveal which levers will actually move coachability for you, as distinct from which levers you already endorse in theory.' },
      { num: '4', title: 'Readout + a coachability practice protocol', body: 'You receive the dimension profile, your defensiveness signature classification, the stated-behavioral gap analysis, and a 12-week coachability practice protocol: one micro-practice per week, scoped to your specific signature and gaps, with measurable outcomes.' },
    ],
    whatYouGet: [
      'Four-dimension COACH profile with percentiles and written interpretation',
      'Defensiveness signature classification with triggers and typical cost-to-you analysis',
      'Stated × behavioral gap analysis identifying which coachability moves you endorse but do not practice',
      'A 12-week micro-practice protocol, one exercise per week, tailored to your specific profile',
      'A feedback-solicitation template set tuned to your Source Weighting score — how to ask, from whom, and in what form',
    ],
    sampleInsight: 'Your overall coachability score is in the 64th percentile — meaning you are more coachable than most but not among the group that compounds rapidly. Your specific defensiveness signature is Intellectualization. When you receive feedback you do not like, your pattern is not to argue or shut down — it is to immediately shift to an analytical discussion of methodology, sample size, rater bias, contextual caveats. This reads to others as engagement, so the feedback loop appears to function, but you rarely actually change behavior. The practice: for the next eight instances of negative feedback, impose a mandatory 24-hour delay before responding with anything analytical; your first response may only be clarifying questions.',
    dimensionTeaser: [
      { name: 'Feedback Receptivity', description: 'Your in-the-moment reaction pattern to negative input — the defensiveness profile.' },
      { name: 'Translation Speed', description: 'How quickly received input actually becomes behavioral change, rather than remaining as good intentions.' },
      { name: 'Seeking Proactivity', description: 'How systematically you solicit feedback beyond what comes unsolicited to you.' },
    ],
    whoItsFor: [
      'High achievers who have plateaued despite obvious talent, and suspect their relationship to input is part of the problem',
      'Leaders about to begin a coaching engagement who want a baseline that the coach and coachee can both reference, so the engagement does not waste the first six sessions on discovery',
      'People who have had the same piece of feedback from multiple sources over multiple years and have not been able to move on it',
    ],
    cta: 'Start this lens',
  },
  forge: {
    code: 'FORGE',
    name: 'Founder CEO Transition',
    pillar: 'Founder & Organizational Leadership',
    tagline: 'A structured diagnostic for founders navigating the hardest move in scaling: from building the product to building the company that builds the product.',
    whatItMeasures: [
      'FORGE measures five dimensions of founder-to-CEO transition readiness: Product Detachment Capacity, Structured Decision Delegation, Executive Hiring Acumen, Board & Stakeholder Interface, and Self-Regeneration Under Long-Horizon Pressure. These are the specific failure points that end founder-CEO tenures at Series B, Series C, and beyond.',
      'The diagnostic is built on a database of 320+ founder-CEO transitions — both successful and failed. The finding that structures FORGE is that this transition is almost never a competence problem and almost always a role-redefinition problem. The skills that made you a great founder of a 30-person company are not just different from the skills you need at 200; they are often actively opposed.',
      'FORGE produces a transition phase classification (Founder-Operator, Founder-Builder, Founder-Institution-Builder) and identifies the specific transition task that is currently binding — the one thing you most need to stop doing, start delegating, or learn to do differently before the next financing or inflection point.',
    ],
    howItWorks: [
      { num: '1', title: '45 structured questions + optional board / exec rater input', body: 'Questions span the five FORGE dimensions and include a mix of self-assessment, behavioral recall, and tradeoff scenarios. Optionally, invite two raters — one board member, one direct report — for an observer view. Estimated completion: 24–32 minutes for the founder, 12 minutes per rater.' },
      { num: '2', title: 'Phase classification + five-dimension profile', body: 'Responses classify you into one of three transition phases and produce a five-dimension profile with percentiles benchmarked against the founder-CEO reference dataset. Rater input, if included, is shown as a separate profile — the delta is typically the most useful data in the readout.' },
      { num: '3', title: 'Binding transition task identification', body: 'The model identifies the single binding transition task — the one thing that, if you do not address it in the next 6–12 months, will generate organizational failure regardless of everything else going right. This is always a role-redefinition task, not a competence-building task.' },
      { num: '4', title: 'Readout + a 12-month transition roadmap', body: 'You receive the phase classification, five-dimension profile, rater delta if applicable, binding transition task diagnosis with an organizational-failure-mode explanation, and a 12-month transition roadmap: four specific role changes per quarter, each with a success metric and a delegation target.' },
    ],
    whatYouGet: [
      'Founder-CEO transition phase classification with phase-fit commentary',
      'Five-dimension FORGE profile benchmarked against the founder-CEO reference dataset',
      'Founder × board × exec delta comparison if rater input was included',
      'Binding transition task diagnosis with the specific failure mode it is heading toward',
      'A 12-month transition roadmap with 16 specific role changes, delegation targets, and success metrics',
    ],
    sampleInsight: 'You are transitioning from Founder-Operator to Founder-Builder — the phase shift between 40 and 140 people. Product Detachment Capacity is your highest dimension at 78; Structured Decision Delegation is your lowest at 22. The binding transition task is not letting go of product decisions — you have already done that — but building a delegated decision structure so the organization is not coming back to you for 14 specific recurring decisions, each of which looks small in isolation but cumulatively consumes 32% of your time per our instrument\'s estimate. The roadmap: define those 14 decisions explicitly, assign each to a named owner with explicit scope, and review the assignment after 90 days, not before.',
    dimensionTeaser: [
      { name: 'Product Detachment Capacity', description: 'How comfortably and completely you can stop making the specific product decisions you used to make personally.' },
      { name: 'Structured Decision Delegation', description: 'Whether delegation is real and structural, or whether decisions flow back to you through informal channels.' },
      { name: 'Executive Hiring Acumen', description: 'How well your hiring model for exec roles matches the actual needs of the scaled company, not the startup you were.' },
    ],
    whoItsFor: [
      'Founder-CEOs between Series A and Series C who are either anticipating or already in the hardest part of the role transition',
      'Founders preparing to hire a CEO and step into an executive chair, wanting to understand what the new role actually requires and whether they are suited for it',
      'Lead investors and board members who want a structured baseline before coaching, advising, or initiating a CEO-succession conversation with a portfolio founder',
    ],
    cta: 'Start this lens',
  },
};

const RELATED_MAP: Record<string, string[]> = {
  prism: ['quest', 'impact', 'leap'],
  cpi: ['bridge', 'mosaic', 'impact'],
  leap: ['impact', 'spark', 'drive'],
  impact: ['prism', 'bridge', 'coach'],
  spark: ['leap', 'mosaic', 'forge'],
  bridge: ['cpi', 'impact', 'mosaic'],
  mosaic: ['spark', 'bridge', 'forge'],
  drive: ['quest', 'leap', 'coach'],
  quest: ['prism', 'drive', 'impact'],
  coach: ['drive', 'leap', 'quest'],
  forge: ['spark', 'mosaic', 'leap'],
};

function SectionContainer({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        maxWidth: V1.contentMax,
        margin: '0 auto',
        width: '100%',
        padding: '0 32px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      style={{
        fontFamily: V1.monoFont,
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: V1.trackingMono,
        color: color || V1.teal600,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function SectionHeading({ children, size = 36 }: { children: React.ReactNode; size?: number }) {
  return (
    <h2
      style={{
        fontFamily: V1.displayFont,
        fontSize: size,
        lineHeight: V1.leadingDisplay,
        letterSpacing: V1.trackingTight,
        color: V1.ink900,
        fontWeight: V1.fwRegular,
        margin: '0 0 28px 0',
      }}
    >
      {children}
    </h2>
  );
}

function Divider({ marginTop = 40, marginBottom = 40 }: { marginTop?: number; marginBottom?: number }) {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: `1px solid ${V1.ink100}`,
        marginTop,
        marginBottom,
      }}
    />
  );
}

export function PublicLensLandingTemplate({ lensCode }: { lensCode: string }) {
  const code = lensCode.toLowerCase();
  const lens = LENS_DATA[code];

  if (!lens) {
    return (
      <div style={{ background: V1.bg, minHeight: '100vh', padding: '80px 0' }}>
        <SectionContainer>
          <Eyebrow>Diagnostic lens</Eyebrow>
          <SectionHeading size={56}>Lens not found</SectionHeading>
          <p style={{ fontFamily: V1.bodyFont, fontSize: 17, color: V1.ink700 }}>
            The lens "{lensCode}" is not available.
          </p>
        </SectionContainer>
      </div>
    );
  }

  const relatedCodes = RELATED_MAP[code] || [];
  const relatedLenses = relatedCodes.map((rc) => LENS_DATA[rc]).filter(Boolean);

  return (
    <div style={{ background: V1.bg, minHeight: '100vh' }}>
      {/* 1. HERO */}
      <section style={{ padding: '80px 0' }}>
        <SectionContainer>
          <Eyebrow>Diagnostic lens · {lens.pillar}</Eyebrow>
          <h1
            style={{
              fontFamily: V1.displayFont,
              fontSize: 56,
              lineHeight: V1.leadingDisplay,
              letterSpacing: V1.trackingTight,
              color: V1.ink900,
              fontWeight: V1.fwRegular,
              margin: '20px 0',
            }}
          >
            {lens.code} · {lens.name}
          </h1>
          <p
            style={{
              fontFamily: V1.displayFont,
              fontStyle: 'italic',
              fontSize: 22,
              lineHeight: 1.4,
              color: V1.ink600,
              maxWidth: 720,
              margin: '0 0 40px 0',
            }}
          >
            {lens.tagline}
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link
              to="/nexus/chat"
              style={{
                background: V1.teal800,
                color: V1.white,
                fontFamily: V1.monoFont,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: V1.trackingMono,
                padding: '14px 24px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Start {lens.code} →
            </Link>
            <Link
              to="/assessments"
              style={{
                background: 'transparent',
                color: V1.teal800,
                fontFamily: V1.monoFont,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: V1.trackingMono,
                padding: '14px 24px',
                border: `1px solid ${V1.teal800}`,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Browse all lenses →
            </Link>
          </div>
        </SectionContainer>
      </section>

      {/* 2. DIVIDER */}
      <Divider />

      {/* 3. WHAT IT MEASURES */}
      <section style={{ padding: '80px 0' }}>
        <SectionContainer>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: V1.trackingMono,
              color: V1.ink400,
              marginBottom: 8,
            }}
          >
            What it measures
          </div>
          <SectionHeading>What {lens.code} measures</SectionHeading>
          {lens.whatItMeasures.map((p, i) => (
            <p
              key={i}
              style={{
                fontFamily: V1.bodyFont,
                fontSize: 17,
                lineHeight: 1.7,
                color: V1.ink700,
                maxWidth: 760,
                margin: i < lens.whatItMeasures.length - 1 ? '0 0 20px 0' : 0,
              }}
            >
              {p}
            </p>
          ))}
        </SectionContainer>
      </section>

      {/* 4. DIVIDER */}
      <Divider />

      {/* 5. HOW IT WORKS */}
      <section style={{ padding: '80px 0' }}>
        <SectionContainer>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: V1.trackingMono,
              color: V1.ink400,
              marginBottom: 8,
            }}
          >
            How it works
          </div>
          <SectionHeading>How it works</SectionHeading>
          <div style={{ maxWidth: 880 }}>
            {lens.howItWorks.map((step, i) => (
              <div
                key={step.num}
                style={{
                  padding: '24px 0',
                  borderTop: i > 0 ? `1px solid ${V1.ink100}` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      border: `1px solid ${V1.teal600}`,
                      color: V1.teal600,
                      fontFamily: V1.monoFont,
                      fontSize: 13,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 16,
                      marginTop: 2,
                    }}
                  >
                    {step.num}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: V1.displayFont,
                        fontSize: 20,
                        fontWeight: V1.fwSemibold,
                        color: V1.ink900,
                        lineHeight: 1.3,
                        marginBottom: 8,
                      }}
                    >
                      {step.title}
                    </div>
                    <p
                      style={{
                        fontFamily: V1.bodyFont,
                        fontSize: 15,
                        lineHeight: 1.6,
                        color: V1.ink700,
                        margin: 0,
                      }}
                    >
                      {step.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionContainer>
      </section>

      {/* 6. DIVIDER */}
      <Divider />

      {/* 7. WHAT YOU'LL GET */}
      <section style={{ padding: '80px 0' }}>
        <SectionContainer>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: V1.trackingMono,
              color: V1.ink400,
              marginBottom: 8,
            }}
          >
            What you'll get
          </div>
          <SectionHeading>What you'll get</SectionHeading>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              maxWidth: 760,
            }}
          >
            {lens.whatYouGet.map((item, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '12px 0',
                  borderTop: i > 0 ? `1px solid ${V1.ink100}` : 'none',
                }}
              >
                <span
                  style={{
                    color: V1.teal600,
                    fontFamily: V1.bodyFont,
                    fontWeight: V1.fwMedium,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  ✓
                </span>
                <span
                  style={{
                    fontFamily: V1.bodyFont,
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: V1.ink700,
                  }}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </SectionContainer>
      </section>

      {/* 8. DIVIDER */}
      <Divider />

      {/* 9. SAMPLE INSIGHT */}
      <section style={{ padding: '80px 0' }}>
        <SectionContainer>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: V1.trackingMono,
              color: V1.ink400,
              marginBottom: 8,
            }}
          >
            Sample insight
          </div>
          <SectionHeading>A sample insight from your readout</SectionHeading>
          <blockquote
            style={{
              borderLeft: `3px solid ${V1.teal600}`,
              paddingLeft: 32,
              fontFamily: V1.displayFont,
              fontStyle: 'italic',
              fontSize: 26,
              lineHeight: 1.4,
              color: V1.ink800,
              maxWidth: 800,
              margin: '0 0 20px 0',
            }}
          >
            "{lens.sampleInsight}"
          </blockquote>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: V1.trackingMono,
              color: V1.ink500,
              textAlign: 'right',
              maxWidth: 800,
              margin: '0 0 48px 0',
            }}
          >
            — {lens.code} · Dimension 3
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {lens.dimensionTeaser.map((dim, i) => (
              <div
                key={i}
                style={{
                  flex: '1 1 calc(33.333% - 12px)',
                  minWidth: 240,
                  border: `1px solid ${V1.ink200}`,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    fontFamily: V1.monoFont,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: V1.trackingMono,
                    color: V1.teal600,
                    marginBottom: 8,
                  }}
                >
                  DIM {String(i + 1).padStart(2, '0')}
                </div>
                <div
                  style={{
                    fontFamily: V1.displayFont,
                    fontSize: 19,
                    lineHeight: 1.3,
                    color: V1.ink900,
                    fontWeight: V1.fwSemibold,
                    marginBottom: 10,
                  }}
                >
                  {dim.name}
                </div>
                <p
                  style={{
                    fontFamily: V1.bodyFont,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: V1.ink700,
                    margin: 0,
                  }}
                >
                  {dim.description}
                </p>
              </div>
            ))}
          </div>
        </SectionContainer>
      </section>

      {/* 10. DIVIDER */}
      <Divider />

      {/* 11. WHO THIS IS FOR */}
      <section style={{ padding: '80px 0' }}>
        <SectionContainer>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: V1.trackingMono,
              color: V1.ink400,
              marginBottom: 8,
            }}
          >
            Who this is for
          </div>
          <SectionHeading>Who {lens.code} is for</SectionHeading>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              maxWidth: 760,
            }}
          >
            {lens.whoItsFor.map((item, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '12px 0',
                  borderTop: i > 0 ? `1px solid ${V1.ink100}` : 'none',
                }}
              >
                <span
                  style={{
                    color: V1.teal600,
                    fontFamily: V1.bodyFont,
                    fontWeight: V1.fwMedium,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  ✓
                </span>
                <span
                  style={{
                    fontFamily: V1.bodyFont,
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: V1.ink700,
                  }}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </SectionContainer>
      </section>

      {/* 12. DIVIDER */}
      <Divider />

      {/* 13. RELATED LENSES */}
      <section style={{ padding: '80px 0' }}>
        <SectionContainer>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: V1.trackingMono,
              color: V1.ink400,
              marginBottom: 8,
            }}
          >
            Related lenses
          </div>
          <SectionHeading>Explore related lenses</SectionHeading>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {relatedLenses.map((rl) => (
              <Link
                key={rl.code}
                to={`/lenses/${rl.code.toLowerCase()}`}
                style={{
                  flex: '1 1 calc(33.333% - 12px)',
                  minWidth: 240,
                  border: `1px solid ${V1.ink200}`,
                  padding: 24,
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                }}
              >
                <div
                  style={{
                    fontFamily: V1.monoFont,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: V1.trackingMono,
                    color: V1.teal600,
                    marginBottom: 10,
                  }}
                >
                  {rl.code}
                </div>
                <div
                  style={{
                    fontFamily: V1.displayFont,
                    fontSize: 22,
                    lineHeight: 1.2,
                    color: V1.ink900,
                    fontWeight: V1.fwRegular,
                    marginBottom: 14,
                  }}
                >
                  {rl.name}
                </div>
                <p
                  style={{
                    fontFamily: V1.displayFont,
                    fontStyle: 'italic',
                    fontSize: 15,
                    lineHeight: 1.5,
                    color: V1.ink600,
                    margin: '0 0 20px 0',
                  }}
                >
                  {rl.tagline}
                </p>
                <div
                  style={{
                    fontFamily: V1.bodyFont,
                    fontSize: 14,
                    color: V1.teal800,
                    fontWeight: V1.fwMedium,
                  }}
                >
                  View lens →
                </div>
              </Link>
            ))}
          </div>
        </SectionContainer>
      </section>

      {/* 14. DIVIDER */}
      <Divider marginBottom={0} />

      {/* 15. FINAL CTA */}
      <section
        style={{
          padding: '96px 0',
          background: V1.teal900,
        }}
      >
        <SectionContainer>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: V1.monoFont,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: V1.trackingMono,
                color: V1.teal300,
                marginBottom: 16,
              }}
            >
              Ready to start
            </div>
            <h2
              style={{
                fontFamily: V1.displayFont,
                fontSize: 48,
                lineHeight: 1.1,
                letterSpacing: V1.trackingTight,
                color: V1.white,
                fontWeight: V1.fwRegular,
                margin: '0 0 20px 0',
              }}
            >
              Begin {lens.code} today.
            </h2>
            <p
              style={{
                fontFamily: V1.displayFont,
                fontStyle: 'italic',
                fontSize: 20,
                lineHeight: 1.5,
                color: 'rgba(255,255,255,0.7)',
                maxWidth: 640,
                margin: '0 auto',
              }}
            >
              {lens.tagline}
            </p>
            <div style={{ marginTop: 40 }}>
              <Link
                to="/nexus/chat"
                style={{
                  background: V1.white,
                  color: V1.teal900,
                  fontFamily: V1.monoFont,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: V1.trackingMono,
                  padding: '16px 32px',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Start {lens.code} →
              </Link>
            </div>
          </div>
        </SectionContainer>
      </section>
    </div>
  );
}

export function PrismSEOPage() {
  return <PublicLensLandingTemplate lensCode="prism" />;
}

export function CpiSEOPage() {
  return <PublicLensLandingTemplate lensCode="cpi" />;
}

export function LeapSEOPage() {
  return <PublicLensLandingTemplate lensCode="leap" />;
}

export function ImpactSEOPage() {
  return <PublicLensLandingTemplate lensCode="impact" />;
}

export function SparkSEOPage() {
  return <PublicLensLandingTemplate lensCode="spark" />;
}

export function BridgeSEOPage() {
  return <PublicLensLandingTemplate lensCode="bridge" />;
}

export function MosaicSEOPage() {
  return <PublicLensLandingTemplate lensCode="mosaic" />;
}

export function DriveSEOPage() {
  return <PublicLensLandingTemplate lensCode="drive" />;
}

export function QuestSEOPage() {
  return <PublicLensLandingTemplate lensCode="quest" />;
}

export function CoachSEOPage() {
  return <PublicLensLandingTemplate lensCode="coach" />;
}

export function ForgeSEOPage() {
  return <PublicLensLandingTemplate lensCode="forge" />;
}

export default PublicLensLandingTemplate;
