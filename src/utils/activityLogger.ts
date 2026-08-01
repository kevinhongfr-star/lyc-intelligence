/**
 * Fire-and-forget activity logger.
 *
 * POSTs an activity record to /api/activity-logs using the authenticated
 * fetch wrapper. Callers do not need to await the returned promise, and any
 * failure is swallowed (logged to console.error) so it never breaks the UI.
 */

import { authFetch } from '@/utils/authFetch';

export interface ActivityEntry {
  type: string;
  entity_type?: string;
  entity_id?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

export function logActivity(activity: ActivityEntry): void {
  try {
    void authFetch('/api/activity-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity),
    }).catch((e) => {
      console.error('[activityLogger] Failed to log activity:', e);
    });
  } catch (e) {
    console.error('[activityLogger] Failed to log activity:', e);
  }
}
