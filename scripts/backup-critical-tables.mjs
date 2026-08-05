#!/usr/bin/env node
/**
 * S4-T06 — Weekly critical-table backup to Supabase Storage
 *
 * Dumps the critical tables listed below as JSON to a Supabase Storage bucket
 * (`backups`), organised by date. Designed to run as a weekly cron (Supabase
 * scheduled function, Vercel cron, or external scheduler).
 *
 * Required env vars:
 *   SUPABASE_URL          — e.g. https://rnnlteyqmtxkzllbohuu.supabase.co
 *   SUPABASE_SERVICE_ROLE — service-role key (bypasses RLS; keep secret)
 *   BACKUP_BUCKET         — Storage bucket name (default: backups)
 *
 * Usage:
 *   node scripts/backup-critical-tables.mjs
 *
 * Restore: see docs/operations/RECOVERY_RUNBOOK.md
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const BUCKET = process.env.BACKUP_BUCKET || 'backups';

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE env vars are required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

// Critical tables to back up. Keep this list in sync with the recovery runbook.
const CRITICAL_TABLES = [
  'contacts',
  'companies',
  'mandates',
  'candidate_pipeline',
  'candidates_pipeline',
  'candidate_shortlists',
  'client_accounts',
  'consultants',
  'scoring_config',
  'nexus_conversations',
  'nexus_memory',
];

// Cap per-table to avoid OOM on very large tables; full daily Supabase backups
// remain the source of truth for point-in-time recovery.
const ROW_LIMIT = 100000;

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

async function ensureBucket() {
  const { data, error } = await supabase.storage.getBucket(BUCKET);
  if (error && error.message.includes('not found')) {
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: '500MB',
    });
    if (createErr) throw new Error(`createBucket: ${createErr.message}`);
    console.log(`[backup] created bucket "${BUCKET}"`);
  } else if (error) {
    throw new Error(`getBucket: ${error.message}`);
  }
}

async function dumpTable(name) {
  const { data, error } = await supabase
    .from(name)
    .select('*')
    .limit(ROW_LIMIT);

  if (error) {
    console.warn(`[backup] WARN: ${name}: ${error.message}`);
    return { table: name, ok: false, error: error.message, rows: 0 };
  }
  const rows = Array.isArray(data) ? data.length : 0;
  const json = JSON.stringify(data ?? []);
  const path = `${timestamp()}/${name}.json`;
  const bytes = Buffer.byteLength(json, 'utf8');

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, json, {
      contentType: 'application/json',
      upsert: false,
    });

  if (uploadErr) {
    console.warn(`[backup] WARN: upload ${name}: ${uploadErr.message}`);
    return { table: name, ok: false, error: uploadErr.message, rows };
  }

  console.log(`[backup] OK: ${name} → ${path} (${rows} rows, ${(bytes / 1024).toFixed(1)} KiB)`);
  return { table: name, ok: true, rows, path, bytes };
}

async function main() {
  console.log(`[backup] start at ${new Date().toISOString()}`);
  await ensureBucket();

  const results = [];
  for (const t of CRITICAL_TABLES) {
    results.push(await dumpTable(t));
  }

  const manifest = {
    generated_at: new Date().toISOString(),
    supabase_url: SUPABASE_URL,
    bucket: BUCKET,
    tables: results,
  };
  const manifestPath = `${timestamp()}/MANIFEST.json`;
  await supabase.storage
    .from(BUCKET)
    .upload(manifestPath, JSON.stringify(manifest, null, 2), {
      contentType: 'application/json',
      upsert: false,
    });
  console.log(`[backup] manifest → ${manifestPath}`);

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.warn(`[backup] completed with ${failed.length} table(s) failing:`);
    for (const f of failed) console.warn(`  - ${f.table}: ${f.error}`);
    process.exit(2);
  }
  console.log(`[backup] done — ${results.length} tables backed up`);
}

main().catch((err) => {
  console.error('[backup] FATAL:', err);
  process.exit(1);
});
