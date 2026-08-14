// ═══════════════════════════════════════════════════════════
// FORGE Scoring Config
// Source of truth: akira_source/diagnostic_portfolio/06_scoring_engine_code/forge_config.json
// ═══════════════════════════════════════════════════════════

export const INSTRUMENT = "FORGE";
export const FULL_NAME = "Strengths Orientation Assessment";
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 36;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 12;
export const TIER = "advisory";
export const SCORING_MODE = "matrix";
export const PRICE_MILES = 99;
export const B2C_NAME = "Strengths Orientation Assessment";
export const TAGLINE = "36 questions. Sales leadership strengths, system building orientation, and scalable revenue architecture.";

export const DIMENSIONS = [
  {
    id: "D1",
    name: "ADAPTIVE LEARNING ORIENTATION (ALO)",
    question_ids: [
      "Q01",
      "Q02",
      "Q03",
      "Q04",
      "Q05",
      "Q06",
      "Q07",
      "Q08",
      "Q09"
    ],
    reverse_coded: [
      "Q03",
      "Q05",
      "Q09"
    ],
    raw_max: 45,
    n_questions: 9,
    sub_dimensions: [
      "I actively seek operating contexts that will require me to develop capabilities I do not yet have, even when lower-risk options are available.",
      "I am energised by operating challenges that expose gaps in my current capability.",
      "I tend to gravitate toward leadership assignments where my current capabilities are well-matched to the requirements, rather than assignments that will stretch me significantly.",
      "When I receive feedback that challenges how I see my own operating approach, I can process it without significant defensiveness.",
      "I find it difficult to integrate feedback that is inconsistent with my own assessment of how I operate.",
      "I have changed something significant about how I operate as a direct result of diagnostic or developmental feedback in the last two years.",
      "When evidence contradicts an assumption I have been operating on, I update the assumption rather than looking for reasons the evidence is wrong.",
      "I hold my current mental models of how leadership and organisations work with a degree of tentativeness — I know they are likely to need revision as conditions change.",
      "I find it difficult to update long-held beliefs about how leadership should work even when my current operating environment provides consistent evidence that those beliefs are not serving me."
    ],
    items: [
      { id: "Q01", text: "I actively seek operating contexts that will require me to develop capabilities I do not yet have, even when lower-risk options are available." },
      { id: "Q02", text: "I am energised by operating challenges that expose gaps in my current capability." },
      { id: "Q03", text: "I tend to gravitate toward leadership assignments where my current capabilities are well-matched to the requirements, rather than assignments that will stretch me significantly." },
      { id: "Q04", text: "When I receive feedback that challenges how I see my own operating approach, I can process it without significant defensiveness." },
      { id: "Q05", text: "I find it difficult to integrate feedback that is inconsistent with my own assessment of how I operate." },
      { id: "Q06", text: "I have changed something significant about how I operate as a direct result of diagnostic or developmental feedback in the last two years." },
      { id: "Q07", text: "When evidence contradicts an assumption I have been operating on, I update the assumption rather than looking for reasons the evidence is wrong." },
      { id: "Q08", text: "I hold my current mental models of how leadership and organisations work with a degree of tentativeness — I know they are likely to need revision as conditions change." },
      { id: "Q09", text: "I find it difficult to update long-held beliefs about how leadership should work even when my current operating environment provides consistent evidence that those beliefs are not serving me." }
    ],
    weight: 1,
    normalised_max: 20,
    normalised_formula: "(raw/45) x 20"
  },
  {
    id: "D2",
    name: "THREE FORCES AWARENESS (TFA)",
    question_ids: [
      "Q10",
      "Q11",
      "Q12",
      "Q13",
      "Q14",
      "Q15",
      "Q16",
      "Q17",
      "Q18"
    ],
    reverse_coded: [
      "Q12",
      "Q15",
      "Q17"
    ],
    raw_max: 45,
    n_questions: 9,
    sub_dimensions: [
      "I can identify specific instances in my current operating context where bilateral governance complexity — the structural friction between two institutional systems — is creating constraints that are not primarily about individual relationships.",
      "When I encounter difficulty in bilateral relationships, I naturally look for structural and governance explanations before attributing the difficulty to individuals.",
      "I tend to explain bilateral operating challenges primarily in terms of the individuals involved rather than the governance structures they are operating within.",
      "I can identify specific ways in which AI capability differences between my organisation and my bilateral partners are creating structural advantages or disadvantages in our professional relationships.",
      "I have noticed at least one case in the past 12 months where AI tools have changed what a professional services partner or counterpart can produce — faster, cheaper, or at higher quality than before.",
      "I do not see AI capability differences as a significant structural factor in my bilateral professional relationships at this stage.",
      "I can identify specific instances in my current context where the gap between my organisation's internal decision cadence and the speed the market is requiring is creating material operating risk.",
      "I see the tempo gap in my current operating environment as primarily a management execution problem rather than a structural feature of how organisations were built for a different era.",
      "I can identify specific governance or succession decisions in my current context that are taking longer than the market environment allows."
    ],
    items: [
      { id: "Q10", text: "I can identify specific instances in my current operating context where bilateral governance complexity — the structural friction between two institutional systems — is creating constraints that are not primarily about individual relationships." },
      { id: "Q11", text: "When I encounter difficulty in bilateral relationships, I naturally look for structural and governance explanations before attributing the difficulty to individuals." },
      { id: "Q12", text: "I tend to explain bilateral operating challenges primarily in terms of the individuals involved rather than the governance structures they are operating within." },
      { id: "Q13", text: "I can identify specific ways in which AI capability differences between my organisation and my bilateral partners are creating structural advantages or disadvantages in our professional relationships." },
      { id: "Q14", text: "I have noticed at least one case in the past 12 months where AI tools have changed what a professional services partner or counterpart can produce — faster, cheaper, or at higher quality than before." },
      { id: "Q15", text: "I do not see AI capability differences as a significant structural factor in my bilateral professional relationships at this stage." },
      { id: "Q16", text: "I can identify specific instances in my current context where the gap between my organisation's internal decision cadence and the speed the market is requiring is creating material operating risk." },
      { id: "Q17", text: "I see the tempo gap in my current operating environment as primarily a management execution problem rather than a structural feature of how organisations were built for a different era." },
      { id: "Q18", text: "I can identify specific governance or succession decisions in my current context that are taking longer than the market environment allows." }
    ],
    weight: 1,
    normalised_max: 20,
    normalised_formula: "(raw/45) x 20"
  },
  {
    id: "D3",
    name: "DEVELOPMENT AGENCY (DA)",
    question_ids: [
      "Q19",
      "Q20",
      "Q21",
      "Q22",
      "Q23",
      "Q24",
      "Q25",
      "Q26",
      "Q27"
    ],
    reverse_coded: [
      "Q20",
      "Q23",
      "Q26"
    ],
    raw_max: 45,
    n_questions: 9,
    sub_dimensions: [
      "I have a clear personal development focus for the next 12 months that I am actively managing, independent of what my organisation has structured for me.",
      "Most of my development in the past three years has been structured by my organisation rather than self-directed.",
      "I can articulate the specific gap I am trying to close in my leadership capability and how I am addressing it.",
      "I am effective at identifying and engaging the specific coaches, peers, programmes, or diagnostic tools that address my current development priorities.",
      "I wait for my organisation to provide development resources rather than seeking them out independently when institutional provision is inadequate.",
      "In the past year, I have sought out at least one development resource (coach, programme, diagnostic, peer forum) that my organisation did not initiate or fund.",
      "My development practices remain consistent during high-pressure operating periods — I do not abandon development when performance demands increase.",
      "Development activity is the first thing I reduce when my operating schedule becomes demanding.",
      "I have maintained my development practices through at least one period of significant operating pressure without substantially reducing them."
    ],
    items: [
      { id: "Q19", text: "I have a clear personal development focus for the next 12 months that I am actively managing, independent of what my organisation has structured for me." },
      { id: "Q20", text: "Most of my development in the past three years has been structured by my organisation rather than self-directed." },
      { id: "Q21", text: "I can articulate the specific gap I am trying to close in my leadership capability and how I am addressing it." },
      { id: "Q22", text: "I am effective at identifying and engaging the specific coaches, peers, programmes, or diagnostic tools that address my current development priorities." },
      { id: "Q23", text: "I wait for my organisation to provide development resources rather than seeking them out independently when institutional provision is inadequate." },
      { id: "Q24", text: "In the past year, I have sought out at least one development resource (coach, programme, diagnostic, peer forum) that my organisation did not initiate or fund." },
      { id: "Q25", text: "My development practices remain consistent during high-pressure operating periods — I do not abandon development when performance demands increase." },
      { id: "Q26", text: "Development activity is the first thing I reduce when my operating schedule becomes demanding." },
      { id: "Q27", text: "I have maintained my development practices through at least one period of significant operating pressure without substantially reducing them." }
    ],
    weight: 1,
    normalised_max: 20,
    normalised_formula: "(raw/45) x 20"
  },
  {
    id: "D4",
    name: "BILATERAL CONTEXT NAVIGATION (BCN)",
    question_ids: [
      "Q28",
      "Q29",
      "Q30",
      "Q31",
      "Q32",
      "Q33",
      "Q34",
      "Q35",
      "Q36"
    ],
    reverse_coded: [
      "Q29",
      "Q32",
      "Q35"
    ],
    raw_max: 45,
    n_questions: 9,
    sub_dimensions: [
      "I function effectively in leadership situations where authority, accountability, and decision rights are genuinely shared and not fully resolved.",
      "I find it difficult to perform at my best when the operating context requires me to act without clear authority over the decisions I need to influence.",
      "I have experience leading effectively in bilateral contexts where the governance structure left significant ambiguity about who held final decision authority, and I managed this ambiguity without it significantly impairing my effectiveness.",
      "I invest in the development of my bilateral counterparts — not just my own team — as part of how I build the bilateral relationship for long-term effectiveness.",
      "I think of my development investment as something I extend primarily to the people I am formally responsible for, not to bilateral counterparts or partners.",
      "I have at least one bilateral counterpart whose capability I am actively working to develop, and I can describe what I am doing and why.",
      "When I am facing multiple simultaneous leadership challenges, I can identify the one that is most structurally significant and prioritise it without attempting to address all challenges at the same pace.",
      "When multiple leadership challenges are active at the same time, I distribute my attention across all of them rather than sequencing them by structural priority.",
      "I have a framework for deciding which of several concurrent operating challenges warrants the most focused leadership attention, and I apply it consistently."
    ],
    items: [
      { id: "Q28", text: "I function effectively in leadership situations where authority, accountability, and decision rights are genuinely shared and not fully resolved." },
      { id: "Q29", text: "I find it difficult to perform at my best when the operating context requires me to act without clear authority over the decisions I need to influence." },
      { id: "Q30", text: "I have experience leading effectively in bilateral contexts where the governance structure left significant ambiguity about who held final decision authority, and I managed this ambiguity without it significantly impairing my effectiveness." },
      { id: "Q31", text: "I invest in the development of my bilateral counterparts — not just my own team — as part of how I build the bilateral relationship for long-term effectiveness." },
      { id: "Q32", text: "I think of my development investment as something I extend primarily to the people I am formally responsible for, not to bilateral counterparts or partners." },
      { id: "Q33", text: "I have at least one bilateral counterpart whose capability I am actively working to develop, and I can describe what I am doing and why." },
      { id: "Q34", text: "When I am facing multiple simultaneous leadership challenges, I can identify the one that is most structurally significant and prioritise it without attempting to address all challenges at the same pace." },
      { id: "Q35", text: "When multiple leadership challenges are active at the same time, I distribute my attention across all of them rather than sequencing them by structural priority." },
      { id: "Q36", text: "I have a framework for deciding which of several concurrent operating challenges warrants the most focused leadership attention, and I apply it consistently." }
    ],
    weight: 1,
    normalised_max: 20,
    normalised_formula: "(raw/45) x 20"
  }
];

