/**
 * LinkedIn Auto-Import & Enrichment Handler — DEX AI Technical Blueprint 10
 *
 * Endpoints:
 *   POST /api/linkedin/import-url       — L-1: Single URL import
 *   POST /api/linkedin/import-batch     — L-2: Batch URL import
 *   POST /api/linkedin/import-csv       — L-3: CSV file import
 *   POST /api/linkedin/import-paste     — L-4: Paste profile text import
 *   GET  /api/linkedin/imports          — L-5: List import history
 *   GET  /api/linkedin/imports/:id      — L-6: Import details with items
 *   POST /api/linkedin/imports/:id/retry— L-7: Retry failed items
 *   GET  /api/linkedin/cache/stats      — L-8: Cache statistics (admin)
 *   POST /api/linkedin/cache/clear      — L-9: Clear stale cache (admin)
 *   GET  /api/linkedin/dedup-check      — L-10: Duplicate check
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectOne,
  selectMany,
  insert,
  update,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest, getUserRole, isAdmin } from './adminAuth.js';

export const maxDuration = 60;

// ── URL Validation ─────────────────────────────────────────────────────
const LINKEDIN_URL_PATTERNS = [
  /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w\-\.]+\/?$/,
  /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w\-\.]+\/?(?:\?[^#]*)?$/,
  /^https?:\/\/[\w]{2,3}\.linkedin\.com\/in\/[\w\-\.]+\/?$/,
  /^https?:\/\/(www\.)?linkedin\.com\/pub\/[\w\-\.\/]+$/,
];

function validateLinkedInURL(url: string): { valid: boolean; normalized: string; error?: string } {
  const trimmed = url.trim();
  if (!trimmed) return { valid: false, normalized: '', error: 'Empty URL' };

  const isValid = LINKEDIN_URL_PATTERNS.some(p => p.test(trimmed));
  if (!isValid) {
    return { valid: false, normalized: trimmed, error: 'Not a valid LinkedIn profile URL' };
  }

  let normalized = trimmed
    .replace(/^http:\/\//, 'https://')
    .replace(/\?.*$/, '')
    .replace(/\/$/, '');

  return { valid: true, normalized };
}

function extractLinkedInSlug(url: string): string | null {
  const match = url.match(/linkedin\.com\/in\/([\w\-\.]+)/);
  return match ? match[1] : null;
}

// ── Profile Fetching ───────────────────────────────────────────────────
async function fetchLinkedInProfile(url: string): Promise<{
  raw_html: string;
  raw_text: string;
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return {
        raw_html: '',
        raw_text: '',
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();

    if (html.includes('challenge') || html.includes('captcha') || html.length < 2000) {
      return {
        raw_html: html,
        raw_text: '',
        success: false,
        error: 'LinkedIn returned challenge/captcha page — use paste mode instead',
      };
    }

    const text = extractTextFromHTML(html);
    return { raw_html: html, raw_text: text, success: true };
  } catch (err: any) {
    return {
      raw_html: '',
      raw_text: '',
      success: false,
      error: `Fetch failed: ${err.message}`,
    };
  }
}

function extractTextFromHTML(html: string): string {
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

// ── DeepSeek Profile Parser ────────────────────────────────────────────
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const PARSER_SYSTEM_PROMPT = `You are a LinkedIn profile parser. Given raw text from a LinkedIn profile page, extract structured data and return ONLY valid JSON.

Rules:
- Extract ALL available information
- If a field is not found, use null (not empty string)
- Names: extract both English and Chinese if present
- Dates: convert to YYYY-MM or YYYY format
- Experience durations: normalize to "X years Y months" format
- Skills: extract up to 30 most prominent skills
- Education: include school, degree, field of study, year
- Languages: include proficiency level if mentioned
- Location: split into city and country
- Years of experience: calculate from earliest work start date
- Output language: keep original language for names/titles, use English for field keys

Return JSON with this exact structure:
{
  "full_name": "string",
  "first_name": "string",
  "last_name": "string",
  "headline": "string",
  "current_company": "string",
  "current_title": "string",
  "location": "string",
  "city": "string",
  "country": "string",
  "industry": "string",
  "years_of_experience": null,
  "summary": "string",
  "email": "string",
  "phone": "string",
  "education": [{"school": "string", "degree": "string", "field": "string", "year": "string"}],
  "experience": [{"company": "string", "title": "string", "duration": "string", "start": "string", "end": "string", "description": "string"}],
  "skills": ["string"],
  "languages": [{"language": "string", "proficiency": "string"}],
  "certifications": [{"name": "string", "issuer": "string", "year": "string"}],
  "linkedin_url": "string"
}`;

async function parseLinkedInProfile(rawText: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  tokens_used?: number;
}> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'DeepSeek API key not configured',
    };
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [
          { role: 'system', content: PARSER_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Parse this LinkedIn profile text:\n\n${rawText.substring(0, 8000)}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      return { success: false, error: `DeepSeek API error: ${response.status}` };
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) {
      return { success: false, error: 'Empty response from DeepSeek' };
    }

    const parsed = JSON.parse(content);
    return {
      success: true,
      data: parsed,
      tokens_used: result.usage?.total_tokens || 0,
    };
  } catch (err: any) {
    return { success: false, error: `Parse error: ${err.message}` };
  }
}

// ── Deduplication Engine ───────────────────────────────────────────────
async function findDuplicateContact(input: {
  linkedin_url?: string;
  email?: string;
  phone?: string;
  full_name?: string;
  current_company?: string;
}): Promise<{
  matched: boolean;
  contact_id?: string;
  match_type?: string;
  confidence?: number;
}> {
  // Priority 1: Exact LinkedIn URL match
  if (input.linkedin_url) {
    const normalized = input.linkedin_url.replace(/\/$/, '').toLowerCase();
    try {
      const contacts = await selectMany('contacts', {}, [], 100, 0, 'id, linkedin_url');
      const match = contacts.find((c: any) =>
        c.linkedin_url &&
        c.linkedin_url.replace(/\/$/, '').toLowerCase() === normalized
      );
      if (match) {
        return { matched: true, contact_id: match.id, match_type: 'exact_linkedin', confidence: 100 };
      }
    } catch (e) { /* skip */ }
  }

  // Priority 2: Exact email match
  if (input.email) {
    try {
      const contacts = await selectMany('contacts', {}, [], 100, 0, 'id, email');
      const match = contacts.find((c: any) =>
        c.email && c.email.toLowerCase() === input.email!.toLowerCase()
      );
      if (match) {
        return { matched: true, contact_id: match.id, match_type: 'exact_email', confidence: 98 };
      }
    } catch (e) { /* skip */ }
  }

  // Priority 3: Exact phone match
  if (input.phone) {
    try {
      const normalizedPhone = input.phone.replace(/[\s\-\(\)]/g, '');
      const contacts = await selectMany('contacts', {}, [], 100, 0, 'id, phone');
      const match = contacts.find((c: any) => {
        if (!c.phone) return false;
        const existing = c.phone.replace(/[\s\-\(\)]/g, '');
        return existing === normalizedPhone || existing.endsWith(normalizedPhone.slice(-8));
      });
      if (match) {
        return { matched: true, contact_id: match.id, match_type: 'exact_phone', confidence: 95 };
      }
    } catch (e) { /* skip */ }
  }

  // Priority 4: Fuzzy name + company match
  if (input.full_name && input.current_company) {
    try {
      const contacts = await selectMany('contacts', {}, [], 200, 0, 'id, full_name, company');
      for (const candidate of contacts) {
        if (!candidate.full_name || !candidate.company) continue;
        const companyMatch = candidate.company.toLowerCase().includes(input.current_company.toLowerCase()) ||
          input.current_company.toLowerCase().includes(candidate.company.toLowerCase());
        if (!companyMatch) continue;

        const similarity = calculateNameSimilarity(input.full_name, candidate.full_name);
        if (similarity > 0.8) {
          return {
            matched: true,
            contact_id: candidate.id,
            match_type: 'fuzzy_name_company',
            confidence: Math.round(similarity * 90),
          };
        }
      }
    } catch (e) { /* skip */ }
  }

  return { matched: false };
}

