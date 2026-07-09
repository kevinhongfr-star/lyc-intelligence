import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateAgentRequest,
  successResponse,
  errorResponse,
  getServiceSupabase,
  type AlessioPayload,
} from '../../lib/agentUtils';

export const maxDuration = 30;

const AGENT = 'alessio';

async function handleAddCandidate(payload: AlessioPayload, sb: any) {
  const tablesWritten: string[] = [];
  let recordsCreated = 0;

  if (payload.contact) {
    const { data: contact, error: contactError } = await sb
      .from('contacts')
      .insert({
        name: payload.contact.name,
        title: payload.contact.title,
        email: payload.contact.email,
        phone: payload.contact.phone,
        linkedin_url: payload.contact.linkedin_url,
        location: payload.contact.location,
        industry: payload.contact.industry,
        function: payload.contact.function,
        seniority: payload.contact.seniority,
        source: payload.contact.source || 'alessio',
        notes: payload.contact.notes,
        cv_url: payload.contact.cv_url,
        status: payload.contact.status || 'new',
      })
      .select()
      .single();

    if (contactError) throw new Error(`Contact insert error: ${contactError.message}`);
    tablesWritten.push('contacts');
    recordsCreated++;

    if (payload.mandate_id && contact?.id) {
      const { error: pipelineError } = await sb
        .from('candidates_pipeline')
        .insert({
          contact_id: contact.id,
          mandate_id: payload.mandate_id,
          stage: payload.stage || 'new',
          status: 'active',
          notes: payload.notes,
          owner: 'alessio',
        });

      if (pipelineError) throw new Error(`Pipeline insert error: ${pipelineError.message}`);
      tablesWritten.push('candidates_pipeline');
      recordsCreated++;
    }

    return { tablesWritten, recordsCreated, message: `Candidate ${payload.contact.name} added successfully.` };
  }

  return { tablesWritten, recordsCreated, message: 'No contact data provided.' };
}

async function handleAddCompany(payload: AlessioPayload, sb: any) {
  if (!payload.company?.name) {
    throw new Error('Company name is required.');
  }

  const { data, error } = await sb
    .from('companies')
    .insert({
      name: payload.company.name,
      industry: payload.company.industry,
      size: payload.company.size,
      location: payload.company.location,
      website: payload.company.website,
      description: payload.company.description,
      client_status: payload.company.client_status || 'prospect',
      notes: payload.company.notes,
    })
    .select()
    .single();

  if (error) throw new Error(`Company insert error: ${error.message}`);

  return {
    tablesWritten: ['companies'],
    recordsCreated: 1,
    message: `Company ${payload.company.name} added successfully.`,
  };
}

async function handleAddMandate(payload: AlessioPayload, sb: any) {
  if (!payload.mandate?.title) {
    throw new Error('Mandate title is required.');
  }

  const { data, error } = await sb
    .from('mandates')
    .insert({
      title: payload.mandate.title,
      client_account_id: payload.mandate.client_account_id,
      status: payload.mandate.status || 'open',
      priority: payload.mandate.priority,
      location: payload.mandate.location,
      function: payload.mandate.function,
      level: payload.mandate.level,
      compensation_range: payload.mandate.compensation_range,
      description: payload.mandate.description,
      jd_text: payload.mandate.jd_text,
    })
    .select()
    .single();

  if (error) throw new Error(`Mandate insert error: ${error.message}`);

  return {
    tablesWritten: ['mandates'],
    recordsCreated: 1,
    message: `Mandate "${payload.mandate.title}" created successfully.`,
  };
}

async function handleAddDocument(payload: AlessioPayload, sb: any) {
  if (!payload.document?.file_url) {
    throw new Error('Document file_url is required.');
  }

  const { data, error } = await sb
    .from('documents')
    .insert({
      contact_id: payload.document.contact_id,
      mandate_id: payload.document.mandate_id,
      type: payload.document.type || 'cv',
      file_url: payload.document.file_url,
      uploaded_by: 'alessio',
      version: payload.document.version || '1.0',
    })
    .select()
    .single();

  if (error) throw new Error(`Document insert error: ${error.message}`);

  return {
    tablesWritten: ['documents'],
    recordsCreated: 1,
    message: 'Document uploaded successfully.',
  };
}

async function handleUpdateStatus(payload: AlessioPayload, sb: any) {
  if (!payload.contact?.name || !payload.stage) {
    throw new Error('Contact name and stage are required for status update.');
  }

  const { data: contacts } = await sb
    .from('contacts')
    .select('id')
    .ilike('name', `%${payload.contact.name}%`)
    .limit(1);

  if (!contacts || contacts.length === 0) {
    throw new Error('Contact not found.');
  }

  const contactId = contacts[0].id;
  const mandateId = payload.mandate_id;

  if (mandateId) {
    const { error } = await sb
      .from('candidates_pipeline')
      .update({ stage: payload.stage, notes: payload.notes })
      .eq('contact_id', contactId)
      .eq('mandate_id', mandateId);

    if (error) throw new Error(`Pipeline update error: ${error.message}`);
  }

  return {
    tablesWritten: ['candidates_pipeline'],
    recordsCreated: 0,
    message: `Candidate status updated to "${payload.stage}".`,
  };
}

const ACTION_HANDLERS: Record<string, (p: AlessioPayload, sb: any) => Promise<any>> = {
  add_candidate: handleAddCandidate,
  add_company: handleAddCompany,
  add_mandate: handleAddMandate,
  add_document: handleAddDocument,
  update_status: handleUpdateStatus,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const validation = validateAgentRequest(req, res, AGENT);
  if (!validation.valid) return;

  const { action, body } = validation;
  const payload = body.payload as AlessioPayload || {};

  const sb = getServiceSupabase();
  if (!sb) {
    return errorResponse(res, 500, AGENT, 'Supabase is not configured.');
  }

  try {
    const handler = ACTION_HANDLERS[action];
    if (!handler) {
      return errorResponse(
        res,
        400,
        AGENT,
        `Unknown action "${action}". Supported actions: ${Object.keys(ACTION_HANDLERS).join(', ')}`
      );
    }

    const result = await handler(payload, sb);
    return successResponse(
      res,
      AGENT,
      action,
      result.recordsCreated || 0,
      result.tablesWritten || [],
      result.message || 'Action completed.'
    );
  } catch (e: any) {
    console.error(`[agents/alessio] Action "${action}" error:`, e);
    return errorResponse(res, 500, AGENT, e.message || 'Internal server error.');
  }
}
