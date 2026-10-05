/**
 * scripts/weekly-digest.ts — CLI runner for the LYC Partners weekly digest pipeline.
 *
 * Usage:
 *   npx tsx scripts/weekly-digest.ts [--dry-run] [--app-url=https://...] [--batch-size=100]
 *
 * Environment:
 *   SUPABASE_URL            required
 *   SUPABASE_SERVICE_ROLE_KEY required
 *   APP_URL                 optional (defaults to https://lyc-intelligence.app)
 *   CRON_SECRET             optional (not used by CLI)
 *
 * Exit codes:
 *   0 — success
 *   1 — unhandled error
 */
import { runWeeklyDigest, type WeeklyDigestSummary } from '../api/_lib/weeklyDigestPipeline.js';

function parseArgs(argv: string[]) {
  const args = {
    dryRun: false,
    appUrl: process.env.APP_URL,
    batchSize: 100,
    now: undefined as Date | undefined,
  };
  for (const arg of argv) {
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg.startsWith('--app-url=')) args.appUrl = arg.split('=')[1];
    else if (arg.startsWith('--batch-size=')) args.batchSize = Math.min(Number(arg.split('=')[1]), 500);
    else if (arg.startsWith('--now=')) args.now = new Date(arg.split('=')[1]);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[weekly-digest] missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  if (args.dryRun) {
    console.log('[weekly-digest] dry-run: would process users with', {
      appUrl: args.appUrl,
      batchSize: args.batchSize,
      now: args.now?.toISOString() || new Date().toISOString(),
    });
    return;
  }

  const summary: WeeklyDigestSummary = await runWeeklyDigest({
    appUrl: args.appUrl,
    batchSize: args.batchSize,
    now: args.now,
  });

  console.log('[weekly-digest] completed:', summary);
}

main().catch((e) => {
  console.error('[weekly-digest] fatal:', e);
  process.exit(1);
});
