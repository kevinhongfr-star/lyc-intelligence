import { authFetch, authFetchJSON } from '@/utils/authFetch';

const API_BASE = '/api/outreach';

export interface OutreachAttemptRecord {
  id: string;
  user_id: string;
  candidate_id: string;
  channel: string;
  template_id: string | null;
  subject: string;
  body: string;
  status: string;
  outcome: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface OutreachTemplateRecord {
  id: string;
  user_id: string;
  name: string;
  channel: string;
  subject: string;
  body: string;
  variables: string[];
  is_default: boolean;
  category: string;
  version: number;
}

export interface OutreachCampaignRecord {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  channel: string;
  template_ids: string[];
  recipient_segment: string;
  status: string;
  schedule: Record<string, unknown>;
  ab_test_enabled: boolean;
  stats: Record<string, number>;
  created_at: string;
  started_at: string | null;
}

export interface CalendarEventRecord {
  id: string;
  user_id: string;
  title: string;
  type: string;
  provider: string;
  start_time: string;
  end_time: string;
  location: string | null;
  status: string;
}

export async function sendOutreach(params: { channel: string; candidate_id: string; subject: string; body?: string; template_id?: string; recipient?: string }): Promise<{ success: boolean; attempt?: OutreachAttemptRecord; error?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function bulkSendOutreach(params: { channel: string; candidate_ids: string[]; subject: string; body?: string; template_id?: string }): Promise<{ success: boolean; sent?: number; error?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function listOutreachAttempts(): Promise<{ success: boolean; attempts?: OutreachAttemptRecord[]; error?: string }> {
  try {
    return await authFetchJSON(`${API_BASE}/attempts`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function listTemplates(): Promise<{ success: boolean; templates?: OutreachTemplateRecord[]; error?: string }> {
  try {
    return await authFetchJSON(`${API_BASE}/templates`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createTemplate(template: { name: string; channel: string; body: string; subject?: string; category?: string }): Promise<{ success: boolean; template?: OutreachTemplateRecord; error?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateTemplate(id: string, template: Partial<OutreachTemplateRecord>): Promise<{ success: boolean; template?: OutreachTemplateRecord; error?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function listCampaigns(): Promise<{ success: boolean; campaigns?: OutreachCampaignRecord[]; error?: string }> {
  try {
    return await authFetchJSON(`${API_BASE}/campaigns`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createCampaign(campaign: { name: string; channel: string; description?: string; template_ids?: string[]; recipient_segment?: string }): Promise<{ success: boolean; campaign?: OutreachCampaignRecord; error?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaign),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function listCalendarEvents(start?: string, end?: string): Promise<{ success: boolean; events?: CalendarEventRecord[]; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    return await authFetchJSON(`/api/calendar/events${params.toString() ?`?${params}`: ''}`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getCalendarAvailability(date?: string, durationMinutes?: number): Promise<{ success: boolean; slots?: Array<{ start: string; end: string }>; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (durationMinutes) params.set('duration_minutes', String(durationMinutes));
    return await authFetchJSON(`/api/calendar/availability${params.toString() ?`?${params}`: ''}`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getOutreachOverview(): Promise<{ success: boolean; summary?: Record<string, number>; error?: string }> {
  try {
    return await authFetchJSON('/api/analytics/outreach/overview');
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getOutreachFunnel(): Promise<{ success: boolean; funnel?: Array<{ step: string; count: number; rate: number }>; error?: string }> {
  try {
    return await authFetchJSON('/api/analytics/outreach/funnel');
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getChannelPerformance(): Promise<{ success: boolean; channels?: Array<Record<string, unknown>>; error?: string }> {
  try {
    return await authFetchJSON('/api/analytics/outreach/channels');
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}