function calculateNameSimilarity(name1: string, name2: string): number {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  if (n1 === n2) return 1.0;

  const distance = levenshteinDistance(n1, n2);
  const maxLen = Math.max(n1.length, n2.length);
  return 1 - (distance / maxLen);
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return matrix[a.length][b.length];
}

// ── CSV Parser ─────────────────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseLinkedInCSV(csvText: string): {
  headers: string[];
  rows: Record<string, string>[];
  detected_format: string;
} {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [], detected_format: 'generic' };

  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').trim();
    });
    rows.push(row);
  }

  let format = 'generic';
  const lowerHeaders = headers.map(h => h.toLowerCase());
  if (lowerHeaders.some(h => h.includes('first name')) && lowerHeaders.some(h => h.includes('linkedin url'))) {
    format = 'linkedin_recruiter';
  } else if (lowerHeaders.some(h => h.includes('connected on')) && lowerHeaders.some(h => h.includes('profile url'))) {
    format = 'sales_navigator';
  }

  return { headers, rows, detected_format: format };
}

const FIELD_MAPPINGS: Record<string, Record<string, string>> = {
  linkedin_recruiter: {
    'First Name': 'first_name',
    'Last Name': 'last_name',
    'LinkedIn URL': 'linkedin_url',
    'Email': 'email',
    'Phone': 'phone',
    'Company': 'current_company',
    'Title': 'current_title',
    'Location': 'location',
    'Industry': 'industry',
  },
  sales_navigator: {
    'First Name': 'first_name',
    'Last Name': 'last_name',
    'Profile URL': 'linkedin_url',
    'Email': 'email',
    'Phone': 'phone',
    'Company': 'current_company',
    'Title': 'current_title',
    'Location': 'location',
  },
};

