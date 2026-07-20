// Collaboration Service — Client Portal collaboration workspace
// Provides projects (mandates), discussion threads, and shared documents for client accounts.

import { supabase } from '@/lib/supabase/client';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface CollaborationProject {
  id: string;
  title: string;
  description: string;
  members: number;
  progress: number;
  lastUpdated: string;
  status: string;
}

export interface DiscussionThread {
  id: string;
  title: string;
  author: string;
  messages: number;
  lastMessage: string;
  unread: boolean;
  mandateId: string | null;
}

export interface SharedDocument {
  id: string;
  title: string;
  type: 'Report' | 'Proposal' | 'Document' | 'Spreadsheet';
  author: string;
  date: string;
  size: string;
  url?: string;
}

// ═══════════════════════════════════════════════════════════════
// SEED DATA (fallback when DB tables are unavailable)
// ═══════════════════════════════════════════════════════════════

const SEED_PROJECTS: CollaborationProject[] = [
  { id: 'p1', title: 'Q1 Executive Search', description: 'Enterprise-level leadership recruitment', members: 5, progress: 75, lastUpdated: '2h ago', status: 'active' },
  { id: 'p2', title: 'TechCorp VP Engineering', description: 'Senior technical leadership role', members: 3, progress: 45, lastUpdated: '5h ago', status: 'active' },
  { id: 'p3', title: 'FinScale CFO Search', description: 'Financial leadership mandate', members: 4, progress: 90, lastUpdated: '1d ago', status: 'near_completion' },
  { id: 'p4', title: 'DataMesh Expansion', description: 'Product and engineering roles', members: 6, progress: 30, lastUpdated: '2d ago', status: 'active' },
];

const SEED_THREADS: DiscussionThread[] = [
  { id: 't1', title: 'Candidate Shortlist Review', author: 'Sarah Kim', messages: 12, lastMessage: 'Let me review these profiles...', unread: true, mandateId: 'p1' },
  { id: 't2', title: 'Interview Schedule', author: 'Alex Chen', messages: 8, lastMessage: 'Updated calendar invite sent', unread: false, mandateId: 'p2' },
  { id: 't3', title: 'Compensation Package', author: 'Michael Wong', messages: 15, lastMessage: 'Feedback received from HR', unread: true, mandateId: 'p3' },
  { id: 't4', title: 'Market Analysis Q1', author: 'Emily Davis', messages: 22, lastMessage: 'Final report attached', unread: false, mandateId: null },
];

const SEED_DOCUMENTS: SharedDocument[] = [
  { id: 'd1', title: 'Q1 Talent Report 2025', type: 'Report', author: 'DEX AI', date: 'Jan 15, 2025', size: '2.4 MB' },
  { id: 'd2', title: 'Executive Search Proposal', type: 'Proposal', author: 'Alex Chen', date: 'Jan 12, 2025', size: '850 KB' },
  { id: 'd3', title: 'Candidate Scorecard', type: 'Spreadsheet', author: 'Sarah Kim', date: 'Jan 10, 2025', size: '120 KB' },
  { id: 'd4', title: 'Market Intelligence Brief', type: 'Document', author: 'DEX AI', date: 'Jan 8, 2025', size: '560 KB' },
];

// ═══════════════════════════════════════════════════════════════
// SERVICE CLASS
// ═══════════════════════════════════════════════════════════════

class CollaborationService {
  private useFallback = false;

  /**
   * Get collaboration projects (mandates) for a client org.
   */
  async getProjects(clientOrgId: string): Promise<CollaborationProject[]> {
    if (this.useFallback) return SEED_PROJECTS;

    try {
      const { data, error } = await supabase
        .from('mandates')
        .select('id, title, status, progress_pct, updated_at, assigned_team')
        .eq('client_org_id', clientOrgId)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!data || data.length === 0) return SEED_PROJECTS;

      return data.map((m: any) => ({
        id: m.id,
        title: m.title || 'Untitled Mandate',
        description: `${m.status || 'Active'} mandate`,
        members: Array.isArray(m.assigned_team) ? m.assigned_team.length : 1,
        progress: typeof m.progress_pct === 'number' ? m.progress_pct : 0,
        lastUpdated: this.formatRelative(m.updated_at),
        status: m.status || 'active',
      }));
    } catch (err) {
      console.warn('[CollaborationService] getProjects failed, using fallback:', err);
      this.useFallback = true;
      return SEED_PROJECTS;
    }
  }

  /**
   * Get discussion threads for a client org.
   * Tries mandate_comments first, falls back to seed.
   */
  async getThreads(clientOrgId: string): Promise<DiscussionThread[]> {
    if (this.useFallback) return SEED_THREADS;

    try {
      // Try mandate_comments if available
      const { data, error } = await supabase
        .from('mandate_comments')
        .select(`
          id,
          mandate_id,
          author_name,
          body,
          created_at,
          is_unread
        `)
        .eq('org_id', clientOrgId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        // Table might not exist; use seed
        return SEED_THREADS;
      }

      if (!data || data.length === 0) return SEED_THREADS;

      // Group by mandate for thread-like display
      const threads: DiscussionThread[] = data.map((c: any) => ({
        id: c.id,
        title: c.body?.slice(0, 50) || 'Comment',
        author: c.author_name || 'Unknown',
        messages: 1,
        lastMessage: c.body?.slice(0, 60) || '',
        unread: Boolean(c.is_unread),
        mandateId: c.mandate_id,
      }));

      return threads;
    } catch (err) {
      console.warn('[CollaborationService] getThreads failed:', err);
      return SEED_THREADS;
    }
  }

  /**
   * Get shared documents for a client org.
   * Uses the documents table if available.
   */
  async getDocuments(clientOrgId: string): Promise<SharedDocument[]> {
    if (this.useFallback) return SEED_DOCUMENTS;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, type, file_url, file_size_bytes, created_at, author_name')
        .eq('org_id', clientOrgId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!data || data.length === 0) return SEED_DOCUMENTS;

      return data.map((d: any) => ({
        id: d.id,
        title: d.name || 'Untitled',
        type: this.mapDocType(d.type),
        author: d.author_name || 'Unknown',
        date: new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        size: this.formatBytes(d.file_size_bytes),
        url: d.file_url,
      }));
    } catch (err) {
      console.warn('[CollaborationService] getDocuments failed, using fallback:', err);
      return SEED_DOCUMENTS;
    }
  }

  private formatRelative(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  private formatBytes(bytes: number | null): string {
    if (!bytes) return '—';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(0)} KB`;
  }

  private mapDocType(type: string | null): SharedDocument['type'] {
    if (!type) return 'Document';
    const t = type.toUpperCase();
    if (t.includes('REPORT')) return 'Report';
    if (t.includes('PROPOSAL')) return 'Proposal';
    if (t.includes('SHEET') || t.includes('EXCEL') || t.includes('CSV')) return 'Spreadsheet';
    return 'Document';
  }
}

export const collaborationService = new CollaborationService();

export default {
  collaborationService,
};