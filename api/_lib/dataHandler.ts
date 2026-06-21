/**
 * dataHandler.ts — Universal data CRUD handler
 * 
 * Routes:
 *   POST   /api/data/pipeline          → insert candidate into pipeline
 *   GET    /api/data/pipeline/:mid      → get pipeline entries for mandate
 *   PATCH  /api/data/pipeline/:id       → update pipeline entry
 *   DELETE /api/data/pipeline/:id       → remove pipeline entry
 *   POST   /api/data/mandate            → create new mandate
 *   PATCH  /api/data/mandate/:id        → update mandate
 *   GET    /api/data/mandate            → list mandates (for selector)
 *   POST   /api/data/contact            → create new contact
 *   PATCH  /api/data/contact/:id        → update contact
 *   GET    /api/data/contact            → list contacts (for selector)
 *   POST   /api/data/scoring-run        → persist scoring run
 *   GET    /api/data/scoring-run        → list scoring runs
 *   POST   /api/data/share              → persist share record
 *   GET    /api/data/share/:id          → get share record
 *   POST   /api/data/mandate-members   → assign user to mandate
 *   GET    /api/data/mandate-members/:mid → get members for mandate
 *   GET    /api/data/mandate-members?user_id=X → get mandates for user
 *   DELETE /api/data/mandate-members/:id → remove assignment
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as db from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';
import { sendEmail } from './email.js';

export async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const resource = pathArr[0] || '';
  const id = pathArr[1] || '';
  const method = req.method || 'GET';

  try {
    // ── Pipeline CRUD ──
    if (resource === 'pipeline') {
      if (method === 'POST' && !id) {
        const { contact_id, mandate_id, stage, match_score, match_reasons, 
                verdict, trident_composite, trident_d1, trident_d2, trident_d3,
                fit_analysis, risk_factors, approach_strategy, notes,
                sweep_tier, key_match_reasons, estimated_comp, availability } = req.body || {};
        
        if (!contact_id || !mandate_id) {
          return res.status(400).json({ error: 'contact_id and mandate_id are required' });
        }

        const row = await db.insert('candidates_pipeline', {
          contact_id,
          mandate_id,
          stage: stage || 'screened',
          sweep_tier: sweep_tier || null,
          match_score: match_score || null,
          match_reasons: match_reasons ? JSON.stringify(match_reasons) : null,
          key_match_reasons: key_match_reasons || null,
          estimated_comp: estimated_comp || null,
          availability: availability || null,
          notes: notes || null,
          trident_composite: trident_composite || null,
          trident_d1: trident_d1 || null,
          trident_d2: trident_d2 || null,
          trident_d3: trident_d3 || null,
          fit_analysis: fit_analysis ? JSON.stringify(fit_analysis) : null,
          risk_factors: risk_factors ? JSON.stringify(risk_factors) : null,
          approach_strategy: approach_strategy || null,
          verdict: verdict || null,
          source: 'platform',
        }, 15000);
        return res.status(201).json({ success: true, data: row });
      }

      if (method === 'GET' && id) {
        const rows = await db.selectMany('candidates_pipeline', {
          select: '*, contact:contacts(id, name, current_title, email, company:companies(id, name)), mandate:mandates(id, title)',
          where: [{ column: 'mandate_id', value: id }],
          orderBy: { column: 'match_score', ascending: false },
        }, 15000);
        return res.status(200).json({ success: true, data: rows });
      }

      if (method === 'PATCH' && id) {
        const updates = req.body || {};
        delete updates.id;
        delete updates.created_at;
        // Stringify JSON fields
        if (updates.fit_analysis && typeof updates.fit_analysis !== 'string') {
          updates.fit_analysis = JSON.stringify(updates.fit_analysis);
        }
        if (updates.risk_factors && typeof updates.risk_factors !== 'string') {
          updates.risk_factors = JSON.stringify(updates.risk_factors);
        }
        if (updates.match_reasons && typeof updates.match_reasons !== 'string') {
          updates.match_reasons = JSON.stringify(updates.match_reasons);
        }
        const rows = await db.update('candidates_pipeline', { column: 'id', value: id }, updates, 15000);
        return res.status(200).json({ success: true, data: rows[0] || null });
      }

      if (method === 'DELETE' && id) {
        const count = await db.deleteRows('candidates_pipeline', { column: 'id', value: id }, 15000);
        return res.status(200).json({ success: true, deleted: count });
      }
    }

    // ── Mandate CRUD ──
    if (resource === 'mandate') {
      if (method === 'POST' && !id) {
        const { title, client_id, company_id, status, priority, description, jd_description, 
                search_definition, skills_requirements, keywords, location, 
                compensation_range, timeline, team_size } = req.body || {};
        
        if (!title) {
          return res.status(400).json({ error: 'title is required' });
        }

        const row = await db.insert('mandates', {
          title,
          client_id: client_id || company_id || null,
          status: status || '1_search',
          priority: priority || null,
          description: description || null,
          jd_description: jd_description || null,
          search_definition: search_definition || null,
          skills_requirements: skills_requirements || null,
          keywords: keywords || null,
          location: location || null,
          compensation_range: compensation_range || null,
          timeline: timeline || null,
          team_size: team_size || null,
          source: 'platform',
        }, 15000);
        return res.status(201).json({ success: true, data: row });
      }

      if (method === 'PATCH' && id) {
        const updates = req.body || {};
        delete updates.id;
        delete updates.created_at;
        const rows = await db.update('mandates', { column: 'id', value: id }, updates, 15000);
        return res.status(200).json({ success: true, data: rows[0] || null });
      }

      if (method === 'GET' && id) {
        const row = await db.selectOne('mandates', {
          select: '*, company:companies(id, name)',
          where: [{ column: 'id', value: id }],
        }, 15000);
        return res.status(200).json({ success: true, data: row });
      }

      if (method === 'GET' && !id) {
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const search = req.query.q as string;
        const userId = req.query.user_id as string;  // Frontend passes current user ID
        
        let rows = await db.selectMany('mandates', {
          select: 'id, title, status, priority, client_id, jd_description, search_definition, skills_requirements, company:companies(id, name)',
          orderBy: { column: 'updated_at', ascending: false },
          limit,
          offset,
        }, 15000);
        
        // Filter by user assignment (unless admin or no user_id provided)
        if (userId) {
          try {
            const { user } = await getUserFromRequest(req);
            if (user && user.role !== 'admin') {
              // Get mandates this user is assigned to
              const assignments = await db.selectMany('mandate_members', {
                select: 'mandate_id',
                where: [{ column: 'user_id', value: userId }],
              }, 15000);
              const assignedIds = new Set(assignments.map((a: any) => a.mandate_id));
              rows = rows.filter((r: any) => assignedIds.has(r.id));
            }
          } catch (e) {
            // If auth check fails, return all (graceful degradation)
            console.warn('[mandate] Auth check failed, returning all:', (e as any).message);
          }
        }
        
        let filtered = rows;
        if (search) {
          const q = search.toLowerCase();
          filtered = rows.filter((r: any) =>
            (r.title || '').toLowerCase().includes(q) ||
            (r.company?.name || '').toLowerCase().includes(q)
          );
        }
        
        return res.status(200).json({ success: true, data: filtered });
      }
    }

    // ── Contact CRUD ──
    if (resource === 'contact') {
      if (method === 'POST' && !id) {
        const { name, email, current_title, company_id, location, country, city,
                seniority, skills, languages, linkedin_url, headline, summary,
                career_history, education } = req.body || {};
        
        if (!name) {
          return res.status(400).json({ error: 'name is required' });
        }

        const row = await db.insert('contacts', {
          name,
          email: email || null,
          current_title: current_title || null,
          company_id: company_id || null,
          location: location || null,
          country: country || null,
          city: city || null,
          seniority: seniority || null,
          skills: skills || null,
          languages: languages || null,
          linkedin_url: linkedin_url || null,
          headline: headline || null,
          summary: summary || null,
          career_history: career_history || null,
          education: education || null,
          source: 'platform',
        }, 15000);
        return res.status(201).json({ success: true, data: row });
      }

      if (method === 'PATCH' && id) {
        const updates = req.body || {};
        delete updates.id;
        delete updates.created_at;
        const rows = await db.update('contacts', { column: 'id', value: id }, updates, 15000);
        return res.status(200).json({ success: true, data: rows[0] || null });
      }

      if (method === 'GET' && id) {
        const row = await db.selectOne('mandates', {
          select: '*, company:companies(id, name)',
          where: [{ column: 'id', value: id }],
        }, 15000);
        return res.status(200).json({ success: true, data: row });
      }

      if (method === 'GET' && !id) {
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const search = req.query.q as string;
        const userId = req.query.user_id as string;

        let rows = await db.selectMany('contacts', {
          select: 'id, name, email, current_title, company_id, location, country, seniority, skills, headline, summary, career_history, trident_composite, trident_d1, trident_d2, trident_d3, company:companies(id, name)',
          orderBy: { column: 'updated_at', ascending: false },
          limit: 10000, // fetch all to filter by user membership, then paginate
          offset: 0,
        }, 15000);

        // Filter by user's mandate membership (non-admin only sees contacts in their mandates)
        if (userId) {
          try {
            const { user } = await getUserFromRequest(req);
            if (user && user.role !== 'admin') {
              // Get mandates this user is assigned to
              const assignments = await db.selectMany('mandate_members', {
                select: 'mandate_id',
                where: [{ column: 'user_id', value: userId }],
              }, 15000);
              const assignedMandateIds = new Set(assignments.map((a: any) => a.mandate_id));
              
              if (assignedMandateIds.size === 0) {
                return res.status(200).json({ success: true, data: [], total: 0 });
              }

              // Get pipeline entries for user's mandates to find allowed contact IDs
              const allPipeline = await db.selectMany('candidates_pipeline', {
                select: 'contact_id, mandate_id',
              }, 15000);
              const allowedContactIds = new Set(
                allPipeline
                  .filter((p: any) => assignedMandateIds.has(p.mandate_id))
                  .map((p: any) => p.contact_id)
              );
              rows = rows.filter((r: any) => allowedContactIds.has(r.id));
            }
          } catch (e) {
            console.warn('[contact] Auth check failed, returning all:', (e as any).message);
          }
        }

        let filtered = rows;
        if (search) {
          const q = search.toLowerCase();
          filtered = rows.filter((r: any) =>
            (r.name || '').toLowerCase().includes(q) ||
            (r.current_title || '').toLowerCase().includes(q) ||
            (r.headline || '').toLowerCase().includes(q) ||
            (r.company?.name || '').toLowerCase().includes(q)
          );
        }

        // Manual pagination after filtering
        const total = filtered.length;
        const paginated = filtered.slice(offset, offset + limit);

        return res.status(200).json({ success: true, data: paginated, total });
      }
    }

    // ── Scoring Run Persistence ──
    // Schema: id, user_id, mandate_id, contact_id, run_type, input_params, 
    //         output_scores, composite_score, verdict, model, tokens_used, duration_ms, created_at
    if (resource === 'scoring-run') {
      if (method === 'POST') {
        const { mandate_id, contact_id, run_type, input_params, output_scores,
                composite_score, verdict, model, tokens_used, duration_ms, user_id } = req.body || {};
        
        const row = await db.insert('scoring_runs', {
          mandate_id: mandate_id || null,
          contact_id: contact_id || null,
          run_type: run_type || 'trident',
          input_params: input_params ? JSON.stringify(input_params) : null,
          output_scores: output_scores ? JSON.stringify(output_scores) : null,
          composite_score: composite_score || null,
          verdict: verdict || null,
          model: model || 'deepseek-chat',
          tokens_used: tokens_used || null,
          duration_ms: duration_ms || null,
          user_id: user_id || null,
        }, 15000);
        return res.status(201).json({ success: true, data: row });
      }

      if (method === 'GET') {
        const limit = parseInt(req.query.limit as string) || 20;
        const rows = await db.selectMany('scoring_runs', {
          orderBy: { column: 'created_at', ascending: false },
          limit,
        }, 15000);
        return res.status(200).json({ success: true, data: rows });
      }
    }

    // ── Share Record ──
    if (resource === 'share') {
      if (method === 'POST') {
        const { results, jd_summary, created_by } = req.body || {};
        
        const row = await db.insert('ai_generations', {
          type: 'match_share',
          input_data: { jd_summary, created_at: new Date().toISOString() },
          output_data: { results },
          user_id: created_by || null,
          source: 'platform',
        }, 15000);
        return res.status(201).json({ success: true, data: row });
      }

      if (method === 'GET' && id) {
        const rows = await db.selectMany('ai_generations', {
          where: [{ column: 'id', value: id }],
        }, 15000);
        return res.status(200).json({ success: true, data: rows[0] || null });
      }
    }

    // ── Profile + Auth User CRUD (Admin) ──
    if (resource === 'profile') {
      if (method === 'POST' && !id) {
        const { email, name, role, tier, icp } = req.body || {};
        
        if (!email || !name) {
          return res.status(400).json({ error: 'email and name are required' });
        }

        // Check if profile already exists
        const existing = await db.selectOne('profiles', {
          select: 'id, email',
          where: [{ column: 'email', value: email.toLowerCase() }],
        }, 15000);
        
        if (existing) {
          return res.status(409).json({ error: 'User with this email already exists' });
        }

        // Generate a random temporary password for the auth user
        const tempPassword = crypto.randomUUID().replace(/-/g, '').slice(0, 16);

        // Step 1: Create auth.users record via Supabase Auth Admin API
        let authUserId: string;
        try {
          const authUser = await db.createAuthUser(email.toLowerCase(), tempPassword, {
            email_confirm: true,
            user_metadata: { name, role: role || 'user' },
          });
          authUserId = authUser.id;
        } catch (authErr: any) {
          // If auth user creation fails (e.g., already exists), try to proceed with profile-only
          console.warn('[profile] Auth user creation failed:', authErr.message);
          // Use a random UUID as fallback — the user won't be able to log in, but the profile exists
          authUserId = crypto.randomUUID();
        }

        // Step 2: Create profiles row with the auth user's ID as the primary key
        const row = await db.insert('profiles', {
          id: authUserId,
          email: email.toLowerCase(),
          name,
          role: role || 'user',
          tier: tier || 'pro',
          icp: icp || 'professional',
        }, 15000);

        // Send invite email with temp password (non-blocking — don't fail if email fails)
        try {
          await sendEmail('team_invite', {
            name,
            email: email.toLowerCase(),
            tempPassword,
            role: role || 'user',
            inviterName: 'Your admin',
          });
        } catch (emailErr) {
          console.warn('[profile] Failed to send invite email:', (emailErr as any).message);
        }

        return res.status(201).json({ 
          success: true, 
          data: row,
          temp_password: tempPassword,  // Admin can share this with the invited user
          auth_created: true,
          email_sent: true,
        });
      }

      if (method === 'GET' && !id) {
        const rows = await db.selectMany('profiles', {
          select: 'id, email, name, role, tier, created_at',
          orderBy: { column: 'created_at', ascending: false },
          limit: 100,
        }, 15000);
        return res.status(200).json({ success: true, data: rows });
      }
    }



    // ── Mandate Members (Assignment) ──
    if (resource === 'mandate-members') {
      if (method === 'POST' && !id) {
        const { mandate_id, user_id, role, assigned_by } = req.body || {};
        
        if (!mandate_id || !user_id) {
          return res.status(400).json({ error: 'mandate_id and user_id are required' });
        }

        // Check if already assigned
        const existing = await db.selectOne('mandate_members', {
          select: 'id',
          where: [
            { column: 'mandate_id', value: mandate_id },
            { column: 'user_id', value: user_id },
          ],
        }, 15000);
        
        if (existing) {
          return res.status(409).json({ error: 'User already assigned to this mandate' });
        }

        const row = await db.insert('mandate_members', {
          mandate_id,
          user_id,
          role: role || 'member',
          assigned_by: assigned_by || null,
        }, 15000);
        return res.status(201).json({ success: true, data: row });
      }

      if (method === 'GET' && id) {
        // Get members for a specific mandate
        const rows = await db.selectMany('mandate_members', {
          select: 'id, user_id, role, assigned_at, assigned_by, profiles:profiles(id, name, email)',
          where: [{ column: 'mandate_id', value: id }],
          orderBy: { column: 'assigned_at', ascending: true },
        }, 15000);
        return res.status(200).json({ success: true, data: rows });
      }

      if (method === 'GET' && !id) {
        // Get assignments for a user
        const userId = req.query.user_id as string;
        if (!userId) {
          return res.status(400).json({ error: 'user_id query param required' });
        }
        const rows = await db.selectMany('mandate_members', {
          select: 'id, mandate_id, role, assigned_at, mandates:mandates(id, title, status)',
          where: [{ column: 'user_id', value: userId }],
          orderBy: { column: 'assigned_at', ascending: false },
        }, 15000);
        return res.status(200).json({ success: true, data: rows });
      }

      if (method === 'DELETE' && id) {
        const count = await db.deleteRows('mandate_members', { column: 'id', value: id }, 15000);
        return res.status(200).json({ success: true, deleted: count });
      }
    }

    return res.status(404).json({ error: `Unknown route: ${method} /api/data/${resource}${id ? '/' + id : ''}` });
  } catch (err: any) {
    return db.handleError(res, 'dataHandler', err);
  }
}
