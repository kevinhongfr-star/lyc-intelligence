import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAX_FILE_SIZE_MB = 10;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Unsupported Content-Type' });
    }

    // Handle JSON-based upload (from serverApi.ts — base64 encoded)
    if (contentType.includes('application/json')) {
      const { fileName, fileType, fileBase64, bucket, mandateId, contactId, visibility } = req.body;
      
      if (!fileName || !fileBase64) {
        return res.status(400).json({ error: 'Missing fileName or fileBase64' });
      }

      const buffer = Buffer.from(fileBase64, 'base64');
      
      if (buffer.length > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return res.status(400).json({ error: 'File exceeds 10MB limit' });
      }

      // Extract text based on file type
      let text = '';
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        text = extractTextFromBuffer(buffer, 'pdf');
      } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
        text = buffer.toString('utf-8');
      } else if (fileName.endsWith('.docx')) {
        text = extractTextFromBuffer(buffer, 'docx');
      } else {
        text = buffer.toString('utf-8');
      }

      return res.status(200).json({
        success: true,
        text: text.substring(0, 50000), // Cap at 50K chars
        fileName,
        fileSize: buffer.length,
        metadata: { bucket, mandateId, contactId, visibility }
      });
    }

    // Handle multipart/form-data upload (from NexusChat — FormData)
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

    // Binary-safe multipart parsing
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const parts = splitBuffer(rawBody, boundaryBuffer);
    
    let fileBuffer: Buffer | null = null;
    let fileName = 'document';
    let fileType = 'application/octet-stream';

    for (const part of parts) {
      const headerEnd = findBufferIndex(part, Buffer.from('\r\n\r\n'));
      if (headerEnd === -1) continue;
      
      const header = part.slice(0, headerEnd).toString('utf-8');
      const body = part.slice(headerEnd + 4, part.length - 2); // Remove trailing \r\n

      if (header.includes('name="file"')) {
        fileBuffer = body;
        const nameMatch = header.match(/filename="([^"]+)"/);
        if (nameMatch) fileName = nameMatch[1];
        const typeMatch = header.match(/Content-Type:\s*([^\r\n]+)/i);
        if (typeMatch) fileType = typeMatch[1];
      }
    }

    if (!fileBuffer) {
      return res.status(400).json({ error: 'No file found in upload' });
    }

    if (fileBuffer.length > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return res.status(400).json({ error: 'File exceeds 10MB limit' });
    }

    let text = '';
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      text = extractTextFromBuffer(fileBuffer, 'pdf');
    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      text = fileBuffer.toString('utf-8');
    } else if (fileName.endsWith('.docx')) {
      text = extractTextFromBuffer(fileBuffer, 'docx');
    } else {
      text = fileBuffer.toString('utf-8');
    }

    return res.status(200).json({
      success: true,
      text: text.substring(0, 50000),
      fileName,
      fileSize: fileBuffer.length
    });
  } catch (e) {
    console.error('[Upload] Error:', e);
    return res.status(500).json({ error: 'Upload processing failed' });
  }
}

// Binary-safe buffer splitting
function splitBuffer(buffer: Buffer, delimiter: Buffer): Buffer[] {
  const parts: Buffer[] = [];
  let start = 0;
  while (start < buffer.length) {
    const idx = findBufferIndex(buffer.slice(start), delimiter);
    if (idx === -1) {
      parts.push(buffer.slice(start));
      break;
    }
    if (idx > 0) parts.push(buffer.slice(start, start + idx));
    start += idx + delimiter.length;
  }
  return parts.filter(p => p.length > 0 && !p.equals(Buffer.from('\r\n')));
}

function findBufferIndex(buffer: Buffer, search: Buffer): number {
  for (let i = 0; i <= buffer.length - search.length; i++) {
    let found = true;
    for (let j = 0; j < search.length; j++) {
      if (buffer[i + j] !== search[j]) { found = false; break; }
    }
    if (found) return i;
  }
  return -1;
}

// Extract text from binary buffers
function extractTextFromBuffer(buffer: Buffer, type: 'pdf' | 'docx'): string {
  const raw = buffer.toString('utf-8');
  
  if (type === 'pdf') {
    // PDF text extraction: find text between BT...ET markers and decode
    const textParts: string[] = [];
    const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
    let match;
    while ((match = btEtRegex.exec(raw)) !== null) {
      const block = match[1];
      // Extract text from Tj and TJ operators
      const tjMatches = block.match(/\(([^)]*)\)\s*Tj/g) || [];
      const tjArrayMatches = block.match(/\[([^\]]*)\]\s*TJ/g) || [];
      
      for (const tj of tjMatches) {
        const text = tj.replace(/\(([^)]*)\)\s*Tj/, '$1');
        if (text && !/^[\x00-\x1F]*$/.test(text)) textParts.push(text);
      }
      for (const tj of tjArrayMatches) {
        const texts = tj.match(/\(([^)]*)\)/g) || [];
        for (const t of texts) {
          const text = t.replace(/[()]/g, '');
          if (text && !/^[\x00-\x1F]*$/.test(text)) textParts.push(text);
        }
      }
    }
    
    // Fallback: extract readable ASCII/UTF-8 sequences
    if (textParts.length === 0) {
      const readable = raw.replace(/[^\x20-\x7E\u0080-\uFFFF]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      // Filter out PDF syntax noise
      const lines = readable.split(/\s+/)
        .filter(w => w.length > 3 && !w.startsWith('/') && !w.startsWith('<<') && !w.startsWith('>>'))
        .join(' ');
      if (lines.length > 50) textParts.push(lines);
    }
    
    return textParts.join(' ').substring(0, 50000);
  }
  
  if (type === 'docx') {
    // DOCX is a ZIP — extract XML content
    // Look for <w:t> tags in the raw bytes
    const xmlText = raw.replace(/[^\x20-\x7E]/g, '');
    const textMatches = xmlText.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
    return textMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ').substring(0, 50000);
  }
  
  return raw.substring(0, 50000);
}
