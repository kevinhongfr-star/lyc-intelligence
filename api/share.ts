
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const SUPABASE_STORAGE_BUCKET = 'share-cards';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, data, userId } = req.body;
  if (!type || !data || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const publicUuid = uuidv4();
    
    // Note: Share card image generation requires html2canvas or similar
    // For this implementation, we'll store the card data and provide a placeholder image URL
    
    // Upload placeholder image or generate real one here
    
    const placeholderImageUrl = 'https://placehold.co/1200x630/0A0A0A/C108AB?text=LYC+Intelligence+Share+Card';
    
    // Save to share_cards table
    const { data: shareCard, error: dbError } = await supabase
      .from('share_cards')
      .insert({
        id: uuidv4(),
        user_id: userId,
        type,
        data,
        image_url: placeholderImageUrl,
        public_uuid: publicUuid,
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB error:', dbError);
      return res.status(500).json({ error: 'Failed to create share card' });
    }

    return res.status(200).json(shareCard);
  } catch (error) {
    console.error('Share error:', error);
    return res.status(500).json({ error: 'Share card creation failed' });
  }
}
