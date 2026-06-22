/*
 * LinkedIn CSV Column Mapping
 *
 * LinkedIn Sales Navigator exports CSV with columns like:
 *   First Name, Last Name, Full Name, Email, Phone, Company, Title,
 *   LinkedIn URL, Location, Connected On
 *
 * We map these to the `contacts` table schema:
 *   id, first_name, last_name, email, phone, company, title,
 *   linkedin_url, location, notes, created_by, organization_id,
 *   created_at, updated_at
 */

import type { OutreachOutcome } from '../../types/index.js';

export interface LinkedInColumnMap {
  [csvColumn: string]: DbColumn | null;
}

export type DbColumn =
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'phone'
  | 'company'
  | 'title'
  | 'linkedin_url'
  | 'location'
  | 'notes'
  | 'skip';

// Canonical LinkedIn -> DB field map. Columns mapped to `null` should
// be skipped by the importer (e.g., "Full Name" because we already
// have first/last separately).
export const LINKEDIN_FIELD_MAP: LinkedInColumnMap = {
  'First Name': 'first_name',
  'Last Name': 'last_name',
  'Full Name': 'skip',
  'Email Address': 'email',
  'Email': 'email',
  'Phone Number': 'phone',
  'Phone': 'phone',
  'Company Name': 'company',
  'Company': 'company',
  'Title': 'title',
  'Job Title': 'title',
  'LinkedIn URL': 'linkedin_url',
  'LinkedIn Profile': 'linkedin_url',
  'Location': 'location',
  'City': 'location',
  'Country': 'skip',
  'Connected On': 'skip',
  'Connection Date': 'skip',
  'Tags': 'skip',
  'Custom Label': 'skip',
  'Sales Nav Status': 'skip',
  'Profile Picture URL': 'skip',
  'Industry': 'skip',
  'Seniority': 'skip',
};

// Columns in the contacts table we allow imports into.
export const ALL_DB_COLUMNS: DbColumn[] = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'company',
  'title',
  'linkedin_url',
  'location',
  'notes',
  'skip',
];

// Human-friendly labels used in the dropdown in the mapping UI.
export const DB_COLUMN_LABELS: Record<DbColumn, string> = {
  first_name: 'First Name',
  last_name: 'Last Name',
  email: 'Email',
  phone: 'Phone',
  company: 'Company',
  title: 'Title',
  linkedin_url: 'LinkedIn URL',
  location: 'Location',
  notes: 'Notes',
  skip: '— Skip —',
};

/**
 * Normalize a CSV column header so we can match it against
 * LINKEDIN_FIELD_MAP. Handles trimming, spaces, and common variations.
 */
export function normalizeColumnHeader(header: string): string {
  return header.trim();
}

/**
 * Auto-map a set of CSV headers to DB columns. Returns a map from
 * CSV header -> DB column. Columns that cannot be auto-mapped are
 * assigned `skip` — the UI should highlight these for manual selection.
 */
export function autoMapColumns(headers: string[]): Record<string, DbColumn> {
  const mapping: Record<string, DbColumn> = {};

  for (const rawHeader of headers) {
    const header = normalizeColumnHeader(rawHeader);

    // 1. Exact match
    if (LINKEDIN_FIELD_MAP[header]) {
      mapping[rawHeader] = LINKEDIN_FIELD_MAP[header];
      continue;
    }

    // 2. Case-insensitive match
    const ciKey = Object.keys(LINKEDIN_FIELD_MAP).find(
      (k) => k.toLowerCase() === header.toLowerCase(),
    );
    if (ciKey) {
      mapping[rawHeader] = LINKEDIN_FIELD_MAP[ciKey];
      continue;
    }

    // 3. Keyword heuristics
    const h = header.toLowerCase();
    if (h.includes('email')) mapping[rawHeader] = 'email';
    else if (h.includes('linkedin')) mapping[rawHeader] = 'linkedin_url';
    else if (h.includes('phone') || h.includes('mobile')) mapping[rawHeader] = 'phone';
    else if (h.startsWith('first')) mapping[rawHeader] = 'first_name';
    else if (h.startsWith('last')) mapping[rawHeader] = 'last_name';
    else if (h === 'name') mapping[rawHeader] = 'first_name';
    else if (h.includes('title') || h.includes('job')) mapping[rawHeader] = 'title';
    else if (h.includes('company') || h.includes('organization')) mapping[rawHeader] = 'company';
    else if (h.includes('location') || h.includes('city')) mapping[rawHeader] = 'location';
    else mapping[rawHeader] = 'skip';
  }

  return mapping;
}

