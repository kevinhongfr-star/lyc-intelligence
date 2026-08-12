/**
 * nexusAssessmentIntegration.ts — NEXUS ↔ Assessment integration layer.
 *
 * #1279: Two integration points:
 *   1. NEXUS can start assessments (direct user to /diagnostics/[slug]/take)
 *   2. NEXUS can discuss results (retrieve and interpret assessment results)
 */

import { getDiagnostic, getAllDiagnosticSlugs } from '@/data/diagnostics';
import { isAnonymousAllowed, tierDisplayName } from '@/config/tierConfig';
import { getResult } from '@/services/diagnosticApi';
import type { ScoringResult } from '@/services/diagnosticScoring';
import type { DiagnosticSlug } from '@/config/tierConfig';

export interface NexusAssessmentContext {
  available: Array<{
    slug: string;
    title: string;
    subtitle: string;
    tier: string;
    questionCount: number;
    canTakeAnonymously: boolean;
  }>;
  completed: Array<{
    slug: string;
    title: string;
    overallScore: number;
    overallLevel: string;
    archetypeName: string | null;
    resultId: string;
  }>;
}

export function buildNexusAssessmentContext(
  completedResults: NexusAssessmentContext['completed'] = []
): string {
  const all = getAllDiagnosticSlugs().map((slug) => {
    const def = getDiagnostic(slug);
    if (!def) return null;
    return {
      slug,
      title: def.meta.title,
      subtitle: def.meta.subtitle,
      tier: tierDisplayName(def.meta.tier_key),
      questionCount: def.meta.total_questions,
      canTakeAnonymously: isAnonymousAllowed(slug),
    };
  }).filter(Boolean);

  const availableList = all.map((d) => {
    const anonNote = d!.canTakeAnonymously ? ' (complimentary, no login required)' : '';
    return `  - ${d!.title} (${d!.slug}): ${d!.subtitle} - ${d!.questionCount} questions, ${d!.tier} tier${anonNote}`;
  }).join('\n');

  const completedList = completedResults.length > 0
    ? completedResults.map((r) =>
        `  - ${r.title} (${r.slug}): Score ${r.overallScore}/100 (${r.overallLevel}), Archetype: ${r.archetypeName ?? 'N/A'}`
      ).join('\n')
    : '  (no assessments completed yet)';

  return `ASSESSMENT CONTEXT:
Available diagnostics:
${availableList}

User's completed assessments:
${completedList}

You can help users:
1. Start an assessment by directing them to /diagnostics/[slug]/take
2. Discuss completed results - interpret scores, suggest development areas
3. Recommend which diagnostic to take next based on their goals
4. Deep-link to results: /diagnostics/[slug]/results/[resultId]`;
}

export type AssessmentIntent =
  | { type: 'take'; slug: string }
  | { type: 'discuss'; slug: string; resultId?: string }
  | { type: 'recommend' }
  | { type: 'none' };

const DIAGNOSTIC_NAMES: Record<string, string[]> = {
  prism: ['prism', 'career branding', 'professional branding'],
  spark: ['spark', 'ai leadership', 'ai readiness'],
  forge: ['forge', 'sales excellence', 'sales'],
  bridge: ['bridge', 'china leadership', 'china readiness'],
  mosaic: ['mosaic', 'cultural intelligence', 'cultural cq'],
  drive: ['drive', 'execution capability', 'execution'],
};

export function detectAssessmentIntent(message: string): AssessmentIntent {
  const lower = message.toLowerCase();

  for (const [slug, names] of Object.entries(DIAGNOSTIC_NAMES)) {
    for (const name of names) {
      if (lower.includes(name)) {
        if (lower.match(/take|start|begin|do\s+the/)) {
          return { type: 'take', slug };
        }
        if (lower.match(/discuss|results?|score|my\s+/)) {
          return { type: 'discuss', slug };
        }
      }
    }
  }

  if (lower.match(/which.*assessment|recommend.*diagnostic|what.*should.*i.*take/)) {
    return { type: 'recommend' };
  }

  return { type: 'none' };
}

export function getTakeLink(slug: string): string {
  return `/diagnostics/${slug}/take`;
}

export function getResultsLink(slug: string, resultId: string): string {
  return `/diagnostics/${slug}/results/${resultId}`;
}

export function getLandingLink(slug: string): string {
  return `/diagnostics/${slug}`;
}

export async function retrieveResultForNexus(
  slug: string,
  resultId: string,
  userId: string | null
): Promise<{ result: ScoringResult; resultId: string } | null> {
  return getResult(resultId, slug, userId);
}

export function buildResultDiscussion(
  slug: string,
  result: ScoringResult
): string {
  const def = getDiagnostic(slug);
  if (!def) return 'I cannot find that diagnostic.';

  const topDim = [...result.dimension_scores].sort((a, b) => b.score - a.score)[0];
  const bottomDim = [...result.dimension_scores].sort((a, b) => a.score - b.score)[0];

  let response = `Your ${def.meta.title} results show an overall score of ${result.overall_score}/100 (${result.overall_level}).\n\n`;

  if (result.archetype_name) {
    response += `Your primary archetype is ${result.archetype_name}.\n\n`;
  }

  if (topDim) {
    response += `Your strongest dimension is ${topDim.dimension_name} (${topDim.score}/100, ${topDim.level}). ${topDim.description}\n\n`;
  }

  if (bottomDim && bottomDim.dimension_key !== topDim?.dimension_key) {
    response += `Your development priority is ${bottomDim.dimension_name} (${bottomDim.score}/100, ${bottomDim.level}). ${bottomDim.description}\n\n`;
  }

  response += `Would you like to explore specific dimensions in more depth, or discuss a development plan?`;

  return response;
}

export function recommendDiagnostic(userGoal: string): DiagnosticSlug | null {
  const lower = userGoal.toLowerCase();

  if (lower.match(/career|brand|professional\s+identity/)) return 'prism';
  if (lower.match(/ai|artificial\s+intelligence|digital\s+transform/)) return 'spark';
  if (lower.match(/sales|revenue|deal|pipeline/)) return 'forge';
  if (lower.match(/china|chinese|asia|cross-border/)) return 'bridge';
  if (lower.match(/cultur|diversity|global\s+team|cross-cultural/)) return 'mosaic';
  if (lower.match(/execut|operations|performance|delivery/)) return 'drive';

  return null;
}
