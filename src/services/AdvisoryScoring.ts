import type { WorkshopScore } from './supabaseApi';
import { authFetch } from '@/utils/authFetch';

export async function scoreAdvisoryAssessment(workshopId: string, participantId: string): Promise<WorkshopScore | null> {
  try {
    const res = await authFetch('/api/scoring/advisory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workshop_id: workshopId, participant_id: participantId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to score assessment' }));
      console.error('[AdvisoryScoring] API error:', err);
      return null;
    }

    const result = await res.json();
    if (result.success) {
      return result.data as WorkshopScore;
    }
    return null;
  } catch (err) {
    console.error('[AdvisoryScoring] Error scoring assessment:', err);
    return null;
  }
}

export async function generateWorkshopReport(workshopId: string): Promise<any | null> {
  try {
    const res = await authFetch('/api/scoring/advisory/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workshop_id: workshopId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to generate report' }));
      console.error('[AdvisoryScoring] Report generation error:', err);
      return null;
    }

    const result = await res.json();
    if (result.success) {
      return result.data;
    }
    return null;
  } catch (err) {
    console.error('[AdvisoryScoring] Error generating report:', err);
    return null;
  }
}