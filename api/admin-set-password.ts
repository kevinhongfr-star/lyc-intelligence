import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, admin_secret } = req.body;

  if (admin_secret !== 'nexus-admin-2026') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
    });

    if (!listRes.ok) {
      const errText = await listRes.text();
      return res.status(500).json({ error: 'Failed to list users', details: errText });
    }

    const listData = await listRes.json();
    const user = (listData.users || []).find((u: any) => u.email === email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      return res.status(500).json({ error: 'Failed to update password', details: errText });
    }

    const updateData = await updateRes.json();
    return res.status(200).json({ success: true, email: updateData.email });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}
