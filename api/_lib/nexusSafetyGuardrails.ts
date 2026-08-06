export type SafetyBoundaryType =
  | 'medical'
  | 'legal'
  | 'financial'
  | 'illegal_unethical'
  | 'relationship_advice'
  | 'out_of_scope';

export interface SafetyPatternConfig {
  type: SafetyBoundaryType;
  keywords: string[];
  patterns: RegExp[];
}

export const SAFETY_BOUNDARY_PATTERNS: SafetyPatternConfig[] = [
  {
    type: 'medical',
    keywords: ['diagnosis', 'diagnose', 'treatment', 'cure', 'medication', 'medicine', 'prescription', 'symptoms', 'medical', 'disease', 'illness', 'sick', 'pain', 'infection', 'vaccine', 'surgery', 'cancer', 'diabetes'],
    patterns: [
      /\b(diagnosis|diagnose|treatment|cure|medication|medicine|prescription|symptoms?|medical|disease|illness|sick|pain|infection|vaccine|surgery|cancer|diabetes)\b/i,
      /\b(what.*(should|can).*(i|you).*(take|take.*for|do.*for).*(this|that|it|pain|symptom))\b/i,
      /\b(is.*this.*(serious|dangerous|urgent))\b/i,
      /\b(how.*(to|do).*(treat|cure|fix|heal))\b/i,
    ],
  },
  {
    type: 'legal',
    keywords: ['lawsuit', 'attorney', 'court', 'lawyer', 'legal', 'sue', 'sued', 'arrest', 'police', 'contract', 'breach', 'liability', 'compliance', 'regulation', 'statute', 'law'],
    patterns: [
      /\b(lawsuit|attorney|court|lawyer|legal|sue|sued|arrest|police|contract|breach|liability|compliance|regulation|statute)\b/i,
      /\b(can.*i.*sue|should.*i.*sue|how.*to.*sue)\b/i,
      /\b(what.*are.*my.*legal.*rights|my.*rights.*under)\b/i,
      /\b(is.*this.*illegal|is.*it.*legal|against.*the.*law)\b/i,
    ],
  },
  {
    type: 'financial',
    keywords: ['invest', 'investing', 'save', 'retire', 'retirement', 'stock', 'stocks', 'crypto', 'bitcoin', 'cryptocurrency', 'loan', 'mortgage', 'interest', 'profit', 'wealth', 'portfolio', 'budget', 'money', 'fund', 'investment', 'financial'],
    patterns: [
      /\b(invest|investing|save|retire|retirement|stock|stocks|crypto|bitcoin|cryptocurrency|loan|mortgage|interest|profit|wealth|portfolio|budget|money|fund|investment|financial)\b/i,
      /\b(how.*(should|can|to).*(i|you).*invest|best.*way.*to.*invest)\b/i,
      /\b(should.*i.*(buy|sell|invest|put.*money))\b/i,
      /\b(what.*is.*the.*best.*(investment|way.*to.*invest|stock|crypto))\b/i,
    ],
  },
  {
    type: 'relationship_advice',
    keywords: ['breakup', 'break up', 'divorce', 'partner', 'relationship', 'boyfriend', 'girlfriend', 'husband', 'wife', 'marriage', 'separation', 'infidelity', 'affair', 'dating', 'breakup advice'],
    patterns: [
      /\b(breakup|break.?up|divorce|partner|relationship|boyfriend|girlfriend|husband|wife|marriage|separation|infidelity|affair|dating)\b/i,
      /\b(how.*to.*(get.*over|deal.*with|handle).*(a|my|the).*(breakup|divorce|separation))\b/i,
      /\b(should.*i.*(break.*up|leave|divorce|forgive|trust))\b/i,
      /\b(my.*(boyfriend|girlfriend|husband|wife|partner).*(is|cheating|has|had))\b/i,
      /\b(cheat|cheating|unfaithful|infidelity).*(spouse|partner|boyfriend|girlfriend|husband|wife|marriage|relationship)/i,
    ],
  },
  {
    type: 'illegal_unethical',
    keywords: ['hack', 'hacking', 'forge', 'forgery', 'fake', 'steal', 'stealing', 'cheat', 'cheating', 'fraud', 'fraudulent', 'illegal', 'unethical', 'plagiarize', 'plagiarism', 'pirate', 'pirated', 'counterfeit', 'bribe', 'bribery', 'embezzle', 'embezzlement'],
    patterns: [
      /\b(hack|hacking|forge|forgery|fake|steal|stealing|cheat|cheating|fraud|fraudulent|illegal|unethical|plagiarize|plagiarism|pirate|pirated|counterfeit|bribe|bribery|embezzle|embezzlement)\b/i,
      /\b(how.*to.*hack|how.*do.*i.*hack|can.*i.*hack)\b/i,
      /\b(make.*it.*look.*fake|create.*a.*fake|forge.*a|how.*to.*forge)\b/i,
      /\b(is.*there.*a.*way.*to.*(cheat|hack|forge|fake|steal))\b/i,
    ],
  },
];

