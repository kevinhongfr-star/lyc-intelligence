/**
 * api/cron/[[...path]].ts — Single catch-all router for all cron jobs
 * Replaces 10 individual cron route files.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAutoEnrollNurture } from '../_lib/cron/autoEnrollNurture.js';
import { handleCheckUnopenedReports } from '../_lib/cron/checkUnopenedReports.js';
import { handleComputeAnalytics } from '../_lib/cron/computeAnalytics.js';
import { handleDetectSignals } from '../_lib/cron/detectSignals.js';
import { handleGenerateBenchmarks } from '../_lib/cron/generateBenchmarks.js';
import { handleGenerateQuarterlyReports } from '../_lib/cron/generateQuarterlyReports.js';
import { handleProcessEmailQueue } from '../_lib/cron/processEmailQueue.js';
import { handleProcessNurture } from '../_lib/cron/processNurture.js';
import { handleProcessSignals } from '../_lib/cron/processSignals.js';
import { handleSyncEmails } from '../_lib/cron/syncEmails.js';

export const maxDuration = 120;

const cronHandlers: Record<string, () => Promise<any>> = {
  'auto-enroll-nurture': handleAutoEnrollNurture,
  'check-unopened-reports': handleCheckUnopenedReports,
  'compute-analytics': handleComputeAnalytics,
  'detect-signals': handleDetectSignals,
  'generate-benchmarks': handleGenerateBenchmarks,
  'generate-quarterly-reports': handleGenerateQuarterlyReports,
  'process-email-queue': handleProcessEmailQueue,
  'process-nurture': handleProcessNurture,
  'process-signals': handleProcessSignals,
  'sync-emails': handleSyncEmails,
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Auth: check Bearer token OR x-cron-secret header
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  const altSecret = req.headers['x-cron-secret'];
  const validAuth =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (cronSecret && altSecret === cronSecret);

  if (cronSecret && !validAuth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const pathArr = (req.query.path as string[]) || [];
  const jobName = pathArr[0] || '';

  const fn = cronHandlers[jobName];
  if (!fn)
    return res.status(404).json({ error: `Unknown cron job: ${jobName}` });

  try {
    const result = await fn();
    return res.status(200).json(result);
  } catch (err: any) {
    console.error(`[cron/${jobName}]`, err);
    return res.status(500).json({
      error: `Cron ${jobName} failed`,
      details:
        process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
}