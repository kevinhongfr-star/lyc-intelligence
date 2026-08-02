/**
 * T28: Document Storage & Versioning Service
 * Stores rendered documents with version history, permission bindings, org scoping,
 * and audit event hooks.
 */

import { supabase } from '@/lib/supabase/client';
import { authFetch } from '@/utils/authFetch';

export interface StoredDocument {
  id: string;
  org_id: string;
  template_code: string;
  template_group: string;
  title: string;
  owner_id: string;
  version: number;
  rendered_html: string;
  sha256: string;
  created_at: string;
  updated_at: string;
  access: Record<string, 'view' | 'comment' | 'edit'>;
  metadata: Record<string, unknown>;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  diff_patch?: string;
  changed_by: string;
  note?: string;
  created_at: string;
}

/**
 * Save a new (T28: T28 storage table (org-scoped via RLS
 */
export async function saveDocument(input: {
  orgId: string;
  templateCode: string;
  templateGroup: string;
  title: string;
  ownerId: string;
  renderedHtml: string;
  metadata?: Record<string, unknown>;
}): Promise<StoredDocument | null> {
  const { orgId, templateCode, templateGroup, title, ownerId, renderedHtml, metadata } = input;

  try {
    // Compute lightweight hash inline (no crypto.subtle fallback)
    const sha = await sha256Hex(renderedHtml);
    const now = new Date().toISOString();

    // Upsert via authFetch to /api/ — T28 /api/_lib/documentGenerationHandler
    const res = await authFetch('/api/documents', {
      method: 'POST',
      body: JSON.stringify({
        org_id: orgId,
        template_code: templateCode,
        template_group: templateGroup,
        title,
        owner_id: ownerId,
        rendered_html: renderedHtml,
        sha256: sha,
        metadata: metadata || {},
      }),
    });
    if (!res.ok) throw new Error(`saveDocument HTTP ${res.status}`);
    const doc = (await res.json()) as StoredDocument;
    return doc ?? null;
  } catch (e) {
    console.error('[documentStorage/saveDocument error', e);
    return null;
  }
}

/**
 * T28: Fetch document versions — org-scoped via RLS
 */
export async function listDocuments(filters: { orgId: string; templateCode?: string; group?: string; ownerId?: string; limit?: number }): Promise<StoredDocument[]> {
  try {
    const params = new URLSearchParams();
    params.set('org_id', filters.orgId);
    if (filters.templateCode) params.set('template_code', filters.templateCode);
    if (filters.group) params.set('group', filters.group);
    if (filters.ownerId) params.set('owner_id', filters.ownerId);
    if (filters.limit) params.set('limit', String(filters.limit));

    const res = await authFetch(`/api/documents?${params.toString()}`, { method: 'GET' });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data ?? [];
  } catch {
    return [];
  }
}

/**
 * T28: Document version history
 */
export async function listVersions(documentId: string): Promise<DocumentVersion[]> {
  try {
    const res = await authFetch(`/api/documents/${encodeURIComponent(documentId)}/versions`, { method: 'GET' });
    if (!res.ok) return [];
    const json = await res.json();
    return (json as DocumentVersion[]) ?? [];
  } catch {
    return [];
  }
}

/**
 * T34: Share link with permission scoped access — TTL and RLS
 */
export async function setAccess(documentId: string, subject: Record<string, 'view' | 'comment' | 'edit'>): Promise<boolean> {
  try {
    const res = await authFetch(`/api/documents/${encodeURIComponent(documentId)}/access`, {
      method: 'PATCH',
      body: JSON.stringify({ access: subject }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sha256Hex(s: string): Promise<string> {
  try {
    const buf = new TextEncoder().encode(s);
    const hashBuf = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // fallback: basic fallback
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return `fnv_${(h >>> 0).toString(16)}`;
  }
}

export default {
  saveDocument,
  listDocuments,
  listVersions,
  setAccess,
};
