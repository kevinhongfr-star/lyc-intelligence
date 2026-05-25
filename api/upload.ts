
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const SUPABASE_STORAGE_BUCKET = 'user-documents';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // This is a placeholder - in production you'd use a library like multer for file handling
  // Since we're using Vercel serverless, we'll outline what you need to do
  
  const { userId, type } = req.body;
  
  if (!userId || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Note: Actual file upload implementation requires proper multipart form handling
    // For production, use:
    // 1. multer or next-connect for serverless functions
    // 2. pdfjs-dist for PDF text extraction
    // 3. mammoth for DOCX text extraction
    
    const fileId = uuidv4();
    const fileName = `document-${fileId}`; // replace with actual file name
    
    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from(SUPABASE_STORAGE_BUCKET)
      .upload(`${userId}/${fileName}`, 'placeholder-file-content', { // replace with actual file buffer
        contentType: 'application/pdf', // replace with actual file type
        upsert: true,
      });

    if (storageError) {
      console.error('Storage error:', storageError);
      return res.status(500).json({ error: 'Failed to upload file' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .getPublicUrl(`${userId}/${fileName}`);

    // Extract text (placeholder)
    const extractedText = 'Text extraction requires pdfjs-dist and mammoth libraries';

    // Save to DB
    const { data: docData, error: dbError } = await supabase
      .from('documents')
      .insert({
        id: fileId,
        user_id: userId,
        name: fileName, // replace with actual name
        type,
        file_url: urlData.publicUrl,
        file_size_bytes: 0, // replace with actual size
        extracted_text: extractedText
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB error:', dbError);
      return res.status(500).json({ error: 'Failed to save document' });
    }

    return res.status(200).json(docData);
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
}
