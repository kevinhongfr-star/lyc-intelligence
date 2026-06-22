/**
 * 5 prompt templates for Org Intelligence scoring.
 * One per criterion. Each asks the model to apply a 0-20 rubric and
 * return a structured response (score + 1-sentence rationale).
 *
 * Source: docs/org_intelligence_scoring_spec_v1.2.md §"LLM Call Detail"
 *
 * Backend file — internal terminology in prompts is fine.
 * Output of these prompts is parsed by parseScoreResponse.ts and
 * stored in org_evaluation_scores. Rationales may be shown to admins
 * — admins have full access to the framework, no brand-rule concern.
 */

import type { Criterion } from './scoringCriteria.js';

const RESPONSE_FORMAT = `Respond with ONLY valid JSON in this exact format:
{
  "score": <integer 0-20>,
  "rationale": "<one sentence, max 200 chars, citing strongest evidence>"
}

Do not include any other text, no markdown, no code fences.`;

export function buildCriterionPrompt(
  criterion: Criterion,
  individualContext: string,
  mandateContext: string,
  successProfileContext: string = ''
): string {
  return `You are evaluating a candidate against the "${criterion.name}" criterion.

Criterion: ${criterion.name}
What it measures: ${criterion.description}

Scoring rubric (0-20 scale):
- 0-7 (low): ${criterion.rubricLow}
- 8-13 (mid): ${criterion.rubricMid}
- 14-20 (high): ${criterion.rubricHigh}

Individual context (public sources, admin intelligence):
${individualContext}

Target mandate (the role they would step into):
${mandateContext}${successProfileContext}

Apply the rubric to this individual against this mandate and success profile requirements. Output the score (0-20 integer) and a one-sentence rationale citing the strongest evidence you found in the context.

${RESPONSE_FORMAT}`;
}

/**
 * Build a "headline summary" prompt — produces the 1-sentence summary
 * shown in the admin UI for each individual.
 */
export function buildSummaryPrompt(
  individualContext: string,
  composite: number,
  tierLabel: string
): string {
  return `Summarize this individual in one sentence (max 200 chars).

Composite score: ${composite}/100 (${tierLabel})

Context:
${individualContext}

Output ONLY the summary sentence, no JSON, no quotes, no preamble.`;
}
