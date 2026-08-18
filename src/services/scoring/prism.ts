// ═══════════════════════════════════════════════════════════
// PRISM Scoring Config
// Source of truth: akira_source/diagnostic_portfolio/06_scoring_engine_code/prism_config.json
// ═══════════════════════════════════════════════════════════

export const INSTRUMENT = "PRISM";
export const FULL_NAME = "PRISM — professional branding";
export const B2C_NAME = "PRISM — professional branding";
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 30;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 10;
export const TIER = "advisory";
export const SCORING_MODE = "matrix";
export const PRICE_MILES = 99;
export const TAGLINE = "30 questions. Personal brand clarity, market legibility, and visibility.";

export const DIMENSIONS = [
  {
    id: "D1",
    name: "Brand Clarity",
    question_ids: [
      "Q01",
      "Q02",
      "Q03",
      "Q04",
      "Q05",
      "Q06"
    ],
    reverse_coded: [
      "Q04"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [
      "I can articulate, in two sentences, what I specifically offer that is distinct from other senior leaders in my field.",
      "When people ask what I do, I have a clear and consistent answer that accurately reflects the value I create.",
      "I know exactly what I want to be known for in the next stage of my career — and it is different from what I am currently known for.",
      "I find it difficult to explain my unique contribution without listing my roles or credentials.",
      "The people who advocate for me in rooms I'm not in can easily articulate what makes me distinctive.",
      "My professional identity has a clear centre — a specific expertise or perspective that connects everything I do."
    ],
    items: [
      { id: "Q01", text: "I can articulate, in two sentences, what I specifically offer that is distinct from other senior leaders in my field." },
      { id: "Q02", text: "When people ask what I do, I have a clear and consistent answer that accurately reflects the value I create." },
      { id: "Q03", text: "I know exactly what I want to be known for in the next stage of my career — and it is different from what I am currently known for." },
      { id: "Q04", text: "I find it difficult to explain my unique contribution without listing my roles or credentials." },
      { id: "Q05", text: "The people who advocate for me in rooms I'm not in can easily articulate what makes me distinctive." },
      { id: "Q06", text: "My professional identity has a clear centre — a specific expertise or perspective that connects everything I do." }
    ],
    weight: 1,
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D2",
    name: "Market Legibility",
    question_ids: [
      "Q07",
      "Q08",
      "Q09",
      "Q10",
      "Q11",
      "Q12"
    ],
    reverse_coded: [
      "Q10"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [
      "My career story — including my cross-border and cross-cultural experience — is easy for APAC boards and search firms to read and value.",
      "I can point to specific results I have achieved that are legible and compelling in APAC business contexts.",
      "APAC-native organisations understand what I bring without me needing to extensively explain my background.",
      "I notice that my APAC cross-border experience is harder to communicate to Western boards and search firms than to APAC-native ones.",
      "I have named stakeholder relationships in my target APAC markets that strengthen my credibility with decision-makers in those markets.",
      "My professional profile — CV, LinkedIn, verbal narrative — explains my cross-border career in a way that creates a clear and compelling picture for APAC audiences."
    ],
    items: [
      { id: "Q07", text: "My career story — including my cross-border and cross-cultural experience — is easy for APAC boards and search firms to read and value." },
      { id: "Q08", text: "I can point to specific results I have achieved that are legible and compelling in APAC business contexts." },
      { id: "Q09", text: "APAC-native organisations understand what I bring without me needing to extensively explain my background." },
      { id: "Q10", text: "I notice that my APAC cross-border experience is harder to communicate to Western boards and search firms than to APAC-native ones." },
      { id: "Q11", text: "I have named stakeholder relationships in my target APAC markets that strengthen my credibility with decision-makers in those markets." },
      { id: "Q12", text: "My professional profile — CV, LinkedIn, verbal narrative — explains my cross-border career in a way that creates a clear and compelling picture for APAC audiences." }
    ],
    weight: 1,
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D3",
    name: "Identity Consistency",
    question_ids: [
      "Q13",
      "Q14",
      "Q15",
      "Q16",
      "Q17",
      "Q18"
    ],
    reverse_coded: [
      "Q16"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [
      "My professional identity is consistent whether I am speaking to a board, a peer, a client, or a search firm.",
      "The story I tell about myself on LinkedIn is consistent with what I say in a job interview or board conversation.",
      "I adapt my communication style to different audiences, but the core of what I stand for stays consistent.",
      "I notice that I present myself quite differently depending on the audience — and I'm not sure which version is the real one.",
      "If someone compared my LinkedIn profile, my CV, and my verbal introduction, they would find a consistent and coherent professional identity.",
      "My various professional roles — executive, board member, advisor — are connected by a consistent identity, not pulled in different directions."
    ],
    items: [
      { id: "Q13", text: "My professional identity is consistent whether I am speaking to a board, a peer, a client, or a search firm." },
      { id: "Q14", text: "The story I tell about myself on LinkedIn is consistent with what I say in a job interview or board conversation." },
      { id: "Q15", text: "I adapt my communication style to different audiences, but the core of what I stand for stays consistent." },
      { id: "Q16", text: "I notice that I present myself quite differently depending on the audience — and I'm not sure which version is the real one." },
      { id: "Q17", text: "If someone compared my LinkedIn profile, my CV, and my verbal introduction, they would find a consistent and coherent professional identity." },
      { id: "Q18", text: "My various professional roles — executive, board member, advisor — are connected by a consistent identity, not pulled in different directions." }
    ],
    weight: 1,
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D4",
    name: "Narrative Power",
    question_ids: [
      "Q19",
      "Q20",
      "Q21",
      "Q22",
      "Q23",
      "Q24"
    ],
    reverse_coded: [
      "Q22"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [
      "I can tell my career story in a way that makes clear not just what I did, but why it matters and what it means for my next contribution.",
      "I frame my achievements in terms of the judgment I exercised and the outcomes I created — not just the roles I held.",
      "When I describe my career trajectory, people understand why each move made sense and where I am heading.",
      "I find it easier to describe what I have done than to articulate what it says about my leadership or my future value.",
      "My professional story has a through-line — a logic that connects my past to my present to my future that is visible to others.",
      "I can adjust my career narrative for different audiences — adjusting the emphasis without losing the coherence or the core story."
    ],
    items: [
      { id: "Q19", text: "I can tell my career story in a way that makes clear not just what I did, but why it matters and what it means for my next contribution." },
      { id: "Q20", text: "I frame my achievements in terms of the judgment I exercised and the outcomes I created — not just the roles I held." },
      { id: "Q21", text: "When I describe my career trajectory, people understand why each move made sense and where I am heading." },
      { id: "Q22", text: "I find it easier to describe what I have done than to articulate what it says about my leadership or my future value." },
      { id: "Q23", text: "My professional story has a through-line — a logic that connects my past to my present to my future that is visible to others." },
      { id: "Q24", text: "I can adjust my career narrative for different audiences — adjusting the emphasis without losing the coherence or the core story." }
    ],
    weight: 1,
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D5",
    name: "Visibility Level",
    question_ids: [
      "Q25",
      "Q26",
      "Q27",
      "Q28",
      "Q29",
      "Q30"
    ],
    reverse_coded: [
      "Q28"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [
      "I am known by the search firms, board nomination committees, or senior networks that are most relevant to my next career move.",
      "My thought leadership — whether written, spoken, or shared — reaches the people who matter most to my career trajectory.",
      "My network actively creates opportunities for me — introducing me, advocating for me, and opening doors I don't know exist.",
      "I am largely invisible to the search firms and senior networks that are most relevant to my target next role.",
      "Industry peers, board members, or senior stakeholders regularly seek out my perspective on relevant topics.",
      "I have a deliberate visibility strategy — I am intentionally building presence in the communities where my next opportunity is most likely to emerge."
    ],
    items: [
      { id: "Q25", text: "I am known by the search firms, board nomination committees, or senior networks that are most relevant to my next career move." },
      { id: "Q26", text: "My thought leadership — whether written, spoken, or shared — reaches the people who matter most to my career trajectory." },
      { id: "Q27", text: "My network actively creates opportunities for me — introducing me, advocating for me, and opening doors I don't know exist." },
      { id: "Q28", text: "I am largely invisible to the search firms and senior networks that are most relevant to my target next role." },
      { id: "Q29", text: "Industry peers, board members, or senior stakeholders regularly seek out my perspective on relevant topics." },
      { id: "Q30", text: "I have a deliberate visibility strategy — I am intentionally building presence in the communities where my next opportunity is most likely to emerge." }
    ],
    weight: 1,
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  }
];

export const COMPOSITE_BANDS = [
  {
    min: 80,
    max: 100,
    band: "Exceptional",
    interpretation: "Clear, consistent, legible brand across all 5 dimensions"
  },
  {
    min: 60,
    max: 79,
    band: "Strong",
    interpretation: "Strong in most dimensions; 1–2 specific development areas"
  },
  {
    min: 40,
    max: 59,
    band: "Developing",
    interpretation: "Brand exists but is not differentiated or consistently legible"
  },
  {
    min: 20,
    max: 39,
    band: "Emerging",
    interpretation: "Foundation work needed before visibility investment makes sense"
  },
  {
    min: 0,
    max: 19,
    band: "Early Stage",
    interpretation: "Urgent brand construction or reconstruction required"
  }
];

export const DIMENSION_VERDICTS = [
  {
    dim: "all",
    min: 16,
    max: 20,
    verdict: "B4",
    meaning: "Mature capability with demonstrated organisational impact"
  },
  {
    dim: "all",
    min: 10,
    max: 15.9,
    verdict: "B3",
    meaning: "Emerging capability with targeted development opportunities"
  },
  {
    dim: "all",
    min: 4,
    max: 9.9,
    verdict: "B2",
    meaning: "Moderate capability with significant development opportunity"
  },
  {
    dim: "all",
    min: 0,
    max: 3.9,
    verdict: "B1",
    meaning: "Significant capability gap requiring immediate attention"
  }
];

// X4-3: ARCHETYPES = person-archetypes only (no matrix axes). See MATRIX_AXES for 2x2 axis definitions.
export const ARCHETYPES = [
  {
    name: "The Authority",
    "#": "1",
    foundation: "Strong",
    visibility: "High",
    description: "Clear brand, consistent identity, widely recognised. The gold standard — a leader whose brand works for them in rooms they're not in.",
    strengths: "Brand clarity and identity consistency are both high. The professional has a distinctive, recognisable professional signature that the market can read, remember, and advocate for. Network advocacy is active and effective; the Authority is the name that comes up when decision-makers are looking for someone with their profile.",
    blind_spots: "Staleness risk: the brand that worked for the last decade may not work for the next one. The Authority can become complacent about brand evolution, assuming that legacy recognition will carry them through market shifts. Over time, the brand stops evolving while the market does — creating a subtle credibility lag that takes years to become visible.",
    core_dynamic: "Clear brand, consistent identity, widely recognised. The gold standard — a leader whose brand works for them in rooms they're not in.",
    risk_if_unaddressed: "Staleness risk: the brand that worked for the last decade may not work for the next one.",
    development_priority: "Deliberate brand evolution; staying ahead of the market rather than managing legacy",
    apac_note: "The Authority is rare in APAC cross-border contexts — often these leaders have strong home-market authority with APAC legibility gaps"
  },
  {
    name: "The Signal",
    "#": "2",
    foundation: "Strong",
    visibility: "Medium",
    description: "Clear about who they are, consistent in how they show up — but not visible enough in the markets that matter. The hidden gem.",
    strengths: "Strong brand foundation: clear identity, consistent signals, authentic centre. The professional knows who they are and shows up consistently — anyone who works with them gets a clear, coherent picture. The internal brand work is largely done.",
    blind_spots: "Will keep being passed over for opportunities their capability deserves. The market can't find them. The Signal is the hidden gem of professional brands — great product, no distribution. Their network knows their quality, but the broader market (search firms, nomination committees, decision-makers outside the immediate circle) has no idea they exist.",
    core_dynamic: "Clear about who they are, consistent in how they show up — but not visible enough in the markets that matter. The hidden gem.",
    risk_if_unaddressed: "Will keep being passed over for opportunities their capability deserves. The market can't find them.",
    development_priority: "Visibility activation: thought leadership, search firm engagement, board network investment",
    apac_note: "Very common APAC profile — deep capability, strong internal brand, low external market presence"
  },
  {
    name: "The Monument",
    "#": "3",
    foundation: "Strong",
    visibility: "Low",
    description: "Solid, well-defined brand. But visibility is very low — known only to immediate network. Either deliberately private or visibility has not kept pace with career development.",
    strengths: "The brand foundation is genuinely solid. There is clarity, consistency, and a well-defined professional identity. People who know the Monument know what they stand for and can describe it accurately. The quality is real — the distribution is the problem.",
    blind_spots: "Opportunities are passing them by in silence. No one is advocating for them in rooms they're not in. The Monument is either deliberately private (a conscious choice) or simply never invested in visibility as their career scope expanded past their existing network. Either way, the market can't find what it can't see.",
    core_dynamic: "Solid, well-defined brand. But visibility is very low — known only to immediate network. Either deliberately private or visibility has not kept pace with career development.",
    risk_if_unaddressed: "Opportunities are passing them by in silence. No one is advocating for them in rooms they're not in.",
    development_priority: "Strategic visibility building; thought leadership publication; search firm relationship investment",
    apac_note: "Common in senior APAC executives post-China mandate or post-SOE career — credibility is real, market presence is near-zero"
  },
  {
    name: "The Chameleon",
    "#": "4",
    foundation: "Weak",
    visibility: "High",
    description: "Adapts to every audience, highly visible — but no consistent centre. Seen everywhere, known by no one. Visibility outpaces substance.",
    strengths: "Strong visibility and narrative energy. The Chameleon is present, active, and visible. They understand intuitively how to show up for different audiences and can be very effective in short-cycle interactions. In contexts where first impressions matter more than sustained relationship, the Chameleon can outperform profiles with stronger substance.",
    blind_spots: "Brand exhaustion: maintaining different versions for different audiences is unsustainable. Over time, the lack of a centre becomes visible. People who encounter the Chameleon across multiple contexts notice the inconsistency, and trust erodes. The Chameleon eventually wears down from the performance cost of being different people to different audiences.",
    core_dynamic: "Adapts to every audience, highly visible — but no consistent centre. Seen everywhere, known by no one. Visibility outpaces substance.",
    risk_if_unaddressed: "Brand exhaustion: maintaining different versions for different audiences is unsustainable. Over time, the lack of a centre becomes visible.",
    development_priority: "Identity consolidation; brand clarity work; finding and anchoring the authentic centre",
    apac_note: "High APAC risk: relationship-rich market means the Chameleon's inconsistency gets noticed faster in APAC networks"
  },
  {
    name: "The Amplifier",
    "#": "5",
    foundation: "Developing",
    visibility: "High",
    description: "Moderate foundation but strong visibility. Often building personal brand before the internal brand foundation is ready. Narrative Power is outrunning Brand Clarity.",
    strengths: "High energy, strong narrative instinct, genuine visibility momentum. The Amplifier is ambitious and active — they're building presence, getting attention, and learning what works. The visibility engine is real and running; the task is to deepen the foundation so visibility doesn't outrun substance.",
    blind_spots: "Imposter syndrome dynamics; gets attention but can't fully deliver on the brand promise. The Amplifier's visibility invites scrutiny that their current foundation can't always withstand. Every visible moment is an opportunity — but also an audit. When the gap between narrative and substance becomes too wide, credibility collapses.",
    core_dynamic: "Moderate foundation but strong visibility. Often building personal brand before the internal brand foundation is ready. Narrative Power is outrunning Brand Clarity.",
    risk_if_unaddressed: "Imposter syndrome dynamics; gets attention but can't fully deliver on the brand promise.",
    development_priority: "Deepen brand foundation; ensure authenticity alignment between narrative and substance",
    apac_note: "APAC specific: Amplifiers who have strong narrative without APAC-specific substance get read quickly by experienced APAC stakeholders"
  },
  {
    name: "The Operator",
    "#": "6",
    foundation: "Developing",
    visibility: "Medium",
    description: "Functional professional brand. Gets the job done, respected in their network — but not differentiated. One of many rather than the one.",
    strengths: "Solid, reliable, functional. The Operator is genuinely good at what they do and has the respect of their immediate network. They deliver, they're consistent, and people know they can count on them. In a stable market with low competition, this is sufficient.",
    blind_spots: "Commoditised. Subject to substitution. Will be overlooked for the roles that require a distinctive contribution. The Operator is the default professional brand — competent, reliable, and completely interchangeable with several other competent, reliable professionals. When the market gets tighter or opportunities become more selective, differentiation is the binding constraint — not capability.",
    core_dynamic: "Functional professional brand. Gets the job done, respected in their network — but not differentiated. One of many rather than the one.",
    risk_if_unaddressed: "Commoditised. Subject to substitution. Will be overlooked for the roles that require a distinctive contribution.",
    development_priority: "Sharpen positioning; find and develop the distinctive angle; differentiation work",
    apac_note: "Very common mid-career APAC profile — solid, respected, invisible above a certain level"
  },
  {
    name: "The Ghost",
    "#": "7",
    foundation: "Developing",
    visibility: "Low",
    description: "Has the foundation of a brand — some clarity, some track record — but is almost completely invisible in the market. The capable executive who disappeared.",
    strengths: "There is a real foundation here. Some clarity, some capability, some consistency — the raw material of a strong professional brand is present. The Ghost is not a blank page; they're a page that no one is reading. Given the right visibility investment, the foundation can support rapid progress.",
    blind_spots: "Irrelevance by default. Network atrophies. Opportunities stop arriving. The Ghost is often a capable professional who went through a transition (career break, relocation, market exit, organisational change) and never reactivated their professional visibility. They're still capable — but the market has moved on, and no one is looking for them.",
    core_dynamic: "Has the foundation of a brand — some clarity, some track record — but is almost completely invisible in the market. The capable executive who disappeared.",
    risk_if_unaddressed: "Irrelevance by default. Network atrophies. Opportunities stop arriving.",
    development_priority: "Visibility strategy; narrative development; re-entry into professional communities",
    apac_note: "Frequent post-APAC-posting profile — spent years in market, network is local, home market visibility has collapsed"
  },
  {
    name: "The Mask",
    "#": "8",
    foundation: "Weak",
    visibility: "Medium",
    description: "Presents a manufactured or constructed brand that doesn't match internal reality. Knows how to show up but isn't sure who they actually are professionally. Exhausting to maintain.",
    strengths: "Presentation discipline. Social intelligence. The Mask understands intuitively what professional contexts expect and can perform that expectation convincingly. They understand the signals of credibility and can project them. In short-cycle contexts this can be surprisingly effective.",
    blind_spots: "The Mask eventually slips — in high-stakes interviews, board conversations, or sustained relationships. The constructed brand can't survive sustained scrutiny or genuine relationship depth. The internal cost is also significant: maintaining a professional identity that doesn't match your internal reality is cognitively and emotionally exhausting.",
    core_dynamic: "Presents a manufactured or constructed brand that doesn't match internal reality. Knows how to show up but isn't sure who they actually are professionally. Exhausting to maintain.",
    risk_if_unaddressed: "The Mask eventually slips — in high-stakes interviews, board conversations, or sustained relationships.",
    development_priority: "Authentic brand discovery; identity work; finding the real professional centre beneath the presentation",
    apac_note: "APAC executive networks are tight — the Mask's manufactured brand is particularly vulnerable in relationship-first contexts"
  },
  {
    name: "The Static",
    "#": "9",
    foundation: "Weak",
    visibility: "Low-Medium",
    description: "No clear brand, no evident evolution, no compelling story. Stuck in a version of themselves that no longer fits the roles they want. Not absent from the market — just not signalling anything.",
    strengths: "The Static is present. They're in the market, they have experience, they have credibility in specific contexts. They're not absent — they're just not signalling anything that the market can pick up and work with. The raw material is there, frozen.",
    blind_spots: "Career plateau becomes permanent. Opportunities stop arriving not because they've left the market but because the market has moved past them. The Static is the professional who has not updated their professional brand since their last promotion or career transition. The signals they send are from a past era — and the market reads them accordingly.",
    core_dynamic: "No clear brand, no evident evolution, no compelling story. Stuck in a version of themselves that no longer fits the roles they want. Not absent from the market — just not signalling anything.",
    risk_if_unaddressed: "Career plateau becomes permanent. Opportunities stop arriving not because they've left the market but because the market has moved past them.",
    development_priority: "Brand reinvention; career narrative rebuild; identifying what the next chapter is actually about"
  },
  {
    name: "The Blank Page",
    "#": "10",
    foundation: "Weak",
    visibility: "Low",
    description: "Starting from scratch or in complete brand crisis. Either very early in executive career development or post-crisis rebuild after exit, board failure, or mandate collapse.",
    strengths: "The opportunity space is wide. A blank page — if you own the construction — can become anything you build. There is no legacy brand debt, no outdated expectations, no stale signals to overcome. The construction process, done deliberately, builds a brand more authentic and differentiated than one that evolved by default.",
    blind_spots: "Without active construction, the blank page gets filled in by others — and rarely in the way the executive would choose. Nature abhors a vacuum; the market will define a professional who does not define themselves. The result is a brand that doesn't serve the executive's interests, career direction, or actual capabilities.",
    core_dynamic: "Starting from scratch or in complete brand crisis. Either very early in executive career development or post-crisis rebuild after exit, board failure, or mandate collapse.",
    risk_if_unaddressed: "Without active construction, the blank page gets filled in by others — and rarely in the way the executive would choose.",
    development_priority: "Full brand construction from foundation up: identity, narrative, visibility, in that sequence",
    apac_note: "Post-exit APAC executives (particularly China or complex-market exits) are at high Blank Page risk if the narrative isn't managed"
  }
];

export const MATRIX_AXES = [
  { name: "Axis 1", description: "Brand Authenticity (Foundation): How strong and consistent is the internal brand foundation? (Strong / Developing / Weak)" },
  { name: "Axis 2", description: "Market Visibility: How readable and present is the executive to external audiences? (High / Medium / Low)" },
];

export const SCORING_CONFIG = {
  INSTRUMENT, FULL_NAME, VERSION, TOTAL_QUESTIONS, SCALE, DELIVERY_MINUTES,
  TIER, PRICE_MILES, B2C_NAME, TAGLINE,
  DIMENSIONS, COMPOSITE_BANDS, DIMENSION_VERDICTS, ARCHETYPES,
};
