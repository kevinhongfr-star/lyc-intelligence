# Recovery Runbook — LYC Intelligence (S4-T06)

Step-by-step restoration guide for the LYC Intelligence Supabase deployment.
Covers point-in-time recovery, table-level restore from manual backups, and
verification. **Read fully before executing in an incident.**

---

## Backup strategy overview

| Layer | Mechanism | Frequency | Retention | Scope |
|-------|-----------|-----------|-----------|-------|
| Automatic | Supabase managed daily backups | Daily | 7 days (Free) / 30 days (Pro) | Full database |
| Point-in-time | Supabase PITR (Pro+ plan) | Continuous | Up to 7 days | Full database, minute granularity |
| Manual | `scripts/backup-critical-tables.mjs` | Weekly (cron) | Until manually purged | Critical tables only (JSON in Storage) |

**Critical tables** (covered by manual backup):
`contacts`, `companies`, `mandates`, `candidate_pipeline`, `candidates_pipeline`,
`candidate_shortlists`, `client_accounts`, `consultants`, `scoring_config`,
`nexus_conversations`, `nexus_memory`.

The manual export is a **secondary** safety net for targeted table restore; the
Supabase automatic + PITR backups are the **primary** recovery path.

---

## Scenario 1 — Accidental row deletion / bad migration (table-level restore)

Use when a single table or small set of rows needs to be restored without
rolling back the entire database.

### Prerequisites
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`, `BACKUP_BUCKET` env vars set
- Node.js 20+ with `@supabase/supabase-js` installed (this repo)

### Steps
1. List available backups and pick the timestamp:
   ```bash
   node -e "
   import { createClient } from '@supabase/supabase-js';
   const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
   const { data } = await sb.storage.from('backups').list();
   console.log(data?.map(d => d.name).join('\n'));
   "
   ```
2. Download the table JSON for the chosen timestamp:
   ```bash
   node -e "
   import { createClient } from '@supabase/supabase-js';
   import { writeFileSync } from 'fs';
   const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
   const TS = '20260804T120000Z';   // adjust
   const TABLE = 'mandates';        // adjust
   const { data, error } = await sb.storage.from('backups').download(\`\${TS}/\${TABLE}.json\`);
   if (error) throw error;
   writeFileSync(\`./restore-\${TABLE}.json\`, Buffer.from(await data.arrayBuffer()));
   console.log('downloaded');
   "
   ```
3. Inspect the JSON locally and decide whether to upsert (preserve newer rows)
   or truncate + reload (lose newer rows). Default to **upsert** unless you are
   certain no newer writes exist.
4. Restore via an upsert script (run in a transaction-safe manner):
   ```bash
   node -e "
   import { createClient } from '@supabase/supabase-js';
   import { readFileSync } from 'fs';
   const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
   const rows = JSON.parse(readFileSync('./restore-mandates.json', 'utf8'));
   const { error } = await sb.from('mandates').upsert(rows, { onConflict: 'id' });
   if (error) throw error;
   console.log('restored', rows.length, 'rows');
   "
   ```
5. Verify row counts and a sample row match expected values (see Verification).

---

## Scenario 2 — Full database restore via Supabase PITR (preferred)

Use when the database is corrupted, a destructive migration was deployed, or a
large-scale data loss occurred.

### Prerequisites
- Supabase Pro plan or higher (PITR is a Pro+ feature)
- Project owner access to the Supabase dashboard

### Steps
1. Go to **Supabase Dashboard → Project → Database → Backups**.
2. Under **Point-in-time Recovery**, pick the restore target timestamp.
   - Choose a timestamp **just before** the incident.
   - PITR granularity is ~1 minute.
3. Click **Restore to a new project** (recommended — avoids overwriting the
   live project during validation). Supabase provisions a clone.
4. Validate the clone:
   - Row counts on critical tables match expected (see Verification).
   - A representative API call returns expected data.
   - Frontend can point at the clone (temporary env var swap in a staging
     deployment) and load without errors.
5. Promote the clone:
   - Option A (low-risk): repoint Vercel `VITE_SUPABASE_URL` to the clone's
     URL and redeploy. Keep the original paused for 24h as a fallback.
   - Option B (destructive): from the clone, use **Database → Replication** or
     `pg_dump`/`pg_restore` to overwrite the original. Only use if Option A is
     not feasible.
6. Update the team — close the incident with a postmortem referencing this
   runbook and the timestamp used.

---

## Scenario 3 — Storage bucket backup lost / inaccessible

The `backups` bucket in Supabase Storage holds the manual JSON exports.

1. Check bucket existence:
   ```bash
   node -e "
   import { createClient } from '@supabase/supabase-js';
   const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
   const { data, error } = await sb.storage.getBucket('backups');
   console.log(error ? 'MISSING: ' + error.message : 'OK: ' + JSON.stringify(data));
   "
   ```
2. If missing, recreate it and immediately run `scripts/backup-critical-tables.mjs`.
3. If the service-role key is compromised, rotate it in
   **Supabase Dashboard → Project Settings → API** before recreating the bucket.

---

## Verification (run after any restore)

For each critical table, confirm the restored count is within ±2% of the
expected baseline (track the baseline in your incident notes or the
`MANIFEST.json` from the backup run).

```bash
node -e "
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
const tables = ['contacts','companies','mandates','candidate_pipeline','candidates_pipeline','candidate_shortlists','client_accounts','consultants','scoring_config','nexus_conversations','nexus_memory'];
for (const t of tables) {
  const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true });
  console.log(\`\${t}: \${error ? 'ERR ' + error.message : count}\`);
}
"
```

Also verify:
- Auth users count matches expected (`auth.users` table — visible in dashboard).
- A representative row from `mandates` and `contacts` has the expected fields.
- The frontend loads `/candidate/dashboard` and `/client/overview` without
  console errors (signals RLS + joins are intact).

---

## Scheduling the weekly manual backup

Recommended: Supabase scheduled function (Database → Functions → Schedule) or a
Vercel cron job hitting a secure endpoint that runs
`scripts/backup-critical-tables.mjs`.

Cron expression (weekly, Sunday 03:00 UTC):
```
0 3 * * 0
```

Alert on non-zero exit code. The script exits `2` if any table fails and `1`
on fatal errors.

---

## Contacts

- Supabase dashboard owner: LYC Partners engineering
- Escalation: see the project's on-call rotation