function mapCSVToContactFields(row: Record<string, string>, format: string): any {
  const mapping = FIELD_MAPPINGS[format] || {};
  const result: any = {};
  for (const [csvField, contactField] of Object.entries(mapping)) {
    if (row[csvField]) {
      result[contactField] = row[csvField];
    }
  }
  if (result.first_name || result.last_name) {
    result.full_name = `${result.first_name || ''} ${result.last_name || ''}`.trim();
  }
  return result;
}

// ── Contact Creation/Update ────────────────────────────────────────────
function calculateLinkedInConfidence(parsed: any): number {
  let score = 0;
  if (parsed.full_name) score += 15;
  if (parsed.email) score += 15;
  if (parsed.phone) score += 10;
  if (parsed.current_company) score += 10;
  if (parsed.current_title) score += 10;
  if (parsed.location) score += 5;
  if (parsed.industry) score += 5;
  if (parsed.education?.length) score += 10;
  if (parsed.experience?.length) score += 10;
  if (parsed.skills?.length) score += 5;
  if (parsed.years_of_experience) score += 5;
  return Math.min(score, 100);
}

async function createContactFromLinkedIn(
  parsed: any,
  sourceUrl: string | null,
  createdBy: string
): Promise<string> {
  const contact = await insert('contacts', {
    full_name: parsed.full_name || '',
    first_name: parsed.first_name || null,
    last_name: parsed.last_name || null,
    email: parsed.email || null,
    phone: parsed.phone || null,
    linkedin_url: sourceUrl || parsed.linkedin_url || null,
    linkedin_headline: parsed.headline || null,
    linkedin_company: parsed.current_company || null,
    company: parsed.current_company || null,
    title: parsed.current_title || null,
    city: parsed.city || null,
    country: parsed.country || null,
    location: parsed.location || null,
    industry: parsed.industry || null,
    linkedin_industry: parsed.industry || null,
    years_of_experience: parsed.years_of_experience || null,
    candidate_notes: parsed.summary || null,
    linkedin_skills: JSON.stringify(parsed.skills || []),
    linkedin_education: JSON.stringify(parsed.education || []),
    linkedin_experience: JSON.stringify(parsed.experience || []),
    linkedin_languages: JSON.stringify(parsed.languages || []),
    linkedin_certifications: JSON.stringify(parsed.certifications || []),
    import_source: 'linkedin_url',
    enrichment_status: 'linkedin_parsed',
    pipeline_stage: 'S1_Sourced',
    data_confidence: calculateLinkedInConfidence(parsed),
    assigned_to: createdBy,
  });
  return contact.id;
}

