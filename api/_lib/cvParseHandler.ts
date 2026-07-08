/**
 * POST /api/ai/parse-cv
 * Parse uploaded CV/Resume file (PDF, DOCX, TXT) and return extracted text.
 * Uses pdf-parse for PDFs, raw text for .txt/.docx.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

let pdfParse: ((buf: Buffer) => Promise<{ text: string }>) | null = null;

async function getPdfParse() {
  if (!pdfParse) {
    try {
      pdfParse = (await import('pdf-parse')).default;
    } catch {
      pdfParse = null;
    }
  }
  return pdfParse;
}

function readBodyAsBuffer(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const contentType = req.headers['content-type'] || '';

    let fileBuffer: Buffer;
    let fileName = '';

    if (contentType.includes('multipart/form-data')) {
      // Simple multipart parsing — extract file part
      const body = await readBodyAsBuffer(req);
      const boundary = contentType.match(/boundary=(.+)/)?.[1];
      if (!boundary) {
        return res.status(400).json({ error: 'Missing boundary in multipart' });
      }

      const boundaryBuf = Buffer.from(`--${boundary}`);
      const parts: Buffer[] = [];
      let start = 0;
      while (true) {
        const idx = body.indexOf(boundaryBuf, start);
        if (idx === -1) break;
        if (start > 0) {
          parts.push(body.slice(start, idx));
        }
        start = idx + boundaryBuf.length;
      }

      // Find the file part
      let filePart: Buffer | null = null;
      for (const part of parts) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;
        const headers = part.slice(0, headerEnd).toString();
        if (headers.includes('filename=')) {
          const nameMatch = headers.match(/filename="([^"]+)"/);
          if (nameMatch) fileName = nameMatch[1];
          filePart = part.slice(headerEnd + 4);
          // Remove trailing \r\n
          if (filePart.length > 2 && filePart[filePart.length - 2] === 13 && filePart[filePart.length - 1] === 10) {
            filePart = filePart.slice(0, -2);
          }
          break;
        }
      }

      if (!filePart) {
        return res.status(400).json({ error: 'No file found in upload' });
      }
      fileBuffer = filePart;
    } else if (contentType.includes('application/json')) {
      // JSON body with base64 encoded file
      const { file: base64File, name } = req.body || {};
      if (!base64File) {
        return res.status(400).json({ error: 'No file data provided' });
      }
      fileName = name || 'upload.pdf';
      fileBuffer = Buffer.from(base64File, 'base64');
    } else {
      return res.status(400).json({ error: 'Unsupported content type' });
    }

    let text = '';
    const lowerName = fileName.toLowerCase();

    if (lowerName.endsWith('.pdf')) {
      const parser = await getPdfParse();
      if (parser) {
        const result = await parser(fileBuffer);
        text = result.text;
      } else {
        // Fallback: extract readable text from PDF binary
        text = extractTextFromPdfBinary(fileBuffer);
      }
    } else if (lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
      text = fileBuffer.toString('utf-8');
    } else if (lowerName.endsWith('.docx')) {
      text = extractTextFromDocx(fileBuffer);
    } else {
      text = fileBuffer.toString('utf-8');
    }

    if (!text || text.trim().length < 10) {
      return res.status(422).json({ error: 'Could not extract meaningful text from file. Please try a different format.' });
    }

    return res.status(200).json({ text: text.trim(), fileName, charCount: text.trim().length });
  } catch (err) {
    console.error('[cv-parse] Error:', err);
    return res.status(500).json({ error: 'Failed to parse file' });
  }
}

/**
 * Fallback: extract readable ASCII/UTF-8 text segments from PDF binary.
 * Not as good as pdf-parse but works without native dependencies.
 */
function extractTextFromPdfBinary(buffer: Buffer): string {
  const text = buffer.toString('latin1');
  const segments: string[] = [];

  // Extract text between BT and ET markers (PDF text objects)
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let match;
  while ((match = btEtRegex.exec(text)) !== null) {
    const block = match[1];
    // Extract strings in parentheses (PDF literal strings)
    const strRegex = /\(([^)]*)\)/g;
    let strMatch;
    while ((strMatch = strRegex.exec(block)) !== null) {
      const s = strMatch[1].replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
      if (s.trim().length > 0) {
        segments.push(s);
      }
    }
    // Extract hex strings
    const hexRegex = /<([0-9a-fA-F]+)>/g;
    while ((strMatch = hexRegex.exec(block)) !== null) {
      const hex = strMatch[1];
      let decoded = '';
      for (let i = 0; i < hex.length; i += 2) {
        decoded += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      }
      if (decoded.trim().length > 0) {
        segments.push(decoded);
      }
    }
  }

  return segments.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extract text from DOCX (which is a ZIP containing XML).
 * Simple approach: look for word/document.xml content.
 */
function extractTextFromDocx(buffer: Buffer): string {
  // DOCX is a ZIP file. Try to find XML text content directly.
  const text = buffer.toString('utf-8');
  // Extract text between <w:t> tags
  const matches = text.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
  if (matches) {
    return matches
      .map(m => m.replace(/<[^>]+>/g, ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  // Fallback
  return text.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
}
