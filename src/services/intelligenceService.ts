/**
 * Intelligence Service v2
 * 
 * Works with v2 tables: intelligence_sources, intelligence_signals, company_intelligence
 */

import { supabase } from '@/lib/supabase/client';

export type SignalType =
  | 'executive_movement'
  | 'market_shift'
  | 'funding_round'
  | 'leadership_change'
  | 'expansion_news';

export type SignalStatus = 'new' | 'reviewed' | 'archived' | 'actioned';
export type SignalPriority = 'critical' | 'high' | 'medium' | 'low';

export type SourceType = 'web_scrape' | 'api_feed' | 'rss' | 'social';
export type SourceStatus = 'active' | 'paused' | 'error';

export interface IntelligenceSignal {
  id: string;
  signal_type: SignalType;
  title: string;
  description: string;
  company_id?: string;
  company_name?: string;
  source_id?: string;
  source_name?: string;
  source_url?: string;
  relevance_score: number;
  priority: SignalPriority;
  status: SignalStatus;
  metadata?: Record<string, any>;
  detected_at: string;
  created_at: string;
}

export interface IntelligenceSource {
  id: string;
  name: string;
  type: SourceType;
  url: string;
  status: SourceStatus;
  schedule?: string;
  config?: Record<string, any>;
  last_run_at?: string;
  last_run_status?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyIntelligence {
  id: string;
  company_id: string;
  company_name: string;
  industry?: string;
  size?: string;
  location?: string;
  revenue?: string;
  funding_stage?: string;
  total_funding?: string;
  employee_count?: number;
  growth_rate?: number;
  competitive_position?: string;
  key_executives?: Array<{ name: string; title: string; since?: string }>;
  recent_news?: Array<{ title: string; source: string; date: string; url?: string }>;
  signals_count?: number;
  last_updated: string;
}

class IntelligenceService {
  /**
   * Get signals with optional filtering
   */
  async getSignals(params: {
    priority?: SignalPriority;
    status?: SignalStatus;
    signalType?: SignalType;
    companyId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: IntelligenceSignal[]; total: number }> {
    let query = supabase
      .from('intelligence_signals')
      .select('*', { count: 'exact' })
      .order('detected_at', { ascending: false });

    if (params.priority) query = query.eq('priority', params.priority);
    if (params.status) query = query.eq('status', params.status);
    if (params.signalType) query = query.eq('signal_type', params.signalType);
    if (params.companyId) query = query.eq('company_id', params.companyId);

    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[IntelligenceService] getSignals error:', error);
      return { data: [], total: 0 };
    }

    return { data: data || [], total: count || 0 };
  }

  /**
   * Get signal by ID
   */
  async getSignal(id: string): Promise<IntelligenceSignal | null> {
    const { data, error } = await supabase
      .from('intelligence_signals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[IntelligenceService] getSignal error:', error);
      return null;
    }

    return data;
  }

  /**
   * Update signal status
   */
  async updateSignalStatus(id: string, status: SignalStatus): Promise<boolean> {
    const { error } = await supabase
      .from('intelligence_signals')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[IntelligenceService] updateSignalStatus error:', error);
      return false;
    }

    return true;
  }

  /**
   * Get intelligence sources
   */
  async getSources(): Promise<IntelligenceSource[]> {
    const { data, error } = await supabase
      .from('intelligence_sources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[IntelligenceService] getSources error:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Create source
   */
  async createSource(source: Omit<IntelligenceSource, 'id' | 'created_at' | 'updated_at'>): Promise<IntelligenceSource | null> {
    const { data, error } = await supabase
      .from('intelligence_sources')
      .insert(source)
      .select()
      .single();

    if (error) {
      console.error('[IntelligenceService] createSource error:', error);
      return null;
    }

    return data;
  }

  /**
   * Update source
   */
  async updateSource(id: string, updates: Partial<IntelligenceSource>): Promise<boolean> {
    const { error } = await supabase
      .from('intelligence_sources')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[IntelligenceService] updateSource error:', error);
      return false;
    }

    return true;
  }

  /**
   * Delete source
   */
  async deleteSource(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('intelligence_sources')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[IntelligenceService] deleteSource error:', error);
      return false;
    }

    return true;
  }

  /**
   * Toggle source active/paused
   */
  async toggleSource(id: string, currentStatus: SourceStatus): Promise<boolean> {
    const newStatus: SourceStatus = currentStatus === 'active' ? 'paused' : 'active';
    return this.updateSource(id, { status: newStatus });
  }

  /**
   * Get company intelligence
   */
  async getCompanyIntelligence(companyId: string): Promise<CompanyIntelligence | null> {
    const { data, error } = await supabase
      .from('company_intelligence')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (error) {
      console.error('[IntelligenceService] getCompanyIntelligence error:', error);
      return null;
    }

    return data;
  }

  /**
   * Get signals for a specific company
   */
  async getCompanySignals(companyId: string, limit = 20): Promise<IntelligenceSignal[]> {
    const { data, error } = await supabase
      .from('intelligence_signals')
      .select('*')
      .eq('company_id', companyId)
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[IntelligenceService] getCompanySignals error:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(): Promise<{
    activeSignals: number;
    highPriority: number;
    sourcesTracked: number;
    companiesMonitored: number;
  }> {
    const [signalsRes, highPriorityRes, sourcesRes, companiesRes] = await Promise.all([
      supabase.from('intelligence_signals').select('id', { count: 'exact', head: true }).in('status', ['new', 'reviewed']),
      supabase.from('intelligence_signals').select('id', { count: 'exact', head: true }).in('priority', ['critical', 'high']),
      supabase.from('intelligence_sources').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('company_intelligence').select('company_id', { count: 'exact', head: true }),
    ]);

    return {
      activeSignals: signalsRes.count || 0,
      highPriority: highPriorityRes.count || 0,
      sourcesTracked: sourcesRes.count || 0,
      companiesMonitored: companiesRes.count || 0,
    };
  }

  /**
   * Subscribe to realtime signal updates
   */
  subscribeToSignals(callback: (signal: IntelligenceSignal) => void) {
    const subscription = supabase
      .channel('intelligence_signals')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'intelligence_signals' },
        (payload) => callback(payload.new as IntelligenceSignal)
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }
}

export const intelligenceService = new IntelligenceService();