async function updateContactWithLinkedIn(contactId: string, parsed: any) {
  try {
    const existing = await selectOne('contacts', { column: 'id', value: contactId, select: '*' }, 5000);
    const updatePayload: any = { enrichment_status: 'linkedin_parsed' };

    if (!existing?.linkedin_headline && parsed.headline) updatePayload.linkedin_headline = parsed.headline;
    if (!existing?.linkedin_skills?.length && parsed.skills?.length) updatePayload.linkedin_skills = JSON.stringify(parsed.skills);
    if (!existing?.linkedin_education?.length && parsed.education?.length) updatePayload.linkedin_education = JSON.stringify(parsed.education);
    if (!existing?.linkedin_experience?.length && parsed.experience?.length) updatePayload.linkedin_experience = JSON.stringify(parsed.experience);
    if (!existing?.linkedin_languages?.length && parsed.languages?.length) updatePayload.linkedin_languages = JSON.stringify(parsed.languages);
    if (!existing?.years_of_experience && parsed.years_of_experience) updatePayload.years_of_experience = parsed.years_of_experience;
    if (!existing?.linkedin_industry && parsed.industry) updatePayload.linkedin_industry = parsed.industry;
    if (!existing?.linkedin_url && parsed.linkedin_url) updatePayload.linkedin_url = parsed.linkedin_url;

    if (Object.keys(updatePayload).length > 0) {
      await update('contacts', contactId, updatePayload);
    }
  } catch (e) {
    console.error('Update contact failed:', e);
  }
}

// ── Import Engine ──────────────────────────────────────────────────────
async function processImportItem(item: any, importRecord: any): Promise<{
  action: string;
  contactId?: string;
  matchType?: string;
  confidence?: number;
  error?: string;
  parsedData?: any;
  tokensUsed?: number;
}> {
  try {
    let rawText = item.raw_profile_data;
    let sourceUrl = item.source_url;
    let parsedData: any = null;
    let tokensUsed = 0;

    // Check cache first
    if (sourceUrl) {
      try {
        const cached = await selectMany(
          'linkedin_data_cache',
          {},
          [], 10, 0, '*'
        );
        const cacheHit = cached.find((c: any) => c.linkedin_url === sourceUrl);
        if (cacheHit) {
          if (cacheHit.parse_status === 'parsed' && cacheHit.parsed_data) {
            return {
              action: 'created',
              parsedData: cacheHit.parsed_data,
              matchType: 'no_match',
              confidence: 0,
            };
          }
          if (cacheHit.raw_text) {
            rawText = cacheHit.raw_text;
          }
        }
      } catch (e) { /* skip cache */ }
    }

    // Fetch if no raw text and we have a URL
    if (!rawText && sourceUrl) {
      const fetchResult = await fetchLinkedInProfile(sourceUrl);
      if (!fetchResult.success) {
        return { action: 'skipped_error', error: fetchResult.error };
      }
      rawText = fetchResult.raw_text;

      // Cache the raw data
      try {
        await insert('linkedin_data_cache', {
          linkedin_url: sourceUrl,
          raw_html: fetchResult.raw_html,
          raw_text: fetchResult.raw_text,
          parse_status: 'pending',
          fetched_by: importRecord.created_by,
        });
      } catch (e) { /* may already exist */ }
    }

    if (!rawText || rawText.length < 50) {
      return { action: 'skipped_error', error: 'Insufficient profile data' };
    }

    // Parse with DeepSeek
    const parseResult = await parseLinkedInProfile(rawText);
    tokensUsed = parseResult.tokens_used || 0;

    if (!parseResult.success) {
      return { action: 'skipped_error', error: parseResult.error };
    }

    parsedData = parseResult.data;

    // Update cache with parsed data
    if (sourceUrl) {
      try {
        const cached = await selectMany('linkedin_data_cache', {}, [], 10, 0, 'id, linkedin_url');
        const cacheHit = cached.find((c: any) => c.linkedin_url === sourceUrl);
        if (cacheHit) {
          await update('linkedin_data_cache', cacheHit.id, {
            parsed_data: JSON.stringify(parsedData),
            parse_status: 'parsed',
            parsed_at: new Date().toISOString(),
          });
        }
      } catch (e) { /* skip */ }
    }

    // Deduplication
    const dedupResult = await findDuplicateContact({
      linkedin_url: sourceUrl || parsedData.linkedin_url,
      email: parsedData.email,
      full_name: parsedData.full_name,
      current_company: parsedData.current_company,
    });

    let action: string;
    let contactId: string | undefined;

    if (dedupResult.matched) {
      contactId = dedupResult.contact_id;
      await updateContactWithLinkedIn(contactId, parsedData);
      action = 'updated';
    } else {
      if (!parsedData.full_name) {
        return { action: 'skipped_error', error: 'Name not extractable from profile' };
      }
      contactId = await createContactFromLinkedIn(parsedData, sourceUrl, importRecord.created_by);
      action = 'created';
    }

    return {
      action,
      contactId,
      matchType: dedupResult.match_type || 'no_match',
      confidence: dedupResult.confidence || 0,
      parsedData,
      tokensUsed,
    };
  } catch (err: any) {
    return { action: 'skipped_error', error: err.message };
  }
}

