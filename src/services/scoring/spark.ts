// ═══════════════════════════════════════════════════════════
// SPARK Scoring Config
// Source of truth: akira_source/diagnostic_portfolio/06_scoring_engine_code/spark_config.json
// ═══════════════════════════════════════════════════════════

export const INSTRUMENT = "SPARK";
export const FULL_NAME = "AI Leadership Readiness & Enterprise Governance";
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 27;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 9;
export const TIER = "advisory";
export const PRICE_MILES = 99;
export const B2C_NAME = "AI Leadership Readiness & Enterprise Governance";
export const TAGLINE = "Do you and your organisation actually have the AI governance foundations the next board mandate will require?";

export const DIMENSIONS = [
  {
    id: "D1",
    name: "INDIVIDUAL AI ADOPTION READINESS (IAAR)",
    question_ids: [
      "SPARK_Q01",
      "SPARK_Q02",
      "SPARK_Q03",
      "SPARK_Q04",
      "SPARK_Q05",
      "SPARK_Q06",
      "SPARK_Q07",
      "SPARK_Q08",
      "SPARK_Q09"
    ],
    reverse_coded: [
      "SPARK_Q03",
      "SPARK_Q05",
      "SPARK_Q08"
    ],
    raw_max: 45,
    n_questions: 9,
    sub_dimensions: [
      "I currently use AI tools as part of my regular professional ...",
      "I have integrated at least one AI-enabled capability into ho...",
      "My use of AI tools in my professional practice remains large...",
      "I am willing to restructure professional workflows that I ha...",
      "I am resistant to changing how I do professional work even w...",
      "I actively look for established workflows in my professional...",
      "I can evaluate the output of AI tools in my professional dom...",
      "I am concerned that I do not yet have the professional judgm...",
      "I treat AI-generated professional outputs as drafts that req..."
    ],
    normalised_max: 20,
    normalised_formula: "(raw/45) x 20"
  },
  {
    id: "D2",
    name: "CAPABILITY EXPOSURE ASSESSMENT (CEA)",
    question_ids: [
      "SPARK_Q10",
      "SPARK_Q11",
      "SPARK_Q12",
      "SPARK_Q13",
      "SPARK_Q14",
      "SPARK_Q15",
      "SPARK_Q16",
      "SPARK_Q17",
      "SPARK_Q18"
    ],
    reverse_coded: [
      "SPARK_Q11",
      "SPARK_Q14",
      "SPARK_Q17"
    ],
    raw_max: 45,
    n_questions: 9,
    sub_dimensions: [
      "I have a clear and current understanding of which AI capabil...",
      "I am uncertain about which AI tools are currently being used...",
      "I can explain to a senior colleague or client what AI-enable...",
      "I can identify at least two or three professional capabiliti...",
      "I am confident that the professional capabilities I have dev...",
      "I have made a deliberate assessment of which of my current p...",
      "I have a reasonably clear picture of the difference between ...",
      "I have not actively assessed whether my bilateral partner or...",
      "I am aware of at least one specific way in which AI capabili..."
    ],
    normalised_max: 20,
    normalised_formula: "(raw/45) x 20"
  },
  {
    id: "D3",
    name: "ORGANISATIONAL PREPAREDNESS (OP)",
    question_ids: [
      "SPARK_Q19",
      "SPARK_Q20",
      "SPARK_Q21",
      "SPARK_Q22",
      "SPARK_Q23",
      "SPARK_Q24",
      "SPARK_Q25",
      "SPARK_Q26",
      "SPARK_Q27"
    ],
    reverse_coded: [
      "SPARK_Q21",
      "SPARK_Q24",
      "SPARK_Q26"
    ],
    raw_max: 45,
    n_questions: 9,
    sub_dimensions: [
      "My organisation has a defined policy for which AI tools can ...",
      "My organisation has a process for reviewing AI-generated pro...",
      "My organisation has no formal governance structure for AI to...",
      "My organisation has the data access and data quality standar...",
      "My organisation's data is organised and accessible in a way ...",
      "Data quality and access limitations are a significant constr...",
      "My organisation is actively investing in developing its prof...",
      "My organisation's approach to AI capability is primarily too...",
      "My organisation has a clear view of which professional capab..."
    ],
    normalised_max: 20,
    normalised_formula: "(raw/45) x 20"
  }
];

export const COMPOSITE_BANDS = [
  {
    band: "AI-Ready Organisation",
    min: 80,
    max: 100,
    interpretation: "Strong individual AI adoption, comprehensive capability awareness, and mature organisational governance. The leader and their organisation are positioned to capture AI productivity gains systematically."
  },
  {
    band: "Building AI Capability",
    min: 60,
    max: 79,
    interpretation: "Moderate AI readiness with meaningful gaps in at least one domain. Targeted investment needed to close specific capability or governance gaps."
  },
  {
    band: "Early AI Adoption",
    min: 40,
    max: 59,
    interpretation: "Foundational AI capability is developing but not yet systemic. Risk of falling behind peers who are investing more deliberately in AI adoption."
  },
  {
    band: "AI Capability Gap",
    min: 0,
    max: 39,
    interpretation: "Significant gaps across individual adoption, capability awareness, and organisational governance. Urgent investment required to avoid structural disadvantage."
  }
];

export const DIMENSION_VERDICTS = [
  {
    dim: "all",
    min: 16,
    max: 20,
    verdict: "Strong",
    meaning: "Mature capability with demonstrated organisational impact"
  },
  {
    dim: "all",
    min: 10,
    max: 15.9,
    verdict: "Developing",
    meaning: "Emerging capability with targeted development opportunities"
  },
  {
    dim: "all",
    min: 0,
    max: 9.9,
    verdict: "Gap",
    meaning: "Significant capability gap requiring immediate attention"
  }
];

export const ARCHETYPES = [
  {
    name: "AI Champion",
    board_ai_fluency: "High",
    governance_maturity: "High",
    core_pattern: "Drives AI governance as board imperative",
    primary_governance_risk: "Over-advances; creates board friction"
  },
  {
    name: "Skeptical Director",
    board_ai_fluency: "High",
    governance_maturity: "Low",
    core_pattern: "Understands AI; distrusts governance structures",
    primary_governance_risk: "Valuable perspective without accountability"
  },
  {
    name: "Governance Bureaucrat",
    board_ai_fluency: "Low",
    governance_maturity: "High",
    core_pattern: "Process-compliant; AI-unaware",
    primary_governance_risk: "Governs AI without understanding it"
  },
  {
    name: "Disengaged Director",
    board_ai_fluency: "Low",
    governance_maturity: "Low",
    core_pattern: "Absent from AI governance entirely",
    primary_governance_risk: "Board-level AI risk unmanaged"
  }
];


export const SCORING_CONFIG = {
  INSTRUMENT, FULL_NAME, VERSION, TOTAL_QUESTIONS, SCALE, DELIVERY_MINUTES,
  TIER, PRICE_MILES, B2C_NAME, TAGLINE,
  DIMENSIONS, COMPOSITE_BANDS, DIMENSION_VERDICTS, ARCHETYPES,
};
