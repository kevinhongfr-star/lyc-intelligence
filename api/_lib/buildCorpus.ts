/**
 * Build the corpus sent to the LLM for each criterion evaluation.
 *
 * Strategy: top-K source truncation. The full evidence list for an
 * individual can be 50+ sources; sending all of them blows the context
 * window. We rank by source authority + recency + title specificity,
 * take the top K, and concatenate with structured headers.
 *
 * Phase 1: simple deterministic ranking. BM25 / embeddings can be
 * layered in later if noise shows up.
 */

export type SourceType = 'web' | 'professional_network' | 'admin_supplied';

export interface Source {
  url: string;
  title: string;
  snippet: string;        // short excerpt, ~200 chars
  publishedAt?: string;   // ISO 8601
  sourceType: SourceType;
}

const TOP_K = 8;
const MAX_CONTEXT_CHARS = 12_000;

const TYPE_WEIGHT: Record<SourceType, number> = {
  admin_supplied: 3,
  professional_network: 2,
  web: 1,
};

function rank(sources: Source[]): Source[] {
  return [...sources].sort((a, b) => {
    const tw = (TYPE_WEIGHT[b.sourceType] ?? 0) - (TYPE_WEIGHT[a.sourceType] ?? 0);
    if (tw !== 0) return tw;

    const ad = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bd = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    if (bd !== ad) return bd - ad;

    return (b.title?.length ?? 0) - (a.title?.length ?? 0);
  });
}

export interface BuildCorpusResult {
  context: string;
  sourcesUsed: number;
  sourcesTotal: number;
  truncated: boolean;
}

export function buildCorpus(sources: Source[]): BuildCorpusResult {
  const ranked = rank(sources).slice(0, TOP_K);
  const total = sources.length;

  const blocks: string[] = [];
  let used = 0;
  let truncated = false;

  for (const s of ranked) {
    const block = `[${s.sourceType}] ${s.title}\n${s.url}\n${s.publishedAt ?? 'undated'}\n${s.snippet}`;
    const joined = blocks.join('\n\n');
    if (joined.length + block.length + 2 > MAX_CONTEXT_CHARS) {
      truncated = true;
      break;
    }
    blocks.push(block);
    used++;
  }

  return {
    context: blocks.join('\n\n'),
    sourcesUsed: used,
    sourcesTotal: total,
    truncated,
  };
}