async function runLinkedInImport(importId: string) {
  try {
    const importRecord = await selectOne(
      'linkedin_imports',
      { column: 'id', value: importId, select: '*' },
      10000
    );
    if (!importRecord) return;

    await update('linkedin_imports', importId, {
      status: 'parsing',
      started_at: new Date().toISOString(),
    });

    const items = await selectMany(
      'linkedin_import_items',
      { import_id: importId },
      ['source_index ASC'],
      100, 0, '*'
    );

    let totalTokens = 0;
    let deepseekCalls = 0;
    let created = 0;
    let updated = 0;
    let duplicate = 0;
    let error = 0;
    const errorsList: any[] = [];

    for (const item of items) {
      if (item.deepseek_processed) continue;

      const result = await processImportItem(item, importRecord);

      if (result.tokensUsed) {
        deepseekCalls++;
        totalTokens += result.tokensUsed;
      }

      const updateData: any = {
        action_taken: result.action,
        deepseek_processed: true,
        processed_at: new Date().toISOString(),
      };

      if (result.parsedData) {
        updateData.parsed_data = JSON.stringify(result.parsedData);
      }
      if (result.matchType) {
        updateData.match_type = result.matchType;
      }
      if (result.confidence !== undefined) {
        updateData.match_confidence = result.confidence;
      }
      if (result.contactId) {
        updateData.created_contact_id = result.contactId;
        updateData.matched_contact_id = result.contactId;
      }
      if (result.error) {
        updateData.deepseek_error = result.error;
        errorsList.push({ index: item.source_index, error: result.error });
      }

      await update('linkedin_import_items', item.id, updateData);

      if (result.action === 'created') created++;
      else if (result.action === 'updated') updated++;
      else if (result.action === 'skipped_duplicate') duplicate++;
      else if (result.action === 'skipped_error') error++;

      // Rate limiting: 200ms delay between DeepSeek calls
      if (result.tokensUsed) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    const finalStatus = error > 0 ? 'partial' : 'completed';

    await update('linkedin_imports', importId, {
      status: finalStatus,
      created_count: created,
      updated_count: updated,
      skipped_duplicate_count: duplicate,
      skipped_error_count: error,
      deepseek_calls: deepseekCalls,
      deepseek_tokens_used: totalTokens,
      completed_at: new Date().toISOString(),
      errors: JSON.stringify(errorsList),
    });

    // Notification
    try {
      await insert('notifications', {
        recipient_id: importRecord.created_by,
        type: 'import_complete',
        priority: 'normal',
        title: 'LinkedIn Import Complete',
        content: `${created} created, ${updated} updated, ${duplicate} duplicates, ${error} errors`,
        resource_type: 'linkedin_import',
        resource_id: importId,
        delivery_channels: JSON.stringify({ in_app: true, email: false }),
      });
    } catch (e) { /* skip */ }

  } catch (err) {
    console.error('Import failed:', err);
    try {
      await update('linkedin_imports', importId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
      });
    } catch (e) { /* skip */ }
  }
}

