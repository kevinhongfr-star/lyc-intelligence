export type MemoryType = 'decision' | 'action_item' | 'emotion' | 'fact' | 'preference' | 'summary';

export interface ExtractedMemory {
  memory_type: MemoryType;
  content: string;
  confidence: number;
  keywords: string[];
}

export interface EpisodicMemoryRecord {
  id: string;
  user_id: string;
  content: string;
  memory_type: MemoryType;
  source_conversation_id?: string;
  importance_score: number;
  ts: number;
  keywords: string[];
  archived?: boolean;
}

const DECISION_PATTERNS: RegExp[] = [
  /\bwe'?ll\s+(.+?)(?:[.!?]|$)/gi,
  /\bi\s+will\s+(.+?)(?:[.!?]|$)/gi,
  /\blet'?s\s+(.+?)(?:[.!?]|$)/gi,
  /\bagreed\s*(?:that|:)?\s+(.+?)(?:[.!?]|$)/gi,
  /\bwe\s+will\s+(.+?)(?:[.!?]|$)/gi,
  /\bdecision\s*(?:made|:|is)\s+(.+?)(?:[.!?]|$)/gi,
];

const ACTION_ITEM_PATTERNS: RegExp[] = [
  /\bneed\s+to\s+(.+?)(?:[.!?]|$)/gi,
  /\bhave\s+to\s+(.+?)(?:[.!?]|$)/gi,
  /\bmust\s+(.+?)(?:[.!?]|$)/gi,
  /\bshould\s+(.+?)(?:[.!?]|$)/gi,
  /\baction\s+item\s*(?::|-)?\s+(.+?)(?:[.!?]|$)/gi,
  /\bnext\s+step\s*(?::|-)?\s+(.+?)(?:[.!?]|$)/gi,
  /\bfollow\s+up\s*(?:on|with|:)?\s+(.+?)(?:[.!?]|$)/gi,
];

const EMOTION_KEYWORDS: Record<string, RegExp> = {
  happy: /\b(happy|glad|pleased|excited|great|good|thrilled|delighted)\b/i,
  frustrated: /\b(frustrated|annoyed|angry|irritated|fed\s*up|exasperated)\b/i,
  excited: /\b(excited|eager|thrilled|pumped|stoked|enthusiastic)\b/i,
  worried: /\b(worried|anxious|concerned|nervous|stressed|uneasy|apprehensive)\b/i,
  confident: /\b(confident|certain|sure|convinced|assured|positive)\b/i,
  overwhelmed: /\b(overwhelmed|swamped|burnt\s*out|burned\s*out|exhausted|drained|stretched)\b/i,
};

const FACT_PATTERNS: RegExp[] = [
  /\bi'?m\s+a\s+(.+?)(?:[.!?]|$)/gi,
  /\bi\s+am\s+a\s+(.+?)(?:[.!?]|$)/gi,
  /\bi\s+have\s+a\s+team\b/gi,
  /\bmy\s+(role|title|position|industry|company|team\s*size)\s*(?:is|:)\s+(.+?)(?:[.!?]|$)/gi,
  /\bi\s+work\s+(?:at|in|for)\s+(.+?)(?:[.!?]|$)/gi,
  /\bi\s+manage\s+(.+?)(?:[.!?]|$)/gi,
  /\bi\s+lead\s+(.+?)(?:[.!?]|$)/gi,
];

