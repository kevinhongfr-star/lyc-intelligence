// Phase 2.7: Saved Searches Engine

import type { SupabaseClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface SearchFilters {
  title?: string;
  location?: string;
  skills?: string[];
  experience_years?: { min?: number; max?: number };
  industry?: string;
  seniority?: string[];
  keywords?: string[];
  education?: string[];
  availability?: string;
  [key: string]: unknown;
}

export interface SavedSearch {
  id: string;
  org_id: string;
  user_id: string;
  search_name: string;
  search_description: string | null;
  search_filters: SearchFilters;
  alert_frequency: 'realtime' | 'daily' | 'weekly' | 'off';
  alert_threshold: number;
  is_active: boolean;
  is_shared: boolean;
  shared_with_team: string | null;
  last_executed_at: string | null;
  last_match_count: number;
  created_at: string;
  updated_at: string;
}

export interface TalentAlert {
  id: string;
  saved_search_id: string;
  org_id: string;
  user_id: string;
  candidate_id: string;
  alert_type: 'new_match' | 'profile_updated' | 'stage_changed';
  match_score: number;
  notification_sent: boolean;
  notification_sent_at: string | null;
  viewed_at: string | null;
  created_at: string;
}

export interface SearchSubscription {
  id: string;
  saved_search_id: string;
  user_id: string;
  org_id: string;
  subscribed_at: string;
  notification_preference: 'inherit' | 'daily' | 'weekly' | 'off';
}

// ═══════════════════════════════════════════════════════════════
// SEARCH MATCHING ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate match score between candidate and search filters
 */
export function calculateMatchScore(
  candidate: Record<string, unknown>,
  filters: SearchFilters
): number {
  let score = 0;
  let totalWeight = 0;

  // Title match (30% weight)
  if (filters.title && candidate.title) {
    totalWeight += 30;
    const titleMatch = (candidate.title as string)
      .toLowerCase()
      .includes((filters.title as string).toLowerCase());
    score += titleMatch ? 30 : 0;
  }

  // Location match (20% weight)
  if (filters.location && candidate.location) {
    totalWeight += 20;
    const locationMatch = (candidate.location as string)
      .toLowerCase()
      .includes((filters.location as string).toLowerCase());
    score += locationMatch ? 20 : 0;
  }

  // Skills match (30% weight)
  if (filters.skills && filters.skills.length > 0 && candidate.skills) {
    totalWeight += 30;
    const candidateSkills = new Set(
      (candidate.skills as string[]).map(s => s.toLowerCase())
    );
    const filterSkills = new Set(
      filters.skills.map(s => s.toLowerCase())
    );
    
    let matchedSkills = 0;
    filterSkills.forEach(skill => {
      if (candidateSkills.has(skill)) matchedSkills++;
    });
    
    const skillScore = (matchedSkills / filterSkills.size) * 30;
    score += skillScore;
  }

  // Experience match (10% weight)
  if (filters.experience_years && candidate.experience_years) {
    totalWeight += 10;
    const exp = candidate.experience_years as number;
    const { min = 0, max = 99 } = filters.experience_years;
    if (exp >= min && exp <= max) {
      score += 10;
    }
  }

  // Industry match (10% weight)
  if (filters.industry && candidate.industry) {
    totalWeight += 10;
    const industryMatch = (candidate.industry as string)
      .toLowerCase()
      .includes((filters.industry as string).toLowerCase());
    score += industryMatch ? 10 : 0;
  }

  // Keywords match (bonus)
  if (filters.keywords && filters.keywords.length > 0) {
    const candidateText = JSON.stringify(candidate).toLowerCase();
    filters.keywords.forEach(keyword => {
      if (candidateText.includes(keyword.toLowerCase())) {
        score += 5;
        totalWeight += 5;
      }
    });
  }

  return totalWeight > 0 ? Math.round((score / totalWeight) * 100) / 100 : 0;
}

/**
 * Check if candidate matches search filters
 */
export function matchesFilters(
  candidate: Record<string, unknown>,
  filters: SearchFilters
): { matches: boolean; score: number } {
  const score = calculateMatchScore(candidate, filters);
  return { matches: score >= 0.7, score };
}

/**
 * Format filters for display
 */
export function formatFilters(filters: SearchFilters): string[] {
  const parts: string[] = [];
  
  if (filters.title) parts.push(`Title: ${filters.title}`);
  if (filters.location) parts.push(`Location: ${filters.location}`);
  if (filters.industry) parts.push(`Industry: ${filters.industry}`);
  if (filters.skills && filters.skills.length > 0) {
    parts.push(`Skills: ${filters.skills.join(', ')}`);
  }
  if (filters.experience_years) {
    const { min, max } = filters.experience_years;
    if (min && max) parts.push(`Experience: ${min}-${max} years`);
    else if (min) parts.push(`Experience: ${min}+ years`);
    else if (max) parts.push(`Experience: up to ${max} years`);
  }
  if (filters.seniority && filters.seniority.length > 0) {
    parts.push(`Seniority: ${filters.seniority.join(', ')}`);
  }

  return parts.length > 0 ? parts : ['No specific filters'];
}

// ═══════════════════════════════════════════════════════════════
// DATABASE OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Create saved search
 */
export async function createSavedSearch(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  searchName: string,
  filters: SearchFilters,
  description?: string,
  alertFrequency: 'realtime' | 'daily' | 'weekly' | 'off' = 'daily',
  isShared: boolean = false
): Promise<SavedSearch | null> {
  const { data, error } = await supabase
    .from('saved_searches')
    .insert({
      org_id: orgId,
      user_id: userId,
      search_name: searchName,
      search_description: description,
      search_filters: filters,
      alert_frequency: alertFrequency,
      is_shared: isShared,
    })
    .select()
    .single();

  if (error || !data) return null;
  return data as SavedSearch;
}

/**
 * Get saved searches for user
 */
export async function getSavedSearches(
  supabase: SupabaseClient,
  orgId: string,
  userId: string
): Promise<SavedSearch[]> {
  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('org_id', orgId)
    .or(`user_id.eq.${userId},is_shared.eq.true`)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as SavedSearch[];
}

/**
 * Get saved search by ID
 */
export async function getSavedSearchById(
  supabase: SupabaseClient,
  searchId: string
): Promise<SavedSearch | null> {
  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('id', searchId)
    .single();

  if (error || !data) return null;
  return data as SavedSearch;
}

/**
 * Update saved search
 */
export async function updateSavedSearch(
  supabase: SupabaseClient,
  searchId: string,
  updates: Partial<Pick<SavedSearch, 'search_name' | 'search_description' | 'search_filters' | 'alert_frequency' | 'alert_threshold' | 'is_active' | 'is_shared'>>
): Promise<SavedSearch | null> {
  const { data, error } = await supabase
    .from('saved_searches')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', searchId)
    .select()
    .single();

  if (error || !data) return null;
  return data as SavedSearch;
}

/**
 * Delete saved search
 */
export async function deleteSavedSearch(
  supabase: SupabaseClient,
  searchId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('saved_searches')
    .delete()
    .eq('id', searchId);

  return !error;
}

/**
 * Execute saved search
 */
export async function executeSavedSearch(
  supabase: SupabaseClient,
  searchId: string
): Promise<{ candidates: Record<string, unknown>[]; count: number }> {
  const search = await getSavedSearchById(supabase, searchId);
  if (!search) return { candidates: [], count: 0 };

  const filters = search.search_filters;
  let query = supabase.from('contacts').select('*');

  // Apply filters
  if (filters.title) {
    query = query.ilike('title', `%${filters.title}%`);
  }
  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }
  if (filters.industry) {
    query = query.ilike('industry', `%${filters.industry}%`);
  }
  if (filters.skills && filters.skills.length > 0) {
    filters.skills.forEach(skill => {
      query = query.overlaps('skills', [skill]);
    });
  }
  if (filters.experience_years) {
    if (filters.experience_years.min) {
      query = query.gte('experience_years', filters.experience_years.min);
    }
    if (filters.experience_years.max) {
      query = query.lte('experience_years', filters.experience_years.max);
    }
  }

  const { data, error, count } = await query;

  if (error || !data) return { candidates: [], count: 0 };

  // Update last executed time
  await supabase
    .from('saved_searches')
    .update({
      last_executed_at: new Date().toISOString(),
      last_match_count: count || 0,
    })
    .eq('id', searchId);

  return { candidates: data as Record<string, unknown>[], count: count || 0 };
}

/**
 * Log search execution
 */
export async function logSearchExecution(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  filters: SearchFilters,
  resultCount: number,
  executionTimeMs: number,
  savedSearchId?: string
): Promise<void> {
  await supabase.from('search_executions').insert({
    org_id: orgId,
    user_id: userId,
    saved_search_id: savedSearchId,
    search_filters: filters,
    result_count: resultCount,
    execution_time_ms: executionTimeMs,
  });
}

export default {
  calculateMatchScore,
  matchesFilters,
  formatFilters,
  createSavedSearch,
  getSavedSearches,
  getSavedSearchById,
  updateSavedSearch,
  deleteSavedSearch,
  executeSavedSearch,
  logSearchExecution,
};