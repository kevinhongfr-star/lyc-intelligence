import type { VercelRequest, VercelResponse } from '@vercel/node';
import { selectMany, countRows, handleError } from './_lib/supabaseRest.js';

export const maxDuration = 30;

/**
 * Consolidated dashboard endpoint — optimized for performance.
 * Consolidates contact queries to avoid fetching the same table 3x.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const [statsResult, mandatesResult, tiersResult, activityResult] = await Promise.all([
      // 1. Dashboard stats — use countRows for totals (instant), fetch minimal grouping data
      (async () => {
        const [totalContacts, totalMandates, totalCompanies, totalProposals, seniorityAndTiers, statuses] = await Promise.all([
          countRows('contacts'),
          countRows('mandates'),
          countRows('companies'),
          countRows('proposals'),
          // Single query for both seniority grouping AND tier distribution
          selectMany('contacts', { 
            select: 'seniority,trident_composite,cxo_stamp',
            limit: 20000,
          }, 10000),
          selectMany('mandates', { 
            select: 'status',
            limit: 10000,
          }, 10000),
        ]);

        const contactsBySeniority: Record<string, number> = {};
        const tiers = { S: 0, A: 0, B: 0, C: 0 };
        for (const c of seniorityAndTiers) {
          const k = c.seniority || 'unknown';
          contactsBySeniority[k] = (contactsBySeniority[k] || 0) + 1;
          const score = c.trident_composite ?? 0;
          if (c.cxo_stamp || score >= 85) tiers.S++;
          else if (score >= 65) tiers.A++;
          else if (score >= 45) tiers.B++;
          else tiers.C++;
        }

        const mandatesByStatus: Record<string, number> = {};
        for (const m of statuses) {
          const k = m.status || 'unknown';
          mandatesByStatus[k] = (mandatesByStatus[k] || 0) + 1;
        }

        return { totalContacts, totalMandates, totalCompanies, totalProposals, mandatesByStatus, contactsBySeniority, _tiers: tiers };
      })(),
      
      // 2. Recent mandates — minimal fields, small limit
      selectMany('mandates', { 
        select: 'id,title,status,client_id,tier1_count,tier2_count,shortlisted_count,interview_count,placed_count,updated_at',
        orderBy: { column: 'updated_at', ascending: false },
        limit: 10 
      }),
      
      // 3. Tier distribution — placeholder, will be filled from stats
      Promise.resolve(null),
      
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

    // Use tier data computed in stats query (avoid redundant fetch)
    const tierDistribution = statsResult._tiers || { S: 0, A: 0, B: 0, C: 0 };
    delete (statsResult as any)._tiers;

    res.status(200).json({
      stats: statsResult,
      mandates: mandatesResult,
      tierDistribution,
      recentActivity: activityResult,
    });
  } catch (err) {
    handleError(res, err, 'Dashboard fetch failed');
  }
}