// ── Main Handler ───────────────────────────────────────────────────────
export async function handleLinkedIn(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const pathArr = (req.query.path as string[]) || [];
    const resource = pathArr[0]; // import-url | import-batch | import-csv | import-paste | imports | cache | dedup-check
    const id = pathArr[1];
    const subResource = pathArr[2];

    const { user, error } = await getUserFromRequest(req);
    if (error || !user) return res.status(401).json({ success: false, error });

    // L-1: POST /api/linkedin/import-url
    if (resource === 'import-url' && req.method === 'POST') {
      return handleImportUrl(req, res, user.id);
    }

    // L-2: POST /api/linkedin/import-batch
    if (resource === 'import-batch' && req.method === 'POST') {
      return handleImportBatch(req, res, user.id);
    }

    // L-3: POST /api/linkedin/import-csv
    if (resource === 'import-csv' && req.method === 'POST') {
      return handleImportCSV(req, res, user.id);
    }

    // L-4: POST /api/linkedin/import-paste
    if (resource === 'import-paste' && req.method === 'POST') {
      return handleImportPaste(req, res, user.id);
    }

    // L-5: GET /api/linkedin/imports
    if (resource === 'imports' && req.method === 'GET' && !id) {
      return handleListImports(req, res, user.id);
    }

    // L-6: GET /api/linkedin/imports/:id
    if (resource === 'imports' && id && req.method === 'GET' && !subResource) {
      return handleGetImport(req, res, id, user.id);
    }

    // L-7: POST /api/linkedin/imports/:id/retry
    if (resource === 'imports' && id && subResource === 'retry' && req.method === 'POST') {
      return handleRetryImport(req, res, id, user.id);
    }

    // L-8: GET /api/linkedin/cache/stats
    if (resource === 'cache' && subResource === 'stats' && req.method === 'GET') {
      return handleCacheStats(req, res, user.id);
    }

    // L-9: POST /api/linkedin/cache/clear
    if (resource === 'cache' && subResource === 'clear' && req.method === 'POST') {
      return handleCacheClear(req, res, user.id);
    }

    // L-10: GET /api/linkedin/dedup-check
    if (resource === 'dedup-check' && req.method === 'GET') {
      return handleDedupCheck(req, res);
    }

    return res.status(404).json({ success: false, error: 'LinkedIn route not found' });
  } catch (err) {
    return handleError(res, 'linkedin', err);
  }
}

// ── Handler Implementations ────────────────────────────────────────────

async function handleImportUrl(req: VercelRequest, res: VercelResponse, userId: string) {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ success: false, error: 'url is required' });

  const validation = validateLinkedInURL(url);
  if (!validation.valid) {
    return res.status(400).json({ success: false, error: validation.error });
  }

  // Create import record
  const importRecord = await insert('linkedin_imports', {
    created_by: userId,
    import_type: 'single_url',
    input_urls: JSON.stringify([validation.normalized]),
    status: 'pending',
    total_input: 1,
  });

  // Create import item
  await insert('linkedin_import_items', {
    import_id: importRecord.id,
    source_url: validation.normalized,
    source_index: 0,
    deepseek_processed: false,
  });

  // Kick off async processing
  setImmediate(() => runLinkedInImport(importRecord.id));

  return res.json({
    success: true,
    import_id: importRecord.id,
    status: 'processing',
    message: 'Importing profile...',
  });
}

