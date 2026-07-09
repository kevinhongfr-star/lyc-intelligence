import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateAgentRequest,
  successResponse,
  errorResponse,
  getServiceSupabase,
  type SamuelPayload,
} from '../../lib/agentUtils';

export const maxDuration = 30;

const AGENT = 'samuel';

async function handleCreateProposal(payload: SamuelPayload, sb: any) {
  if (!payload.proposal?.title) {
    throw new Error('Proposal title is required.');
  }

  const { data, error } = await sb
    .from('proposals')
    .insert({
      title: payload.proposal.title,
      client_account_id: payload.proposal.client_account_id,
      mandate_id: payload.proposal.mandate_id,
      status: payload.proposal.status || 'draft',
      value: payload.proposal.value,
      currency: payload.proposal.currency || 'USD',
      valid_until: payload.proposal.valid_until,
      terms: payload.proposal.terms,
      file_url: payload.proposal.file_url,
      created_by: 'samuel',
    })
    .select()
    .single();

  if (error) throw new Error(`Proposal insert error: ${error.message}`);

  return {
    tablesWritten: ['proposals'],
    recordsCreated: 1,
    message: `Proposal "${payload.proposal.title}" created successfully.`,
  };
}

async function handleUpdateClient(payload: SamuelPayload, sb: any) {
  if (!payload.client_account?.company_name) {
    throw new Error('Client company name is required.');
  }

  const { data: existing } = await sb
    .from('client_accounts')
    .select('id')
    .ilike('company_name', `%${payload.client_account.company_name}%`)
    .limit(1);

  if (existing && existing.length > 0) {
    const { error } = await sb
      .from('client_accounts')
      .update({
        contact_person: payload.client_account.contact_person,
        email: payload.client_account.email,
        phone: payload.client_account.phone,
        industry: payload.client_account.industry,
        status: payload.client_account.status,
        contract_value: payload.client_account.contract_value,
        payment_terms: payload.client_account.payment_terms,
        notes: payload.client_account.notes,
      })
      .eq('id', existing[0].id);

    if (error) throw new Error(`Client update error: ${error.message}`);

    return {
      tablesWritten: ['client_accounts'],
      recordsCreated: 0,
      message: `Client "${payload.client_account.company_name}" updated successfully.`,
    };
  }

  const { data, error } = await sb
    .from('client_accounts')
    .insert({
      company_name: payload.client_account.company_name,
      contact_person: payload.client_account.contact_person,
      email: payload.client_account.email,
      phone: payload.client_account.phone,
      industry: payload.client_account.industry,
      status: payload.client_account.status || 'lead',
      contract_value: payload.client_account.contract_value,
      payment_terms: payload.client_account.payment_terms,
      notes: payload.client_account.notes,
    })
    .select()
    .single();

  if (error) throw new Error(`Client insert error: ${error.message}`);

  return {
    tablesWritten: ['client_accounts'],
    recordsCreated: 1,
    message: `Client "${payload.client_account.company_name}" created successfully.`,
  };
}

async function handleCreateContract(payload: SamuelPayload, sb: any) {
  if (!payload.contract?.title) {
    throw new Error('Contract title is required.');
  }

  const { data, error } = await sb
    .from('contracts')
    .insert({
      client_account_id: payload.contract.client_account_id,
      mandate_id: payload.contract.mandate_id,
      proposal_id: payload.contract.proposal_id,
      contract_number: payload.contract.contract_number,
      title: payload.contract.title,
      status: payload.contract.status || 'draft',
      value: payload.contract.value,
      currency: payload.contract.currency || 'USD',
      start_date: payload.contract.start_date,
      end_date: payload.contract.end_date,
      signed_at: payload.contract.signed_at,
      signed_by: payload.contract.signed_by,
      file_url: payload.contract.file_url,
      terms_summary: payload.contract.terms_summary,
      created_by: 'samuel',
    })
    .select()
    .single();

  if (error) throw new Error(`Contract insert error: ${error.message}`);

  return {
    tablesWritten: ['contracts'],
    recordsCreated: 1,
    message: `Contract "${payload.contract.title}" created successfully.`,
  };
}

async function handleCreateInvoice(payload: SamuelPayload, sb: any) {
  if (!payload.invoice?.invoice_number) {
    throw new Error('Invoice number is required.');
  }

  const { data, error } = await sb
    .from('invoices')
    .insert({
      contract_id: payload.invoice.contract_id,
      client_account_id: payload.invoice.client_account_id,
      invoice_number: payload.invoice.invoice_number,
      type: payload.invoice.type || 'standard',
      status: payload.invoice.status || 'draft',
      amount: payload.invoice.amount,
      currency: payload.invoice.currency || 'USD',
      due_date: payload.invoice.due_date,
      paid_at: payload.invoice.paid_at,
      payment_ref: payload.invoice.payment_ref,
      line_items: payload.invoice.line_items,
      notes: payload.invoice.notes,
      created_by: 'samuel',
    })
    .select()
    .single();

  if (error) throw new Error(`Invoice insert error: ${error.message}`);

  return {
    tablesWritten: ['invoices'],
    recordsCreated: 1,
    message: `Invoice ${payload.invoice.invoice_number} created successfully.`,
  };
}

async function handleLogPayment(payload: SamuelPayload, sb: any) {
  if (!payload.payment?.invoice_id || !payload.payment?.amount) {
    throw new Error('Invoice ID and amount are required for payment.');
  }

  const { data, error } = await sb
    .from('payments')
    .insert({
      invoice_id: payload.payment.invoice_id,
      amount: payload.payment.amount,
      currency: payload.payment.currency || 'USD',
      payment_date: payload.payment.payment_date || new Date().toISOString(),
      method: payload.payment.method || 'wire',
      reference: payload.payment.reference,
      status: payload.payment.status || 'confirmed',
      notes: payload.payment.notes,
    })
    .select()
    .single();

  if (error) throw new Error(`Payment insert error: ${error.message}`);

  return {
    tablesWritten: ['payments'],
    recordsCreated: 1,
    message: 'Payment logged successfully.',
  };
}

const ACTION_HANDLERS: Record<string, (p: SamuelPayload, sb: any) => Promise<any>> = {
  create_proposal: handleCreateProposal,
  update_client: handleUpdateClient,
  create_contract: handleCreateContract,
  create_invoice: handleCreateInvoice,
  log_payment: handleLogPayment,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const validation = validateAgentRequest(req, res, AGENT);
  if (!validation.valid) return;

  const { action, body } = validation;
  const payload = body.payload as SamuelPayload || {};

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
    console.error(`[agents/samuel] Action "${action}" error:`, e);
    return errorResponse(res, 500, AGENT, e.message || 'Internal server error.');
  }
}
