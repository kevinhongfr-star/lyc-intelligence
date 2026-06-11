/**
 * Parse LLM response into a sub-score + rationale.
 * Tolerant to common LLM response variations:
 *   - leading/trailing whitespace
 *   - code-fenced JSON blocks
 *   - prose around the JSON
 *   - score drift (0-100 / 0-10 instead of 0-20)
 */

export interface ParsedScore {
  score: number;        // 0-20, clamped
  rationale: string;    // 1-sentence, max 500 chars
}

export class ParseScoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseScoreError';
  }
}

/**
 * Detect and normalize score drift:
 *   - 0-20 scale: pass through
 *   - 0-100 scale: divide by 5
 *   - 0-10 scale: multiply by 2
 *   - 0-5 scale: multiply by 4
 * Detection: if max raw value > 20, treat as 0-100.
 */
function normalizeScore(raw: number): number {
  if (!Number.isFinite(raw)) {
    throw new ParseScoreError(`Score is not a finite number: ${raw}`);
  }
  if (raw > 20) {
    // Likely 0-100 scale
    return Math.round(raw / 5);
  }
  return Math.round(raw);
}

function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

export function parseScoreResponse(raw: string): ParsedScore {
  let text = raw.trim();
  text = stripCodeFences(text);

  let obj: any = null;
  try {
    obj = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new ParseScoreError(
        `No JSON object found in LLM response: ${raw.slice(0, 200)}`
      );
    }
    try {
      obj = JSON.parse(match[0]);
    } catch {
      throw new ParseScoreError(
        `Could not parse JSON from LLM response: ${match[0].slice(0, 200)}`
      );
    }
  }

  const rawScore = Number(obj?.score);
  const score = normalizeScore(rawScore);
  if (score < 0 || score > 20) {
    throw new ParseScoreError(
      `Score out of range after normalization: ${score} (raw ${rawScore})`
    );
  }

  const rationale = String(obj?.rationale ?? '').slice(0, 500).trim();
  if (!rationale) {
    throw new ParseScoreError(`LLM response missing "rationale" field: ${raw.slice(0, 200)}`);
  }

  return { score, rationale };
}
