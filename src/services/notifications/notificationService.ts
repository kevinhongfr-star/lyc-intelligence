// Phase 7.3: Notification Service
// Centralized notification system

import type { SupabaseClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type NotificationType =
  | 'feedback_received'
  | 'candidate_advanced'
  | 'interview_scheduled'
  | 'new_candidate_added'
  | 'report_ready'
  | 'reference_submitted'
  | 'offer_status_changed'
  | 'milestone_at_risk'
  | 'message_received';

export type DeliveryMethod = 'email' | 'in_app' | 'both' | 'none';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  emailSent: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  userId: string;
  feedbackReceived: DeliveryMethod;
  candidateAdvanced: DeliveryMethod;
  interviewScheduled: DeliveryMethod;
  newCandidateAdded: DeliveryMethod;
  reportReady: DeliveryMethod;
  referenceSubmitted: DeliveryMethod;
  offerStatusChanged: DeliveryMethod;
  milestoneAtRisk: DeliveryMethod;
  messageReceived: DeliveryMethod;
}

export interface NotificationConfig {
  type: NotificationType;
  label: string;
  defaultDelivery: DeliveryMethod;
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const NOTIFICATION_TYPES: NotificationConfig[] = [
  { type: 'feedback_received', label: 'Feedback Received', defaultDelivery: 'both' },
  { type: 'candidate_advanced', label: 'Candidate Advanced', defaultDelivery: 'in_app' },
  { type: 'interview_scheduled', label: 'Interview Scheduled', defaultDelivery: 'both' },
  { type: 'new_candidate_added', label: 'New Candidate Added', defaultDelivery: 'in_app' },
  { type: 'report_ready', label: 'Report Ready', defaultDelivery: 'both' },
  { type: 'reference_submitted', label: 'Reference Submitted', defaultDelivery: 'both' },
  { type: 'offer_status_changed', label: 'Offer Status Changed', defaultDelivery: 'both' },
  { type: 'milestone_at_risk', label: 'Milestone at Risk', defaultDelivery: 'both' },
  { type: 'message_received', label: 'Message Received', defaultDelivery: 'both' },
];

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION SERVICE
// ═══════════════════════════════════════════════════════════════

/**
 * Get notification type label
 */
export function getNotificationTypeLabel(type: NotificationType): string {
  const config = NOTIFICATION_TYPES.find(t => t.type === type);
  return config?.label || type;
}

/**
 * Get user notification preferences
 */
export async function getUserPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    // Return defaults if no preferences exist
    return {
      userId,
      feedbackReceived: 'both',
      candidateAdvanced: 'in_app',
      interviewScheduled: 'both',
      newCandidateAdded: 'in_app',
      reportReady: 'both',
      referenceSubmitted: 'both',
      offerStatusChanged: 'both',
      milestoneAtRisk: 'both',
      messageReceived: 'both',
    };
  }

  return {
    userId: data.user_id,
    feedbackReceived: (data.feedback_received as DeliveryMethod) || 'both',
    candidateAdvanced: (data.candidate_advanced as DeliveryMethod) || 'in_app',
    interviewScheduled: (data.interview_scheduled as DeliveryMethod) || 'both',
    newCandidateAdded: (data.new_candidate_added as DeliveryMethod) || 'in_app',
    reportReady: (data.report_ready as DeliveryMethod) || 'both',
    referenceSubmitted: (data.reference_submitted as DeliveryMethod) || 'both',
    offerStatusChanged: (data.offer_status_changed as DeliveryMethod) || 'both',
    milestoneAtRisk: (data.milestone_at_risk as DeliveryMethod) || 'both',
    messageReceived: (data.message_received as DeliveryMethod) || 'both',
  };
}

/**
 * Save user notification preferences
 */
