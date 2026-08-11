// Confirm a user's email using service_role key (admin bypass)
// Secured by CRON_SECRET header check
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '');
  if (token !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'email required' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const user = users.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        confirmed_at: data.user.confirmed_at,
        role: data.user.user_metadata?.role || 'none',
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
