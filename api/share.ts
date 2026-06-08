import type { VercelRequest, VercelResponse } from '@vercel/node';
import { insert, isSupabaseConfigured, handleError } from './_lib/supabaseRest.js';

export const maxDuration = 60;

// Inline uuid v4 — avoids adding `uuid` to dependencies (not in package.json).
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!isSupabaseConfigured()) {
      return res.status(500).json({ error: 'Server configuration error: Supabase not configured' });
    }

    const { type, data, userId } = req.body;
    if (!type || !data || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const publicUuid = uuidv4();
    const placeholderImageUrl =
      'https://placehold.co/1200x630/0A0A0A/C108AB?text=LYC+Intelligence+Share+Card';

    const shareCard = await insert('share_cards', {
      id: uuidv4(),
      user_id: userId,
      type,
      data,
      image_url: placeholderImageUrl,
      public_uuid: publicUuid,
    });

    return res.status(200).json(shareCard);
  } catch (err) {
    return handleError(res, 'share', err);
  }
}
