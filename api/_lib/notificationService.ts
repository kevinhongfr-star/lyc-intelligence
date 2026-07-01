/**
 * Notification creation helper — DEX AI Technical Blueprint 07
 *
 * Internal helper for creating notifications from various modules.
 * Not an API endpoint — called from other server-side code.
 */

import { insert, selectOne, selectMany } from './supabaseRest.js';

interface CreateNotificationParams {
  recipient_id: string;
  type: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  content?: string;
  resource_type?: string;
  resource_id?: string;
  actor_id?: string;
  channels?: { in_app?: boolean; email?: boolean };
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const prefs = await selectOne('notification_preferences', {
      column: 'user_id', value: params.recipient_id,
      select: '*',
    }, 5000);

    const inApp = prefs ? prefs.in_app_enabled : (params.channels?.in_app ?? true);
    const email = prefs ? prefs.email_enabled : (params.channels?.email ?? false);

    const notif = await insert('notifications', {
      recipient_id: params.recipient_id,
      type: params.type,
      priority: params.priority || 'normal',
      title: params.title,
      content: params.content,
      resource_type: params.resource_type,
      resource_id: params.resource_id,
      actor_id: params.actor_id,
      delivery_channels: JSON.stringify({ in_app: inApp, email }),
    });

    if (email) {
      await queueEmailNotification(notif.id, params.title, params.content || '', params.recipient_id);
    }

    return notif;
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
}

async function queueEmailNotification(notificationId: string, subject: string, htmlContent: string, userId: string) {
  try {
    const profile = await selectOne('profiles', { column: 'id', value: userId, select: 'email, full_name' }, 5000);
    if (!profile || !profile.email) return;

    const emailHtml = generateEmailHtml(subject, htmlContent);

    await insert('email_notification_queue', {
      notification_id: notificationId,
      to_address: profile.email,
      to_name: profile.full_name || '',
      subject: `[DEX AI] ${subject}`,
      html_body: emailHtml,
    });
  } catch (err) {
    console.error('Failed to queue email:', err);
  }
}

function generateEmailHtml(subject: string, content: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; padding: 24px; border-radius: 8px 8px 0 0;">
        <h2 style="color: #ffffff; margin: 0; font-size: 18px;">DEX AI Notification</h2>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; background: #ffffff;">
        <h3 style="margin-top: 0; color: #111827;">${subject}</h3>
        <p style="color: #374151; line-height: 1.6;">${content || ''}</p>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Sent by DEX AI • ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  `;
}

export async function notifyMultiple(
  params: Omit<CreateNotificationParams, 'recipient_id'>,
  recipientIds: string[]
) {
  const results = await Promise.allSettled(
    recipientIds.map(id => createNotification({ ...params, recipient_id: id }))
  );
  return results;
}

export async function onPipelineStageChange(
  contact: any,
  fromStage: string,
  toStage: string,
  changedBy: string
) {
  if (contact.assigned_to) {
    await createNotification({
      recipient_id: contact.assigned_to,
      type: 'pipeline_stage_change',
      title: `${contact.full_name || contact.name} moved to ${toStage}`,
      content: `Candidate moved from ${fromStage} to ${toStage}.`,
      resource_type: 'contact',
      resource_id: contact.id,
      actor_id: changedBy,
      channels: { in_app: true },
    });
  }

  if (['S12_Presented_to_Client', 'S16_Offer_Extended', 'S19_Closed'].includes(toStage)) {
    const teamLeads = await selectMany('profiles', { role: 'team_lead' }, [], 10, 0, 'id');
    for (const lead of teamLeads) {
      await createNotification({
        recipient_id: lead.id,
        type: 'pipeline_stage_change',
        priority: 'high',
        title: `${contact.full_name || contact.name} — ${toStage}`,
        content: `Late-stage update: candidate is now at ${toStage}.`,
        resource_type: 'contact',
        resource_id: contact.id,
        actor_id: changedBy,
        channels: { in_app: true, email: true },
      });
    }
  }
}

export async function onTridentReviewNeeded(scorecard: any, contact: any, scorerId: string) {
  const admins = await selectMany('profiles', { role: 'admin' }, [], 10, 0, 'id');
  const teamLeads = await selectMany('profiles', { role: 'team_lead' }, [], 10, 0, 'id');
  const recipients = [...admins.map(a => a.id), ...teamLeads.map(t => t.id)];

  for (const recipientId of recipients) {
    await createNotification({
      recipient_id: recipientId,
      type: 'trident_review_needed',
      priority: 'normal',
      title: `New TRIDENT scorecard needs review`,
      content: `${contact.full_name} scored ${scorecard.composite_score}/10 (${scorecard.verdict}) — ready for review.`,
      resource_type: 'trident_scorecard',
      resource_id: scorecard.id,
      actor_id: scorerId,
      channels: { in_app: true, email: false },
    });
  }
}

export async function onClientFeedbackReceived(feedback: any, contact: any, mandateId: string) {
  const mandate = await selectOne('mandates', { column: 'id', value: mandateId, select: '*' }, 5000);
  if (mandate?.lead_consultant_id) {
    await createNotification({
      recipient_id: mandate.lead_consultant_id,
      type: 'client_feedback_received',
      priority: 'high',
      title: `Client feedback: ${contact.full_name}`,
      content: `Feedback type: ${feedback.feedback_type}`,
      resource_type: 'contact',
      resource_id: contact.id,
      channels: { in_app: true, email: true },
    });
  }
}
