
import { getSupabase } from './supabaseApi';

export type DocumentType = 
  | 'CV'
  | 'LINKEDIN'
  | 'JD'
  | 'PERFORMANCE_REVIEW'
  | 'EXECUTIVE_BIO'
  | 'BOARD_PRESENTATION'
  | 'OTHER';

export interface Document {
  id: string;
  user_id: string;
  name: string;
  type: DocumentType;
  file_url: string;
  file_size_bytes: number;
  extracted_text: string;
  created_at: string;
  updated_at: string;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CV: 'CV / Resume',
  LINKEDIN: 'LinkedIn Profile Export',
  JD: 'Job Description',
  PERFORMANCE_REVIEW: 'Performance Review',
  EXECUTIVE_BIO: 'Executive Bio',
  BOARD_PRESENTATION: 'Board Presentation',
  OTHER: 'Other'
};

export async function uploadDocument(
  file: File,
  type: DocumentType,
  userId: string
): Promise<Document | null> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  formData.append('userId', userId);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Upload failed');
    }

    return await res.json();
  } catch (e) {
    console.error('[documentService] uploadDocument failed:', e);
    return null;
  }
}

export async function getUserDocuments(userId: string): Promise<Document[]> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Document[];
  } catch (e) {
    console.error('[documentService] getUserDocuments failed:', e);
    return [];
  }
}

export async function deleteDocument(docId: string): Promise<boolean> {
  try {
    const sb = getSupabase();
    const { error } = await sb.from('documents').delete().eq('id', docId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('[documentService] deleteDocument failed:', e);
    return false;
  }
}

export function getMaxDocumentsForTier(tier: string): number {
  switch (tier) {
    case 'council':
      return Infinity;
    case 'pro':
      return 10;
    case 'basic':
      return 3;
    default:
      return 0;
  }
}
