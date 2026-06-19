import type { VercelRequest, VercelResponse } from '@vercel/node';
import { selectMany, handleError } from './_lib/supabaseRest.js';

export const maxDuration = 30;

/**
 * Consolidated dashboard endpoint — runs all queries in parallel.
 * Returns: stats, mandates, tierDistribution, recentActivity in one response.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Run all 4 queries in parallel
    const [statsResult, mandatesResult, tiersResult, activityResult] = await Promise.all([
      // 1. Dashboard stats (counts + breakdowns)
      (async () => {
        const [contacts, mandates, companies, proposals] = await Promise.all([
          selectMany('contacts', { select: 'id,seniority', limit: 10000 }),
          selectMany('mandates', { select: 'id,status', limit: 10000 }),
          selectMany('companies', { select: 'id', limit: 1 }),
          selectMany('proposals', { select: 'id', limit: 1 }),
        ]);
        
        const contactsBySeniority: Record<string, number> = {};
        for (const c of contacts) {
          const k = c.seniority || 'unknown';
          contactsBySeniority[k] = (contactsBySeniority[k] || 0) + 1;
        }
        
        const mandatesByStatus: Record<string, number> = {};
        for (const m of mandates) {
          const k = m.status || 'unknown';
          mandatesByStatus[k] = (mandatesByStatus[k] || 0) + 1;
        }
        
        return {
          totalContacts: contacts.length,
          totalMandates: mandates.length,
          totalCompanies: companies.length,
          totalProposals: proposals.length,
          mandatesByStatus,
          contactsBySeniority,
        };
      })(),
      
      // 2. Recent mandates — simplified, no JOIN (frontend can resolve company names)
      selectMany('mandates', { 
        select: 'id,title,status,company_id,tier1_count,tier2_count,shortlisted_count,interview_count,placed_count,updated_at',
        orderBy: { column: 'updated_at', ascending: false },
        limit: 10 
      }),
      
      // 3. Tier distribution — fetch minimal fields
      (async () => {
        const contacts = await selectMany('contacts', { 
          select: 'trident_composite,cxo_stamp',
          limit: 15000 
        });
        const tiers = { S: 0, A: 0, B: 0, C: 0 };
        
        for (const c of contacts) {
          const score = c.trident_composite ?? 0;
          if (c.cxo_stamp || score >= 85) tiers.S++;
          else if (score >= 65) tiers.A++;
          else if (score >= 45) tiers.B++;
          else tiers.C++;
        }
        return tiers;
      })(),
      
      // 4. Recent activity feed
      (async () => {
        const [scoringRuns, recentContacts] = await Promise.all([
          selectMany('scoring_runs', { 
            select: 'id,run_type,composite_score,verdict,created_at,contact_id,mandate_id',
            orderBy: { column: 'created_at', ascending: false },
            limit: 15 
          }),
          selectMany('contacts', { 
            select: 'id,name,current_title,updated_at',
            orderBy: { column: 'updated_at', ascending: false },
            limit: 15 
          }),
        ]);
        
        const activities: any[] = [];
        
        for (const sr of scoringRuns) {
          activities.push({
            type: 'scoring',
            id: sr.id,
            title: `Scored: ${sr.run_type}`,
            detail: sr.verdict ? `Verdict: ${sr.verdict}` : `Score: ${sr.composite_score ?? '—'}`,
            timestamp: sr.created_at,
            contact_id: sr.contact_id,
            mandate_id: sr.mandate_id,
          });
        }
        
        for (const c of recentContacts) {
          activities.push({
            type: 'contact_update',
            id: c.id,
            title: c.name,
            detail: c.current_title ?? 'Profile updated',
            timestamp: c.updated_at,
          });
        }
        
        return activities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 20);
      })(),
    ]);
    
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
    return res.status(200).json({
      stats: statsResult,
      mandates: mandatesResult,
      tierDistribution: tiersResult,
      recentActivity: activityResult,
    });
  } catch (error: any) {
    console.error('[Dashboard API] Error:', error);
    return handleError(res, 'dashboard', error);
  }
}
