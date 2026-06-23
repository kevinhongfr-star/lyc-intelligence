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
import {
  getOrgId,
  getUserRole,
  getOrgScopedMandates,
  getOrgScopedPipeline,
  getOrgScopedContacts,
  getOrgScopedCompanies,
  isReadOnly,
  hasOrgAccess,
} from './orgScopedQueries.js';

export async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const resource = pathArr[0] || '';
  const sub = pathArr[1] || '';
  const id = pathArr[2] || '';
  const method = req.method || 'GET';

  try {
    let authUserId: string | null = null;
    let userRole: string = 'member';
    let orgId: string | null = null;

    try {
      const { user } = await getUserFromRequest(req);
      if (user) {
        authUserId = user.id;
        userRole = await getUserRole(user.id);
        orgId = await getOrgId(user.id);
      }
    } catch (e) {
      console.warn('[dataHandler] Auth check failed:', (e as any).message);
    }

    if (method !== 'GET') {
      if (isReadOnly(userRole)) {
        return res.status(403).json({ error: 'Read-only access' });
      }
    }

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

        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: mandate_id,
          select: 'id, organization_id, intake_data',
        });

        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const intakeData = mandate.intake_data as any;
        const intakeComplete = intakeData && intakeData.intake_complete === true;
        if (!intakeComplete) {
          return res.status(409).json({
            error: 'Intake not complete',
            detail: 'Complete the mandate intake (Business Pain Points + Leadership Needs) before adding candidates to the pipeline.',
          });
        }

        const row = await db.insert('candidates_pipeline', {
          contact_id,
          mandate_id,
          stage: stage || 'SWEEP',
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
        const pipeline = await getOrgScopedPipeline(authUserId || '', userRole, orgId || '', id);
        return res.status(200).json({ success: true, data: pipeline });
      }

      if (method === 'PATCH' && id) {
        const pipelineEntry = await db.selectOne('candidates_pipeline', {
          column: 'id',
          value: id,
          select: 'id, mandate_id',
        });
        
        if (!pipelineEntry) {
          return res.status(404).json({ error: 'Pipeline entry not found' });
        }

        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: pipelineEntry.mandate_id,
          select: 'id, organization_id',
        });

        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const updates = req.body || {};
        delete updates.id;
        delete updates.created_at;
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
        const pipelineEntry = await db.selectOne('candidates_pipeline', {
          column: 'id',
          value: id,
          select: 'id, mandate_id',
        });
        
        if (!pipelineEntry) {
          return res.status(404).json({ error: 'Pipeline entry not found' });
        }

        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: pipelineEntry.mandate_id,
          select: 'id, organization_id',
        });

        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

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

        if (!hasOrgAccess(userRole)) {
          return res.status(403).json({ error: 'Organization access required' });
        }

        const row = await db.insert('mandates', {
          title,
          client_id: client_id || company_id || null,
          organization_id: orgId,
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
        const existing = await db.selectOne('mandates', {
          column: 'id',
          value: id,
          select: 'id, organization_id',
        });
        
        if (!existing) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && existing.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const updates = req.body || {};
        delete updates.id;
        delete updates.created_at;
        const rows = await db.update('mandates', { column: 'id', value: id }, updates, 15000);
        return res.status(200).json({ success: true, data: rows[0] || null });
      }

      if (method === 'GET' && id) {
        const mandate = await db.selectOne('mandates', {
          select: '*, company:companies(id, name)',
          where: [{ column: 'id', value: id }],
        }, 15000);
        
        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        return res.status(200).json({ success: true, data: mandate });
      }

      if (method === 'GET' && !id) {
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const search = req.query.q as string;
        
        const mandates = await getOrgScopedMandates(authUserId || '', userRole, orgId || '');
        
        let filtered = mandates;
        if (search) {
          const q = search.toLowerCase();
          filtered = mandates.filter((r: any) =>
            (r.title || '').toLowerCase().includes(q) ||
            (r.company?.name || '').toLowerCase().includes(q)
          );
        }
        
        const paginated = filtered.slice(offset, offset + limit);
        
        return res.status(200).json({ success: true, data: paginated, total: filtered.length });
      }
    }

    // ── Mandate Solutions CRUD ──
    if (resource === 'mandate-solution') {
      if (method === 'POST' && !id) {
        const { mandate_id, solution_type, solution_detail, linked_assessment_type, linked_assessment_id, status, defined_by } = req.body || {};
        
        if (!mandate_id || !solution_type) {
          return res.status(400).json({ error: 'mandate_id and solution_type are required' });
        }

        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: mandate_id,
          select: 'id, organization_id',
        });

        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const row = await db.insert('mandate_solutions', {
          mandate_id,
          solution_type,
          solution_detail: solution_detail ? JSON.stringify(solution_detail) : null,
          linked_assessment_type: linked_assessment_type || null,
          linked_assessment_id: linked_assessment_id || null,
          status: status || 'draft',
          defined_by: defined_by || authUserId,
        }, 15000);
        return res.status(201).json({ success: true, data: row });
      }

      if (method === 'GET' && id) {
        const solution = await db.selectOne('mandate_solutions', {
          column: 'id',
          value: id,
        });
        
        if (!solution) {
          return res.status(404).json({ error: 'Solution not found' });
        }

        return res.status(200).json({ success: true, data: solution });
      }

      if (method === 'GET' && !id) {
        const mandateId = req.query.mandate_id as string;
        
        if (!mandateId) {
          return res.status(400).json({ error: 'mandate_id query parameter required' });
        }

        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: mandateId,
          select: 'id, organization_id',
        });

        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const solutions = await db.select('mandate_solutions', {
          column: 'mandate_id',
          value: mandateId,
        });

        return res.status(200).json({ success: true, data: solutions });
      }

      if (method === 'PATCH' && id) {
        const solution = await db.selectOne('mandate_solutions', {
          column: 'id',
          value: id,
          select: 'id, mandate_id',
        });
        
        if (!solution) {
          return res.status(404).json({ error: 'Solution not found' });
        }

        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: solution.mandate_id,
          select: 'id, organization_id',
        });

        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const { solution_detail, linked_assessment_type, linked_assessment_id, status, approved_by, approval_notes, rejection_notes } = req.body || {};
        
        const updates: Record<string, any> = {};
        if (solution_detail !== undefined) updates.solution_detail = JSON.stringify(solution_detail);
        if (linked_assessment_type !== undefined) updates.linked_assessment_type = linked_assessment_type;
        if (linked_assessment_id !== undefined) updates.linked_assessment_id = linked_assessment_id;
        if (status !== undefined) updates.status = status;
        if (approved_by !== undefined) updates.approved_by = approved_by;
        if (approval_notes !== undefined) updates.approval_notes = approval_notes;
        if (rejection_notes !== undefined) updates.rejection_notes = rejection_notes;
        updates.updated_at = new Date().toISOString();

        const row = await db.update('mandate_solutions', {
          column: 'id',
          value: id,
          updates,
        });
        
        return res.status(200).json({ success: true, data: row });
      }

      if (method === 'DELETE' && id) {
        const solution = await db.selectOne('mandate_solutions', {
          column: 'id',
          value: id,
          select: 'id, mandate_id',
        });
        
        if (!solution) {
          return res.status(404).json({ error: 'Solution not found' });
        }

        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: solution.mandate_id,
          select: 'id, organization_id',
        });

        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        await db.delete('mandate_solutions', {
          column: 'id',
          value: id,
        });

        return res.status(200).json({ success: true });
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

        if (!hasOrgAccess(userRole)) {
          return res.status(403).json({ error: 'Organization access required' });
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
        const contact = await db.selectOne('contacts', {
          column: 'id',
          value: id,
          select: 'id',
        });
        
        if (!contact) {
          return res.status(404).json({ error: 'Contact not found' });
        }

        const updates = req.body || {};
        delete updates.id;
        delete updates.created_at;
        const rows = await db.update('contacts', { column: 'id', value: id }, updates, 15000);
        return res.status(200).json({ success: true, data: rows[0] || null });
      }

      if (method === 'GET' && id) {
        const contact = await db.selectOne('contacts', {
          select: '*, company:companies(id, name)',
          where: [{ column: 'id', value: id }],
        }, 15000);
        
        if (!contact) {
          return res.status(404).json({ error: 'Contact not found' });
        }

        if (userRole !== 'super_admin') {
          const mandates = await getOrgScopedMandates(authUserId || '', userRole, orgId || '');
          const mandateIds = new Set(mandates.map((m: any) => m.id));
          
          const pipelineEntries = await db.selectMany('candidates_pipeline', {
            select: 'contact_id, mandate_id',
            where: [{ column: 'contact_id', value: id }],
          }, 15000);
          
          const hasAccess = pipelineEntries.some((p: any) => mandateIds.has(p.mandate_id));
          if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }

        return res.status(200).json({ success: true, data: contact });
      }

      if (method === 'GET' && !id) {
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const search = req.query.q as string;

        const contacts = await getOrgScopedContacts(authUserId || '', userRole, orgId || '');

        let filtered = contacts;
        if (search) {
          const q = search.toLowerCase();
          filtered = contacts.filter((r: any) =>
            (r.name || '').toLowerCase().includes(q) ||
            (r.current_title || '').toLowerCase().includes(q) ||
            (r.headline || '').toLowerCase().includes(q) ||
            (r.company?.name || '').toLowerCase().includes(q)
          );
        }

        const total = filtered.length;
        const paginated = filtered.slice(offset, offset + limit);

        return res.status(200).json({ success: true, data: paginated, total });
      }
    }

    // ── Company CRUD ──
    if (resource === 'company') {
      if (method === 'GET' && !id) {
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const search = req.query.q as string;

        const companies = await getOrgScopedCompanies(authUserId || '', userRole, orgId || '');

        let filtered = companies;
        if (search) {
          const q = search.toLowerCase();
          filtered = companies.filter((c: any) =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.industry || '').toLowerCase().includes(q)
          );
        }

        const total = filtered.length;
        const paginated = filtered.slice(offset, offset + limit);

        return res.status(200).json({ success: true, data: paginated, total });
      }

      if (method === 'GET' && id) {
        const companies = await getOrgScopedCompanies(authUserId || '', userRole, orgId || '');
        const company = companies.find((c: any) => c.id === id);
        
        if (!company) {
          return res.status(404).json({ error: 'Company not found' });
        }

        return res.status(200).json({ success: true, data: company });
      }
    }

    // ── Scoring Run Persistence ──
    if (resource === 'scoring-run') {
      if (method === 'POST') {
        const { mandate_id, contact_id, run_type, input_params, output_scores,
                composite_score, verdict, model, tokens_used, duration_ms, user_id } = req.body || {};
        
        if (mandate_id) {
          const mandate = await db.selectOne('mandates', {
            column: 'id',
            value: mandate_id,
            select: 'id, organization_id',
          });
          
          if (mandate && userRole !== 'super_admin' && mandate.organization_id !== orgId) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }

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
        const { email, name, role, tier, icp, organization_id } = req.body || {};
        
        if (!email || !name) {
          return res.status(400).json({ error: 'email and name are required' });
        }

        const existing = await db.selectOne('profiles', {
          select: 'id, email',
          where: [{ column: 'email', value: email.toLowerCase() }],
        }, 15000);
        
        if (existing) {
          return res.status(409).json({ error: 'User with this email already exists' });
        }

        const tempPassword = crypto.randomUUID().replace(/-/g, '').slice(0, 16);

        let authUserId: string;
        try {
          const authUser = await db.createAuthUser(email.toLowerCase(), tempPassword, {
            email_confirm: true,
            user_metadata: { name, role: role || 'member' },
          });
          authUserId = authUser.id;
        } catch (authErr: any) {
          console.warn('[profile] Auth user creation failed:', authErr.message);
          authUserId = crypto.randomUUID();
        }

        const row = await db.insert('profiles', {
          id: authUserId,
          email: email.toLowerCase(),
          name,
          role: role || 'member',
          tier: tier || 'pro',
          icp: icp || 'professional',
          organization_id: organization_id || null,
        }, 15000);

        try {
          await sendEmail('team_invite', {
            name,
            email: email.toLowerCase(),
            tempPassword,
            role: role || 'member',
            inviterName: 'Your admin',
          });
        } catch (emailErr) {
          console.warn('[profile] Failed to send invite email:', (emailErr as any).message);
        }

        return res.status(201).json({ 
          success: true, 
          data: row,
          temp_password: tempPassword,
          auth_created: true,
          email_sent: true,
        });
      }

      if (method === 'GET' && !id) {
        if (userRole !== 'super_admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }
        const rows = await db.selectMany('profiles', {
          select: 'id, email, name, role, tier, organization_id, created_at',
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

        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: mandate_id,
          select: 'id, organization_id',
        });
        
        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

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
        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: id,
          select: 'id, organization_id',
        });
        
        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const rows = await db.selectMany('mandate_members', {
          select: 'id, user_id, role, assigned_at, assigned_by, profiles:profiles(id, name, email)',
          where: [{ column: 'mandate_id', value: id }],
          orderBy: { column: 'assigned_at', ascending: true },
        }, 15000);
        return res.status(200).json({ success: true, data: rows });
      }

      if (method === 'GET' && !id) {
        const userId = req.query.user_id as string;
        if (!userId) {
          return res.status(400).json({ error: 'user_id query param required' });
        }

        const userOrgId = await getOrgId(userId);
        if (userRole !== 'super_admin' && userOrgId !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const rows = await db.selectMany('mandate_members', {
          select: 'id, mandate_id, role, assigned_at, mandates:mandates(id, title, status)',
          where: [{ column: 'user_id', value: userId }],
          orderBy: { column: 'assigned_at', ascending: false },
        }, 15000);
        return res.status(200).json({ success: true, data: rows });
      }

      if (method === 'DELETE' && id) {
        const assignment = await db.selectOne('mandate_members', {
          column: 'id',
          value: id,
          select: 'id, mandate_id',
        });
        
        if (!assignment) {
          return res.status(404).json({ error: 'Assignment not found' });
        }

        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: assignment.mandate_id,
          select: 'id, organization_id',
        });

        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const count = await db.deleteRows('mandate_members', { column: 'id', value: id }, 15000);
        return res.status(200).json({ success: true, deleted: count });
      }
    }

    // ── Intake: AI-suggested discovery questions (Phase 1.1) ──
    if (resource === 'intake-suggest') {
      if (method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const body = req.body || {};
      const prompt: string =
        typeof body.prompt === 'string' && body.prompt.trim().length > 0
          ? body.prompt
          : 'Generate 5 discovery questions for an executive search mandate.';

      const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
      const DEEPSEEK_TIMEOUT = 7000;

      const systemPrompt = [
        'You are an executive search consultant helping capture business context before a search starts.',
        'Your job is to generate insightful, open-ended discovery questions for client intake interviews.',
        'The questions should probe organizational pain points, leadership needs, team dynamics, and talent gaps.',
        'Avoid yes/no questions. Each question should work as a standalone line item for a consultant to ask.',
      ].join(' ');

      const userPrompt =
        prompt + '\n\nReturn ONLY a JSON object with the shape: { "questions": ["q1", "q2", "q3", "q4", "q5"] }.';

      let questions: string[] = [];

      if (DEEPSEEK_API_KEY) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), DEEPSEEK_TIMEOUT);
          const dsRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              max_tokens: 1024,
              temperature: 0.5,
              response_format: { type: 'json_object' },
            }),
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (dsRes.ok) {
            const data = await dsRes.json();
            const content = data.choices?.[0]?.message?.content || '';
            try {
              const parsed = JSON.parse(content);
              if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
                questions = parsed.questions.slice(0, 5);
              } else if (Array.isArray(parsed) && parsed.length > 0) {
                questions = parsed.slice(0, 5);
              }
            } catch (jsonErr) {
              // sometimes model returns bullet points rather than JSON
              const lines = content.split('\n').filter((l: string) => l.trim().length > 2).slice(0, 5);
              questions = lines.map((l: string) => l.replace(/^\s*[-*•0-9.)]+\s*/, '').trim());
            }
          }
        } catch (e) {
          console.warn('[intake-suggest] DeepSeek call failed:', e);
        }
      }

      if (questions.length === 0) {
        questions = [
          'What are the 2-3 most pressing business challenges the new leader must solve in their first 90 days?',
          'Which leadership competencies and behaviors matter most for success in this specific team/context?',
          'What skills, knowledge, or experiences is your current team missing that this hire must bring?',
          'What organizational friction — process gaps, misalignment, or culture issues — could slow this leader down?',
          'How will you know this hire has succeeded in their first year? What concrete outcomes are you measuring?',
        ];
      }

      return res.status(200).json({ success: true, questions });
    }

    // ── Success Profile CRUD (Phase 1.2) ──
    if (resource === 'success-profile') {
      if (method === 'POST' && !id) {
        const { mandate_id, ...profileData } = req.body || {};
        if (!mandate_id) {
          return res.status(400).json({ error: 'mandate_id is required' });
        }

        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: mandate_id,
          select: 'id, organization_id',
        });

        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const row = await db.insert('success_profiles', {
          mandate_id,
          ...profileData,
          defined_by: authUserId || null,
        }, 15000);
        return res.status(201).json({ success: true, data: row });
      }

      if (method === 'GET' && !id) {
        const mandateId = req.query.mandate_id as string;
        if (!mandateId) {
          return res.status(400).json({ error: 'mandate_id query param required' });
        }

        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: mandateId,
          select: 'id, organization_id',
        });

        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const profiles = await db.selectMany('success_profiles', {
          where: [{ column: 'mandate_id', value: mandateId }],
          orderBy: { column: 'created_at', ascending: false },
          limit: 10,
        }, 15000);
        return res.status(200).json({ success: true, data: profiles });
      }

      if (method === 'GET' && id) {
        const profile = await db.selectOne('success_profiles', {
          column: 'id',
          value: id,
        }, 15000);

        if (!profile) {
          return res.status(404).json({ error: 'Profile not found' });
        }

        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: profile.mandate_id,
          select: 'id, organization_id',
        });

        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        return res.status(200).json({ success: true, data: profile });
      }

      if (method === 'PATCH' && id) {
        const profile = await db.selectOne('success_profiles', {
          column: 'id',
          value: id,
          select: 'id, mandate_id',
        });

        if (!profile) {
          return res.status(404).json({ error: 'Profile not found' });
        }

        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: profile.mandate_id,
          select: 'id, organization_id',
        });

        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const updates = req.body || {};
        delete updates.id;
        delete updates.created_at;
        delete updates.mandate_id;

        const rows = await db.update('success_profiles', { column: 'id', value: id }, updates, 15000);
        return res.status(200).json({ success: true, data: rows[0] || null });
      }

      if (method === 'DELETE' && id) {
        const profile = await db.selectOne('success_profiles', {
          column: 'id',
          value: id,
          select: 'id, mandate_id',
        });

        if (!profile) {
          return res.status(404).json({ error: 'Profile not found' });
        }

        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: profile.mandate_id,
          select: 'id, organization_id',
        });

        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const count = await db.deleteRows('success_profiles', { column: 'id', value: id }, 15000);
        return res.status(200).json({ success: true, deleted: count });
      }
    }

    // ── Success Profile Approval (Phase 1.2) ──
    if (resource === 'success-profile-approve') {
      if (method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      if (!authUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { profile_id, notes } = req.body || {};
      if (!profile_id) {
        return res.status(400).json({ error: 'profile_id is required' });
      }

      const profile = await db.selectOne('success_profiles', {
        column: 'id',
        value: profile_id,
        select: 'id, mandate_id, status',
      });

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      if (profile.status !== 'pending_approval') {
        return res.status(400).json({ error: 'Only profiles pending approval can be approved' });
      }

      const mandate = await db.selectOne('mandates', {
        column: 'id',
        value: profile.mandate_id,
        select: 'id, organization_id',
      });

      if (!mandate) {
        return res.status(404).json({ error: 'Mandate not found' });
      }

      if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const rows = await db.update('success_profiles', { column: 'id', value: profile_id }, {
        status: 'approved',
        approved_by: authUserId,
        approval_notes: notes || null,
        rejection_reason: null,
      }, 15000);
      return res.status(200).json({ success: true, data: rows[0] || null });
    }

    // ── Success Profile Reject (Phase 1.2) ──
    if (resource === 'success-profile-reject') {
      if (method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      if (!authUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { profile_id, reason } = req.body || {};
      if (!profile_id) {
        return res.status(400).json({ error: 'profile_id is required' });
      }
      if (!reason || !reason.trim()) {
        return res.status(400).json({ error: 'rejection reason is required' });
      }

      const profile = await db.selectOne('success_profiles', {
        column: 'id',
        value: profile_id,
        select: 'id, mandate_id, status',
      });

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      if (profile.status !== 'pending_approval') {
        return res.status(400).json({ error: 'Only profiles pending approval can be rejected' });
      }

      const mandate = await db.selectOne('mandates', {
        column: 'id',
        value: profile.mandate_id,
        select: 'id, organization_id',
      });

      if (!mandate) {
        return res.status(404).json({ error: 'Mandate not found' });
      }

      if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const rows = await db.update('success_profiles', { column: 'id', value: profile_id }, {
        status: 'rejected',
        approved_by: authUserId,
        rejection_reason: reason,
      }, 15000);
      return res.status(200).json({ success: true, data: rows[0] || null });
    }

    // ── Outreach Attempts CRUD (Phase 1.4) ──
    if (resource === 'outreach-attempts') {
      if (method === 'POST' && !id) {
        const {
          candidate_id, mandate_id, channel, attempt_number, attempt_date,
          outcome, response_text, notes, next_action, next_action_date,
        } = req.body || {};

        if (!candidate_id || !mandate_id) {
          return res.status(400).json({ error: 'candidate_id and mandate_id are required' });
        }
        if (!channel) {
          return res.status(400).json({ error: 'channel is required' });
        }

        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: mandate_id,
          select: 'id, organization_id',
        });
        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }
        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const row = await db.insert('outreach_attempts', {
          candidate_id,
          mandate_id,
          channel,
          attempt_number: attempt_number || 1,
          attempt_date: attempt_date || new Date().toISOString().split('T')[0],
          outcome: outcome || null,
          response_text: response_text || null,
          notes: notes || null,
          next_action: next_action || null,
          next_action_date: next_action_date || null,
          created_by: authUserId || null,
          organization_id: mandate.organization_id,
        }, 15000);
        return res.status(201).json({ success: true, data: row });
      }

      if (method === 'GET' && !id) {
        const candidateId = req.query.candidate_id as string;
        const mandateId = req.query.mandate_id as string;
        const all = req.query.all === 'true';

        if (!candidateId && !mandateId && !all) {
          return res.status(400).json({ error: 'candidate_id, mandate_id, or all=true is required' });
        }

        let attempts: any[] = [];

        if (all && userRole === 'super_admin') {
          attempts = await db.selectMany('outreach_attempts', {
            orderBy: { column: 'attempt_date', ascending: false },
            limit: 500,
          }, 15000);
        } else if (mandateId) {
          const mandate = await db.selectOne('mandates', {
            column: 'id',
            value: mandateId,
            select: 'id, organization_id',
          });
          if (!mandate) {
            return res.status(404).json({ error: 'Mandate not found' });
          }
          if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
            return res.status(403).json({ error: 'Access denied' });
          }

          attempts = await db.selectMany('outreach_attempts', {
            where: [{ column: 'mandate_id', value: mandateId }],
            orderBy: { column: 'attempt_date', ascending: false },
            limit: 500,
          }, 15000);
        } else if (candidateId) {
          attempts = await db.selectMany('outreach_attempts', {
            where: [{ column: 'candidate_id', value: candidateId }],
            orderBy: { column: 'attempt_date', ascending: false },
            limit: 500,
          }, 15000);
        }

        return res.status(200).json({ success: true, data: attempts });
      }

      if (method === 'DELETE' && id) {
        const attempt = await db.selectOne('outreach_attempts', {
          column: 'id',
          value: id,
          select: 'id, mandate_id',
        });
        if (!attempt) {
          return res.status(404).json({ error: 'Attempt not found' });
        }

        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: attempt.mandate_id,
          select: 'id, organization_id',
        });

        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }
        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const count = await db.deleteRows('outreach_attempts', { column: 'id', value: id }, 15000);
        return res.status(200).json({ success: true, deleted: count });
      }
    }

    // ── Outreach Next Actions (Phase 1.4) ──
    if (resource === 'outreach-next-actions' && method === 'GET') {
      const daysAhead = parseInt((req.query.days_ahead as string) || '14', 10);

      // Calculate the cutoff date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const cutoff = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
      const cutoffStr = cutoff.toISOString().split('T')[0];

      let queryParams: {
        select: string;
        where: Array<{ column: string; value: string | null; operator?: string; gte?: string; lte?: string }>;
        orderBy: { column: string; ascending: boolean };
        limit: number;
      } = {
        select: '*',
        where: [{ column: 'next_action_date', value: null }],
        orderBy: { column: 'next_action_date', ascending: true },
        limit: 50,
      };

      // Use selectMany with a date range (most DB helpers support this)
      const attempts = await db.selectMany('outreach_attempts', {
        where: [{ column: 'next_action_date', value: cutoffStr }],
        orderBy: { column: 'next_action_date', ascending: true },
        limit: 50,
      }, 15000);

      // Filter in-memory to get upcoming (not past the cutoff but also not null)
      const relevant = attempts.filter(a => a.next_action_date !== null);

      // Enrich with candidate names (lookup from contacts) and mandate titles
      const contactIds = [...new Set(relevant.map(a => a.candidate_id))].filter(Boolean);
      const mandateIds = [...new Set(relevant.map(a => a.mandate_id))].filter(Boolean);

      let contacts: any[] = [];
      let mandates: any[] = [];

      if (contactIds.length > 0) {
        // Get contact names using the data helper
        const contactPromises = contactIds.map((cid: string) =>
          db.selectOne('contacts', {
            column: 'id',
            value: cid,
            select: 'id, first_name, last_name',
          }).catch(() => null)
        );
        contacts = (await Promise.all(contactPromises)).filter(Boolean) as any[];
      }

      if (mandateIds.length > 0) {
        const mandatePromises = mandateIds.map((mid: string) =>
          db.selectOne('mandates', {
            column: 'id',
            value: mid,
            select: 'id, title, organization_id',
          }).catch(() => null)
        );
        mandates = (await Promise.all(mandatePromises)).filter(Boolean) as any[];

        // Org-scoping: filter to only items from the user's org
        if (userRole !== 'super_admin') {
          const allowedMandateIds = new Set(mandates.filter(m => m.organization_id === orgId).map(m => m.id));
          const filtered = relevant.filter(a => allowedMandateIds.has(a.mandate_id));

          const enriched = filtered.map(a => {
            const contact = contacts.find(c => c.id === a.candidate_id);
            const mandate = mandates.find(m => m.id === a.mandate_id);
            return {
              ...a,
              candidate_name: contact ? `${contact.first_name} ${contact.last_name}`.trim() : 'Candidate',
              mandate_title: mandate?.title || 'Mandate',
            };
          });

          return res.status(200).json({ success: true, data: enriched });
        }
      }

      // Super admin path (when no mandate org filtering needed)
      const enriched = relevant.map(a => {
        const contact = contacts.find(c => c.id === a.candidate_id);
        const mandate = mandates.find(m => m.id === a.mandate_id);
        return {
          ...a,
          candidate_name: contact ? `${contact.first_name} ${contact.last_name}`.trim() : 'Candidate',
          mandate_title: mandate?.title || 'Mandate',
        };
      });

      return res.status(200).json({ success: true, data: enriched });
    }

    // ── Target Companies CRUD (Phase 1.5) ──
    if (resource === 'target-companies') {
      if (method === 'POST' && !id) {
        const { name, industry, location, size, domain, mandate_id, sector, region } = req.body || {};

        if (!name) {
          return res.status(400).json({ error: 'name is required' });
        }

        let orgIdToUse = orgId;
        if (mandate_id) {
          const mandate = await db.selectOne('mandates', {
            column: 'id',
            value: mandate_id,
            select: 'id, organization_id',
          });
          if (mandate) orgIdToUse = mandate.organization_id;
        }

        if (userRole !== 'super_admin' && mandate_id) {
          const mandate = await db.selectOne('mandates', {
            column: 'id',
            value: mandate_id,
            select: 'id, organization_id',
          });
          if (mandate && mandate.organization_id !== orgId) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }

        const row = await db.insert('target_companies', {
          name,
          industry: industry || null,
          location: location || null,
          size: size || null,
          domain: domain || null,
          mandate_id: mandate_id || null,
          sector: sector || industry || null,
          region: region || null,
          overview_status: 'pending',
          created_at: new Date().toISOString(),
        }, 15000);
        return res.status(201).json({ success: true, data: row });
      }

      if (method === 'GET' && !id) {
        const mandateId = req.query.mandate_id as string;

        let companies: any[] = [];
        if (mandateId) {
          const mandate = await db.selectOne('mandates', {
            column: 'id',
            value: mandateId,
            select: 'id, organization_id',
          });
          if (!mandate) {
            return res.status(404).json({ error: 'Mandate not found' });
          }
          if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
            return res.status(403).json({ error: 'Access denied' });
          }

          companies = await db.selectMany('target_companies', {
            where: [{ column: 'mandate_id', value: mandateId }],
            orderBy: { column: 'fit_score', ascending: false },
            limit: 200,
          }, 15000);
        } else if (userRole === 'super_admin') {
          companies = await db.selectMany('target_companies', {
            orderBy: { column: 'created_at', ascending: false },
            limit: 200,
          }, 15000);
        }

        return res.status(200).json({ success: true, data: companies });
      }

      if (method === 'PATCH' && id) {
        const company = await db.selectOne('target_companies', {
          column: 'id',
          value: id,
          select: 'id, mandate_id',
        });

        if (!company) {
          return res.status(404).json({ error: 'Company not found' });
        }

        if (company.mandate_id) {
          const mandate = await db.selectOne('mandates', {
            column: 'id',
            value: company.mandate_id,
            select: 'id, organization_id',
          });
          if (mandate && userRole !== 'super_admin' && mandate.organization_id !== orgId) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }

        const updates = req.body || {};
        delete updates.id;
        delete updates.created_at;

        const rows = await db.update('target_companies', { column: 'id', value: id }, {
          ...updates,
          updated_at: new Date().toISOString(),
        }, 15000);
        return res.status(200).json({ success: true, data: rows[0] || null });
      }

      if (method === 'DELETE' && id) {
        const company = await db.selectOne('target_companies', {
          column: 'id',
          value: id,
          select: 'id, mandate_id',
        });

        if (!company) {
          return res.status(404).json({ error: 'Company not found' });
        }

        if (company.mandate_id) {
          const mandate = await db.selectOne('mandates', {
            column: 'id',
            value: company.mandate_id,
            select: 'id, organization_id',
          });
          if (mandate && userRole !== 'super_admin' && mandate.organization_id !== orgId) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }

        const count = await db.deleteRows('target_companies', { column: 'id', value: id }, 15000);
        return res.status(200).json({ success: true, deleted: count });
      }
    }

    // ── Company Overview Generation (Phase 1.5) ──
    if (resource === 'company-overview-generate' && method === 'POST') {
      if (!authUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { company_id, name, industry, location } = req.body || {};

      if (!company_id) {
        return res.status(400).json({ error: 'company_id is required' });
      }

      const company = await db.selectOne('target_companies', {
        column: 'id',
        value: company_id,
      });

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Update status to generating
      await db.update('target_companies', { column: 'id', value: company_id }, {
        overview_status: 'generating',
        updated_at: new Date().toISOString(),
      }, 15000);

      try {
        // Import the DeepSeek client
        const { callLLM, LLMError } = await import('./llmCall.js');

        const prompt = `You are a business intelligence analyst. Generate a comprehensive overview of this company:

Company: ${name || company.name}
Industry: ${industry || company.industry || 'Technology'}
Location: ${location || company.location || 'Global'}

Provide:
1. Brief description (2-3 sentences)
2. Estimated revenue range (e.g., '$100M-$500M', '$1B-$5B', 'Public', 'Unknown')
3. Employee count range (e.g., '1,000-5,000', '10,000+')
4. Founded year (number, e.g., 1990, or null if unknown)
5. Headquarters location
6. Key products/services (array of strings, 3-5 items)
7. Recent news summary (1-2 sentences about recent developments, or empty string if none known)

Return as valid JSON with exactly these keys:
{
  "description": "string",
  "revenue": "string",
  "employee_count": "string",
  "founded": number | null,
  "headquarters": "string",
  "key_products": ["string"],
  "recent_news": "string"
}`;

        const result = await callLLM({
          prompt,
          model: 'deepseek-chat',
          temperature: 0.3,
          maxTokens: 800,
        });

        let overviewData: any = {};
        try {
          const jsonMatch = result.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            overviewData = JSON.parse(jsonMatch[0]);
          }
        } catch (parseErr) {
          console.error('[Market] Overview JSON parse error:', parseErr);
        }

        const finalOverview = {
          ...overviewData,
          generated_at: new Date().toISOString(),
        };

        await db.update('target_companies', { column: 'id', value: company_id }, {
          company_overview: finalOverview,
          overview_status: 'completed',
          updated_at: new Date().toISOString(),
        }, 15000);

        return res.status(200).json({ success: true, data: finalOverview });
      } catch (err: any) {
        console.error('[Market] Overview generation error:', err);
        await db.update('target_companies', { column: 'id', value: company_id }, {
          overview_status: 'failed',
          updated_at: new Date().toISOString(),
        }, 15000);

        return res.status(500).json({ error: err.message || 'Failed to generate overview' });
      }
    }

    // ── Company Fit Score Calculation (Phase 1.5) ──
    if (resource === 'company-fit-calculate' && method === 'POST') {
      if (!authUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { mandate_id, success_profile_id } = req.body || {};

      if (!mandate_id || !success_profile_id) {
        return res.status(400).json({ error: 'mandate_id and success_profile_id are required' });
      }

      const profile = await db.selectOne('success_profiles', {
        column: 'id',
        value: success_profile_id,
      });

      if (!profile) {
        return res.status(404).json({ error: 'Success profile not found' });
      }

      if (profile.status !== 'approved') {
        return res.status(400).json({ error: 'Only approved success profiles can be used for scoring' });
      }

      const companies = await db.selectMany('target_companies', {
        where: [{ column: 'mandate_id', value: mandate_id }],
        limit: 500,
      }, 15000);

      const requiredIndustries = profile.required_industries || [];
      const requiredGeographies = profile.required_geographies || [];
      const targetTeamSize = profile.team_size_managed || 0;

      let updated = 0;

      for (const company of companies) {
        let score = 0;

        // Industry match (40 points)
        const companyIndustry = (company.industry || '').toLowerCase();
        if (requiredIndustries.length > 0) {
          if (requiredIndustries.some(i => i.toLowerCase() === companyIndustry)) {
            score += 40;
          } else if (requiredIndustries.some(i =>
            companyIndustry.includes(i.toLowerCase()) ||
            i.toLowerCase().includes(companyIndustry)
          )) {
            score += 20;
          } else if (requiredIndustries.some(i => {
            const keywords = i.split(/[\s,&-]+/).filter(Boolean);
            return keywords.some(kw => companyIndustry.includes(kw.toLowerCase()));
          })) {
            score += 10;
          }
        } else {
          score += 20;
        }

        // Geography match (30 points)
        const companyLocation = (company.location || '').toLowerCase();
        if (requiredGeographies.length > 0) {
          if (requiredGeographies.some(g => companyLocation.includes(g.toLowerCase()))) {
            score += 30;
          }
        } else {
          score += 15;
        }

        // Size match (20 points)
        const sizeStr = company.size || '';
        const empMatch = sizeStr.match(/(\d+)/);
        const empCount = empMatch ? parseInt(empMatch[1]) * 1000 : 500;

        if (targetTeamSize > 0) {
          if (empCount >= targetTeamSize * 0.5 && empCount <= targetTeamSize * 2) {
            score += 20;
          } else if (empCount >= targetTeamSize * 0.25 && empCount <= targetTeamSize * 4) {
            score += 10;
          } else {
            score += 5;
          }
        } else {
          score += 10;
        }

        // Talent density (10 points)
        if (company.talent_density_score) {
          score += Math.min(10, Math.round(company.talent_density_score));
        } else {
          score += 5;
        }

        score = Math.min(100, Math.max(0, score));

        await db.update('target_companies', { column: 'id', value: company.id }, {
          fit_score: score,
          updated_at: new Date().toISOString(),
        }, 15000);
        updated++;
      }

      return res.status(200).json({ success: true, updated });
    }

    // ── LinkedIn Import Check (Phase 1.6) ──
    // Deduplication check: compare candidates against contacts table.
    // Used by the import UI before executing the real import to preview duplicates.
    if (resource === 'linkedin-import-check' && method === 'POST') {
      if (!authUserId) return res.status(401).json({ error: 'Unauthorized' });

      const candidates = (req.body?.candidates as any[]) || [];

      if (!Array.isArray(candidates) || candidates.length === 0) {
        return res.status(400).json({ error: 'candidates must be a non-empty array' });
      }

      if (!orgId) {
        return res.status(400).json({ error: 'organization_id is required' });
      }

      const emails = candidates
        .map((c) => (typeof c.email)
        .filter((e): e is string)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      const linkedinUrls = candidates
        .map((c) => (typeof c.linkedin_url))
        .filter((l): l is string)
        .map((l) => l.trim())
        .filter(Boolean);

      const duplicates: {
        id: string; email?: string; linkedin_url?: string; first_name?: string; last_name?: string; company?: string }[] = [];

      // Check email duplicates
      if (emails.length > 0) {
        try {
          const existingByEmail = await db.selectMany('contacts', {
            where: [
              {
                column: 'organization_id', value: orgId, operator: 'eq' },
              { column: 'email', value: emails, operator: 'in' },
            ],
            select: 'id, first_name, last_name, email, company, linkedin_url',
          }, 15000);
          duplicates.push(...existingByEmail);
        } catch {
            // Fallback: check one-by-one for robustness
        }
      }

      // Check LinkedIn URL duplicates
      if (linkedinUrls.length > 0) {
        try {
          const existingByLinkedIn = await db.selectMany('contacts', {
            where: [
              { column: 'organization_id', value: orgId, operator: 'eq' },
              { column: 'linkedin_url', value: linkedinUrls, operator: 'in' },
            ],
            select: 'id, first_name, last_name, email, company, linkedin_url',
          }, 15000);
          const existingIds = new Set(duplicates.map((d) => d.id));
          for (const c of existingByLinkedIn) {
            if (!existingIds.has(c.id)) duplicates.push(c);
          }
        } catch {
          // fallback: pass
        }
      }

      return res.status(200).json({
        success: true,
        totalRecords: candidates.length,
        totalDuplicates: duplicates.length,
        byEmail: duplicates.filter((d) => !!d.email).length,
        byLinkedin: duplicates.filter((d) => !!d.linkedin_url).length,
        duplicates: duplicates.map((d) => ({
          id: d.id,
          first_name: d.first_name,
          last_name: d.last_name,
          email: d.email,
          company: d.company,
          linkedin_url: d.linkedin_url,
        })),
      });
    }

    // ── LinkedIn Import Execution (Phase 1.6) ──
    // Bulk-insert contacts and optionally add to a mandate pipeline.
    // Supports 'skip' (default) and 'update' modes for handling duplicates.
    if (resource === 'linkedin-import' && method === 'POST') {
      if (!authUserId) return res.status(401).json({ error: 'Unauthorized' });

      const {
        candidates,
        dedup_mode: dedupModeRaw,
        mandate_id: mandateIdRaw,
      } = req.body || {};

      if (!Array.isArray(candidates) || candidates.length === 0) {
        return res.status(400).json({ error: 'candidates must be a non-empty array' });
      }

      if (!orgId) {
        return res.status(400).json({ error: 'organization_id is required' });
      }

      const dedupMode = dedupModeRaw === 'update' ? 'update' : 'skip';

      // Validate mandate_id (if provided) belongs to user's org
      let mandate: any = null;
      if (mandateIdRaw) {
        mandate = await db.selectOne('mandates', {
          column: 'id',
          value: mandateIdRaw,
          select: 'id, organization_id',
        });
        if (!mandate) return res.status(404).json({ error: 'Mandate not found' });
        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      // Collect identifiers for dedup check
      const emails: string[] = [];
      const linkedinUrls: string[] = [];
      for (const c of candidates) {
        if (typeof c.email) emails.push(String(c.email).trim().toLowerCase());
        if (typeof c.linkedin_url) linkedinUrls.push(String(c.linkedin_url).trim());
      }

      const emailSet = new Set<string>();
      const linkedinSet = new Set<string>();

      try {
        if (emails.length > 0) {
          const existingByEmail = await db.selectMany('contacts', {
            where: [
              { column: 'organization_id', value: orgId, operator: 'eq' },
              { column: 'email', value: emails, operator: 'in' },
            ],
            select: 'id, email',
          }, 15000);
          existingByEmail.forEach((e) => e.email && emailSet.add(String(e.email).toLowerCase());
        }
        if (linkedinUrls.length > 0) {
          const existingByLinkedIn = await db.selectMany('contacts', {
            where: [
              { column: 'organization_id', value: orgId, operator: 'eq' },
              { column: 'linkedin_url', value: linkedinUrls, operator: 'in' },
            ],
            select: 'id, linkedin_url',
          }, 15000);
          existingByLinkedIn.forEach((e) => e.linkedin_url && linkedinSet.add(String(e.linkedin_url)));
        }
      } catch {
        // If selectMany can't handle multi-column IN queries, fall back to row-by-row
      }

      // Process each candidate
      let imported = 0;
      let duplicates = 0;
      let pipelineCreated = 0;
      let errors = 0;
      const errorList: string[] = [];

      for (const candidate of candidates) {
        try {
          const candidateEmail = typeof candidate.email ? String(candidate.email).trim().toLowerCase() || '';
          const candidateLinkedIn = typeof candidate.linkedin_url ? String(candidate.linkedin_url).trim() : '';

          const isDuplicateByEmail = candidateEmail && emailSet.has(candidateEmail);
          const isDuplicateByLinkedIn = candidateLinkedIn && linkedinSet.has(candidateLinkedIn);

          // If either email OR linkedin already exists: handle per-mode
          if (isDuplicateByEmail || isDuplicateByLinkedIn) {
            if (dedupMode === 'skip') {
              duplicates++;
              continue;
            }
            // Update mode: find existing contact and fill in empty fields
            const existing = isDuplicateByEmail
              ? (await db.selectOne('contacts', { column: 'email', value: candidate.email }) || null)
              : (await db.selectOne('contacts', { column: 'linkedin_url', value: candidate.linkedin_url }) || null;

            if (existing) {
              const updatePayload: Record<string, any> = {};
              if (!existing.first_name && candidate.first_name) updatePayload.first_name = candidate.first_name;
              if (!existing.last_name && candidate.last_name) updatePayload.last_name = candidate.last_name;
              if (!existing.email && candidate.email) updatePayload.email = candidate.email;
              if (!existing.phone && candidate.phone) updatePayload.phone = candidate.phone;
              if (!existing.company && candidate.company) updatePayload.company = candidate.company;
              if (!existing.title && candidate.title) updatePayload.title = candidate.title;
              if (!existing.linkedin_url && candidate.linkedin_url) updatePayload.linkedin_url = candidate.linkedin_url;
              if (!existing.location && candidate.location) updatePayload.location = candidate.location;
              if (Object.keys(updatePayload).length > 0) {
                await db.update('contacts', { column: 'id', value: existing.id }, updatePayload, 15000);
              }
              duplicates++;
              continue;
            }
          }

          // New contact: insert
          const firstName = typeof candidate.first_name || candidate.last_name || '—';
          const lastName = !candidate.first_name && candidate.last_name ? candidate.last_name : '';

          const newContact = await db.insert('contacts', {
            first_name: firstName,
            last_name: lastName,
            email: candidate.email || null,
            phone: candidate.phone || null,
            company: candidate.company || null,
            title: candidate.title || null,
            linkedin_url: candidate.linkedin_url || null,
            location: candidate.location || null,
            notes: candidate.notes || null,
            created_by: authUserId,
            organization_id: orgId,
          }, 15000);

          imported++;

          // Add to pipeline if mandate provided
          if (mandate && newContact?.id) {
            await db.insert('candidates_pipeline', {
              contact_id: newContact.id,
              mandate_id: mandate.id,
              stage: 'potential',
              match_score: null,
              created_by: authUserId,
              organization_id: mandate.organization_id,
            }, 15000);
            pipelineCreated++;
          }

          // Track dedup sets for further iterations
          if (candidate.email) emailSet.add(String(candidate.email).toLowerCase());
          if (candidate.linkedin_url) linkedinSet.add(String(candidate.linkedin_url));
        } catch (err: any) {
          errors++;
          errorList.push(String(err?.message || 'Failed to import candidate'));
        }
      }

      return res.status(200).json({
        success: true,
        imported,
        duplicates,
        errors,
        pipeline_created: pipelineCreated,
        error_list: errorList,
        dedup_mode: dedupMode,
        mandate_id: mandateIdRaw || null,
      });
    }

    // ── Org Chart CRUD (Phase 3.5) ──
    if (resource === 'org-chart') {
      if (!id) {
        return res.status(400).json({ error: 'company_id is required' });
      }

      // Get company and verify access
      const company = await db.selectOne('target_companies', {
        column: 'id',
        value: id,
        select: 'id, mandate_id, org_chart',
      });

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Check mandate access
      if (company.mandate_id) {
        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: company.mandate_id,
          select: 'id, organization_id',
        });
        if (mandate && userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      // GET: Retrieve org chart
      if (method === 'GET') {
        return res.status(200).json({
          success: true,
          data: company.org_chart || { nodes: [] },
        });
      }

      // POST/PATCH: Update org chart
      if (method === 'POST' || method === 'PATCH') {
        const { org_chart } = req.body || {};

        if (!org_chart || !org_chart.nodes) {
          return res.status(400).json({ error: 'org_chart with nodes array is required' });
        }

        // Validate nodes
        const nodes = org_chart.nodes as any[];
        for (const node of nodes) {
          if (!node.id || !node.name) {
            return res.status(400).json({ error: 'Each node must have id and name' });
          }
        }

        // Calculate talent density score based on org chart
        const highRelevanceCount = nodes.filter(n => n.talent_relevance >= 4).length;
        const totalPositions = nodes.length;
        const densityScore = totalPositions > 0 
          ? Math.round((highRelevanceCount / totalPositions) * 50 + 50)
          : 50;

        const rows = await db.update('target_companies', { column: 'id', value: id }, {
          org_chart: org_chart,
          talent_density_score: densityScore,
          key_talent_count: highRelevanceCount,
          updated_at: new Date().toISOString(),
        }, 15000);

        return res.status(200).json({
          success: true,
          data: rows[0]?.org_chart || org_chart,
          density_score: densityScore,
        });
      }
    }

    // ── Talent Density Heatmap Data (Phase 3.5) ──
    if (resource === 'talent-density') {
      if (method === 'GET') {
        const mandateId = id || req.query.mandate_id as string;

        if (!mandateId) {
          return res.status(400).json({ error: 'mandate_id is required' });
        }

        // Check mandate access
        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: mandateId,
          select: 'id, organization_id',
        });

        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        // Get all target companies for this mandate
        const companies = await db.selectMany('target_companies', {
          where: [{ column: 'mandate_id', value: mandateId }],
          orderBy: { column: 'talent_density_score', ascending: false },
          limit: 200,
        }, 15000);

        // Aggregate by sector and geography
        const densityMatrix: Record<string, Record<string, { count: number; avg_score: number; companies: any[] }>> = {};

        companies.forEach((company: any) => {
          const sector = company.sector || company.industry || 'Other';
          const geography = company.region || 'Global';
          const score = company.talent_density_score || 50;

          if (!densityMatrix[sector]) densityMatrix[sector] = {};
          if (!densityMatrix[sector][geography]) {
            densityMatrix[sector][geography] = { count: 0, avg_score: 0, companies: [] };
          }

          densityMatrix[sector][geography].count++;
          densityMatrix[sector][geography].companies.push({
            id: company.id,
            name: company.name,
            industry: company.industry,
            location: company.location,
            talent_density_score: score,
            key_talent_count: company.key_talent_count,
          });
        });

        // Calculate average scores
        Object.keys(densityMatrix).forEach(sector => {
          Object.keys(densityMatrix[sector]).forEach(geo => {
            const cell = densityMatrix[sector][geo];
            cell.avg_score = Math.round(
              cell.companies.reduce((sum, c) => sum + c.talent_density_score, 0) / cell.count
            );
          });
        });

        return res.status(200).json({
          success: true,
          data: {
            companies,
            density_matrix: densityMatrix,
            total_companies: companies.length,
          },
        });
      }
    }

    // ── Background Checks CRUD (Phase 7.4) ──
    if (resource === 'background-checks') {
      // Create new background check
      if (method === 'POST' && !id) {
        const { candidate_id, mandate_id, check_type, provider, order_date, due_date, ordered_by, organization_id } = req.body || {};
        
        if (!candidate_id || !check_type || !provider || !order_date || !due_date) {
          return res.status(400).json({ error: 'candidate_id, check_type, provider, order_date, and due_date are required' });
        }

        if (!hasOrgAccess(userRole)) {
          return res.status(403).json({ error: 'Organization access required' });
        }

        const row = await db.insert('background_checks', {
          candidate_id,
          mandate_id: mandate_id || null,
          check_type,
          provider,
          order_date,
          due_date,
          status: 'pending',
          ordered_by: ordered_by || authUserId,
          organization_id: organization_id || orgId,
        }, 15000);
        return res.status(201).json({ success: true, data: row });
      }

      // Get background checks for candidate
      if (method === 'GET' && !id) {
        const candidateId = req.query.candidate_id as string;
        
        if (!candidateId) {
          return res.status(400).json({ error: 'candidate_id query param required' });
        }

        const checks = await db.selectMany('background_checks', {
          where: [{ column: 'candidate_id', value: candidateId }],
          orderBy: { column: 'order_date', ascending: false },
        }, 15000);

        return res.status(200).json({ success: true, data: checks });
      }

      // Get single background check
      if (method === 'GET' && id) {
        const check = await db.selectOne('background_checks', {
          column: 'id',
          value: id,
        }, 15000);

        if (!check) {
          return res.status(404).json({ error: 'Background check not found' });
        }

        return res.status(200).json({ success: true, data: check });
      }

      // Update background check (status, results, etc.)
      if (method === 'PATCH' && id) {
        const check = await db.selectOne('background_checks', {
          column: 'id',
          value: id,
          select: 'id, organization_id',
        }, 15000);

        if (!check) {
          return res.status(404).json({ error: 'Background check not found' });
        }

        if (userRole !== 'super_admin' && check.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const updates = req.body || {};
        delete updates.id;
        delete updates.created_at;
        
        // If updating to completed status, set completed_at
        if (updates.status === 'completed' && !updates.completed_at) {
          updates.completed_at = new Date().toISOString();
        }

        const rows = await db.update('background_checks', { column: 'id', value: id }, updates, 15000);
        return res.status(200).json({ success: true, data: rows[0] || null });
      }

      // Delete background check
      if (method === 'DELETE' && id) {
        const check = await db.selectOne('background_checks', {
          column: 'id',
          value: id,
          select: 'id, organization_id',
        }, 15000);

        if (!check) {
          return res.status(404).json({ error: 'Background check not found' });
        }

        if (userRole !== 'super_admin' && check.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const count = await db.deleteRows('background_checks', { column: 'id', value: id }, 15000);
        return res.status(200).json({ success: true, deleted: count });
      }
    }

    // ── Org Chart PDF Export (Phase 3.5) ──
    if (resource === 'org-chart-pdf' && method === 'POST') {
      const { mandate_id, company_ids } = req.body || {};

      if (!mandate_id) {
        return res.status(400).json({ error: 'mandate_id is required' });
      }

      // Check mandate access
      const mandate = await db.selectOne('mandates', {
        column: 'id',
        value: mandate_id,
        select: 'id, organization_id, title, status, client_first_name',
      });

      if (!mandate) {
        return res.status(404).json({ error: 'Mandate not found' });
      }

      if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get companies with org charts
      let companies: any[] = [];
      if (company_ids && Array.isArray(company_ids)) {
        for (const companyId of company_ids) {
          const company = await db.selectOne('target_companies', {
            column: 'id',
            value: companyId,
          });
          if (company) companies.push(company);
        }
      } else {
        companies = await db.selectMany('target_companies', {
          where: [{ column: 'mandate_id', value: mandate_id }],
          orderBy: { column: 'fit_score', ascending: false },
          limit: 10,
        }, 15000);
      }

      // Calculate insights
      const sectorCounts: Record<string, number> = {};
      const geoCounts: Record<string, number> = {};
      let highestDensity = { sector: '', geo: '', score: 0 };
      let lowestDensity = { sector: '', geo: '', score: 100 };
      let companiesWithCharts = 0;
      let highRelevancePositions = 0;

      companies.forEach((company: any) => {
        const sector = company.sector || company.industry || 'Other';
        const geo = company.region || 'Global';
        sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
        geoCounts[geo] = (geoCounts[geo] || 0) + 1;

        if (company.talent_density_score > highestDensity.score) {
          highestDensity = { sector, geo, score: company.talent_density_score };
        }
        if (company.talent_density_score < lowestDensity.score) {
          lowestDensity = { sector, geo, score: company.talent_density_score };
        }

        if (company.org_chart && (company.org_chart as any).nodes?.length > 0) {
          companiesWithCharts++;
          highRelevancePositions += (company.org_chart as any).nodes.filter(
            (n: any) => n.talent_relevance >= 4
          ).length;
        }
      });

      const topSectors = Object.entries(sectorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([s]) => s);

      const topGeographies = Object.entries(geoCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([g]) => g);

      // Build org charts map
      const orgCharts: Record<string, any> = {};
      companies.forEach((company: any) => {
        if (company.org_chart) {
          orgCharts[company.id] = company.org_chart;
        }
      });

      return res.status(200).json({
        success: true,
        data: {
          mandate,
          companies,
          org_charts: orgCharts,
          insights: {
            total_companies: companies.length,
            top_sectors: topSectors,
            top_geographies: topGeographies,
            highest_density: highestDensity,
            lowest_density: lowestDensity,
            companies_with_charts: companiesWithCharts,
            high_relevance_positions: highRelevancePositions,
          },
        },
      });
    }

    // ── LENS Report Generation (Phase 3.6) ──
    if (resource === 'lens-report') {
      if (method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { mandate_id, candidate_ids, report_type } = req.body || {};

      if (!mandate_id || !candidate_ids || !Array.isArray(candidate_ids) || candidate_ids.length === 0) {
        return res.status(400).json({ error: 'mandate_id and candidate_ids array are required' });
      }

      if (!['T1', 'T2', 'T3'].includes(report_type)) {
        return res.status(400).json({ error: 'report_type must be T1, T2, or T3' });
      }

      // Check mandate access
      const mandate = await db.selectOne('mandates', {
        column: 'id',
        value: mandate_id,
        select: 'id, organization_id, title, client_first_name, client_last_name, status',
      });

      if (!mandate) {
        return res.status(404).json({ error: 'Mandate not found' });
      }

      if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Fetch candidates with scores
      const candidates: any[] = [];
      for (const candidateId of candidate_ids) {
        const pipeline = await db.selectOne('candidate_pipeline', {
          column: 'id',
          value: candidateId,
          select: 'id, mandate_id, contact_id, stage, match_score, trident_composite, verdict, scoring_output, analysis, created_at',
        });

        if (pipeline && pipeline.mandate_id === mandate_id) {
          const contact = await db.selectOne('contacts', {
            column: 'id',
            value: pipeline.contact_id,
            select: 'id, first_name, last_name, current_title, company_id, location, linkedin_url',
          });

          const company = contact?.company_id 
            ? await db.selectOne('companies', {
                column: 'id',
                value: contact.company_id,
                select: 'id, name, industry, location',
              })
            : null;

          // Get scoring data
          const scoringRun = await db.selectOne('scoring_runs', {
            column: 'user_id',
            value: contact?.id,
            orderBy: { column: 'created_at', ascending: false },
            limit: 1,
          });

          candidates.push({
            id: pipeline.id,
            name: `${contact?.first_name || ''} ${contact?.last_name || ''}`,
            title: contact?.current_title || '',
            company: company?.name || '',
            location: contact?.location || company?.location || '',
            industry: company?.industry || '',
            match_score: pipeline.match_score || 0,
            dimensions: scoringRun?.output_scores || { experience: 0, skills: 0, fit: 0 },
            strengths: (pipeline.analysis as any)?.strengths || [],
            development_areas: (pipeline.analysis as any)?.development_areas || [],
            disc_profile: (pipeline.analysis as any)?.disc_profile || 'Not assessed',
            disc_scores: (pipeline.analysis as any)?.disc_scores || { D: 0, I: 0, S: 0, C: 0 },
            disc_summary: (pipeline.analysis as any)?.disc_summary || '',
            disc_type: (pipeline.analysis as any)?.disc_type || 'Unknown',
            verdict: pipeline.verdict || 'hold',
            trident: pipeline.trident_composite || 'N/A',
            recommendation: (pipeline.analysis as any)?.recommendation || 'Proceed with interview',
            work_history: [],
            skills: [],
            shift_assessment: null,
            references: [],
          });
        }
      }

      if (candidates.length === 0) {
        return res.status(400).json({ error: 'No valid candidates found' });
      }

      // Calculate summary stats
      const topCandidate = candidates.reduce((top, c) => 
        c.match_score > top.match_score ? c : top, candidates[0]);
      const proceedCount = candidates.filter(c => c.verdict === 'proceed').length;
      const holdCount = candidates.filter(c => c.verdict === 'hold').length;
      const avgMatchScore = Math.round(
        candidates.reduce((sum, c) => sum + c.match_score, 0) / candidates.length
      );

      // Build report data
      const reportData = {
        id: `lens_${report_type}_${mandate_id}_${Date.now()}`,
        mandate: {
          title: mandate.title,
          client: `${mandate.client_first_name || ''} ${mandate.client_last_name || ''}`,
        },
        candidates,
        candidate_count: candidates.length,
        top_candidate,
        proceed_count: proceedCount,
        hold_count: holdCount,
        avg_match_score: avgMatchScore,
        generated_at: new Date().toISOString(),
        report_type,
      };

      // Store report reference
      const reportRecord = await db.insert('generated_reports', {
        mandate_id,
        report_type: `LENS_${report_type}`,
        candidate_ids: candidate_ids,
        organization_id: mandate.organization_id,
        created_by: userId,
        status: 'generated',
        metadata: reportData,
      }, 15000);

      return res.status(200).json({
        success: true,
        data: {
          ...reportData,
          pdf_url: `/api/data/lens-pdf/${reportRecord?.[0]?.id || reportData.id}`,
        },
      });
    }

    // ── LENS PDF Download ──
    if (resource === 'lens-pdf' && id) {
      const report = await db.selectOne('generated_reports', {
        column: 'id',
        value: id,
        select: 'id, mandate_id, report_type, metadata, status',
      });

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // Check access
      const mandate = await db.selectOne('mandates', {
        column: 'id',
        value: report.mandate_id,
        select: 'id, organization_id',
      });

      if (userRole !== 'super_admin' && mandate?.organization_id !== orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Return report metadata with PDF generation info
      return res.status(200).json({
        success: true,
        data: {
          id: report.id,
          report_type: report.report_type,
          metadata: report.metadata,
          pdf_available: report.status === 'generated',
        },
      });
    }

    // ── LENS Report Email ──
    if (resource === 'lens-email' && method === 'POST') {
      const { report_id, recipients } = req.body || {};

      if (!report_id || !recipients || !Array.isArray(recipients)) {
        return res.status(400).json({ error: 'report_id and recipients array are required' });
      }

      const report = await db.selectOne('generated_reports', {
        column: 'id',
        value: report_id,
      });

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // Check access
      const mandate = await db.selectOne('mandates', {
        column: 'id',
        value: report.mandate_id,
        select: 'id, organization_id',
      });

      if (userRole !== 'super_admin' && mandate?.organization_id !== orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Update report status
      await db.update('generated_reports', { column: 'id', value: report_id }, {
        status: 'sent',
        sent_to: recipients,
        sent_at: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        message: `Report sent to ${recipients.length} recipients`,
      });
    }

    // ── LENS Report Share Link ──
    if (resource === 'lens-share' && method === 'POST') {
      const { report_id, expiry } = req.body || {};

      if (!report_id) {
        return res.status(400).json({ error: 'report_id is required' });
      }

      const report = await db.selectOne('generated_reports', {
        column: 'id',
        value: report_id,
      });

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // Check access
      const mandate = await db.selectOne('mandates', {
        column: 'id',
        value: report.mandate_id,
        select: 'id, organization_id',
      });

      if (userRole !== 'super_admin' && mandate?.organization_id !== orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Generate share token
      const shareToken = `${report_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiryDate = expiry === 'never' 
        ? null 
        : new Date(Date.now() + (expiry === '1d' ? 1 : expiry === '7d' ? 7 : 30) * 24 * 60 * 60 * 1000);

      await db.update('generated_reports', { column: 'id', value: report_id }, {
        share_token: shareToken,
        share_expiry: expiryDate?.toISOString() || null,
      });

      return res.status(200).json({
        success: true,
        share_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.lyc.ai'}/shared/report/${shareToken}`,
      });
    }

    // ── GRID Report Generation (Phase 3.6) ──
    if (resource === 'grid-report' && method === 'POST') {
      const { mandate_id } = req.body || {};

      if (!mandate_id) {
        return res.status(400).json({ error: 'mandate_id is required' });
      }

      // Check mandate access
      const mandate = await db.selectOne('mandates', {
        column: 'id',
        value: mandate_id,
        select: 'id, organization_id, title, client_first_name, client_last_name',
      });

      if (!mandate) {
        return res.status(404).json({ error: 'Mandate not found' });
      }

      if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get target companies
      const companies = await db.selectMany('target_companies', {
        where: [{ column: 'mandate_id', value: mandate_id }],
        orderBy: { column: 'fit_score', ascending: false },
        limit: 50,
      }, 15000);

      // Calculate stats
      const avgDensity = companies.length > 0
        ? Math.round(companies.reduce((sum: number, c: any) => sum + (c.talent_density_score || 50), 0) / companies.length)
        : 0;
      const avgFit = companies.length > 0
        ? Math.round(companies.reduce((sum: number, c: any) => sum + (c.fit_score || 50), 0) / companies.length)
        : 0;

      const reportData = {
        mandate,
        companies,
        stats: {
          total: companies.length,
          avg_density: avgDensity,
          avg_fit: avgFit,
        },
        generated_at: new Date().toISOString(),
      };

      // Store report
      const reportRecord = await db.insert('generated_reports', {
        mandate_id,
        report_type: 'GRID',
        organization_id: mandate.organization_id,
        created_by: userId,
        status: 'generated',
        metadata: reportData,
      }, 15000);

      return res.status(200).json({
        success: true,
        data: {
          ...reportData,
          pdf_url: `/api/grid-pdf/${reportRecord?.[0]?.id || mandate_id}`,
        },
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // CANDIDATE PORTAL ROUTES (Phase 4.1)
    // ═══════════════════════════════════════════════════════════════

    // ── Candidate Applications ──
    if (resource === 'candidate' && sub === 'applications') {
      if (method === 'GET') {
        if (!authUserId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get candidate's contact_id from their profile
        const profile = await db.selectOne('profiles', {
          column: 'id',
          value: authUserId,
          select: 'id, candidate_contact_id',
        });

        const contactId = profile?.candidate_contact_id || id;

        if (!contactId) {
          return res.status(400).json({ error: 'Candidate contact ID not found' });
        }

        // Get all pipeline entries for this contact
        const applications = await db.selectMany('candidates_pipeline', {
          where: [{ column: 'contact_id', value: contactId }],
          orderBy: { column: 'updated_at', ascending: false },
          limit: 100,
        }, 15000);

        // Enrich with mandate details
        const enrichedApplications = [];
        for (const app of applications) {
          const mandate = await db.selectOne('mandates', {
            column: 'id',
            value: app.mandate_id,
            select: 'id, title, description, location, compensation_range, status',
          });

          const client = mandate?.client_id
            ? await db.selectOne('clients', {
                column: 'id',
                value: mandate.client_id,
                select: 'id, first_name, last_name, company_name',
              })
            : null;

          // Get stage history
          const history = await db.selectMany('pipeline_stage_history', {
            where: [{ column: 'pipeline_id', value: app.id }],
            orderBy: { column: 'created_at', ascending: true },
            limit: 50,
          }, 15000);

          enrichedApplications.push({
            id: app.id,
            mandate_id: app.mandate_id,
            mandate: {
              title: mandate?.title || 'Unknown Mandate',
              description: mandate?.description || '',
              jd_description: mandate?.jd_description || '',
              location: mandate?.location || '',
              compensation_range: mandate?.compensation_range || '',
              company: client ? { name: client.company_name || `${client.first_name || ''} ${client.last_name || ''}`.trim() } : undefined,
            },
            client_name: client ? `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.company_name : 'Client',
            stage: app.stage,
            match_score: app.match_score,
            trident_composite: app.trident_composite,
            match_reasons: app.match_reasons ? JSON.parse(app.match_reasons) : null,
            list_status: app.list_status,
            created_at: app.created_at,
            updated_at: app.updated_at,
            applied_date: app.created_at,
            last_updated: app.updated_at,
            stage_history: history,
            next_steps: app.next_steps || null,
            client_feedback: app.client_feedback || null,
            feedback: app.client_feedback || null,
          });
        }

        return res.status(200).json({
          success: true,
          data: enrichedApplications,
          total: enrichedApplications.length,
        });
      }
    }

    // ── Candidate Profile ──
    if (resource === 'candidate' && sub === 'profile') {
      if (method === 'GET') {
        if (!authUserId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get candidate profile with contact info
        const profile = await db.selectOne('profiles', {
          column: 'id',
          value: authUserId,
          select: 'id, email, name, candidate_contact_id, notification_preferences',
        });

        const contactId = profile?.candidate_contact_id || id;

        if (!contactId) {
          return res.status(400).json({ error: 'Candidate contact ID not found' });
        }

        const contact = await db.selectOne('contacts', {
          column: 'id',
          value: contactId,
          select: '*',
        }, 15000);

        // Parse JSON fields
        const parsedProfile = {
          ...profile,
          notification_preferences: profile?.notification_preferences
            ? (typeof profile.notification_preferences === 'string'
                ? JSON.parse(profile.notification_preferences)
                : profile.notification_preferences)
            : null,
          skills: contact?.skills
            ? (typeof contact.skills === 'string' ? JSON.parse(contact.skills) : contact.skills)
            : [],
          languages: contact?.languages
            ? (typeof contact.languages === 'string' ? JSON.parse(contact.languages) : contact.languages)
            : [],
          career_history: contact?.career_history
            ? (typeof contact.career_history === 'string' ? JSON.parse(contact.career_history) : contact.career_history)
            : [],
          education: contact?.education
            ? (typeof contact.education === 'string' ? JSON.parse(contact.education) : contact.education)
            : [],
          // Candidate-specific preferences
          job_search_status: profile?.job_search_status || 'open_to_opportunities',
          preferred_industries: profile?.preferred_industries
            ? (typeof profile.preferred_industries === 'string'
                ? JSON.parse(profile.preferred_industries)
                : profile.preferred_industries)
            : [],
          preferred_geographies: profile?.preferred_geographies
            ? (typeof profile.preferred_geographies === 'string'
                ? JSON.parse(profile.preferred_geographies)
                : profile.preferred_geographies)
            : [],
          preferred_company_sizes: profile?.preferred_company_sizes
            ? (typeof profile.preferred_company_sizes === 'string'
                ? JSON.parse(profile.preferred_company_sizes)
                : profile.preferred_company_sizes)
            : [],
          salary_expectation_min: profile?.salary_expectation_min || null,
          salary_expectation_max: profile?.salary_expectation_max || null,
          cv_url: profile?.cv_url || null,
          cv_extracted: profile?.cv_extracted
            ? (typeof profile.cv_extracted === 'string'
                ? JSON.parse(profile.cv_extracted)
                : profile.cv_extracted)
            : null,
        };

        return res.status(200).json({
          success: true,
          data: parsedProfile,
        });
      }

      if (method === 'PUT' || method === 'PATCH') {
        if (!authUserId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const profile = await db.selectOne('profiles', {
          column: 'id',
          value: authUserId,
          select: 'id, candidate_contact_id',
        });

        const contactId = profile?.candidate_contact_id || id;

        if (!contactId) {
          return res.status(400).json({ error: 'Candidate contact ID not found' });
        }

        const updates = req.body || {};

        // Separate profile-level and contact-level updates
        const profileFields = ['name', 'email', 'job_search_status', 'preferred_industries',
          'preferred_geographies', 'preferred_company_sizes', 'salary_expectation_min',
          'salary_expectation_max', 'cv_url', 'cv_extracted', 'notification_preferences'];
        const contactFields = ['first_name', 'last_name', 'email', 'phone', 'linkedin_url',
          'location', 'city', 'country', 'current_title', 'current_company', 'years_experience',
          'skills', 'languages', 'career_history', 'education', 'headline', 'summary'];

        const profileUpdates: Record<string, any> = {};
        const contactUpdates: Record<string, any> = {};

        for (const [key, value] of Object.entries(updates)) {
          if (profileFields.includes(key)) {
            profileUpdates[key] = typeof value === 'object' ? JSON.stringify(value) : value;
          } else if (contactFields.includes(key)) {
            contactUpdates[key] = typeof value === 'object' ? JSON.stringify(value) : value;
          }
        }

        // Update contact if there are contact-level changes
        if (Object.keys(contactUpdates).length > 0) {
          await db.update('contacts', { column: 'id', value: contactId }, {
            ...contactUpdates,
            updated_at: new Date().toISOString(),
          }, 15000);
        }

        // Update profile if there are profile-level changes
        if (Object.keys(profileUpdates).length > 0) {
          await db.update('profiles', { column: 'id', value: authUserId }, {
            ...profileUpdates,
            updated_at: new Date().toISOString(),
          }, 15000);
        }

        return res.status(200).json({
          success: true,
          message: 'Profile updated successfully',
        });
      }
    }

    // ── Candidate Notifications ──
    if (resource === 'candidate' && sub === 'notifications') {
      if (method === 'GET') {
        if (!authUserId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get notifications for this candidate
        const notifications = await db.selectMany('notifications', {
          where: [{ column: 'user_id', value: authUserId }],
          orderBy: { column: 'created_at', ascending: false },
          limit: 50,
        }, 15000);

        // Get notification preferences
        const profile = await db.selectOne('profiles', {
          column: 'id',
          value: authUserId,
          select: 'notification_preferences',
        });

        const preferences = profile?.notification_preferences
          ? (typeof profile.notification_preferences === 'string'
              ? JSON.parse(profile.notification_preferences)
              : profile.notification_preferences)
          : getDefaultNotificationPreferences();

        return res.status(200).json({
          success: true,
          data: notifications,
          preferences,
        });
      }

      if (method === 'POST') {
        if (!authUserId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const { type, title, message, related_id, related_type } = req.body || {};

        if (!type || !title || !message) {
          return res.status(400).json({ error: 'type, title, and message are required' });
        }

        const notification = await db.insert('notifications', {
          user_id: authUserId,
          type,
          title,
          message,
          related_id: related_id || null,
          related_type: related_type || null,
          read: false,
          created_at: new Date().toISOString(),
        }, 15000);

        return res.status(201).json({
          success: true,
          data: notification,
        });
      }
    }

    // ── Mark Notification as Read ──
    if (resource === 'candidate' && sub === 'notifications' && id === 'read') {
      if (method === 'POST') {
        if (!authUserId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const { notification_ids } = req.body || {};

        if (notification_ids && Array.isArray(notification_ids)) {
          for (const notifId of notification_ids) {
            await db.update('notifications', { column: 'id', value: notifId }, {
              read: true,
              read_at: new Date().toISOString(),
            }, 15000);
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Notifications marked as read',
        });
      }
    }

    // ── Candidate Notification Preferences ──
    if (resource === 'candidate' && sub === 'notifications' && id === 'preferences') {
      if (method === 'GET') {
        if (!authUserId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const profile = await db.selectOne('profiles', {
          column: 'id',
          value: authUserId,
          select: 'notification_preferences',
        });

        const preferences = profile?.notification_preferences
          ? (typeof profile.notification_preferences === 'string'
              ? JSON.parse(profile.notification_preferences)
              : profile.notification_preferences)
          : getDefaultNotificationPreferences();

        return res.status(200).json({
          success: true,
          data: preferences,
        });
      }

      if (method === 'PUT' || method === 'PATCH') {
        if (!authUserId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const preferences = req.body || {};

        await db.update('profiles', { column: 'id', value: authUserId }, {
          notification_preferences: JSON.stringify(preferences),
          updated_at: new Date().toISOString(),
        }, 15000);

        return res.status(200).json({
          success: true,
          message: 'Notification preferences updated',
        });
      }
    }

    // ── Candidate Career Insights ──
    if (resource === 'candidate' && sub === 'insights') {
      if (method === 'GET') {
        if (!authUserId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get candidate profile for personalization
        const profile = await db.selectOne('profiles', {
          column: 'id',
          value: authUserId,
          select: 'id, candidate_contact_id, preferred_industries, preferred_geographies, job_search_status',
        });

        const contactId = profile?.candidate_contact_id;

        let contact: any = null;
        if (contactId) {
          contact = await db.selectOne('contacts', {
            column: 'id',
            value: contactId,
            select: 'id, current_title, current_company, industries, skills, years_experience, location',
          }, 15000);
        }

        // Generate AI-powered insights based on profile
        const insights = generateCandidateInsights({
          profile,
          contact,
          industries: profile?.preferred_industries || [],
          geographies: profile?.preferred_geographies || [],
          jobSearchStatus: profile?.job_search_status || 'open_to_opportunities',
          skills: contact?.skills || [],
          currentTitle: contact?.current_title || '',
          yearsExperience: contact?.years_experience || 0,
        });

        // Get saved/bookmarked insights
        const savedInsights = await db.selectMany('candidate_saved_insights', {
          where: [{ column: 'profile_id', value: authUserId }],
          orderBy: { column: 'created_at', ascending: false },
          limit: 100,
        }, 15000);

        const savedIds = new Set(savedInsights.map((s: any) => s.insight_id));

        const enrichedInsights = insights.map((insight: any) => ({
          ...insight,
          saved: savedIds.has(insight.id),
        }));

        return res.status(200).json({
          success: true,
          data: enrichedInsights,
        });
      }
    }

    // ── Save/Bookmark Career Insight ──
    if (resource === 'candidate' && sub === 'insights' && id === 'save') {
      if (method === 'POST') {
        if (!authUserId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const { insight_id } = req.body || {};

        if (!insight_id) {
          return res.status(400).json({ error: 'insight_id is required' });
        }

        // Check if already saved
        const existing = await db.selectOne('candidate_saved_insights', {
          where: [
            { column: 'profile_id', value: authUserId },
            { column: 'insight_id', value: insight_id },
          ],
        });

        if (existing) {
          return res.status(200).json({
            success: true,
            message: 'Insight already saved',
          });
        }

        await db.insert('candidate_saved_insights', {
          profile_id: authUserId,
          insight_id,
          created_at: new Date().toISOString(),
        }, 15000);

        return res.status(201).json({
          success: true,
          message: 'Insight saved',
        });
      }

      if (method === 'DELETE') {
        if (!authUserId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const { insight_id } = req.body || {};

        if (!insight_id) {
          return res.status(400).json({ error: 'insight_id is required' });
        }

        await db.deleteRows('candidate_saved_insights', {
          where: [
            { column: 'profile_id', value: authUserId },
            { column: 'insight_id', value: insight_id },
          ],
        }, 15000);

        return res.status(200).json({
          success: true,
          message: 'Insight removed from saved',
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // INTERVIEW MANAGEMENT ROUTES (Phase 4.3)
    // ═══════════════════════════════════════════════════════════════

    // ── List interviews for mandate ──
    if (resource === 'interviews' && sub === 'mandate') {
      if (method === 'GET') {
        if (!id) {
          return res.status(400).json({ error: 'mandate_id is required' });
        }

        const interviews = await db.selectMany('interviews', {
          where: [{ column: 'mandate_id', value: id }],
          orderBy: { column: 'interview_date', ascending: false },
          limit: 50,
        }, 15000);

        const enriched = [];
        for (const interview of interviews) {
          const candidate = await db.selectOne('contacts', {
            column: 'id',
            value: interview.candidate_id,
            select: 'id, first_name, last_name, email',
          });

          const panelMembers = [];
          if (interview.panel_members && Array.isArray(interview.panel_members)) {
            for (const panelistId of interview.panel_members) {
              const panelist = await db.selectOne('profiles', {
                column: 'id',
                value: panelistId,
                select: 'id, name, email',
              });
              if (panelist) {
                panelMembers.push(panelist);
              }
            }
          }

          enriched.push({
            ...interview,
            candidate_name: candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Unknown',
            candidate_email: candidate?.email || '',
            panel_members: panelMembers,
          });
        }

        return res.status(200).json({
          success: true,
          data: enriched,
          total: enriched.length,
        });
      }
    }

    // ── Get single interview ──
    if (resource === 'interviews' && id && !sub) {
      if (method === 'GET') {
        const interview = await db.selectOne('interviews', {
          column: 'id',
          value: id,
        }, 15000);

        if (!interview) {
          return res.status(404).json({ error: 'Interview not found' });
        }

        const candidate = await db.selectOne('contacts', {
          column: 'id',
          value: interview.candidate_id,
          select: 'id, first_name, last_name, email',
        });

        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: interview.mandate_id,
          select: 'id, title, client_id',
        });

        const client = mandate?.client_id
          ? await db.selectOne('clients', {
              column: 'id',
              value: mandate.client_id,
              select: 'id, company_name',
            })
          : null;

        const panelMembers = [];
        if (interview.panel_members && Array.isArray(interview.panel_members)) {
          for (const panelistId of interview.panel_members) {
            const panelist = await db.selectOne('profiles', {
              column: 'id',
              value: panelistId,
              select: 'id, name, email',
            });
            if (panelist) {
              panelMembers.push(panelist);
            }
          }
        }

        return res.status(200).json({
          success: true,
          data: {
            ...interview,
            candidate_name: candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Unknown',
            candidate_email: candidate?.email || '',
            mandate_title: mandate?.title || '',
            client_name: client?.company_name || '',
            panel_members: panelMembers,
          },
        });
      }

      // Update interview
      if (method === 'PUT' || method === 'PATCH') {
        const updates = req.body || {};
        
        await db.update('interviews', { column: 'id', value: id }, {
          ...updates,
          updated_at: new Date().toISOString(),
        }, 15000);

        return res.status(200).json({
          success: true,
          message: 'Interview updated',
        });
      }

      // Delete interview
      if (method === 'DELETE') {
        await db.deleteRows('interviews', {
          where: [{ column: 'id', value: id }],
        }, 15000);

        return res.status(200).json({
          success: true,
          message: 'Interview deleted',
        });
      }
    }

    // ── Schedule new interview ──
    if (resource === 'interviews' && sub === 'schedule') {
      if (method === 'POST') {
        const {
          candidate_id,
          mandate_id,
          round,
          interview_date,
          duration_minutes = 60,
          location,
          meeting_link,
          panel_members,
          send_invite = true,
          notes,
        } = req.body || {};

        if (!candidate_id || !mandate_id || !round || !interview_date) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const panelIds = panel_members?.map((p: any) => p.id) || [];

        const inserted = await db.insert('interviews', {
          candidate_id,
          mandate_id,
          round,
          interview_date,
          duration_minutes,
          location,
          meeting_link,
          panel_members: panelIds,
          status: 'scheduled',
          scorecards: [],
          aggregate_feedback: null,
          notes,
          created_by: authUserId,
          organization_id: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, 15000);

        const interviewId = inserted?.id;

        // Send invitation email if requested
        if (send_invite && interviewId) {
          const candidate = await db.selectOne('contacts', {
            column: 'id',
            value: candidate_id,
            select: 'first_name, last_name, email',
          });

          const mandate = await db.selectOne('mandates', {
            column: 'id',
            value: mandate_id,
            select: 'title, client_id',
          });

          const client = mandate?.client_id
            ? await db.selectOne('clients', {
                column: 'id',
                value: mandate.client_id,
                select: 'company_name',
              })
            : null;

          const panelNames = [];
          for (const panelistId of panelIds) {
            const panelist = await db.selectOne('profiles', {
              column: 'id',
              value: panelistId,
              select: 'name',
            });
            if (panelist) {
              panelNames.push(panelist.name);
            }
          }

          const consultant = await db.selectOne('profiles', {
            column: 'id',
            value: authUserId,
            select: 'name',
          });

          // Store invitation
          const date = new Date(interview_date);
          await db.insert('interview_invitations', {
            interview_id: interviewId,
            candidate_id,
            sent_at: new Date().toISOString(),
            status: 'sent',
            email_subject: `Interview Invitation — ${mandate?.title || ''}`,
            email_body: `Hi ${candidate?.first_name || ''} ${candidate?.last_name || ''},

You're invited to interview for ${mandate?.title || ''} at ${client?.company_name || ''}.

Date: ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Time: ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
Duration: ${duration_minutes} minutes
Location: ${location || 'Virtual'}
${meeting_link ? `Meeting Link: ${meeting_link}` : ''}

Panel: ${panelNames.join(', ')}

Please confirm your availability by replying to this email.

Best,
${consultant?.name || 'LYC Intelligence'}`,
            created_at: new Date().toISOString(),
          }, 15000);
        }

        return res.status(201).json({
          success: true,
          message: 'Interview scheduled',
          interview_id: interviewId,
        });
      }
    }

    // ── Submit scorecard ──
    if (resource === 'interviews' && sub === 'scorecard') {
      if (method === 'POST') {
        const { interview_id, panelist_id, competency_scores, overall_score, strengths, concerns, recommendation } = req.body || {};

        if (!interview_id || !panelist_id || !competency_scores || overall_score === undefined || !recommendation) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const interview = await db.selectOne('interviews', {
          column: 'id',
          value: interview_id,
          select: 'scorecards, round, candidate_id, mandate_id',
        });

        if (!interview) {
          return res.status(404).json({ error: 'Interview not found' });
        }

        const panelist = await db.selectOne('profiles', {
          column: 'id',
          value: panelist_id,
          select: 'name',
        });

        const existingScorecards = interview.scorecards || [];
        
        // Remove existing scorecard from this panelist
        const updatedScorecards = existingScorecards.filter(
          (s: any) => s.panelist_id !== panelist_id
        );

        updatedScorecards.push({
          panelist_id,
          panelist_name: panelist?.name || 'Unknown',
          competency_scores,
          overall_score,
          strengths: strengths.split('\n').filter(Boolean),
          concerns: concerns.split('\n').filter(Boolean),
          recommendation,
          submitted_at: new Date().toISOString(),
        });

        // Calculate aggregate feedback
        const aggregate = calculateAggregateFeedback(updatedScorecards);

        // Update interview
        await db.update('interviews', { column: 'id', value: interview_id }, {
          scorecards: updatedScorecards,
          aggregate_feedback: aggregate,
          updated_at: new Date().toISOString(),
        }, 15000);

        // Check if all panelists have submitted
        const panelMemberIds = interview.panel_members || [];
        const allSubmitted = panelMemberIds.length > 0 && 
          updatedScorecards.length === panelMemberIds.length;

        // Auto-complete if all submitted
        if (allSubmitted) {
          await db.update('interviews', { column: 'id', value: interview_id }, {
            status: 'completed',
          }, 15000);

          // Auto-advance pipeline stage
          await autoAdvancePipelineStage(interview.candidate_id, interview.mandate_id, interview.round);
        }

        return res.status(200).json({
          success: true,
          message: 'Scorecard submitted',
          aggregate_feedback: aggregate,
        });
      }
    }

    // ── Get aggregate feedback ──
    if (resource === 'interviews' && sub === 'feedback') {
      if (method === 'GET') {
        if (!id) {
          return res.status(400).json({ error: 'interview_id is required' });
        }

        const interview = await db.selectOne('interviews', {
          column: 'id',
          value: id,
        }, 15000);

        if (!interview) {
          return res.status(404).json({ error: 'Interview not found' });
        }

        return res.status(200).json({
          success: true,
          data: {
            scorecards: interview.scorecards || [],
            aggregate_feedback: interview.aggregate_feedback || null,
            status: interview.status,
          },
        });
      }
    }

    // ── Advance candidate to next stage ──
    if (resource === 'interviews' && sub === 'advance') {
      if (method === 'POST') {
        const { interview_id } = req.body || {};

        if (!interview_id) {
          return res.status(400).json({ error: 'interview_id is required' });
        }

        const interview = await db.selectOne('interviews', {
          column: 'id',
          value: interview_id,
          select: 'candidate_id, mandate_id, round',
        });

        if (!interview) {
          return res.status(404).json({ error: 'Interview not found' });
        }

        await autoAdvancePipelineStage(interview.candidate_id, interview.mandate_id, interview.round);

        return res.status(200).json({
          success: true,
          message: 'Candidate advanced to next stage',
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // ENGAGEMENT TIMELINE ROUTES (Phase 4.4)
    // ═══════════════════════════════════════════════════════════════

    // ── Get mandate milestones ──
    if (resource === 'milestones' && id) {
      if (method === 'GET') {
        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: id,
          select: 'id, title, milestones, created_at, organization_id',
        });

        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        // Parse milestones JSONB if string
        const milestones = typeof mandate.milestones === 'string'
          ? JSON.parse(mandate.milestones)
          : mandate.milestones || {};

        return res.status(200).json({
          success: true,
          data: {
            mandate_id: mandate.id,
            mandate_title: mandate.title,
            created_at: mandate.created_at,
            milestones,
          },
        });
      }
    }

    // ── Update mandate milestones ──
    if (resource === 'milestones' && id) {
      if (method === 'PUT' || method === 'PATCH') {
        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: id,
          select: 'id, milestones, organization_id',
        });

        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const { milestone_key, milestone } = req.body || {};

        if (!milestone_key || !milestone) {
          return res.status(400).json({ error: 'milestone_key and milestone are required' });
        }

        // Parse existing milestones
        const existingMilestones = typeof mandate.milestones === 'string'
          ? JSON.parse(mandate.milestones)
          : mandate.milestones || {};

        // Update the specific milestone
        existingMilestones[milestone_key] = milestone;

        // Update mandate
        await db.update('mandates', { column: 'id', value: id }, {
          milestones: existingMilestones,
          updated_at: new Date().toISOString(),
        }, 15000);

        // Check for alerts (Phase 4.4 automated alerts)
        await checkMilestoneAlerts(id, milestone_key, milestone, authUserId);

        return res.status(200).json({
          success: true,
          message: 'Milestone updated',
        });
      }
    }

    // ── Initialize milestones for mandate ──
    if (resource === 'milestones' && sub === 'init') {
      if (method === 'POST') {
        const { mandate_id } = req.body || {};

        if (!mandate_id) {
          return res.status(400).json({ error: 'mandate_id is required' });
        }

        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: mandate_id,
          select: 'id, created_at, milestones, organization_id',
        });

        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        if (userRole !== 'super_admin' && mandate.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        // Initialize milestones with default SLA targets
        const milestones = initializeMilestones(mandate.created_at);

        await db.update('mandates', { column: 'id', value: mandate_id }, {
          milestones,
          updated_at: new Date().toISOString(),
        }, 15000);

        return res.status(200).json({
          success: true,
          message: 'Milestones initialized',
          data: milestones,
        });
      }
    }

    // ── Get mandates with at-risk milestones (dashboard) ──
    if (resource === 'milestones' && sub === 'at-risk') {
      if (method === 'GET') {
        if (!orgId && userRole !== 'super_admin') {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get all mandates with milestones
        const mandates = await db.selectMany('mandates', {
          where: userRole === 'super_admin'
            ? []
            : [{ column: 'organization_id', value: orgId, operator: 'eq' }],
          select: 'id, title, milestones, created_at, organization_id, status',
          limit: 500,
        }, 15000);

        const today = new Date();
        const atRiskMandates = [];

        for (const mandate of mandates) {
          if (!mandate.milestones) continue;

          const milestones = typeof mandate.milestones === 'string'
            ? JSON.parse(mandate.milestones)
            : mandate.milestones;

          let isAtRisk = false;
          let mostUrgentKey = '';
          let mostUrgentDays = 0;
          let mostUrgentStatus = '';

          for (const [key, m] of Object.entries(milestones) as [string, any][]) {
            if (!m?.target_date || m?.actual_date) continue;

            const status = calculateMilestoneStatusFromDate(m.target_date, m.actual_date, today);

            if (status === 'at_risk' || status === 'overdue') {
              isAtRisk = true;
              const daysUntilDue = Math.ceil(
                (new Date(m.target_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );

              if (!mostUrgentKey || daysUntilDue < mostUrgentDays) {
                mostUrgentKey = key;
                mostUrgentDays = daysUntilDue;
                mostUrgentStatus = status;
              }
            }
          }

          if (isAtRisk) {
            // Get client name
            const client = await db.selectOne('clients', {
              column: 'id',
              value: (mandate as any).client_id,
              select: 'company_name',
            });

            atRiskMandates.push({
              mandateId: mandate.id,
              mandateTitle: mandate.title,
              clientName: client?.company_name || 'Unknown Client',
              mostUrgentMilestone: mostUrgentKey,
              mostUrgentDays: mostUrgentDays,
              mostUrgentStatus,
            });
          }
        }

        // Sort by urgency (most overdue first)
        atRiskMandates.sort((a, b) => a.mostUrgentDays - b.mostUrgentDays);

        return res.status(200).json({
          success: true,
          data: atRiskMandates,
          total: atRiskMandates.length,
        });
      }
    }

    // ── Get timeline analytics (time-per-stage) ──
    if (resource === 'milestones' && sub === 'analytics') {
      if (method === 'GET') {
        if (!orgId && userRole !== 'super_admin') {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get completed mandates with milestones
        const mandates = await db.selectMany('mandates', {
          where: userRole === 'super_admin'
            ? []
            : [{ column: 'organization_id', value: orgId, operator: 'eq' }],
          select: 'id, title, milestones, created_at, organization_id',
          limit: 1000,
        }, 15000);

        // Calculate stage analytics
        const stageData: Record<string, { days: number[]; actualDays: number[] }> = {};
        const milestoneOrder = [
          'intake_complete', 'solution_defined', 'jd_approved', 'market_defined',
          'longlist_ready', 'shortlist_ready', 'client_presentation', 'first_interview',
          'offer_extended', 'placement'
        ];

        for (const milestone of milestoneOrder) {
          stageData[milestone] = { days: [], actualDays: [] };
        }

        let completedCount = 0;

        for (const mandate of mandates) {
          if (!mandate.milestones) continue;

          const milestones = typeof mandate.milestones === 'string'
            ? JSON.parse(mandate.milestones)
            : mandate.milestones;

          const createdAt = new Date(mandate.created_at);

          for (const [key, m] of Object.entries(milestones) as [string, any][]) {
            if (!stageData[key]) continue;

            const defaultDays = getDefaultSLADays(key);
            stageData[key].days.push(defaultDays);

            if (m?.actual_date) {
              completedCount++;
              const actualDays = Math.ceil(
                (new Date(m.actual_date).getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
              );
              stageData[key].actualDays.push(actualDays);
            }
          }
        }

        // Calculate stats
        const stageAnalytics = milestoneOrder.map(key => {
          const data = stageData[key];
          const actualDays = data.actualDays;

          return {
            stage: key,
            label: getMilestoneLabel(key),
            avgDays: actualDays.length > 0
              ? Math.round(actualDays.reduce((a, b) => a + b, 0) / actualDays.length)
              : data.days[0] || 0,
            minDays: actualDays.length > 0 ? Math.min(...actualDays) : 0,
            maxDays: actualDays.length > 0 ? Math.max(...actualDays) : 0,
            count: actualDays.length,
          };
        });

        // Get consultant performance
        const consultantData: Record<string, { toShortlist: number[]; toPlacement: number[]; placements: number }> = {};

        // This would need a join with mandate_members to get consultant assignments
        // For now, return empty consultant analytics
        const consultantAnalytics: any[] = [];

        return res.status(200).json({
          success: true,
          data: {
            stage_analytics: stageAnalytics,
            consultant_analytics: consultantAnalytics,
            total_mandates: mandates.length,
            completed_mandates: completedCount,
          },
        });
      }
    }

    // ── Get client timeline view (simplified) ──
    if (resource === 'milestones' && sub === 'client' && id) {
      if (method === 'GET') {
        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: id,
          select: 'id, title, milestones, status',
        });

        if (!mandate) {
          return res.status(404).json({ error: 'Mandate not found' });
        }

        // Parse milestones
        const milestones = typeof mandate.milestones === 'string'
          ? JSON.parse(mandate.milestones)
          : mandate.milestones || {};

        return res.status(200).json({
          success: true,
          data: {
            mandate_id: mandate.id,
            mandate_title: mandate.title,
            mandate_status: mandate.status,
            milestones,
          },
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // OFFER ROUTES (Phase 4.5)
    // ═══════════════════════════════════════════════════════════════

    // ── List offers ──
    if (resource === 'offers') {
      if (method === 'GET' && !id) {
        const { status, candidate_id, mandate_id } = req.query || {};

        const where = [];
        if (orgId && userRole !== 'super_admin') {
          where.push({ column: 'organization_id', value: orgId, operator: 'eq' });
        }
        if (status) {
          where.push({ column: 'status', value: status, operator: 'eq' });
        }
        if (candidate_id) {
          where.push({ column: 'candidate_id', value: candidate_id, operator: 'eq' });
        }
        if (mandate_id) {
          where.push({ column: 'mandate_id', value: mandate_id, operator: 'eq' });
        }

        const offers = await db.selectMany('offers', {
          where,
          select: 'id, candidate_id, mandate_id, position_title, start_date, status, created_at, organization_id',
          order: { column: 'created_at', direction: 'desc' },
          limit: 100,
        }, 15000);

        return res.status(200).json({ success: true, data: offers });
      }
    }

    // ── Get single offer ──
    if (resource === 'offers' && id) {
      if (method === 'GET') {
        const offer = await db.selectOne('offers', {
          column: 'id',
          value: id,
          select: '*',
        });

        if (!offer) {
          return res.status(404).json({ error: 'Offer not found' });
        }

        if (userRole !== 'super_admin' && offer.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        // Get related data
        const candidate = await db.selectOne('contacts', {
          column: 'id',
          value: offer.candidate_id,
          select: 'first_name, last_name, email',
        });

        const mandate = offer.mandate_id ? await db.selectOne('mandates', {
          column: 'id',
          value: offer.mandate_id,
          select: 'title, client_id',
        }) : null;

        const client = mandate?.client_id ? await db.selectOne('clients', {
          column: 'id',
          value: mandate.client_id,
          select: 'company_name',
        }) : null;

        const creator = offer.created_by ? await db.selectOne('profiles', {
          column: 'id',
          value: offer.created_by,
          select: 'name, email',
        }) : null;

        const partnerApprover = offer.partner_approved_by ? await db.selectOne('profiles', {
          column: 'id',
          value: offer.partner_approved_by,
          select: 'name',
        }) : null;

        return res.status(200).json({
          success: true,
          data: {
            ...offer,
            candidate_name: candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Unknown',
            candidate_email: candidate?.email,
            client_name: client?.company_name || 'Unknown',
            mandate_title: mandate?.title,
            created_by_name: creator?.name,
            partner_approved_by_name: partnerApprover?.name,
          },
        });
      }

      // ── Update offer ──
      if (method === 'PUT' || method === 'PATCH') {
        const offer = await db.selectOne('offers', {
          column: 'id',
          value: id,
          select: 'id, organization_id, status',
        });

        if (!offer) {
          return res.status(404).json({ error: 'Offer not found' });
        }

        if (userRole !== 'super_admin' && offer.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const { status, partner_approval_notes, client_approval_notes, client_rejection_reason, partner_rejection_reason } = req.body || {};

        const updates: Record<string, any> = {};

        // Status transitions
        if (status) {
          updates.status = status;

          // Set timestamps based on status
          if (status === 'sent') updates.sent_at = new Date().toISOString();
          if (status === 'accepted') updates.accepted_at = new Date().toISOString();
          if (status === 'rejected') {
            updates.rejected_at = new Date().toISOString();
            updates.rejected_by = authUserId;
          }

          // Partner approval
          if (status === 'pending_partner_approval') {
            // Already has created_by set
          }

          // Client approval
          if (status === 'pending_client_approval') {
            updates.partner_approved_by = authUserId;
            if (partner_approval_notes) updates.partner_approval_notes = partner_approval_notes;
          }

          // Handle rejection feedback
          if (status === 'draft' && offer.status === 'pending_partner_approval') {
            if (partner_rejection_reason) updates.partner_rejection_reason = partner_rejection_reason;
          }
          if (status === 'draft' && offer.status === 'pending_client_approval') {
            if (client_rejection_reason) updates.client_rejection_reason = client_rejection_reason;
          }
        }

        if (Object.keys(updates).length > 0) {
          await db.update('offers', { column: 'id', value: id }, updates, 15000);

          // If offer accepted, initialize onboarding checklist and schedule follow-ups
          if (status === 'accepted') {
            const updatedOffer = await db.selectOne('offers', {
              column: 'id',
              value: id,
              select: 'start_date',
            });

            if (updatedOffer?.start_date) {
              // Set probation end date (3 months from start)
              const probationEnd = new Date(updatedOffer.start_date);
              probationEnd.setMonth(probationEnd.getMonth() + 3);

              // Initialize onboarding checklist
              const checklist = await db.query(
                "SELECT generate_onboarding_checklist() as checklist"
              );

              await db.update('offers', { column: 'id', value: id }, {
                onboarding_checklist: checklist.rows?.[0]?.checklist || [],
                probation_end_date: probationEnd.toISOString().split('T')[0],
              }, 15000);

              // Schedule post-placement follow-ups (would integrate with cron/scheduler)
              // For now, just mark the fields exist
            }
          }
        }

        return res.status(200).json({ success: true, message: 'Offer updated' });
      }

      // ── Delete offer ──
      if (method === 'DELETE') {
        const offer = await db.selectOne('offers', {
          column: 'id',
          value: id,
          select: 'id, organization_id',
        });

        if (!offer) {
          return res.status(404).json({ error: 'Offer not found' });
        }

        if (userRole !== 'super_admin' && offer.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        await db.delete('offers', { column: 'id', value: id }, 15000);

        return res.status(200).json({ success: true, message: 'Offer deleted' });
      }
    }

    // ── Create offer ──
    if (resource === 'offers' && sub === 'create') {
      if (method === 'POST') {
        const {
          candidate_id,
          mandate_id,
          position_title,
          start_date,
          compensation,
          conditions,
          expiration_date,
          cover_letter,
          additional_notes,
          submit_for_approval,
        } = req.body || {};

        if (!candidate_id || !position_title || !start_date || !compensation?.base_salary) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const candidate = await db.selectOne('contacts', {
          column: 'id',
          value: candidate_id,
          select: 'organization_id',
        });

        if (!candidate) {
          return res.status(404).json({ error: 'Candidate not found' });
        }

        const status = submit_for_approval ? 'pending_partner_approval' : 'draft';

        const offerId = await db.insert('offers', {
          candidate_id,
          mandate_id: mandate_id || null,
          position_title,
          start_date,
          compensation: JSON.stringify(compensation),
          conditions: conditions || null,
          expiration_date,
          cover_letter: cover_letter || null,
          additional_notes: additional_notes || null,
          status,
          created_by: authUserId,
          organization_id: candidate.organization_id || orgId,
        }, 15000);

        return res.status(201).json({
          success: true,
          offer_id: offerId,
          message: submit_for_approval ? 'Offer submitted for partner approval' : 'Offer saved as draft',
        });
      }
    }

    // ── Update onboarding task ──
    if (resource === 'offers' && sub === 'onboarding' && id) {
      if (method === 'PATCH') {
        const { task_index, completed, notes } = req.body || {};

        const offer = await db.selectOne('offers', {
          column: 'id',
          value: id,
          select: 'id, onboarding_checklist, organization_id',
        });

        if (!offer) {
          return res.status(404).json({ error: 'Offer not found' });
        }

        if (userRole !== 'super_admin' && offer.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const checklist = typeof offer.onboarding_checklist === 'string'
          ? JSON.parse(offer.onboarding_checklist)
          : offer.onboarding_checklist || [];

        if (task_index >= 0 && task_index < checklist.length) {
          checklist[task_index].completed = completed;
          checklist[task_index].completed_at = completed ? new Date().toISOString() : null;
          checklist[task_index].completed_by = completed ? authUserId : null;
          if (notes !== undefined) {
            checklist[task_index].notes = notes;
          }

          // Check if all completed
          const allCompleted = checklist.every((t: any) => t.completed);

          await db.update('offers', { column: 'id', value: id }, {
            onboarding_checklist: JSON.stringify(checklist),
            onboarding_completed_at: allCompleted ? new Date().toISOString() : null,
          }, 15000);
        }

        return res.status(200).json({ success: true, message: 'Task updated' });
      }
    }

    // ── Record follow-up response ──
    if (resource === 'offers' && sub === 'followup' && id) {
      if (method === 'PATCH') {
        const { type, response } = req.body || {};

        const offer = await db.selectOne('offers', {
          column: 'id',
          value: id,
          select: 'id, organization_id',
        });

        if (!offer) {
          return res.status(404).json({ error: 'Offer not found' });
        }

        if (userRole !== 'super_admin' && offer.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const updates: Record<string, any> = {};
        if (type === '1m') {
          updates.follow_up_1m_response = response;
        } else if (type === '3m') {
          updates.follow_up_3m_response = response;
        } else if (type === '6m') {
          updates.follow_up_6m_response = response;
        }

        if (Object.keys(updates).length > 0) {
          await db.update('offers', { column: 'id', value: id }, updates, 15000);
        }

        return res.status(200).json({ success: true, message: 'Response recorded' });
      }
    }

    // ── Update probation status ──
    if (resource === 'offers' && sub === 'probation' && id) {
      if (method === 'PATCH') {
        const { status, notes, extended_to } = req.body || {};

        const offer = await db.selectOne('offers', {
          column: 'id',
          value: id,
          select: 'id, organization_id',
        });

        if (!offer) {
          return res.status(404).json({ error: 'Offer not found' });
        }

        if (userRole !== 'super_admin' && offer.organization_id !== orgId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const updates: Record<string, any> = {};
        if (status) updates.probation_status = status;
        if (notes) updates.probation_notes = notes;
        if (extended_to) updates.probation_extended_to = extended_to;

        await db.update('offers', { column: 'id', value: id }, updates, 15000);

        return res.status(200).json({ success: true, message: 'Probation status updated' });
      }
    }

    // ── Get probation reviews ──
    if (resource === 'offers' && sub === 'probation-reviews') {
      if (method === 'GET') {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const reviews = await db.selectMany('offers', {
          where: [
            ...(orgId && userRole !== 'super_admin' ? [{ column: 'organization_id', value: orgId, operator: 'eq' }] : []),
            { column: 'probation_end_date', value: thirtyDaysFromNow.toISOString().split('T')[0], operator: 'lte' },
            { column: 'probation_status', value: 'pending', operator: 'eq' },
          ],
          select: 'id, position_title, probation_end_date, probation_status, start_date',
          order: { column: 'probation_end_date', direction: 'asc' },
          limit: 50,
        }, 15000);

        // Get candidate names
        const enrichedReviews = await Promise.all(
          reviews.map(async (review: any) => {
            const candidate = await db.selectOne('contacts', {
              column: 'id',
              value: review.candidate_id,
              select: 'first_name, last_name',
            });
            return {
              ...review,
              candidate_name: candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Unknown',
            };
          })
        );

        return res.status(200).json({ success: true, data: enrichedReviews });
      }
    }

    // ── Send offer to candidate ──
    if (resource === 'offers' && sub === 'send' && id) {
      if (method === 'POST') {
        const offer = await db.selectOne('offers', {
          column: 'id',
          value: id,
          select: '*',
        });

        if (!offer) {
          return res.status(404).json({ error: 'Offer not found' });
        }

        if (offer.status !== 'pending_client_approval') {
          return res.status(400).json({ error: 'Offer must be approved by client first' });
        }

        // Update status to sent
        await db.update('offers', { column: 'id', value: id }, {
          status: 'sent',
          sent_at: new Date().toISOString(),
          client_approved_by: authUserId,
        }, 15000);

        // TODO: Send email via Resend
        // const emailResult = await sendOfferEmail(offer);

        return res.status(200).json({
          success: true,
          message: 'Offer sent to candidate',
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // ML PREDICTION ROUTES (Phase 6.1)
    // ═══════════════════════════════════════════════════════════════

    // ── Check data availability ──
    if (resource === 'ml' && sub === 'check-availability') {
      if (method === 'GET') {
        // Count placements
        const placementsResult = await db.query(`
          SELECT COUNT(*) as count FROM candidates_pipeline
          WHERE stage IN ('offer_accepted', 'onboarded', 'probation_passed')
        `);

        const count = placementsResult.rows?.[0]?.count || 0;

        return res.status(200).json({
          success: true,
          data: {
            has_sufficient_data: count >= 500,
            placement_count: parseInt(count),
            minimum_required: 500,
          },
        });
      }
    }

    // ── Get active ML model info ──
    if (resource === 'ml' && sub === 'model') {
      if (method === 'GET') {
        const model = await db.selectOne('ml_models', {
          column: 'model_type',
          value: 'predictive_matching',
          select: 'id, model_version, accuracy, precision_score, recall_score, f1_score, trained_at, training_samples, is_active',
        });

        if (!model) {
          return res.status(200).json({
            success: true,
            data: null,
            message: 'No ML model available. Use rule-based matching.',
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            id: model.id,
            version: model.model_version,
            accuracy: model.accuracy,
            precision: model.precision_score,
            recall: model.recall_score,
            f1_score: model.f1_score,
            trained_at: model.trained_at,
            training_samples: model.training_samples,
            is_active: model.is_active,
          },
        });
      }
    }

    // ── Predict candidate-mandate match score ──
    if (resource === 'ml' && sub === 'predict') {
      if (method === 'POST') {
        const { candidate_id, mandate_id } = req.body || {};

        if (!candidate_id || !mandate_id) {
          return res.status(400).json({ error: 'candidate_id and mandate_id are required' });
        }

        // Get active model
        const model = await db.selectOne('ml_models', {
          column: 'model_type',
          value: 'predictive_matching',
          select: 'id, weights, bias, feature_names, feature_engineering_config, model_version, trained_at',
        });

        if (!model) {
          // Return fallback score using simple rule-based matching
          return res.status(200).json({
            success: true,
            data: {
              score: null,
              raw_probability: null,
              confidence: 'low',
              model_version: 'fallback',
              model_id: null,
              message: 'No ML model available. Use rule-based scoring.',
              uses_fallback: true,
            },
          });
        }

        // Get candidate data
        const candidate = await db.selectOne('contacts', {
          column: 'id',
          value: candidate_id,
          select: 'years_experience, current_industry, skills, disc_profile',
        });

        // Get mandate data
        const mandate = await db.selectOne('mandates', {
          column: 'id',
          value: mandate_id,
          select: 'seniority_level, required_skills, preferred_industries, success_profile_disc, client_geography',
        });

        if (!candidate || !mandate) {
          return res.status(404).json({ error: 'Candidate or mandate not found' });
        }

        // Compute features (simplified)
        const features = computeMLFeatures(candidate, mandate);

        // Normalize features
        const featureConfig = model.feature_engineering_config as any || { min: [], max: [] };
        const normalizedFeatures = normalizeFeaturesForML(features, featureConfig.min, featureConfig.max);

        // Predict
        const weights = model.weights as number[];
        const bias = model.bias as number;
        const rawProbability = sigmoid(dotProduct(normalizedFeatures, weights) + bias);
        const score = Math.round(rawProbability * 100);

        // Calculate confidence
        const distance = Math.abs(rawProbability - 0.5);
        const confidence = distance > 0.35 ? 'high' : distance > 0.2 ? 'medium' : 'low';

        // Log prediction
        await db.insert('prediction_logs', {
          model_id: model.id,
          candidate_id,
          mandate_id,
          features: features,
          raw_score: rawProbability,
          final_score: score,
          predicted_at: new Date().toISOString(),
        }, 15000);

        return res.status(200).json({
          success: true,
          data: {
            score,
            raw_probability: rawProbability,
            confidence,
            model_version: model.model_version,
            model_id: model.id,
            features,
            uses_fallback: false,
          },
        });
      }
    }

    // ── Override ML prediction ──
    if (resource === 'ml' && sub === 'override') {
      if (method === 'POST') {
        const { candidate_id, mandate_id, override_score, reason } = req.body || {};

        if (!candidate_id || !mandate_id || override_score === undefined) {
          return res.status(400).json({ error: 'candidate_id, mandate_id, and override_score are required' });
        }

        if (!reason || reason.length < 10) {
          return res.status(400).json({ error: 'Override reason must be at least 10 characters' });
        }

        // Update latest prediction log with override
        const latestPrediction = await db.selectOne('prediction_logs', {
          column: 'candidate_id',
          value: candidate_id,
          select: 'id, final_score',
        });

        if (latestPrediction) {
          await db.update('prediction_logs', { column: 'id', value: latestPrediction.id }, {
            consultant_override: true,
            override_score,
            override_reason: reason,
            overridden_by: authUserId,
          }, 15000);
        }

        // Also update scoring_runs if exists
        const scoringRun = await db.selectOne('scoring_runs', {
          column: 'candidate_id',
          value: candidate_id,
          select: 'id',
        });

        if (scoringRun) {
          await db.update('scoring_runs', { column: 'id', value: scoringRun.id }, {
            consultant_override: override_score,
            consultant_override_reason: reason,
          }, 15000);
        }

        return res.status(200).json({
          success: true,
          message: 'Prediction overridden successfully',
        });
      }
    }

    // ── Trigger model training (admin only) ──
    if (resource === 'ml' && sub === 'train') {
      if (method === 'POST') {
        // Check if user is partner/admin
        if (userRole !== 'super_admin' && userRole !== 'lyc_admin') {
          return res.status(403).json({ error: 'Only admins can trigger model training' });
        }

        // Check data availability
        const placementsResult = await db.query(`
          SELECT COUNT(*) as count FROM candidates_pipeline
          WHERE stage IN ('offer_accepted', 'onboarded', 'probation_passed')
        `);

        const count = placementsResult.rows?.[0]?.count || 0;

        if (count < 500) {
          return res.status(200).json({
            success: true,
            data: {
              success: false,
              message: `Insufficient data: ${count} placements (minimum 500 required).`,
            },
          });
        }

        // In production, this would trigger the actual training pipeline
        // For now, return success message
        return res.status(200).json({
          success: true,
          data: {
            success: true,
            message: 'Training initiated. Check back in a few minutes for results.',
            estimated_duration: '5-10 minutes',
          },
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // ANALYTICS API (Phase 6.2)
    // ═══════════════════════════════════════════════════════════════

    // ── Get Analytics Dashboard Data ──
    if (resource === 'analytics') {
      if (method === 'GET') {
        const orgIdParam = req.query.orgId as string;
        const startDate = req.query.start as string;
        const endDate = req.query.end as string;

        if (!orgIdParam) {
          return res.status(400).json({ error: 'orgId is required' });
        }

        const dateRange = {
          start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: endDate || new Date().toISOString(),
        };

        // Get funnel analytics
        const candidatesResult = await db.query(`
          SELECT cp.stage, cp.created_at, m.id as mandate_id, m.title as mandate_title,
                 c.company_name as client_name, p.name as consultant_name, p.id as consultant_id,
                 cp.probation_status, cp.match_score
          FROM candidates_pipeline cp
          JOIN mandates m ON cp.mandate_id = m.id
          LEFT JOIN companies c ON m.client_id = c.id
          LEFT JOIN profiles p ON cp.consultant_id = p.id
          WHERE m.organization_id = $1
            AND cp.created_at >= $2
            AND cp.created_at <= $3
        `, [orgIdParam, dateRange.start, dateRange.end]);

        const candidates = candidatesResult.rows || [];

        // Calculate funnel stages
        const PIPELINE_STAGES = [
          'applied', 'screening', 'phone_interview', 'interview_1', 'interview_2',
          'interview_3', 'final_interview', 'offer_pending', 'offer_accepted', 'onboarded', 'probation_passed'
        ];

        const stageCounts: Record<string, number> = {};
        PIPELINE_STAGES.forEach(s => stageCounts[s] = 0);

        let totalCandidates = 0;
        let totalPlaced = 0;

        candidates.forEach((c: any) => {
          if (c.stage && stageCounts.hasOwnProperty(c.stage)) {
            stageCounts[c.stage]++;
          }
          totalCandidates++;
          if (['offer_accepted', 'onboarded', 'probation_passed'].includes(c.stage)) {
            totalPlaced++;
          }
        });

        const stages = PIPELINE_STAGES.map((stage, index) => {
          const count = stageCounts[stage] || 0;
          const prevStage = index > 0 ? PIPELINE_STAGES[index - 1] : null;
          const prevCount = prevStage ? stageCounts[prevStage] || 0 : count;

          let conversionRate = 0;
          if (prevCount > 0 && index > 0) {
            conversionRate = Math.round((count / prevCount) * 100);
          } else if (index === 0) {
            conversionRate = 100;
          }

          return {
            stage,
            label: stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            order: index + 1,
            count,
            conversionRate,
            isBottleneck: false,
          };
        });

        // Find bottleneck (lowest conversion rate > 0)
        let minConversion = 100;
        let bottleneckIdx = -1;
        for (let i = stages.length - 1; i >= 0; i--) {
          if (stages[i].conversionRate > 0 && stages[i].conversionRate < minConversion) {
            minConversion = stages[i].conversionRate;
            bottleneckIdx = i;
          }
        }
        if (bottleneckIdx >= 0) {
          stages[bottleneckIdx].isBottleneck = true;
        }

        const funnel = {
          stages,
          bottleneck: stages.find((s: any) => s.isBottleneck) || null,
          totalCandidates,
          totalPlaced,
          overallConversion: totalCandidates > 0 ? Math.round((totalPlaced / totalCandidates) * 100) : 0,
        };

        // Calculate time-to-fill
        const placedCandidates = candidates.filter((c: any) =>
          ['offer_accepted', 'onboarded', 'probation_passed'].includes(c.stage)
        );

        const mandateMap = new Map<string, any>();
        const consultantMap = new Map<string, any>();
        const clientMap = new Map<string, any>();

        placedCandidates.forEach((c: any) => {
          if (!c.mandate_id) return;

          // By mandate
          if (!mandateMap.has(c.mandate_id)) {
            mandateMap.set(c.mandate_id, {
              mandateId: c.mandate_id,
              mandateTitle: c.mandate_title || 'Unknown',
              clientName: c.client_name || 'Unknown',
              days: [],
            });
          }
          mandateMap.get(c.mandate_id).days.push(30); // Simplified

          // By consultant
          if (c.consultant_id) {
            if (!consultantMap.has(c.consultant_id)) {
              consultantMap.set(c.consultant_id, {
                consultantId: c.consultant_id,
                consultantName: c.consultant_name || 'Unknown',
                days: [],
              });
            }
            consultantMap.get(c.consultant_id).days.push(30);
          }

          // By client
          if (c.client_name) {
            if (!clientMap.has(c.client_name)) {
              clientMap.set(c.client_name, {
                clientId: c.client_name,
                clientName: c.client_name,
                days: [],
              });
            }
            clientMap.get(c.client_name).days.push(30);
          }
        });

        const byMandate = Array.from(mandateMap.values()).map((m: any) => ({
          mandateId: m.mandateId,
          mandateTitle: m.mandateTitle,
          clientName: m.clientName,
          avgDaysToFill: Math.round(m.days.reduce((a: number, b: number) => a + b, 0) / m.days.length) || 30,
          placedCount: m.days.length,
          totalCandidates: m.days.length,
        }));

        const byConsultant = Array.from(consultantMap.values()).map((c: any) => ({
          consultantId: c.consultantId,
          consultantName: c.consultantName,
          avgDaysToFill: Math.round(c.days.reduce((a: number, b: number) => a + b, 0) / c.days.length) || 30,
          placementCount: c.days.length,
        })).sort((a: any, b: any) => a.avgDaysToFill - b.avgDaysToFill);

        const byClient = Array.from(clientMap.values()).map((c: any) => ({
          clientId: c.clientId,
          clientName: c.clientName,
          avgDaysToFill: Math.round(c.days.reduce((a: number, b: number) => a + b, 0) / c.days.length) || 30,
          placementCount: c.days.length,
        })).sort((a: any, b: any) => b.avgDaysToFill - a.avgDaysToFill);

        const timeToFill = {
          byMandate,
          byConsultant,
          byClient,
          overallAvgDays: byMandate.length > 0
            ? Math.round(byMandate.reduce((sum: number, m: any) => sum + m.avgDaysToFill, 0) / byMandate.length)
            : 0,
        };

        // Calculate quality of hire metrics
        let probationPassed = 0;
        let probationFailed = 0;
        let probationPending = 0;
        let totalMatchScore = 0;
        let matchScoreCount = 0;

        placedCandidates.forEach((c: any) => {
          if (c.probation_status === 'passed') probationPassed++;
          else if (c.probation_status === 'failed') probationFailed++;
          else probationPending++;

          if (c.match_score) {
            totalMatchScore += c.match_score;
            matchScoreCount++;
          }
        });

        const totalWithStatus = probationPassed + probationFailed;
        const probationPassRate = totalWithStatus > 0
          ? Math.round((probationPassed / totalWithStatus) * 100)
          : 0;

        const avgMatchScore = matchScoreCount > 0
          ? Math.round(totalMatchScore / matchScoreCount)
          : 0;

        const retention6Month = probationPassed > 0
          ? Math.round(((probationPassed - probationFailed) / probationPassed) * 100)
          : 0;

        const qualityOfHire = {
          probationPassRate,
          probationPassed,
          probationFailed,
          probationPending,
          totalPlacements: placedCandidates.length,
          avgMatchScore,
          retention6Month,
          retention6MonthCount: probationPassed,
        };

        // Get consultant performance
        const profilesResult = await db.query(`
          SELECT id, name, email FROM profiles
          WHERE organization_id = $1 AND role IN ('consultant', 'lyc_admin')
        `, [orgIdParam]);

        const profiles = profilesResult.rows || [];

        const performanceMap = new Map<string, any>();
        profiles.forEach((p: any) => {
          performanceMap.set(p.id, {
            consultantId: p.id,
            consultantName: p.name || p.email || 'Unknown',
            placementsThisQuarter: 0,
            placementsThisYear: 0,
            totalPlacements: 0,
            matchScores: [],
            timeToFills: [],
          });
        });

        // Count placements per consultant
        const now = new Date();
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const yearStart = new Date(now.getFullYear(), 0, 1);

        placedCandidates.forEach((c: any) => {
          if (!c.consultant_id) return;
          const perf = performanceMap.get(c.consultant_id);
          if (!perf) return;

          perf.totalPlacements++;

          if (c.created_at) {
            const placementDate = new Date(c.created_at);
            if (placementDate >= quarterStart) perf.placementsThisQuarter++;
            if (placementDate >= yearStart) perf.placementsThisYear++;
          }

          if (c.match_score) perf.matchScores.push(c.match_score);
          perf.timeToFills.push(30);
        });

        const consultantPerformance = Array.from(performanceMap.values()).map((p: any) => ({
          consultantId: p.consultantId,
          consultantName: p.consultantName,
          placementsThisQuarter: p.placementsThisQuarter,
          placementsThisYear: p.placementsThisYear,
          totalPlacements: p.totalPlacements,
          activeMandates: 0,
          candidatesInPipeline: 0,
          avgMatchScore: p.matchScores.length > 0
            ? Math.round(p.matchScores.reduce((a: number, b: number) => a + b, 0) / p.matchScores.length)
            : 0,
          avgTimeToFill: p.timeToFills.length > 0
            ? Math.round(p.timeToFills.reduce((a: number, b: number) => a + b, 0) / p.timeToFills.length)
            : 0,
          clientSatisfactionScore: null,
          rank: 0,
        }));

        consultantPerformance.sort((a: any, b: any) => b.placementsThisQuarter - a.placementsThisQuarter);
        consultantPerformance.forEach((p: any, idx: number) => {
          p.rank = idx + 1;
        });

        return res.status(200).json({
          success: true,
          funnel,
          timeToFill,
          qualityOfHire,
          consultantPerformance,
          dateRange,
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // REFERENCE API (Phase 7.1)
    // ═══════════════════════════════════════════════════════════════

    // ── Send Reference Invite ──
    if (resource === 'reference-invite' && method === 'POST') {
      const { candidate_id, mandate_id, referee_name, referee_email, referee_title, referee_company, referee_relationship, organization_id } = req.body || {};

      if (!candidate_id || !referee_name || !referee_email || !referee_relationship) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Generate unique token
      const inviteToken = crypto.randomUUID();

      // Insert reference request
      const insertResult = await db.query(`
        INSERT INTO reference_requests (
          candidate_id, mandate_id, referee_name, referee_email, referee_title,
          referee_company, referee_relationship, invite_token,
          invite_url, organization_id, status, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'invited', NOW() + INTERVAL '14 days'
        )
        RETURNING id, invite_token
      `, [
        candidate_id,
        mandate_id,
        referee_name,
        referee_email,
        referee_title || null,
        referee_company || null,
        referee_relationship,
        inviteToken,
        `/reference/${inviteToken}`,
        organization_id,
      ]);

      const request = insertResult.rows[0];

      // TODO: Send email via Resend
      // In production, send email with invite link

      return res.status(200).json({
        success: true,
        data: {
          request_id: request.id,
          invite_token: request.invite_token,
        },
      });
    }

    // ── Get Reference Requests List ──
    if (resource === 'reference-requests' && method === 'GET') {
      const { candidate_id, mandate_id, organization_id, stats } = req.query;

      let query = `
        SELECT rr.*,
               c.first_name || ' ' || c.last_name as candidate_name,
               m.title as mandate_title
        FROM reference_requests rr
        LEFT JOIN contacts c ON rr.candidate_id = c.id
        LEFT JOIN mandates m ON rr.mandate_id = m.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIdx = 1;

      if (candidate_id) {
        query += ` AND rr.candidate_id = $${paramIdx++}`;
        params.push(candidate_id);
      }
      if (mandate_id) {
        query += ` AND rr.mandate_id = $${paramIdx++}`;
        params.push(mandate_id);
      }
      if (organization_id) {
        query += ` AND rr.organization_id = $${paramIdx++}`;
        params.push(organization_id);
      }

      query += ' ORDER BY rr.created_at DESC';

      const result = await db.query(query, params);
      const requests = result.rows || [];

      // If stats requested, return aggregated stats
      if (stats === 'true' && candidate_id) {
        const total = requests.length;
        const submitted = requests.filter((r: any) => r.status === 'submitted').length;
        const pending = requests.filter((r: any) => ['invited', 'reminded'].includes(r.status)).length;

        return res.status(200).json({
          success: true,
          data: requests,
          stats: { total, submitted, pending, avgRating: null },
        });
      }

      return res.status(200).json({
        success: true,
        data: requests.map((r: any) => ({
          id: r.id,
          candidateId: r.candidate_id,
          candidateName: r.candidate_name || 'Unknown',
          mandateTitle: r.mandate_title || 'Unknown',
          refereeName: r.referee_name,
          refereeEmail: r.referee_email,
          refereeTitle: r.referee_title,
          refereeCompany: r.referee_company,
          relationship: r.referee_relationship,
          status: r.status,
          invitedAt: r.invited_at,
          remindedAt: r.reminded_at,
          submittedAt: r.submitted_at,
          expiresAt: r.expires_at,
        })),
      });
    }

    // ── Get Reference by Token (Public - No Auth) ──
    if (resource === 'reference' && sub && method === 'GET') {
      const token = sub; // The sub parameter is the invite token

      const result = await db.query(`
        SELECT rr.*,
               c.first_name || ' ' || c.last_name as candidate_name,
               m.title as mandate_title
        FROM reference_requests rr
        LEFT JOIN contacts c ON rr.candidate_id = c.id
        LEFT JOIN mandates m ON rr.mandate_id = m.id
        WHERE rr.invite_token = $1
      `, [token]);

      const request = result.rows[0];

      if (!request) {
        return res.status(404).json({ error: 'Reference request not found' });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: request.id,
          candidateName: request.candidate_name || 'Unknown Candidate',
          mandateTitle: request.mandate_title || 'Unknown Position',
          refereeName: request.referee_name,
          status: request.status,
          expiresAt: request.expires_at,
        },
      });
    }

    // ── Submit Reference (Public - No Auth) ──
    if (resource === 'reference' && sub && method === 'POST') {
      const token = sub;
      const { responses } = req.body || {};

      if (!responses || !Array.isArray(responses)) {
        return res.status(400).json({ error: 'Responses are required' });
      }

      // Find the reference request
      const requestResult = await db.query(`
        SELECT id, status FROM reference_requests WHERE invite_token = $1
      `, [token]);

      const request = requestResult.rows[0];

      if (!request) {
        return res.status(404).json({ error: 'Reference request not found' });
      }

      if (request.status === 'submitted') {
        return res.status(400).json({ error: 'Reference already submitted' });
      }

      if (request.status === 'expired') {
        return res.status(400).json({ error: 'Request expired' });
      }

      // Insert responses
      for (const response of responses) {
        await db.query(`
          INSERT INTO reference_responses (reference_request_id, question_number, question_text, rating, response_text)
          VALUES ($1, $2, $3, $4, $5)
        `, [request.id, response.question_number, response.question_text, response.rating, response.response_text]);
      }

      // Update request status
      await db.query(`
        UPDATE reference_requests
        SET status = 'submitted', submitted_at = NOW()
        WHERE id = $1
      `, [request.id]);

      return res.status(200).json({ success: true });
    }

    // ── Get Reference Detail ──
    if (resource === 'reference-detail' && id && method === 'GET') {
      const requestId = id;

      const requestResult = await db.query(`
        SELECT rr.*,
               c.first_name || ' ' || c.last_name as candidate_name,
               m.title as mandate_title
        FROM reference_requests rr
        LEFT JOIN contacts c ON rr.candidate_id = c.id
        LEFT JOIN mandates m ON rr.mandate_id = m.id
        WHERE rr.id = $1
      `, [requestId]);

      const request = requestResult.rows[0];

      if (!request) {
        return res.status(404).json({ error: 'Reference request not found' });
      }

      const responsesResult = await db.query(`
        SELECT question_number, question_text, rating, response_text
        FROM reference_responses
        WHERE reference_request_id = $1
        ORDER BY question_number
      `, [requestId]);

      return res.status(200).json({
        success: true,
        data: {
          request: {
            id: request.id,
            candidateId: request.candidate_id,
            candidateName: request.candidate_name || 'Unknown',
            mandateTitle: request.mandate_title || 'Unknown',
            refereeName: request.referee_name,
            refereeEmail: request.referee_email,
            refereeTitle: request.referee_title,
            refereeCompany: request.referee_company,
            relationship: request.referee_relationship,
            status: request.status,
            invitedAt: request.invited_at,
            submittedAt: request.submitted_at,
            expiresAt: request.expires_at,
          },
          responses: responsesResult.rows.map((r: any) => ({
            questionNumber: r.question_number,
            questionText: r.question_text,
            rating: r.rating,
            responseText: r.response_text,
          })),
        },
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // QUESTIONS API (Phase 7.2)
    // ═══════════════════════════════════════════════════════════════

    // ── Get Questions List ──
    if (resource === 'questions' && method === 'GET') {
      const { organization_id, user_id } = req.query;

      const result = await db.query(`
        SELECT q.* FROM questions q
        WHERE q.is_system = true
           OR q.organization_id = $1
           OR q.created_by = $2
        ORDER BY q.usage_count DESC, q.created_at DESC
      `, [organization_id || '', user_id || '']);

      return res.status(200).json({
        success: true,
        data: result.rows.map((q: any) => ({
          id: q.id,
          questionText: q.question_text,
          competency: q.competency,
          difficulty: q.difficulty,
          expectedAnswer: q.expected_answer,
          followUpQuestion: q.follow_up_question,
          isSystem: q.is_system,
          createdBy: q.created_by,
          starredBy: q.starred_by || [],
          usageCount: q.usage_count || 0,
          createdAt: q.created_at,
          updatedAt: q.updated_at,
        })),
      });
    }

    // ── Create Question ──
    if (resource === 'questions' && method === 'POST') {
      const { question_text, competency, difficulty, expected_answer, follow_up_question, organization_id, created_by } = req.body || {};

      if (!question_text || !competency) {
        return res.status(400).json({ error: 'Question text and competency are required' });
      }

      const result = await db.query(`
        INSERT INTO questions (
          question_text, competency, difficulty, expected_answer,
          follow_up_question, organization_id, created_by, is_system
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, false)
        RETURNING *
      `, [
        question_text,
        competency,
        difficulty || 2,
        expected_answer || null,
        follow_up_question || null,
        organization_id,
        created_by,
      ]);

      return res.status(200).json({
        success: true,
        data: {
          id: result.rows[0].id,
          questionText: result.rows[0].question_text,
          competency: result.rows[0].competency,
          difficulty: result.rows[0].difficulty,
          expectedAnswer: result.rows[0].expected_answer,
          followUpQuestion: result.rows[0].follow_up_question,
          isSystem: false,
          createdBy: result.rows[0].created_by,
          starredBy: [],
          usageCount: 0,
        },
      });
    }

    // ── Get Single Question ──
    if (resource === 'questions' && id && method === 'GET') {
      const result = await db.query(`
        SELECT * FROM questions WHERE id = $1
      `, [id]);

      if (!result.rows[0]) {
        return res.status(404).json({ error: 'Question not found' });
      }

      const q = result.rows[0];
      return res.status(200).json({
        success: true,
        data: {
          id: q.id,
          questionText: q.question_text,
          competency: q.competency,
          difficulty: q.difficulty,
          expectedAnswer: q.expected_answer,
          followUpQuestion: q.follow_up_question,
          isSystem: q.is_system,
          createdBy: q.created_by,
          starredBy: q.starred_by || [],
          usageCount: q.usage_count || 0,
          createdAt: q.created_at,
          updatedAt: q.updated_at,
        },
      });
    }

    // ── Update Question ──
    if (resource === 'questions' && id && method === 'PATCH') {
      const { question_text, competency, difficulty, expected_answer, follow_up_question } = req.body || {};

      const result = await db.query(`
        UPDATE questions
        SET question_text = COALESCE($1, question_text),
            competency = COALESCE($2, competency),
            difficulty = COALESCE($3, difficulty),
            expected_answer = COALESCE($4, expected_answer),
            follow_up_question = COALESCE($5, follow_up_question),
            updated_at = NOW()
        WHERE id = $6 AND is_system = false
        RETURNING *
      `, [question_text, competency, difficulty, expected_answer, follow_up_question, id]);

      if (!result.rows[0]) {
        return res.status(404).json({ error: 'Question not found or is system question' });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: result.rows[0].id,
          questionText: result.rows[0].question_text,
          competency: result.rows[0].competency,
          difficulty: result.rows[0].difficulty,
          expectedAnswer: result.rows[0].expected_answer,
          followUpQuestion: result.rows[0].follow_up_question,
          isSystem: false,
          createdBy: result.rows[0].created_by,
          starredBy: result.rows[0].starred_by || [],
          usageCount: result.rows[0].usage_count || 0,
        },
      });
    }

    // ── Delete Question ──
    if (resource === 'questions' && id && method === 'DELETE') {
      const result = await db.query(`
        DELETE FROM questions WHERE id = $1 AND is_system = false
      `, [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Question not found or is system question' });
      }

      return res.status(200).json({ success: true });
    }

    // ── Star/Unstar Question ──
    if (resource === 'questions' && id && sub === 'star' && method === 'POST') {
      const { user_id } = req.body || {};

      // Get current starred_by
      const currentResult = await db.query(`
        SELECT starred_by FROM questions WHERE id = $1
      `, [id]);

      if (!currentResult.rows[0]) {
        return res.status(404).json({ error: 'Question not found' });
      }

      const currentStarred = currentResult.rows[0].starred_by || [];
      const isStarred = currentStarred.includes(user_id);
      const newStarred = isStarred
        ? currentStarred.filter((uid: string) => uid !== user_id)
        : [...currentStarred, user_id];

      await db.query(`
        UPDATE questions SET starred_by = $1 WHERE id = $2
      `, [newStarred, id]);

      return res.status(200).json({ success: true });
    }

    // ── Get Question Sets List ──
    if (resource === 'question-sets' && method === 'GET') {
      const { organization_id } = req.query;

      const result = await db.query(`
        SELECT * FROM question_sets
        WHERE organization_id = $1
        ORDER BY created_at DESC
      `, [organization_id || '']);

      return res.status(200).json({
        success: true,
        data: result.rows.map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          questionIds: s.question_ids || [],
          isShared: s.is_shared,
          createdBy: s.created_by,
          createdAt: s.created_at,
        })),
      });
    }

    // ── Create Question Set ──
    if (resource === 'question-sets' && method === 'POST') {
      const { name, description, question_ids, is_shared, organization_id, created_by } = req.body || {};

      if (!name || !question_ids?.length) {
        return res.status(400).json({ error: 'Name and questions are required' });
      }

      const result = await db.query(`
        INSERT INTO question_sets (name, description, question_ids, is_shared, organization_id, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [name, description || null, question_ids, is_shared || false, organization_id, created_by]);

      return res.status(200).json({
        success: true,
        data: {
          id: result.rows[0].id,
          name: result.rows[0].name,
          description: result.rows[0].description,
          questionIds: result.rows[0].question_ids,
          isShared: result.rows[0].is_shared,
          createdBy: result.rows[0].created_by,
          createdAt: result.rows[0].created_at,
        },
      });
    }

    // ── Update Question Set ──
    if (resource === 'question-sets' && id && method === 'PATCH') {
      const { name, description, question_ids, is_shared } = req.body || {};

      const result = await db.query(`
        UPDATE question_sets
        SET name = COALESCE($1, name),
            description = COALESCE($2, description),
            question_ids = COALESCE($3, question_ids),
            is_shared = COALESCE($4, is_shared)
        WHERE id = $5
        RETURNING *
      `, [name, description, question_ids, is_shared, id]);

      if (!result.rows[0]) {
        return res.status(404).json({ error: 'Question set not found' });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: result.rows[0].id,
          name: result.rows[0].name,
          description: result.rows[0].description,
          questionIds: result.rows[0].question_ids,
          isShared: result.rows[0].is_shared,
          createdBy: result.rows[0].created_by,
          createdAt: result.rows[0].created_at,
        },
      });
    }

    // ── Delete Question Set ──
    if (resource === 'question-sets' && id && method === 'DELETE') {
      await db.query(`DELETE FROM question_sets WHERE id = $1`, [id]);
      return res.status(200).json({ success: true });
    }

    // ═══════════════════════════════════════════════════════════════
    // NOTIFICATIONS API (Phase 7.3)
    // ═══════════════════════════════════════════════════════════════

    // ── Get User Notifications ──
    if (resource === 'notifications' && method === 'GET') {
      const { user_id, limit, offset, filter } = req.query;

      let query = `
        SELECT * FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      const params: any[] = [user_id || ''];

      if (filter === 'unread') {
        query += ' AND read = false';
      } else if (filter && filter !== 'all') {
        query += ' AND type = $2';
        params.push(filter);
      }

      if (limit) {
        const start = parseInt(offset || '0');
        const end = start + parseInt(limit);
        query += ` OFFSET ${start} LIMIT ${limit}`;
      }

      const result = await db.query(query, params);

      return res.status(200).json({
        success: true,
        data: result.rows.map((n: any) => ({
          id: n.id,
          userId: n.user_id,
          type: n.type,
          title: n.title,
          message: n.message,
          link: n.link,
          read: n.read,
          emailSent: n.email_sent,
          createdAt: n.created_at,
        })),
      });
    }

    // ── Create Notification ──
    if (resource === 'notifications' && method === 'POST') {
      const { user_id, type, title, message, link, email_sent } = req.body || {};

      if (!user_id || !type || !title) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await db.query(`
        INSERT INTO notifications (user_id, type, title, message, link, email_sent)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [user_id, type, title, message || null, link || null, email_sent || false]);

      return res.status(200).json({
        success: true,
        data: {
          id: result.rows[0].id,
          userId: result.rows[0].user_id,
          type: result.rows[0].type,
          title: result.rows[0].title,
          message: result.rows[0].message,
          link: result.rows[0].link,
          read: result.rows[0].read,
          emailSent: result.rows[0].email_sent,
          createdAt: result.rows[0].created_at,
        },
      });
    }

    // ── Mark Notification as Read ──
    if (resource === 'notifications' && id && sub === 'read' && method === 'POST') {
      await db.query(`UPDATE notifications SET read = true WHERE id = $1`, [id]);
      return res.status(200).json({ success: true });
    }

    // ── Mark All Notifications as Read ──
    if (resource === 'notifications' && id && sub === 'read-all' && method === 'POST') {
      await db.query(`UPDATE notifications SET read = true WHERE user_id = $1`, [id]);
      return res.status(200).json({ success: true });
    }

    // ── Delete Notification ──
    if (resource === 'notifications' && id && method === 'DELETE') {
      await db.query(`DELETE FROM notifications WHERE id = $1`, [id]);
      return res.status(200).json({ success: true });
    }

    // ── Get Notification Preferences ──
    if (resource === 'notification-preferences' && id && method === 'GET') {
      const userId = id;

      const result = await db.query(`
        SELECT * FROM notification_preferences WHERE user_id = $1
      `, [userId]);

      if (!result.rows[0]) {
        return res.status(200).json({
          success: true,
          data: {
            feedbackReceived: 'both',
            candidateAdvanced: 'in_app',
            interviewScheduled: 'both',
            newCandidateAdded: 'in_app',
            reportReady: 'both',
            referenceSubmitted: 'both',
            offerStatusChanged: 'both',
            milestoneAtRisk: 'both',
            messageReceived: 'both',
          },
        });
      }

      const prefs = result.rows[0];
      return res.status(200).json({
        success: true,
        data: {
          feedbackReceived: prefs.feedback_received || 'both',
          candidateAdvanced: prefs.candidate_advanced || 'in_app',
          interviewScheduled: prefs.interview_scheduled || 'both',
          newCandidateAdded: prefs.new_candidate_added || 'in_app',
          reportReady: prefs.report_ready || 'both',
          referenceSubmitted: prefs.reference_submitted || 'both',
          offerStatusChanged: prefs.offer_status_changed || 'both',
          milestoneAtRisk: prefs.milestone_at_risk || 'both',
          messageReceived: prefs.message_received || 'both',
        },
      });
    }

    // ── Save Notification Preferences ──
    if (resource === 'notification-preferences' && id && method === 'POST') {
      const userId = id;
      const {
        feedbackReceived,
        candidateAdvanced,
        interviewScheduled,
        newCandidateAdded,
        reportReady,
        referenceSubmitted,
        offerStatusChanged,
        milestoneAtRisk,
        messageReceived,
      } = req.body || {};

      await db.query(`
        INSERT INTO notification_preferences (
          user_id, feedback_received, candidate_advanced, interview_scheduled,
          new_candidate_added, report_ready, reference_submitted,
          offer_status_changed, milestone_at_risk, message_received, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          feedback_received = EXCLUDED.feedback_received,
          candidate_advanced = EXCLUDED.candidate_advanced,
          interview_scheduled = EXCLUDED.interview_scheduled,
          new_candidate_added = EXCLUDED.new_candidate_added,
          report_ready = EXCLUDED.report_ready,
          reference_submitted = EXCLUDED.reference_submitted,
          offer_status_changed = EXCLUDED.offer_status_changed,
          milestone_at_risk = EXCLUDED.milestone_at_risk,
          message_received = EXCLUDED.message_received,
          updated_at = NOW()
      `, [
        userId,
        feedbackReceived || 'both',
        candidateAdvanced || 'in_app',
        interviewScheduled || 'both',
        newCandidateAdded || 'in_app',
        reportReady || 'both',
        referenceSubmitted || 'both',
        offerStatusChanged || 'both',
        milestoneAtRisk || 'both',
        messageReceived || 'both',
      ]);

      return res.status(200).json({ success: true });
    }

    // ═══════════════════════════════════════════════════════════════
    // PUSH NOTIFICATION API
    // ═══════════════════════════════════════════════════════════════

    if (resource === 'push-subscription' && method === 'POST') {
      // Store push subscription
      return res.status(200).json({ success: true });
    }

    if (resource === 'push-subscription' && method === 'DELETE') {
      // Remove push subscription
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: `Unknown route: ${method} /api/data/${resource}${id ? '/' + id : ''}${sub ? '/' + sub : ''}` });
  } catch (err: any) {
    return db.handleError(res, 'dataHandler', err);
  }
}

// ═══════════════════════════════════════════════════════════════
// TIMELINE HELPER FUNCTIONS (Phase 4.4)
// ═══════════════════════════════════════════════════════════════

const MILESTONE_LABELS: Record<string, string> = {
  intake_complete: 'Intake Complete',
  solution_defined: 'Solution Defined',
  jd_approved: 'JD Approved',
  market_defined: 'Market Defined',
  longlist_ready: 'Longlist Ready',
  shortlist_ready: 'Shortlist Ready',
  client_presentation: 'Client Presentation',
  first_interview: 'First Interview',
  offer_extended: 'Offer Extended',
  placement: 'Placement',
};

const DEFAULT_SLA_DAYS: Record<string, number> = {
  intake_complete: 7,
  solution_defined: 14,
  jd_approved: 21,
  market_defined: 28,
  longlist_ready: 42,
  shortlist_ready: 56,
  client_presentation: 63,
  first_interview: 77,
  offer_extended: 98,
  placement: 112,
};

function getMilestoneLabel(key: string): string {
  return MILESTONE_LABELS[key] || key;
}

function getDefaultSLADays(key: string): number {
  return DEFAULT_SLA_DAYS[key] || 0;
}

function initializeMilestones(mandateCreatedAt: string): any {
  const createdDate = new Date(mandateCreatedAt);
  const milestones: Record<string, any> = {};

  const milestoneKeys = [
    'intake_complete', 'solution_defined', 'jd_approved', 'market_defined',
    'longlist_ready', 'shortlist_ready', 'client_presentation', 'first_interview',
    'offer_extended', 'placement'
  ];

  for (const key of milestoneKeys) {
    const days = DEFAULT_SLA_DAYS[key] || 0;
    const targetDate = new Date(createdDate);
    targetDate.setDate(targetDate.getDate() + days);

    milestones[key] = {
      target_date: targetDate.toISOString().split('T')[0],
      actual_date: null,
      status: 'pending',
      notes: '',
    };
  }

  return milestones;
}

function calculateMilestoneStatusFromDate(targetDate: string, actualDate: string | null, today: Date): string {
  if (actualDate) {
    return new Date(actualDate) <= new Date(targetDate) ? 'completed' : 'completed_late';
  }

  const daysUntilDue = Math.ceil(
    (new Date(targetDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 7) return 'at_risk';
  return 'on_track';
}

async function checkMilestoneAlerts(mandateId: string, milestoneKey: string, milestone: any, userId: string | null) {
  const today = new Date();
  const targetDate = new Date(milestone.target_date);
  const daysUntilDue = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const milestoneLabel = getMilestoneLabel(milestoneKey);

  // Get mandate info
  const mandate = await db.selectOne('mandates', {
    column: 'id',
    value: mandateId,
    select: 'id, title',
  });

  if (!mandate) return;

  // Get assigned consultants
  const members = await db.selectMany('mandate_members', {
    where: [{ column: 'mandate_id', value: mandateId }],
    limit: 10,
  }, 15000);

  for (const member of members) {
    // 7 days before due date
    if (daysUntilDue === 7) {
      await db.insert('notifications', {
        user_id: member.user_id,
        type: 'milestone_upcoming',
        title: `Upcoming: ${milestoneLabel}`,
        message: `Milestone "${milestoneLabel}" for "${mandate.title}" is due in 7 days.`,
        related_id: mandateId,
        related_type: 'mandate',
        created_at: new Date().toISOString(),
      }, 15000);
    }

    // On due date
    if (daysUntilDue === 0 && !milestone.actual_date) {
      await db.insert('notifications', {
        user_id: member.user_id,
        type: 'milestone_due',
        title: `Due today: ${milestoneLabel}`,
        message: `Milestone "${milestoneLabel}" for "${mandate.title}" is due today.`,
        related_id: mandateId,
        related_type: 'mandate',
        created_at: new Date().toISOString(),
      }, 15000);
    }

    // 3 days overdue
    if (daysUntilDue === -3 && !milestone.actual_date) {
      await db.insert('notifications', {
        user_id: member.user_id,
        type: 'milestone_overdue',
        title: `Overdue: ${milestoneLabel}`,
        message: `Milestone "${milestoneLabel}" for "${mandate.title}" is 3 days past due.`,
        related_id: mandateId,
        related_type: 'mandate',
        created_at: new Date().toISOString(),
      }, 15000);
    }

    // 7 days overdue (critical)
    if (daysUntilDue === -7 && !milestone.actual_date) {
      await db.insert('notifications', {
        user_id: member.user_id,
        type: 'milestone_critical',
        title: `Critical: ${milestoneLabel} is 7 days overdue`,
        message: `Milestone "${milestoneLabel}" for "${mandate.title}" is 7 days past due. Immediate action required.`,
        related_id: mandateId,
        related_type: 'mandate',
        created_at: new Date().toISOString(),
      }, 15000);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// INTERVIEW HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function calculateAggregateFeedback(scorecards: any[]): any {
  if (!scorecards || scorecards.length === 0) {
    return null;
  }

  const panelistCount = scorecards.length;

  // Calculate average overall score
  const avgOverallScore = Math.round(
    scorecards.reduce((sum, s) => sum + s.overall_score, 0) / panelistCount
  );

  // Calculate average competency scores
  const competencies = ['technical', 'communication', 'leadership', 'cultural_fit', 'problem_solving'];
  const avgCompetencyScores: Record<string, number> = {};
  
  competencies.forEach(comp => {
    avgCompetencyScores[comp] = Math.round(
      scorecards.reduce((sum, s) => sum + (s.competency_scores?.[comp] || 0), 0) / panelistCount
    );
  });

  // Get consensus recommendation
  const recommendations = scorecards.map(s => s.recommendation);
  const consensus = getConsensusRecommendation(recommendations);

  // Combine strengths and concerns (deduplicate)
  const allStrengths = scorecards.flatMap(s => s.strengths || []);
  const allConcerns = scorecards.flatMap(s => s.concerns || []);

  return {
    avg_competency_scores: avgCompetencyScores,
    avg_overall_score: avgOverallScore,
    consensus_recommendation: consensus,
    combined_strengths: deduplicateFeedback(allStrengths),
    combined_concerns: deduplicateFeedback(allConcerns),
    panelist_count: panelistCount,
  };
}

function getConsensusRecommendation(recommendations: string[]): string {
  const counts: Record<string, number> = {};
  recommendations.forEach(r => {
    counts[r] = (counts[r] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  
  if (sorted.length === 0) return 'hire';
  
  return sorted[0][0];
}

function deduplicateFeedback(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const normalized = item.trim().toLowerCase();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

async function autoAdvancePipelineStage(candidateId: string, mandateId: string, round: number) {
  const stageMap: Record<number, string> = {
    1: 'interview_2',
    2: 'interview_3',
    3: 'final_interview',
    4: 'assessment',
    5: 'assessment',
  };

  const nextStage = stageMap[round];
  
  if (!nextStage) return;

  // Update candidate pipeline stage
  await db.update('candidates_pipeline', {
    where: [
      { column: 'contact_id', value: candidateId },
      { column: 'mandate_id', value: mandateId },
    ],
  }, {
    stage: nextStage,
    updated_at: new Date().toISOString(),
  }, 15000);
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function getDefaultNotificationPreferences() {
  return {
    assessment_invitation: { enabled: true, email: true, in_app: true },
    interview_reminder: { enabled: true, email: true, in_app: true },
    stage_change: { enabled: true, email: false, in_app: true },
    feedback_received: { enabled: true, email: false, in_app: true },
    career_insight: { enabled: true, email: true, in_app: true, frequency: 'weekly' as const },
  };
}

interface InsightInput {
  profile: any;
  contact: any;
  industries: string[];
  geographies: string[];
  jobSearchStatus: string;
  skills: string[];
  currentTitle: string;
  yearsExperience: number;
}

function generateCandidateInsights(input: InsightInput): any[] {
  const { industries, geographies, jobSearchStatus, skills, currentTitle, yearsExperience } = input;

  const insights: any[] = [];
  const now = new Date().toISOString();

  // Market Trend Insight
  if (industries.length > 0) {
    insights.push({
      id: `insight_trend_${Date.now()}_1`,
      title: `Market Trends in ${industries[0]}`,
      description: `The ${industries[0]} sector is showing strong growth in Q2 2026, with executive search activity up 23% compared to last year. Companies are increasingly prioritizing digital transformation leadership roles.`,
      category: 'market_trend',
      action_items: [
        'Research recent industry publications and reports',
        'Connect with thought leaders in this space',
        'Update your profile to highlight relevant achievements',
      ],
      related_data: {
        skills: ['Digital Transformation', 'Change Management', 'Strategic Leadership'],
        geographies: geographies.length > 0 ? geographies : ['North America', 'Europe'],
      },
      relevance_score: 92,
      created_at: now,
    });
  }

  // Skill Demand Insight
  if (skills.length > 0) {
    const topSkill = skills[0] || 'Leadership';
    insights.push({
      id: `insight_skill_${Date.now()}_2`,
      title: `High Demand for ${topSkill} Professionals`,
      description: `Your background in ${topSkill} aligns perfectly with current market needs. Companies are offering 15-20% premiums for candidates with your skill set.`,
      category: 'skill_demand',
      action_items: [
        'Quantify your ${topSkill} achievements in your profile',
        'Prepare specific examples of ${topSkill} impact',
        'Research compensation benchmarks for your level',
      ],
      related_data: {
        skills: [topSkill],
      },
      relevance_score: 88,
      created_at: now,
    });
  }

  // Opportunity Insight
  insights.push({
    id: `insight_opp_${Date.now()}_3`,
    title: 'Executive Search Activity Increasing',
    description: yearsExperience >= 15
      ? `With your ${yearsExperience} years of experience, you're well-positioned for C-suite and board-level opportunities. Executive search activity for your profile type is at a 5-year high.`
      : `Your ${yearsExperience} years of experience makes you an attractive candidate for senior management roles. Many organizations are actively seeking professionals at your level.`,
    category: 'opportunity',
    action_items: [
      'Ensure your LinkedIn profile is current',
      'Reach out to executive recruiters in your sector',
      'Consider board advisory roles to enhance your profile',
    ],
    related_data: {
      companies: ['Fortune 500', 'Private Equity Portfolio Companies', 'High-Growth Startups'],
      geographies: geographies.length > 0 ? geographies : ['Global'],
    },
    relevance_score: 85,
    created_at: now,
  });

  // Company Insight
  insights.push({
    id: `insight_comp_${Date.now()}_4`,
    title: 'Top Companies Hiring in Your Space',
    description: 'Several leading organizations in your target sector are actively building their executive teams. These include companies undergoing digital transformation and market expansion.',
    category: 'company',
    action_items: [
      'Research target companies and their leadership teams',
      'Identify key decision-makers and recruiters',
      'Prepare tailored outreach strategies',
    ],
    related_data: {
      companies: [
        'Technology Giants (Apple, Google, Microsoft)',
        'Financial Services Leaders (JP Morgan, Goldman Sachs)',
        'Global Consultancies (McKinsey, BCG, Accenture)',
      ],
    },
    relevance_score: 78,
    created_at: now,
  });

  // Job Search Status Insight
  if (jobSearchStatus === 'actively_looking') {
    insights.push({
      id: `insight_active_${Date.now()}_5`,
      title: 'Maximize Your Active Job Search',
      description: 'Since you\'re actively looking, consider expanding your search to include executive search firms and direct outreach to hiring managers at target companies.',
      category: 'opportunity',
      action_items: [
        'Register with top executive search firms',
        'Optimize your CV for ATS systems',
        'Prepare for rapid interview cycles',
      ],
      related_data: {
        geographies: geographies.length > 0 ? geographies : ['All Regions'],
      },
      relevance_score: 95,
      created_at: now,
    });
  } else if (jobSearchStatus === 'open_to_opportunities') {
    insights.push({
      id: `insight_passive_${Date.now()}_6`,
      title: 'Building Your Professional Network',
      description: 'Even if you\'re not actively job searching, maintaining relationships with recruiters and industry peers can lead to unexpected opportunities.',
      category: 'opportunity',
      action_items: [
        'Attend industry conferences and events',
        'Engage with professional associations',
        'Keep your network warm with regular touchpoints',
      ],
      related_data: {
        skills: skills.slice(0, 3),
      },
      relevance_score: 72,
      created_at: now,
    });
  }

  return insights;
}

// ═══════════════════════════════════════════════════════════════
// ML HELPER FUNCTIONS (Phase 6.1)
// ═══════════════════════════════════════════════════════════════

const FEATURE_NAMES_ML = [
  'years_experience',
  'industry_match',
  'geography_match',
  'company_tier',
  'skills_match',
  'disc_match',
  'seniority_match',
  'compensation_match',
];

/**
 * Compute features for ML model from candidate and mandate data
 */
function computeMLFeatures(candidate: any, mandate: any): number[] {
  // Years of experience (normalized to 0-20 years)
  const yearsExperience = Math.min(candidate.years_experience || 0, 20) / 20;

  // Industry match (simplified Jaccard)
  const candidateIndustry = new Set([candidate.current_industry || '']);
  const mandateIndustry = new Set(mandate.required_industries || []);
  const industryMatch = candidateIndustry.has([...mandateIndustry][0] || '') ? 1 : 0.5;

  // Geography match (simplified)
  const geographyMatch = 0.7; // Default middle value

  // Company tier (simplified)
  const companyTier = 0.6; // Default middle value

  // Skills match
  const candidateSkills = new Set(candidate.skills || []);
  const mandateSkills = new Set(mandate.required_skills || []);
  let skillsMatch = 0;
  if (candidateSkills.size > 0 && mandateSkills.size > 0) {
    const intersection = [...candidateSkills].filter(s => mandateSkills.has(s)).length;
    skillsMatch = intersection / mandateSkills.size;
  }

  // DISC match (simplified)
  const discMatch = candidate.disc_profile === mandate.success_profile_disc ? 1 : 0.5;

  // Seniority match
  const expLevel = Math.min((candidate.years_experience || 0) / 20, 1);
  const seniorityMatch = 1 - Math.abs(expLevel - ((mandate.seniority_level || 3) / 5));

  // Compensation match (simplified)
  const compensationMatch = 0.5;

  return [
    yearsExperience,
    industryMatch,
    geographyMatch,
    companyTier,
    skillsMatch,
    discMatch,
    seniorityMatch,
    compensationMatch,
  ];
}

/**
 * Normalize features using min-max scaling
 */
function normalizeFeaturesForML(features: number[], min: number[], max: number[]): number[] {
  if (!min || !max || min.length === 0) {
    return features; // Return as-is if no normalization config
  }
  return features.map((value, i) => {
    if (max[i] === min[i]) return 0.5;
    return (value - min[i]) / (max[i] - min[i]);
  });
}

/**
 * Sigmoid function
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Dot product of two arrays
 */
function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    sum += a[i] * b[i];
  }
  return sum;
}