// Phase 2.7: Talent Alerts Logic

import type { SupabaseClient } from '@supabase/supabase-js';
import { matchesFilters, getSavedSearches, getSavedSearchById } from './engine';
import type { SavedSearch, TalentAlert } from './engine';

// ═══════════════════════════════════════════════════════════════
// ALERT GENERATION ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Generate talent alerts for a saved search
 */
export async function generateTalentAlerts(
  supabase: SupabaseClient,
  savedSearch: SavedSearch
): Promise<TalentAlert[]> {
  const alerts: TalentAlert[] = [];
  
  // Get candidates updated since last execution
  const lastExecuted = savedSearch.last_executed_at || '1970-01-01T00:00:00Z';
  
  const { data: candidates, error } = await supabase
    .from('contacts')
    .select('*')
    .gte('updated_at', lastExecuted);

  if (error || !candidates) return [];

  // Check each candidate against filters
  for (const candidate of candidates as Record<string, unknown>[]) {
    const { matches, score } = matchesFilters(candidate, savedSearch.search_filters);
    
    if (matches) {
      // Check if alert already exists for this candidate
      const { data: existingAlert } = await supabase
        .from('talent_alerts')
        .select('id')
        .eq('saved_search_id', savedSearch.id)
        .eq('candidate_id', candidate.id)
        .single();

      if (!existingAlert) {
        const alertType = candidate.created_at > lastExecuted 
          ? 'new_match' 
          : 'profile_updated';

        const { data: alert } = await supabase
          .from('talent_alerts')
          .insert({
            saved_search_id: savedSearch.id,
            org_id: savedSearch.org_id,
            user_id: savedSearch.user_id,
            candidate_id: candidate.id,
            alert_type: alertType,
            match_score: score,
          })
          .select()
          .single();

        if (alert) {
          alerts.push(alert as TalentAlert);
        }
      }
    }
  }

  return alerts;
}

/**
 * Run alert generation for all active saved searches
 */
export async function runTalentAlertGeneration(
  supabase: SupabaseClient,
  orgId?: string
): Promise<{ totalAlertsGenerated: number; searchesChecked: number }> {
  let searches = await getSavedSearches(supabase, orgId || '', '');
  
  if (orgId) {
    searches = searches.filter(s => s.org_id === orgId);
  }
  
  const activeSearches = searches.filter(s => s.is_active && s.alert_frequency !== 'off');
  
  let totalAlertsGenerated = 0;

  for (const search of activeSearches) {
    const alerts = await generateTalentAlerts(supabase, search);
    totalAlertsGenerated += alerts.length;
  }

  return { totalAlertsGenerated, searchesChecked: activeSearches.length };
}

/**
 * Get unviewed talent alerts for user
 */
export async function getUnviewedAlerts(
  supabase: SupabaseClient,
  userId: string
): Promise<TalentAlert[]> {
  const { data, error } = await supabase
    .from('talent_alerts')
    .select('*')
    .eq('user_id', userId)
    .is('viewed_at', null)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as TalentAlert[];
}

/**
 * Get all talent alerts for user
 */
export async function getAllAlerts(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 50
): Promise<TalentAlert[]> {
  const { data, error } = await supabase
    .from('talent_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as TalentAlert[];
}

/**
 * Mark alert as viewed
 */
export async function markAlertAsViewed(
  supabase: SupabaseClient,
  alertId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('talent_alerts')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', alertId);

  return !error;
}

/**
 * Mark all alerts as viewed
 */
export async function markAllAlertsAsViewed(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('talent_alerts')
    .update({ viewed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('viewed_at', null);

  return !error;
}

/**
 * Send notifications for alerts
 */
export async function sendAlertNotifications(
  supabase: SupabaseClient,
  alerts: TalentAlert[]
): Promise<void> {
  for (const alert of alerts) {
    if (!alert.notification_sent) {
      // Get search info
      const search = await getSavedSearchById(supabase, alert.saved_search_id);
      
      if (search) {
        // Send notification via notification service
        // This would integrate with Phase 7.3 notification system
        console.log(`Sending alert for search: ${search.search_name}`);
        
        // Mark as sent
        await supabase
          .from('talent_alerts')
          .update({
            notification_sent: true,
            notification_sent_at: new Date().toISOString(),
          })
          .eq('id', alert.id);
      }
    }
  }
}

/**
 * Count unviewed alerts
 */
export async function countUnviewedAlerts(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('talent_alerts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('viewed_at', null);

  if (error || count === null) return 0;
  return count;
}

export default {
  generateTalentAlerts,
  runTalentAlertGeneration,
  getUnviewedAlerts,
  getAllAlerts,
  markAlertAsViewed,
  markAllAlertsAsViewed,
  sendAlertNotifications,
  countUnviewedAlerts,
};