async function handleImportBatch(req: VercelRequest, res: VercelResponse, userId: string) {
  const { urls } = req.body || {};
  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ success: false, error: 'urls array is required' });
  }

  if (urls.length > 50) {
    return res.status(400).json({ success: false, error: 'Max 50 URLs per batch' });
  }

  const validUrls: string[] = [];
  const errors: any[] = [];

  for (let i = 0; i < urls.length; i++) {
    const validation = validateLinkedInURL(urls[i]);
    if (validation.valid) {
      validUrls.push(validation.normalized);
    } else {
      errors.push({ index: i, url: urls[i], error: validation.error });
    }
  }

  if (validUrls.length === 0) {
    return res.status(400).json({ success: false, error: 'No valid URLs provided', errors });
  }

  const importRecord = await insert('linkedin_imports', {
    created_by: userId,
    import_type: 'batch_urls',
    input_urls: JSON.stringify(validUrls),
    status: 'pending',
    total_input: validUrls.length,
    errors: JSON.stringify(errors),
  });

  // Create items
  for (let i = 0; i < validUrls.length; i++) {
    await insert('linkedin_import_items', {
      import_id: importRecord.id,
      source_url: validUrls[i],
      source_index: i,
      deepseek_processed: false,
    });
  }

  setImmediate(() => runLinkedInImport(importRecord.id));

  return res.json({
    success: true,
    import_id: importRecord.id,
    total_urls: validUrls.length,
    status: 'queued',
    message: `${validUrls.length} profiles queued for import`,
    errors: errors.length ? errors : undefined,
  });
}

async function handleImportPaste(req: VercelRequest, res: VercelResponse, userId: string) {
  const { text, linkedin_url } = req.body || {};
  if (!text || text.trim().length < 50) {
    return res.status(400).json({ success: false, error: 'Profile text is required (min 50 chars)' });
  }

  const importRecord = await insert('linkedin_imports', {
    created_by: userId,
    import_type: 'copy_paste',
    input_raw_text: text.substring(0, 10000),
    status: 'pending',
    total_input: 1,
  });

  await insert('linkedin_import_items', {
    import_id: importRecord.id,
    source_url: linkedin_url || null,
    source_index: 0,
    raw_profile_data: text,
    deepseek_processed: false,
  });

  setImmediate(() => runLinkedInImport(importRecord.id));

  return res.json({
    success: true,
    import_id: importRecord.id,
    status: 'processing',
    message: 'Parsing pasted profile...',
  });
}

async function handleImportCSV(req: VercelRequest, res: VercelResponse, userId: string) {
  const { csv_text, format = 'auto' } = req.body || {};
  if (!csv_text) return res.status(400).json({ success: false, error: 'csv_text is required' });

  const parsed = parseLinkedInCSV(csv_text);
  const detectedFormat = format === 'auto' ? parsed.detected_format : format;

  if (parsed.rows.length > 200) {
    return res.status(400).json({ success: false, error: 'Max 200 rows per CSV import' });
  }

  const importRecord = await insert('linkedin_imports', {
    created_by: userId,
    import_type: detectedFormat === 'linkedin_recruiter' ? 'linkedin_recruiter_export' :
                 detectedFormat === 'sales_navigator' ? 'sales_navigator_export' : 'csv_file',
    status: 'pending',
    total_input: parsed.rows.length,
    metadata: JSON.stringify({
      detected_format: detectedFormat,
      headers: parsed.headers,
    }),
  });

  // Create items
  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i];
    const mapped = mapCSVToContactFields(row, detectedFormat);
    const linkedinUrl = mapped.linkedin_url || row['LinkedIn URL'] || row['Profile URL'] || '';

    await insert('linkedin_import_items', {
      import_id: importRecord.id,
      source_url: linkedinUrl || null,
      source_index: i,
      raw_profile_data: JSON.stringify(mapped),
      deepseek_processed: false,
      parsed_data: JSON.stringify(mapped),
    });
  }

  setImmediate(() => runLinkedInImport(importRecord.id));

  return res.json({
    success: true,
    import_id: importRecord.id,
    total_rows: parsed.rows.length,
    status: 'queued',
    detected_format: detectedFormat,
  });
}

