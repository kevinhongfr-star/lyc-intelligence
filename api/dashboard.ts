import type { VercelRequest, VercelResponse } from '@vercel/node';
import { selectMany, countRows, handleError } from './_lib/supabaseRest.js';

export const maxDuration = 30;

/**
 * Consolidated dashboard endpoint — minimized HTTP round-trips.
 * Computes counts from fetched data where possible to avoid extra queries.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Phase 1: 3 parallel queries (the minimum needed)
    const [contactsData, mandatesData, activityResult] = await Promise.all([
      // 1. All contacts data needed for stats + tiers in one fetch
      selectMany('contacts', { 
        select: 'seniority,trident_composite,cxo_stamp',
        limit: 20000,
      }, 12000),
      
      // 2. All mandates for stats + recent list
      (async () => {
        const [statuses, recent] = await Promise.all([
          selectMany('mandates', { select: 'status', limit: 10000 }, 12000),
          selectMany('mandates', { 
            select: 'id,title,status,client_id,tier1_count,tier2_count,shortlisted_count,interview_count,placed_count,updated_at',
            orderBy: { column: 'updated_at', ascending: false },
            limit: 10 
          }, 10000),
        ]);
        return { statuses, recent };
      })(),
      
      // 3. Activity feed
      (async () => {
        const [scoringRuns, recentContacts] = await Promise.all([
          selectMany('scoring_runs', { 
            select: 'id,run_type,composite_score,verdict,created_at,contact_id,mandate_id',
            orderBy: { column: 'created_at', ascending: false },
            limit: 15 
          }, 10000),
          selectMany('contacts', { 
            select: 'id,name,current_title,updated_at',
            orderBy: { column: 'updated_at', ascending: false },
            limit: 15 
          }, 10000),
        ]);
        const activities: any[] = [];
        for (const sr of scoringRuns) {
          activities.push({
            type: 'scoring', id: sr.id,
            title: `Scored: ${sr.run_type}`,
            detail: sr.verdict ? `Verdict: ${sr.verdict}` : `Score: ${sr.composite_score ?? '—'}`,
            timestamp: sr.created_at, contact_id: sr.contact_id, mandate_id: sr.mandate_id,
          });
        }
        for (const c of recentContacts) {
          activities.push({
            type: 'contact_update', id: c.id,
            title: c.name, detail: c.current_title ?? 'Profile updated',
            timestamp: c.updated_at,
          });
        }
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return activities.slice(0, 20);
      })(),
    ]);

    // Compute stats from fetched data (no extra HTTP calls)
    const totalContacts = contactsData.length;
    const contactsBySeniority: Record<string, number> = {};
    const tierDistribution = { S: 0, A: 0, B: 0, C: 0 };
    for (const c of contactsData) {
      const k = c.seniority || 'unknown';
      contactsBySeniority[k] = (contactsBySeniority[k] || 0) + 1;
      const score = c.trident_composite ?? 0;
      if (c.cxo_stamp || score >= 85) tierDistribution.S++;
      else if (score >= 65) tierDistribution.A++;
      else if (score >= 45) tierDistribution.B++;
      else tierDistribution.C++;
    }

    const totalMandates = mandatesData.statuses.length;
    const mandatesByStatus: Record<string, number> = {};
    for (const m of mandatesData.statuses) {
      const k = m.status || 'unknown';
      mandatesByStatus[k] = (mandatesByStatus[k] || 0) + 1;
    }

    // Get companies + proposals counts (fast — small tables)
    let totalCompanies = 0;
    let totalProposals = 0;
    try {
      const [co, pr] = await Promise.all([
        countRows('companies'),
        countRows('proposals'),
      ]);
      totalCompanies = co;
      totalProposals = pr;
    } catch { /* non-critical */ }

    res.status(200).json({
      stats: {
        totalContacts,
        totalMandates,
        totalCompanies,
        totalProposals,
        mandatesByStatus,
        contactsBySeniority,
      },
      mandates: mandatesData.recent,
      tierDistribution,
      recentActivity: activityResult,
    });
  } catch (err) {
    handleError(res, err, 'Dashboard fetch failed');
  }
}
