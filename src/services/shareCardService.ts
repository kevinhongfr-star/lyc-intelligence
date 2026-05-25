
import { getSupabase } from './supabaseApi';

export type ShareCardType = 'assessment' | 'trident' | 'progress';

export interface ShareCard {
  id: string;
  user_id: string;
  type: ShareCardType;
  data: any;
  image_url: string;
  public_uuid: string;
  created_at: string;
}

export async function generateShareCard(
  type: ShareCardType,
  data: any,
  userId: string
): Promise<ShareCard | null> {
  try {
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data, userId })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Share card generation failed');
    }

    return await res.json();
  } catch (e) {
    console.error('[shareCardService] generate failed:', e);
    return null;
  }
}

export async function getShareCard(publicUuid: string): Promise<ShareCard | null> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('share_cards')
      .select('*')
      .eq('public_uuid', publicUuid)
      .single();

    if (error) throw error;
    return data as ShareCard;
  } catch (e) {
    console.error('[shareCardService] get failed:', e);
    return null;
  }
}

export function getLinkedInShareUrl(shareCard: ShareCard): string {
  const baseUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=';
  const shareUrl = `${window.location.origin}/share/${shareCard.public_uuid}`;
  let text = '';

  switch (shareCard.type) {
    case 'assessment':
      text = `Just got my cross-border leadership profile from LYC Intelligence. Archetype: ${shareCard.data?.archetype || 'Executive'}.`;
      break;
    case 'trident':
      text = `TRIDENT scorecard for ${shareCard.data?.candidate_name || 'Candidate'}: ${shareCard.data?.composite_score || 0}/100.`;
      break;
    case 'progress':
      text = 'Check out my leadership progress over the last quarter with LYC Intelligence.';
      break;
  }

  return `${baseUrl}${encodeURIComponent(shareUrl)}`;
}
