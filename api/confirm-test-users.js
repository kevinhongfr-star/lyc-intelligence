// Confirm ECHO audit test accounts using service_role key
// Low-risk: only confirms 3 specific hardcoded test email addresses
import { createClient } from '@supabase/supabase-js';

const TEST_ACCOUNTS = [
  'echo.leader@lyc-partners.ai',
  'echo.candidate@lyc-partners.ai',
  'echo.consultant@lyc-partners.ai',
];

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const results = [];

    for (const email of TEST_ACCOUNTS) {
      // Find user
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        results.push({ email, error: listError.message });
        continue;
      }

      const user = users.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        results.push({ email, error: 'User not found' });
        continue;
      }

      // Confirm email
      const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      });

      if (error) {
        results.push({ email, error: error.message });
      } else {
        results.push({
          email,
          confirmed: true,
          confirmed_at: data.user.confirmed_at,
          role: data.user.user_metadata?.role || 'none',
        });
      }
    }

    return res.status(200).json({ results });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
