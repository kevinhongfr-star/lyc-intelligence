
import { getSupabase } from './supabaseApi';

export interface B2CLeadInput {
  name: string;
  email: string;
  current_title?: string;
  country?: string;
  source: string;
  message_summary?: string;
}

export interface B2BLeadInput {
  name: string;
  work_email: string;
  company: string;
  title?: string;
  source: string;
}

export async function captureB2CLead(lead: B2CLeadInput): Promise<boolean> {
  try {
    const res = await fetch('/api/lead-capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...lead, type: 'b2c' }),
    });
    return res.ok;
  } catch (e) {
    console.error('Error capturing B2C lead:', e);
    return false;
  }
}

export async function captureB2BLead(lead: B2BLeadInput): Promise<boolean> {
  try {
    const res = await fetch('/api/lead-capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...lead, type: 'b2b' }),
    });
    return res.ok;
  } catch (e) {
    console.error('Error capturing B2B lead:', e);
    return false;
  }
}

export async function sendEmailNotification(data: {
  type: 'welcome' | 'lead_notify' | 'lead_capture' | 'upgrade_reminder' | 'hot_lead';
  payload: any;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (e) {
    console.error('Error sending email:', e);
    return false;
  }
}