/**
 * Minimum RFC 4180 CSV parser. Ported from companiesUploadHandler.ts.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\r' || c === '\n') {
      row.push(field);
      field = '';
      if (c === '\r' && text[i + 1] === '\n') i++;
      if (!(row.length === 1 && row[0] === '')) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    if (!(row.length === 1 && row[0] === '')) rows.push(row);
  }

  return rows;
}

/**
 * Apply the column mapping to raw rows to produce contact records.
 * Returns the mapped records and a count of rows that are "empty"
 * (no non-skip fields populated).
 */
export function applyMapping(
  headers: string[],
  rows: string[][],
  columnMap: Record<string, DbColumn>,
): { records: Partial<Record<DbColumn, string>>[]; emptyCount: number; unmappedCount: number } {
  const records: Partial<Record<DbColumn, string>>[] = [];
  let emptyCount = 0;
  let unmappedCount = 0;

  // Index each CSV column to its mapped DB column (or "skip")
  const columnIndex: (DbColumn | null)[] = headers.map(
    (h) => (columnMap[h] === 'skip' ? null : (columnMap[h] || null)),
  );

  const hasAnyMapping = columnIndex.some((c) => c !== null);

  if (!hasAnyMapping) {
    return { records: [], emptyCount: rows.length, unmappedCount: rows.length };
  }

  for (const row of rows) {
    const record: Partial<Record<DbColumn, string>> = {};
    let hasAnyData = false;

    for (let i = 0; i < headers.length; i++) {
      const target = columnIndex[i];
      const value = (row[i] ?? '').trim();
      if (!target || !value) continue;

      // Basic field sanitization
      const sanitized = sanitizeField(target, value);
      if (!sanitized) continue;

      // If two CSV cols map to the same DB column, concatenate with space
      record[target] = record[target] ? `${record[target]} ${sanitized}` : sanitized;
      hasAnyData = true;
    }

    if (hasAnyData) {
      records.push(record);
    } else {
      emptyCount++;
    }
  }

  return { records, emptyCount, unmappedCount };
}

function sanitizeField(column: DbColumn, value: string): string | null {
  if (!value) return null;

  switch (column) {
    case 'email':
      // Simple email normalization: lowercase and strip common junk
      const emailMatch = value.toLowerCase().match(/[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/);
      return emailMatch ? emailMatch[0] : null;
    case 'linkedin_url':
      // Normalize LinkedIn URL — strip query params
      try {
        const url = value.startsWith('http') ? value : `https://${value}`;
        const u = new URL(url);
        // Keep the path, strip query + fragment
        return `https://www.linkedin.com${u.pathname}`;
      } catch {
        return value.startsWith('linkedin.com') || value.startsWith('www.linkedin.com')
          ? `https://${value.replace(/^www\./, '')}`
          : value;
      }
    case 'phone':
      return value.slice(0, 50);
    case 'first_name':
    case 'last_name':
    case 'company':
    case 'title':
    case 'location':
    case 'notes':
      return value.slice(0, 255);
    default:
      return value.slice(0, 255);
  }
}

/**
 * Split "Full Name" into first/last when we only have full name.
 * Useful when a CSV has "Full Name" but no separate first/last columns.
 */
export function splitFullName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first_name: parts[0], last_name: '' };
  if (parts.length === 2) return { first_name: parts[0], last_name: parts[1] };
  // More than 2 parts: first part = first name, rest = last name
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

/**
 * Outreach outcome constants — kept here for easy reuse in the UI
 * (which currently relies on a separate enum, but we keep references
 * symmetric for forward-compatibility).
 */
export const OUTREACH_OUTCOMES: { value: OutreachOutcome; label: string }[] = [
  { value: 'no_response', label: 'No Response' },
  { value: 'interested', label: 'Interested' },
  { value: 'scheduled_interview', label: 'Interview Scheduled' },
  { value: 'positive', label: 'Positive' },
  { value: 'negative', label: 'Negative' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'referred_other', label: 'Referred Others' },
  { value: 'invalid_contact', label: 'Invalid Contact' },
];
