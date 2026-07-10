/**
 * api/_lib/nexusConfigHandler.ts
 * NEXUS persona configuration — read/write from Supabase platform_settings table
 * 
 * GET  /api/nexus/config — fetch current config
 * POST /api/nexus/config — update config
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const CONFIG_KEY = 'nexus_persona_config';

const DEFAULT_CONFIG = {
  temperature: 0.7,
  max_tokens: 500,
  model: 'deepseek-chat',
  formality: 0.7,
  directness: 0.65,
  terminology: 'professional',
  diagnostic_protocol: true,
  confidentiality_level: 'strict',
  milestone_tracking: true,
  system_prompt: '',
};

async function getConfig(): Promise<any> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return DEFAULT_CONFIG;

  try {
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/platform_settings?key=eq.${CONFIG_KEY}&select=value`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    if (!resp.ok) return DEFAULT_CONFIG;
    const rows = await resp.json();
    if (!rows || rows.length === 0 || !rows[0].value) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...rows[0].value };
  } catch {
    return DEFAULT_CONFIG;
  }
}

async function updateConfig(updates: any): Promise<any> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error('Supabase not configured');

  const current = await getConfig();
  const merged = { ...current, ...updates };
  const now = new Date().toISOString();

  // Try UPDATE first
  const updateResp = await fetch(
    `${SUPABASE_URL}/rest/v1/platform_settings?key=eq.${CONFIG_KEY}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        value: merged,
        updated_at: now,
        updated_by: 'admin',
      }),
    }
  );

  if (updateResp.ok) {
    const rows = await updateResp.json();
    if (rows && rows.length > 0) return merged;
  }

  // INSERT if no row existed
  const insertResp = await fetch(
    `${SUPABASE_URL}/rest/v1/platform_settings`,
    {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        key: CONFIG_KEY,
        value: merged,
        updated_at: now,
        updated_by: 'admin',
      }),
    }
  );

  if (!insertResp.ok) {
    const errText = await insertResp.text();
    throw new Error(`Failed to save config: ${insertResp.status} ${errText}`);
  }

  return merged;
}

export async function nexusConfigHandler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const config = await getConfig();
      return res.status(200).json(config);
    } else if (req.method === 'POST' || req.method === 'PUT') {
      const updates = req.body || {};
      
      // Validate numeric fields
      if (updates.temperature !== undefined) {
        const t = Number(updates.temperature);
        if (isNaN(t) || t < 0 || t > 2) return res.status(400).json({ error: 'temperature must be 0-2' });
        updates.temperature = t;
      }
      if (updates.max_tokens !== undefined) {
        const m = Number(updates.max_tokens);
        if (isNaN(m) || m < 50 || m > 8000) return res.status(400).json({ error: 'max_tokens must be 50-8000' });
        updates.max_tokens = m;
      }
      if (updates.formality !== undefined) {
        updates.formality = Math.max(0, Math.min(1, Number(updates.formality)));
      }
      if (updates.directness !== undefined) {
        updates.directness = Math.max(0, Math.min(1, Number(updates.directness)));
      }
      const allowedTerminology = ['executive', 'professional', 'accessible'];
      if (updates.terminology && !allowedTerminology.includes(updates.terminology)) {
        return res.status(400).json({ error: 'terminology must be executive|professional|accessible' });
      }

      const saved = await updateConfig(updates);
      return res.status(200).json(saved);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err: any) {
    console.error('[nexusConfigHandler] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