const REDIRECTION_MESSAGES: Record<SafetyBoundaryType, string> = {
  medical:
    'I understand you may be seeking guidance on a health matter. I am not a medical professional and cannot provide diagnosis, treatment, or medical advice. Please consult a qualified healthcare provider or emergency service if you are in urgent need of medical attention.',
  legal:
    'I understand you have a legal question. I am not a lawyer and cannot provide legal advice. Please consult a qualified legal professional or your local bar association for guidance on your specific situation.',
  financial:
    'I understand you are seeking financial guidance. I am not a licensed financial advisor and cannot provide investment, tax, or financial planning advice. Please consult a qualified financial professional for personalized guidance.',
  illegal_unethical:
    'I cannot assist with requests that involve illegal or unethical activities. If you are facing a difficult situation, I encourage you to seek help through legitimate channels and qualified professionals.',
  relationship_advice:
    'I understand you may be navigating a challenging relationship situation. While I can offer a supportive ear, I am not a substitute for professional counseling. Consider reaching out to a licensed therapist or counselor who can provide personalized guidance.',
  out_of_scope:
    'That question falls outside my core expertise as a career and professional development assistant. I am designed to help with career strategy, skill development, and professional growth. Is there something in those areas I can help you with?',
};

const OVERCONFIDENCE_MARKERS = [
  /\b(obviously|clearly|certainly|definitely|absolutely|of course|naturally|undoubtedly)\b/i,
  /\b(this is|it is) (always|never|everyone|everyone knows)\b/i,
  /\b(i (always|never|definitely|certainly|absolutely) (know|think|believe|recommend|suggest))\b/i,
  /\b(the only way|the best way|the correct way|you must|you have to)\b/i,
  /\b(guarantee|guaranteed|will definitely|100%|one hundred percent)\b/i,
  /\b(impossible|ridiculous|absurd|stupid|dumb|obviously wrong)\b/i,
];

const HUMILITY_TRIGGERS = [
  /\b(maybe|perhaps|i think|i believe|it seems|appears|possibly|potentially)\b/i,
  /\b(not entirely|not completely|limited|approximate|roughly|about|around)\b/i,
  /\b(might|could|may|suggest|recommend|consider)\b/i,
];

export function classifySafetyBoundary(userMessage: string): SafetyBoundaryType | null {
  if (!userMessage || typeof userMessage !== 'string') {
    return null;
  }

  const text = userMessage.trim();
  if (!text) return null;

  for (const config of SAFETY_BOUNDARY_PATTERNS) {
    for (const pattern of config.patterns) {
      if (pattern.test(text)) {
        return config.type;
      }
    }
  }

  return 'out_of_scope';
}

export function getSafetyRedirection(boundaryType: SafetyBoundaryType): string {
  return REDIRECTION_MESSAGES[boundaryType] || REDIRECTION_MESSAGES.out_of_scope;
}

export function assessModelConfidence(responseText: string): number {
  if (!responseText || typeof responseText !== 'string') {
    return 50;
  }

  let score = 70;
  const text = responseText.trim();

  for (const marker of OVERCONFIDENCE_MARKERS) {
    if (marker.test(text)) {
      score += 6;
    }
  }

  for (const trigger of HUMILITY_TRIGGERS) {
    if (trigger.test(text)) {
      score -= 5;
    }
  }

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (/\b(will|shall|must|will definitely|guaranteed)\b/i.test(trimmed) && /\b(not|never|no)\b/i.test(trimmed) === false) {
      score += 2;
    }
  }

  const hedgingCount = (text.match(/\b(maybe|perhaps|possibly|potentially|i think|i believe|it seems)\b/gi) || []).length;
  score -= hedgingCount * 2;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function generateHumilityNote(confidenceScore: number): string {
  if (confidenceScore >= 70) {
    return '';
  }

  const notes = [
    'Please keep in mind that this guidance is general in nature and may not apply to your specific situation.',
    'I want to be transparent that this is a complex area and individual circumstances can vary significantly.',
    'This is based on general principles, but I encourage you to consider your own context and seek additional perspectives.',
    'I should note that this guidance has limitations, and you may want to validate it with additional research or professional advice.',
    'Every situation is unique, so please use this as a starting point rather than a definitive answer.',
  ];

  let index: number;
  if (confidenceScore >= 50) {
    index = 0;
  } else if (confidenceScore >= 30) {
    index = 2;
  } else {
    index = 4;
  }

  return notes[index];
}