export const COMPOSITE_BANDS = [
  {
    min: 80,
    max: 100,
    band: "Revenue Architect",
    interpretation: "Scalable revenue architecture with strong system leadership. Revenue generation is organisational, not personality-dependent."
  },
  {
    min: 60,
    max: 79,
    band: "Strong Performer",
    interpretation: "Solid sales leadership with identifiable strengths. Some dimensions need investment to achieve scalable revenue architecture."
  },
  {
    min: 40,
    max: 59,
    band: "Developing Sales Leader",
    interpretation: "Foundational sales capability present but not yet at scale. Key dimensions require deliberate development."
  },
  {
    min: 0,
    max: 39,
    band: "Sales Capability Gap",
    interpretation: "Significant gaps in sales leadership architecture. Revenue generation may be at risk without targeted intervention."
  }
];

export const DIMENSION_VERDICTS = [
  {
    dim: "all",
    min: 16,
    max: 20,
    verdict: "B4",
    meaning: "Mature sales leadership with scalable architecture"
  },
  {
    dim: "all",
    min: 10,
    max: 15.9,
    verdict: "B3",
    meaning: "Emerging sales leadership with development opportunities"
  },
  {
    dim: "all",
    min: 4,
    max: 9.9,
    verdict: "B2",
    meaning: "Moderate sales capability with significant development opportunity"
  },
  {
    dim: "all",
    min: 0,
    max: 3.9,
    verdict: "B1",
    meaning: "Significant sales leadership gap requiring intervention"
  }
];

