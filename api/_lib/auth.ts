import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export interface AuthedRequest extends VercelRequest {
  userId?: string;
  userEmail?: string;
}

export async function requireAuth(
  req: AuthedRequest,
  res: VercelResponse
): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization token' });
    return false;
  }

  const token = authHeader.slice(7);
  if (!supabase) {
    console.warn('[Auth] Supabase not configured, skipping auth');
    return true;
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return false;
    }
    req.userId = data.user.id;
    req.userEmail = data.user.email || undefined;
    return true;
  } catch (e) {
    res.status(401).json({ error: 'Token verification failed' });
    return false;
  }
}
