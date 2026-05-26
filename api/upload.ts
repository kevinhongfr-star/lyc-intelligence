
import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAX_FILE_SIZE_MB = 10;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
    }

    const rawBody = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      (req as any).on('data', (chunk: Buffer) => chunks.push(chunk));
      (req as any).on('end', () => resolve(Buffer.concat(chunks)));
      (req as any).on('error', reject);
    });

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return res.status(400).json({ error: 'Missing boundary in Content-Type' });
    }

    const parts = rawBody.toString().split(`--${boundary}`);
    let fileContent = '';
    let fileName = '';

    for (const part of parts) {
      if (part.includes('Content-Disposition')) {
        const filenameMatch = part.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          fileName = filenameMatch[1];
        }

        const contentStart = part.indexOf('\r\n\r\n');
        if (contentStart !== -1) {
          const content = part.substring(contentStart + 4).trimEnd();
          if (!part.includes('name="type"')) {
            fileContent = content;
          }
        }
      }
    }

    if (!fileName) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const ext = fileName.toLowerCase().split('.').pop();
    if (!['pdf', 'docx', 'txt'].includes(ext || '')) {
      return res.status(400).json({ error: 'File type not supported. Only PDF, DOCX, and TXT files are allowed.' });
    }

    if (rawBody.length > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return res.status(400).json({ error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit` });
    }

    let extractedText = fileContent;
    if (ext === 'pdf') {
      extractedText = extractTextFromPDFContent(fileContent);
    } else if (ext === 'docx') {
      extractedText = extractTextFromDOCXContent(fileContent);
    }

    return res.status(200).json({
      text: extractedText,
      filename: fileName,
      size: rawBody.length
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
}

function extractTextFromPDFContent(content: string): string {
  try {
    const text = content
      .replace(/%PDF-\d+\.\d+/g, '')
      .replace(/\/Type\/[^\/]+/g, '')
      .replace(/\/Subtype\/[^\/]+/g, '')
      .replace(/\/Length[\s]*[\d]+/g, '')
      .replace(/stream[\s\S]*?endstream/g, '')
      .replace(/[\x00-\x1F\x7F-\xFF]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return text || 'Unable to extract text from PDF';
  } catch {
    return 'Unable to extract text from PDF';
  }
}

function extractTextFromDOCXContent(content: string): string {
  try {
    const matches = content.match(/<w:t>([^<]+)<\/w:t>/g);
    if (matches) {
      return matches.map(m => m.replace(/<\/?w:t>/g, '')).join(' ');
    }
    return 'Unable to extract text from DOCX';
  } catch {
    return 'Unable to extract text from DOCX';
  }
}