export async function saveUserPreferences(
  supabase: SupabaseClient,
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  // Build update object with snake_case keys
  const updateData: Record<string, DeliveryMethod> = {};

  if (preferences.feedbackReceived !== undefined) {
    updateData.feedback_received = preferences.feedbackReceived;
  }
  if (preferences.candidateAdvanced !== undefined) {
    updateData.candidate_advanced = preferences.candidateAdvanced;
  }
  if (preferences.interviewScheduled !== undefined) {
    updateData.interview_scheduled = preferences.interviewScheduled;
  }
  if (preferences.newCandidateAdded !== undefined) {
    updateData.new_candidate_added = preferences.newCandidateAdded;
  }
  if (preferences.reportReady !== undefined) {
    updateData.report_ready = preferences.reportReady;
  }
  if (preferences.referenceSubmitted !== undefined) {
    updateData.reference_submitted = preferences.referenceSubmitted;
  }
  if (preferences.offerStatusChanged !== undefined) {
    updateData.offer_status_changed = preferences.offerStatusChanged;
  }
  if (preferences.milestoneAtRisk !== undefined) {
    updateData.milestone_at_risk = preferences.milestoneAtRisk;
  }
  if (preferences.messageReceived !== undefined) {
    updateData.message_received = preferences.messageReceived;
  }

  const { error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: userId,
      ...updateData,
      updated_at: new Date().toISOString(),
    });

  return !error;
}

/**
 * Get delivery preference for a specific notification type
 */
export function getDeliveryPreference(
  preferences: NotificationPreferences,
  type: NotificationType
): DeliveryMethod {
  const mapping: Record<NotificationType, keyof NotificationPreferences> = {
    feedback_received: 'feedbackReceived',
    candidate_advanced: 'candidateAdvanced',
    interview_scheduled: 'interviewScheduled',
    new_candidate_added: 'newCandidateAdded',
    report_ready: 'reportReady',
    reference_submitted: 'referenceSubmitted',
    offer_status_changed: 'offerStatusChanged',
    milestone_at_risk: 'milestoneAtRisk',
    message_received: 'messageReceived',
  };

  return preferences[mapping[type]];
}

/**
 * Create in-app notification
 */
export async function createNotification(
  supabase: SupabaseClient,
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link: string,
  emailSent: boolean = false
): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      link,
      email_sent: emailSent,
    })
    .select()
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    type: data.type as NotificationType,
    title: data.title,
    message: data.message,
    link: data.link,
    read: data.read,
    emailSent: data.email_sent,
    createdAt: data.created_at,
  };
}

/**
 * Send notification (in-app + email based on preferences)
 */
export async function sendNotification(
  supabase: SupabaseClient,
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link: string
): Promise<void> {
  // Get user preferences
  const preferences = await getUserPreferences(supabase, userId);
  const delivery = getDeliveryPreference(preferences, type);

  if (delivery === 'none') {
    return;
  }

  // Create in-app notification
  if (delivery === 'in_app' || delivery === 'both') {
    await createNotification(supabase, userId, type, title, message, link, false);
  }

  // Send email notification
  if (delivery === 'email' || delivery === 'both') {
    // In production, this would call the email service
    // await sendNotificationEmail(userId, title, message, link);
    await createNotification(supabase, userId, type, title, message, link, true);
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 50,
  offset: number = 0,
  filter?: 'all' | 'unread' | NotificationType
): Promise<Notification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter === 'unread') {
    query = query.eq('read', false);
  } else if (filter !== 'all' && filter) {
    query = query.eq('type', filter);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map(n => ({
    id: n.id,
    userId: n.user_id,
    type: n.type as NotificationType,
    title: n.title,
    message: n.message,
    link: n.link,
    read: n.read,
    emailSent: n.email_sent,
    createdAt: n.created_at,
  }));
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    return 0;
  }

  return count || 0;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  supabase: SupabaseClient,
  notificationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  return !error;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  return !error;
}

/**
 * Delete notification
 */
export async function deleteNotification(
  supabase: SupabaseClient,
  notificationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  return !error;
}

// ═══════════════════════════════════════════════════════════════
// EMAIL NOTIFICATION (Placeholder)
// ═══════════════════════════════════════════════════════════════

/**
 * Send notification email via Resend
 */
export async function sendNotificationEmail(
  userId: string,
  title: string,
  message: string,
  link: string
): Promise<void> {
  // In production, this would use Resend to send emails
  // Example:
  // await resend.emails.send({
  //   from: 'DEX AI <notifications@dexai.com>',
  //   to: userEmail,
  //   subject: title,
  //   html: renderEmail({ title, message, link }),
  // });
  console.log('Sending notification email:', { userId, title, message, link });
}

export default {
  sendNotification,
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  getUserPreferences,
  saveUserPreferences,
  getNotificationTypeLabel,
};