async function handleListImports(req: VercelRequest, res: VercelResponse, userId: string) {
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const role = await getUserRole(userId);
  const isAdminOrLead = role === 'admin' || role === 'team_lead';

  const imports = await selectMany(
    'linkedin_imports',
    isAdminOrLead ? {} : { created_by: userId },
    ['created_at DESC'],
    limitNum, offset, '*'
  );

  return res.json({ success: true, imports });
}

async function handleGetImport(req: VercelRequest, res: VercelResponse, importId: string, userId: string) {
  const importRecord = await selectOne(
    'linkedin_imports',
    { column: 'id', value: importId, select: '*' },
    5000
  );

  if (!importRecord) return res.status(404).json({ success: false, error: 'Import not found' });

  const role = await getUserRole(userId);
  if (importRecord.created_by !== userId && role !== 'admin' && role !== 'team_lead') {
    return res.status(403).json({ success: false, error: 'Not your import' });
  }

  const items = await selectMany(
    'linkedin_import_items',
    { import_id: importId },
    ['source_index ASC'],
    200, 0, '*'
  );

  return res.json({ success: true, import: importRecord, items });
}

async function handleRetryImport(req: VercelRequest, res: VercelResponse, importId: string, userId: string) {
  const importRecord = await selectOne(
    'linkedin_imports',
    { column: 'id', value: importId, select: '*' },
    5000
  );

  if (!importRecord) return res.status(404).json({ success: false, error: 'Import not found' });
  if (importRecord.created_by !== userId) {
    const role = await getUserRole(userId);
    if (role !== 'admin' && role !== 'team_lead') {
      return res.status(403).json({ success: false, error: 'Not your import' });
    }
  }

  // Reset failed items
  const items = await selectMany(
    'linkedin_import_items',
    { import_id: importId },
    [], 200, 0, 'id, action_taken, deepseek_processed'
  );

  let retryCount = 0;
  for (const item of items) {
    if (item.action_taken === 'skipped_error') {
      await update('linkedin_import_items', item.id, {
        deepseek_processed: false,
        deepseek_error: null,
        action_taken: null,
        processed_at: null,
      });
      retryCount++;
    }
  }

  if (retryCount === 0) {
    return res.json({ success: true, message: 'No failed items to retry', retried: 0 });
  }

  await update('linkedin_imports', importId, {
    status: 'parsing',
    started_at: new Date().toISOString(),
  });

  setImmediate(() => runLinkedInImport(importId));

  return res.json({
    success: true,
    message: `Retrying ${retryCount} failed items`,
    retried: retryCount,
  });
}

async function handleCacheStats(req: VercelRequest, res: VercelResponse, userId: string) {
  if (!await isAdmin(userId)) {
    return res.status(403).json({ success: false, error: 'Admin only' });
  }

  try {
    const all = await selectMany('linkedin_data_cache', {}, [], 1000, 0, 'parse_status, fetch_count');
    const total = all.length;
    const parsed = all.filter((c: any) => c.parse_status === 'parsed').length;
    const pending = all.filter((c: any) => c.parse_status === 'pending').length;
    const error = all.filter((c: any) => c.parse_status === 'error').length;

    return res.json({
      success: true,
      stats: { total, parsed, pending, error },
    });
  } catch (e) {
    return res.json({ success: true, stats: { total: 0, parsed: 0, pending: 0, error: 0 } });
  }
}

async function handleCacheClear(req: VercelRequest, res: VercelResponse, userId: string) {
  if (!await isAdmin(userId)) {
    return res.status(403).json({ success: false, error: 'Admin only' });
  }

  return res.json({
    success: true,
    message: 'Cache clear would remove stale entries (requires service role for deletion)',
  });
}

async function handleDedupCheck(req: VercelRequest, res: VercelResponse) {
  const { linkedin_url, email, phone, full_name, company } = req.query as Record<string, string>;

  const result = await findDuplicateContact({
    linkedin_url,
    email,
    phone,
    full_name,
    current_company: company,
  });

  return res.json({ success: true, ...result });
}
