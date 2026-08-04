/**
 * api/_lib/cron/generateProactiveSuggestions.ts — S7-T05 (N5)
 *
 * Cron job: evaluate all proactive-suggestion triggers and emit new
 * suggestions (with notifications) for any qualifying events.
 *
 * Scheduled via /api/cron/generate-proactive-suggestions with CRON_SECRET.
 * Runs on an hourly cadence (configurable in Vercel/Dashboard).
 *
 * Trigger sources:
 *   - pipeline_stage_history (last 24h)        → stage_change
 *   - candidates_pipeline high match_score      → new_match
 *   - nexus_conversations diagnostic_progress   → assessment_complete
 *   - nexus_memory (strength, importance>=0.75) → profile_strength
 *   - stale conversations (7+ days)             → stale_conversation
 */

import { evaluateAllTriggers } from '../nexusProactiveHandler.js';

export async function handleGenerateProactiveSuggestions() {
  const result = await evaluateAllTriggers();
  return {
    generated: result,
    timestamp: new Date().toISOString(),
  };
}