export const ARCHETYPES = [
  {
    name: "Rainmaker",
    selling_acumen: "High",
    system_leadership: "Low",
    description: "Personal relationship-driven revenue engine. The natural closer who thrives in front of clients, carries major relationships, and generates deals that no one else can replicate.",
    strengths: "Unmatched commercial instinct. Reads opportunities fast, builds trust quickly, closes at a high rate. The Rainmaker's personal network and relationship depth carry the revenue engine. In early-stage or founder-led organisations, the Rainmaker is the engine — their deal-making capability funds everything else.",
    blind_spots: "Cannot scale; revenue collapses when they leave. The Rainmaker's strength is also the organisation's structural risk: every major deal depends on their personal involvement, which means revenue is capped at their personal bandwidth. The team orbits around them rather than developing independent deal capability, and the organisation can never institutionalise what the Rainmaker does intuitively.",
    core_pattern: "Personal relationship-driven revenue",
    revenue_risk: "Cannot scale; revenue collapses when they leave",
    orientation: "Selling Acumen dominant, System Leadership low",
    quadrant: "High Selling Acumen / Low System Leadership"
  },
  {
    name: "System Builder",
    selling_acumen: "Low",
    system_leadership: "High",
    description: "Scalable revenue architecture without the personal commercial edge. The operator who builds pipelines, processes, and CRM rigour that should generate predictable revenue — but struggles when the machine requires a human touch.",
    strengths: "Process, rigour, and organisational design. The System Builder creates the sales infrastructure that outlasts any individual contributor: pipeline governance, forecast discipline, onboarding playbooks, compensation design, territory segmentation. When the commercial foundation is already strong, the System Builder scales it reliably.",
    blind_spots: "Pipeline is strong on paper; personal deals are weak. The System Builder can design the most elegant revenue machine in the world but cannot personally close a flagship deal when the machine stalls. In high-value B2B or enterprise contexts where relationships and judgment decide large deals, the System Builder's lack of commercial acumen becomes the binding constraint on revenue growth.",
    core_pattern: "Scalable revenue architecture",
    revenue_risk: "Pipeline is strong; personal deals are weak",
    orientation: "System Leadership dominant, Selling Acumen low",
    quadrant: "Low Selling Acumen / High System Leadership"
  },
  {
    name: "Revenue Architect",
    selling_acumen: "High",
    system_leadership: "High",
    description: "Full commercial leadership. The rare executive who can personally close a major deal AND build the organisational system that closes a hundred smaller ones without them. The target state for every senior sales leader.",
    strengths: "Rare combination of commercial instinct and institutional design capability. The Revenue Architect can lead from the front on a critical enterprise pursuit while simultaneously building the sales machine that makes their personal involvement optional over time. They recruit Rainmakers, train them, institutionalise their methods, and maintain the commercial judgment that keeps the system honest.",
    blind_spots: "Risk: under-delegates; creates revenue dependency even with strong system. The Revenue Architect's biggest risk is themselves — their ability to personally fix any deal can become a crutch that the organisation learns to rely on, undermining the very system they're trying to build. The gap between building a system and trusting it is the Revenue Architect's defining tension.",
    core_pattern: "Full commercial leadership",
    revenue_risk: "Risk: under-delegates; creates revenue dependency",
    orientation: "Selling Acumen + System Leadership balanced (both high)",
    quadrant: "High Selling Acumen / High System Leadership"
  },
  {
    name: "Promoted Seller",
    selling_acumen: "High (individual)",
    system_leadership: "Low",
    description: "Top individual performer promoted into leadership — the classic scaling failure. Can still close their own deals but cannot grow a team, build a system, or reproduce their capability in others. The team stalls while the leader stays in the field.",
    strengths: "Deep individual selling credibility. The Promoted Seller knows what great selling looks like because they've lived it; they can coach deal mechanics because they've closed those deals themselves. Their team respects their commercial capability because it is real, not theoretical.",
    blind_spots: "Classic scaling failure; the team underperforms because the leader cannot shift from 'selling' to 'leading selling.' The Promoted Seller defaults to what got them promoted — personally closing deals — while their team flounders without the system, coaching, and pipeline governance they actually need. Revenue doesn't scale; it just stays at the same level the leader could generate as an IC, now with more overhead.",
    core_pattern: "Top performer promoted into leadership",
    revenue_risk: "Classic scaling failure; team underperforms",
    orientation: "Individual Selling still dominant, System Leadership not yet developed",
    quadrant: "Low Selling Acumen (as leader) / Low System Leadership"
  }
];


export const SCORING_CONFIG = {
  INSTRUMENT, FULL_NAME, VERSION, TOTAL_QUESTIONS, SCALE, DELIVERY_MINUTES,
  TIER, PRICE_MILES, B2C_NAME, TAGLINE,
  DIMENSIONS, COMPOSITE_BANDS, DIMENSION_VERDICTS, ARCHETYPES,
};
