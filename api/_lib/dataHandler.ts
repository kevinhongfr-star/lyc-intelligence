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
  const id = pathArr[1] || '';
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

    return res.status(404).json({ error: `Unknown route: ${method} /api/data/${resource}${id ? '/' + id : ''}` });
  } catch (err: any) {
    return db.handleError(res, 'dataHandler', err);
  }
}