const STOPWORDS = new Set([
  'the','a','an','and','or','but','if','then','else','of','to','in','on','at','by',
  'for','with','about','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','should','could','may','might','must','shall','can',
  'i','me','my','myself','we','our','ours','you','your','yours','he','him','his','she',
  'her','hers','it','its','they','them','their','theirs','this','that','these','those',
  'what','which','who','whom','whose','when','where','why','how','all','any','both',
  'each','few','more','most','other','some','such','no','nor','not','only','own','same',
  'so','than','too','very','just','also','now','here','there','from','up','down','out',
  'off','over','under','again','further','once','during','before','after','above','below',
  'between','through','into','throughout','within','without','along','across','behind',
  'beyond','near','upon','per','etc','as','because','while','although','though','whether',
  'since','until','unless','however','therefore','thus','hence','like','unlike','via',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

export function extractKeywords(text: string, limit: number = 10): string[] {
  const tokens = tokenize(text);
  const counts: Record<string, number> = {};
  for (const t of tokens) {
    counts[t] = (counts[t] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
}

export function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  setA.forEach((item) => {
    if (setB.has(item)) intersection++;
  });
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function estimateImportance(memory: ExtractedMemory | { content: string; memory_type: MemoryType }): number {
  let score = 0.3;
  const content = memory.content.toLowerCase();
  const type = memory.memory_type;

  const typeBase: Record<MemoryType, number> = {
    decision: 0.65,
    action_item: 0.55,
    emotion: 0.35,
    fact: 0.5,
    preference: 0.5,
    summary: 0.6,
  };
  score = typeBase[type] ?? 0.4;

  if (/deadline|urgent|critical|important|must|essential|priority/i.test(content)) {
    score += 0.15;
  }
  if (/this week|today|tomorrow|soon|immediately|asap/i.test(content)) {
    score += 0.1;
  }
  if (/team|company|stakeholder|board|executive|ceo|client/i.test(content)) {
    score += 0.08;
  }
  if (/career|promotion|role|transition|interview|offer|salary|compensation/i.test(content)) {
    score += 0.1;
  }
  if (content.length > 120) score += 0.05;
  if (/!/.test(memory.content)) score += 0.03;

  return Math.min(1, Math.max(0, Math.round(score * 100) / 100));
}

function cleanExtract(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.;:!?-]+|[\s,.;:!?-]+$/g, '')
    .trim();
}

function sentenceSplit(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  return sentences.map(s => s.trim()).filter(Boolean);
}

export function autoExtract(conversationText: string): ExtractedMemory[] {
  const results: ExtractedMemory[] = [];
  const sentences = sentenceSplit(conversationText);

  for (const sentence of sentences) {
    for (const pattern of DECISION_PATTERNS) {
      let match: RegExpExecArray | null;
      const localPattern = new RegExp(pattern.source, pattern.flags);
      while ((match = localPattern.exec(sentence)) !== null) {
        const extracted = cleanExtract(match[1] || sentence);
        if (extracted.length >= 8 && extracted.length <= 500) {
          results.push({
            memory_type: 'decision',
            content: extracted,
            confidence: 0.75,
            keywords: extractKeywords(extracted),
          });
          break;
        }
      }
    }

    for (const pattern of ACTION_ITEM_PATTERNS) {
      let match: RegExpExecArray | null;
      const localPattern = new RegExp(pattern.source, pattern.flags);
      while ((match = localPattern.exec(sentence)) !== null) {
        const extracted = cleanExtract(match[1] || sentence);
        if (extracted.length >= 8 && extracted.length <= 500) {
          const already = results.some(
            r => r.memory_type === 'action_item' && r.content === extracted
          );
          if (!already) {
            results.push({
              memory_type: 'action_item',
              content: extracted,
              confidence: 0.7,
              keywords: extractKeywords(extracted),
            });
          }
          break;
        }
      }
    }

    for (const [emotion, pattern] of Object.entries(EMOTION_KEYWORDS)) {
      if (pattern.test(sentence)) {
        const already = results.some(
          r => r.memory_type === 'emotion' && r.content.includes(emotion)
        );
        if (!already) {
          results.push({
            memory_type: 'emotion',
            content: `User expressed feeling ${emotion}: "${cleanExtract(sentence)}"`,
            confidence: 0.6,
            keywords: [emotion, ...extractKeywords(sentence, 5)],
          });
          break;
        }
      }
    }

    for (const pattern of FACT_PATTERNS) {
      let match: RegExpExecArray | null;
      const localPattern = new RegExp(pattern.source, pattern.flags);
      while ((match = localPattern.exec(sentence)) !== null) {
        const extracted = cleanExtract(match[1] ? `${match[0].replace(/[.!?]+$/, '')}` : sentence);
        if (extracted.length >= 6 && extracted.length <= 500) {
          const already = results.some(
            r => r.memory_type === 'fact' &&
              (r.content === extracted ||
                (r.content.includes(extracted) && extracted.length > 20))
          );
          if (!already) {
            results.push({
              memory_type: 'fact',
              content: extracted,
              confidence: 0.8,
              keywords: extractKeywords(extracted),
            });
          }
          break;
        }
      }
    }
  }

  return results;
}

export interface RelatedMemoryResult {
  memory: EpisodicMemoryRecord;
  similarity: number;
}

export function getRelated(
  queryText: string,
  memoryStore: EpisodicMemoryRecord[],
  topK: number = 5
): RelatedMemoryResult[] {
  const queryKeywords = new Set(extractKeywords(queryText, 15));
  const queryTokens = new Set(tokenize(queryText));

  const scored: RelatedMemoryResult[] = memoryStore
    .filter(m => !m.archived)
    .map(memory => {
      const memKeywords = new Set(memory.keywords || extractKeywords(memory.content, 15));
      const memTokens = new Set(tokenize(memory.content));
      const keywordSim = jaccardSimilarity(queryKeywords, memKeywords);
      const tokenSim = jaccardSimilarity(queryTokens, memTokens);
      const importanceBoost = (memory.importance_score || 0) * 0.15;
      const similarity = Math.min(1, keywordSim * 0.5 + tokenSim * 0.35 + importanceBoost);
      return { memory, similarity };
    })
    .filter(r => r.similarity > 0.02)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return scored;
}

export interface CleanupResult {
  archived: string[];
  remaining: number;
}

const ARCHIVE_THRESHOLD_DAYS = 90;
const ARCHIVE_IMPORTANCE_CUTOFF = 0.3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function autoCleanup(
  memoryStore: EpisodicMemoryRecord[],
  nowTs: number = Date.now()
): CleanupResult {
  const cutoffTs = nowTs - ARCHIVE_THRESHOLD_DAYS * MS_PER_DAY;
  const archived: string[] = [];
  let remaining = 0;

  for (const memory of memoryStore) {
    const memTs = memory.ts ?? 0;
    if (
      !memory.archived &&
      memTs < cutoffTs &&
      (memory.importance_score ?? 0) < ARCHIVE_IMPORTANCE_CUTOFF
    ) {
      memory.archived = true;
      archived.push(memory.id);
    } else if (!memory.archived) {
      remaining++;
    }
  }

  return { archived, remaining };
}
