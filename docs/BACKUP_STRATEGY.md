# Database Backup Strategy — LYC Intelligence

## Overview
Automated backup and recovery strategy for the LYC Intelligence platform database (Supabase PostgreSQL).

## Backup Types

### 1. Full Backup (Daily, 02:00 UTC)
- **What:** Complete export of all 20+ tables as JSON files
- **Retention:** 30 days
- **Storage:** Supabase Storage bucket `backups`
- **Trigger:** External cron → POST `/api/backups` with `{"type": "full"}`
- **Size estimate:** ~2-5 GB (grows with data)

### 2. Incremental Backup (Hourly)
- **What:** Export rows with `updated_at` since last incremental
- **Retention:** 7 days
- **Storage:** Supabase Storage bucket `backups`
- **Trigger:** External cron → POST `/api/backups` with `{"type": "incremental", "since": "<ISO timestamp>"}`
- **Size estimate:** ~10-100 MB per run

### 3. Schema Backup (Weekly, Sunday)
- **What:** Table definitions and metadata
- **Retention:** 90 days
- **Storage:** Supabase Storage bucket `backups`

### 4. On-Demand (Manual)
- **Trigger:** Admin console → POST `/api/backups` with specific tables
- **Use case:** Before major migrations or data changes

## Implementation

### API Endpoints
All backup operations go through `/api/backups`:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/backups` | List all backup jobs |
| POST | `/api/backups` | Trigger new backup |
| POST | `/api/backups/verify/:id` | Verify backup integrity |
| POST | `/api/backups/restore` | Queue restore job |
| GET | `/api/backups/schedule` | Get schedule config |
| GET | `/api/backups/stats` | Get backup statistics |
| POST | `/api/backups/export` | Quick table export |

### Storage Structure
```
backups/
  2026-07-20/
    full/
      bk-1234567890-abc123/
        manifest.json          ← Backup metadata
        profiles.json          ← Table data
        organizations.json
        mandates.json
        candidates.json
        ...
    incremental/
      bk-1234567891-def456/
        manifest.json
        profiles.json
        ...
    schema/
      bk-1234567892-ghi789/
        schema.json
```

### Critical Tables (Priority Order)
1. `profiles` — User accounts and auth
2. `organizations` — Client organizations
3. `org_members` — Org membership
4. `mandates` — Executive search mandates
5. `candidates` — Candidate records
6. `applications` — Candidate-mandate applications
7. `assessments` — Assessment records
8. `assessment_answers` — Assessment responses
9. `assessment_results` — Scoring results
10. `credits` — Credit balances
11. `credit_transactions` — Transaction history
12. `subscriptions` — Subscription records
13. `documents` — Generated documents
14. `notifications` — User notifications
15. `audit_logs` — Audit trail

## Scheduling

### Option 1: Vercel Cron (Recommended)
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/backups/cron",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Option 2: External Scheduler
Use GitHub Actions, cron-job.org, or similar to POST to the backup API.

### Option 3: Supabase Built-in
Supabase Pro plan includes automated daily backups with PITR (Point-in-Time Recovery). This is complementary to our logical backups.

## Recovery Process

1. **Identify the backup to restore from:**
   ```bash
   GET /api/backups?status=verified&limit=10
   ```

2. **Queue the restore:**
   ```bash
   POST /api/backups/restore
   Body: {"backupId": "bk-xxx", "targetEnv": "staging"}
   ```

3. **Verify the restore:**
   ```bash
   POST /api/backups/verify/bk-xxx
   ```

4. **Test application functionality** after restore

## Monitoring
- Backup stats available at `GET /api/backups/stats`
- Admin console shows backup health
- Failed backups trigger alerts via notification system

## RTO/RPO Targets
- **RPO (Recovery Point Objective):** 1 hour (hourly incremental backups)
- **RTO (Recovery Time Objective):** 30 minutes (automated restore queue)

## Security
- All backup operations require admin authentication
- Backup data encrypted at rest (Supabase Storage)
- Backup access logged in audit_logs table
- Retention policies enforced automatically
