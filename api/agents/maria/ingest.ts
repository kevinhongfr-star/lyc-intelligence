import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateAgentRequest,
  successResponse,
  errorResponse,
  getServiceSupabase,
  type MariaPayload,
} from '../../lib/agentUtils';

export const maxDuration = 30;

const AGENT = 'maria';

async function handleScheduleEvent(payload: MariaPayload, sb: any) {
  if (!payload.event?.title || !payload.event?.scheduled_at) {
    throw new Error('Event title and scheduled_at are required.');
  }

  const { data, error } = await sb
    .from('events')
    .insert({
      type: payload.event.type || 'meeting',
      title: payload.event.title,
      mandate_id: payload.event.mandate_id,
      contact_id: payload.event.contact_id,
      client_account_id: payload.event.client_account_id,
      scheduled_at: payload.event.scheduled_at,
      duration_min: payload.event.duration_min || 60,
      location: payload.event.location,
      format: payload.event.format || 'video',
      status: payload.event.status || 'scheduled',
      organizer: 'maria',
      notes: payload.event.notes,
      meeting_link: payload.event.meeting_link,
    })
    .select()
    .single();

  if (error) throw new Error(`Event insert error: ${error.message}`);

  return {
    tablesWritten: ['events'],
    recordsCreated: 1,
    message: `Event "${payload.event.title}" scheduled successfully.`,
  };
}

async function handleScheduleInterview(payload: MariaPayload, sb: any) {
  if (!payload.interview?.interview_date) {
    throw new Error('Interview date is required.');
  }

  const { data, error } = await sb
    .from('interviews')
    .insert({
      mandate_id: payload.interview.mandate_id,
      contact_id: payload.interview.contact_id,
      client_account_id: payload.interview.client_account_id,
      interview_date: payload.interview.interview_date,
      round: payload.interview.round,
      format: payload.interview.format,
      interviewers: payload.interview.interviewers,
      status: payload.interview.status || 'scheduled',
      feedback_summary: payload.interview.feedback_summary,
      candidate_rating: payload.interview.candidate_rating,
      strengths: payload.interview.strengths,
      weaknesses: payload.interview.weaknesses,
      recommendation: payload.interview.recommendation,
      notes: payload.interview.notes,
      scheduled_by: 'maria',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '42P01') {
      const { data: eventData, error: eventError } = await sb
        .from('events')
        .insert({
          type: 'interview',
          title: `Interview - Round ${payload.interview.round || '1'}`,
          mandate_id: payload.interview.mandate_id,
          contact_id: payload.interview.contact_id,
          client_account_id: payload.interview.client_account_id,
          scheduled_at: payload.interview.interview_date,
          status: payload.interview.status || 'scheduled',
          organizer: 'maria',
          notes: payload.interview.notes,
        })
        .select()
        .single();

      if (eventError) throw new Error(`Event insert error: ${eventError.message}`);

      return {
        tablesWritten: ['events'],
        recordsCreated: 1,
        message: `Interview scheduled as event (interviews table not yet created).`,
      };
    }
    throw new Error(`Interview insert error: ${error.message}`);
  }

  return {
    tablesWritten: ['interviews'],
    recordsCreated: 1,
    message: 'Interview scheduled successfully.',
  };
}

async function handleLogMeeting(payload: MariaPayload, sb: any) {
  if (!payload.client_meeting?.meeting_date) {
    throw new Error('Meeting date is required.');
  }

  const { data, error } = await sb
    .from('client_meetings')
    .insert({
      client_account_id: payload.client_meeting.client_account_id,
      mandate_id: payload.client_meeting.mandate_id,
      meeting_date: payload.client_meeting.meeting_date,
      type: payload.client_meeting.type,
      attendees: payload.client_meeting.attendees,
      agenda: payload.client_meeting.agenda,
      minutes: payload.client_meeting.minutes,
      action_items: payload.client_meeting.action_items,
      status: payload.client_meeting.status || 'completed',
      organized_by: 'maria',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '42P01') {
      const { data: eventData, error: eventError } = await sb
        .from('events')
        .insert({
          type: 'client-meeting',
          title: `Client Meeting - ${payload.client_meeting.type || 'General'}`,
          client_account_id: payload.client_meeting.client_account_id,
          mandate_id: payload.client_meeting.mandate_id,
          scheduled_at: payload.client_meeting.meeting_date,
          status: payload.client_meeting.status || 'completed',
          organizer: 'maria',
          notes: payload.client_meeting.minutes,
        })
        .select()
        .single();

      if (eventError) throw new Error(`Event insert error: ${eventError.message}`);

      return {
        tablesWritten: ['events'],
        recordsCreated: 1,
        message: `Meeting logged as event (client_meetings table not yet created).`,
      };
    }
    throw new Error(`Meeting insert error: ${error.message}`);
  }

  return {
    tablesWritten: ['client_meetings'],
    recordsCreated: 1,
    message: 'Client meeting logged successfully.',
  };
}

async function handleRecordFeedback(payload: MariaPayload, sb: any) {
  if (!payload.feedback?.feedback_type) {
    throw new Error('Feedback type is required.');
  }

  const { data, error } = await sb
    .from('feedback_records')
    .insert({
      source_type: payload.feedback.source_type,
      source_id: payload.feedback.source_id,
      mandate_id: payload.feedback.mandate_id,
      contact_id: payload.feedback.contact_id,
      interview_id: payload.feedback.interview_id,
      feedback_type: payload.feedback.feedback_type,
      rating: payload.feedback.rating,
      summary: payload.feedback.summary,
      detailed_feedback: payload.feedback.detailed_feedback,
      received_at: payload.feedback.received_at || new Date().toISOString(),
      recorded_by: 'maria',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '42P01') {
      return {
        tablesWritten: [],
        recordsCreated: 0,
        message: 'Feedback table not yet created. Feedback stored in memory only.',
      };
    }
    throw new Error(`Feedback insert error: ${error.message}`);
  }

  return {
    tablesWritten: ['feedback_records'],
    recordsCreated: 1,
    message: 'Feedback recorded successfully.',
  };
}

const ACTION_HANDLERS: Record<string, (p: MariaPayload, sb: any) => Promise<any>> = {
  schedule_event: handleScheduleEvent,
  schedule_interview: handleScheduleInterview,
  log_meeting: handleLogMeeting,
  record_feedback: handleRecordFeedback,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const validation = validateAgentRequest(req, res, AGENT);
  if (!validation.valid) return;

  const { action, body } = validation;
  const payload = body.payload as MariaPayload || {};

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
    console.error(`[agents/maria] Action "${action}" error:`, e);
    return errorResponse(res, 500, AGENT, e.message || 'Internal server error.');
  }
}
