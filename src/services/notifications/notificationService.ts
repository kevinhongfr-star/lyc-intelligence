// v2.0: Notification Service
// Centralized notification system with quiet hours, digest mode, realtime, web push

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
  | 'message_received'
  | 'mention'
  | 'assignment'
  | 'status_change'
  | 'reminder'
  | 'system'
  | 'billing'
  | 'event'
  | 'coaching'
  | 'intelligence'
  | 'ai_insight'
  | 'deadline'
  | 'approval';

export type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms';

export type DigestMode = 'instant' | 'digest_daily' | 'digest_weekly';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string | null;
  entityType: string | null;
  entityId: string | null;
  actionUrl: string | null;
  read: boolean;
  readAt: string | null;
  channels: string[];
  emailSent: boolean;
  pushSent: boolean;
  smsSent: boolean;
  isDigest: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  userId: string;
  globalEmailEnabled: boolean;
  globalPushEnabled: boolean;
  globalSmsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  quietHoursTimezone: string;
  digestMode: DigestMode;
  digestDeliveryTime: string;
  typeSettings: Partial<Record<NotificationType, {
    in_app: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  }>>;
}

export interface NotificationConfig {
  type: NotificationType;
  label: string;
  category: string;
  description: string;
  defaultChannels: NotificationChannel[];
  critical: boolean;
}

export interface DigestNotification {
  id: string;
  userId: string;
  notifications: Notification[];
  summary: string;
  createdAt: string;
  deliveredAt: string | null;
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const NOTIFICATION_TYPES: NotificationConfig[] = [
  { type: 'feedback_received', label: 'Feedback Received', category: 'candidate', description: 'When a client submits feedback on a candidate', defaultChannels: ['in_app', 'email'], critical: false },
  { type: 'candidate_advanced', label: 'Candidate Advanced', category: 'pipeline', description: 'When a candidate moves to the next stage', defaultChannels: ['in_app'], critical: false },
  { type: 'interview_scheduled', label: 'Interview Scheduled', category: 'interview', description: 'When an interview is scheduled', defaultChannels: ['in_app', 'email', 'push'], critical: false },
  { type: 'new_candidate_added', label: 'New Candidate Added', category: 'candidate', description: 'When a new candidate is added to a mandate', defaultChannels: ['in_app'], critical: false },
  { type: 'report_ready', label: 'Report Ready', category: 'reports', description: 'When a generated report is ready', defaultChannels: ['in_app', 'email'], critical: false },
  { type: 'reference_submitted', label: 'Reference Submitted', category: 'candidate', description: 'When a reference check is submitted', defaultChannels: ['in_app', 'email'], critical: false },
  { type: 'offer_status_changed', label: 'Offer Status Changed', category: 'offer', description: 'When an offer status changes', defaultChannels: ['in_app', 'email', 'push', 'sms'], critical: true },
  { type: 'milestone_at_risk', label: 'Milestone at Risk', category: 'sla', description: 'When a milestone is at risk of being missed', defaultChannels: ['in_app', 'email', 'push'], critical: true },
  { type: 'message_received', label: 'Message Received', category: 'communication', description: 'When a new message is received', defaultChannels: ['in_app', 'email', 'push'], critical: false },
  { type: 'mention', label: 'Mention', category: 'social', description: 'When someone mentions you in a comment', defaultChannels: ['in_app', 'email', 'push'], critical: false },
  { type: 'assignment', label: 'Assignment', category: 'workflow', description: 'When you are assigned to a task or mandate', defaultChannels: ['in_app', 'email', 'push'], critical: false },
  { type: 'status_change', label: 'Status Change', category: 'workflow', description: 'When a mandate or deal status changes', defaultChannels: ['in_app'], critical: false },
  { type: 'reminder', label: 'Reminder', category: 'workflow', description: 'Task and deadline reminders', defaultChannels: ['in_app', 'push'], critical: false },
  { type: 'system', label: 'System', category: 'system', description: 'System announcements and updates', defaultChannels: ['in_app', 'email'], critical: false },
  { type: 'billing', label: 'Billing', category: 'billing', description: 'Payment and subscription notifications', defaultChannels: ['in_app', 'email', 'push', 'sms'], critical: true },
  { type: 'event', label: 'Event', category: 'events', description: 'Council event updates and reminders', defaultChannels: ['in_app', 'email', 'push'], critical: false },
  { type: 'coaching', label: 'Coaching', category: 'coaching', description: 'Coaching session updates', defaultChannels: ['in_app', 'email', 'push'], critical: false },
  { type: 'intelligence', label: 'Intelligence', category: 'intelligence', description: 'Market intelligence signals', defaultChannels: ['in_app', 'email'], critical: false },
  { type: 'ai_insight', label: 'AI Insight', category: 'ai', description: 'AI-generated insights and recommendations', defaultChannels: ['in_app'], critical: false },
  { type: 'deadline', label: 'Deadline', category: 'workflow', description: 'Upcoming deadlines', defaultChannels: ['in_app', 'email', 'push'], critical: true },
  { type: 'approval', label: 'Approval', category: 'workflow', description: 'Approval requests and updates', defaultChannels: ['in_app', 'email', 'push'], critical: false },
];

export const NOTIFICATION_CATEGORIES: Array<{ id: string; label: string; icon: string }> = [
  { id: 'candidate', label: 'Candidates', icon: 'users' },
  { id: 'pipeline', label: 'Pipeline', icon: 'pipeline' },
  { id: 'interview', label: 'Interviews', icon: 'calendar' },
  { id: 'reports', label: 'Reports', icon: 'file-text' },
  { id: 'offer', label: 'Offers', icon: 'briefcase' },
  { id: 'sla', label: 'SLA', icon: 'clock' },
  { id: 'communication', label: 'Messages', icon: 'message-square' },
  { id: 'social', label: 'Mentions', icon: 'at-sign' },
  { id: 'workflow', label: 'Workflow', icon: 'workflow' },
  { id: 'system', label: 'System', icon: 'settings' },
  { id: 'billing', label: 'Billing', icon: 'credit-card' },
  { id: 'events', label: 'Events', icon: 'calendar' },
  { id: 'coaching', label: 'Coaching', icon: 'headphones' },
  { id: 'intelligence', label: 'Intelligence', icon: 'trending-up' },
  { id: 'ai', label: 'AI Insights', icon: 'sparkles' },
];

// ═══════════════════════════════════════════════════════════════
// CORE SERVICE (UX-NOT-001)
// ═══════════════════════════════════════════════════════════════

export function getNotificationTypeLabel(type: NotificationType): string {
  const config = NOTIFICATION_TYPES.find(t => t.type === type);
  return config?.label || type;
}

export function getNotificationTypeConfig(type: NotificationType): NotificationConfig | undefined {
  return NOTIFICATION_TYPES.find(t => t.type === type);
}

export function getDefaultPreferences(userId: string): NotificationPreferences {
  const typeSettings: Partial<Record<NotificationType, {
    in_app: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  }>> = {};

  NOTIFICATION_TYPES.forEach(config => {
    typeSettings[config.type] = {
      in_app: config.defaultChannels.includes('in_app'),
      email: config.defaultChannels.includes('email'),
      push: config.defaultChannels.includes('push'),
      sms: config.defaultChannels.includes('sms'),
    };
  });

  return {
    userId,
    globalEmailEnabled: true,
    globalPushEnabled: true,
    globalSmsEnabled: false,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    quietHoursTimezone: 'Asia/Shanghai',
    digestMode: 'instant',
    digestDeliveryTime: '08:00',
    typeSettings,
  };
}

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
    return getDefaultPreferences(userId);
  }

  return {
    userId: data.user_id,
    globalEmailEnabled: data.global_email_enabled ?? true,
    globalPushEnabled: data.global_push_enabled ?? true,
    globalSmsEnabled: data.global_sms_enabled ?? false,
    quietHoursEnabled: data.quiet_hours_enabled ?? false,
    quietHoursStart: data.quiet_hours_start ?? '22:00',
    quietHoursEnd: data.quiet_hours_end ?? '08:00',
    quietHoursTimezone: data.quiet_hours_timezone ?? 'Asia/Shanghai',
    digestMode: (data.digest_mode as DigestMode) || 'instant',
    digestDeliveryTime: data.digest_delivery_time ?? '08:00',
    typeSettings: data.type_settings || getDefaultPreferences(userId).typeSettings,
  };
}

export async function saveUserPreferences(
  supabase: SupabaseClient,
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  const updateData: Record<string, any> = {
    user_id: userId,
  };

  if (preferences.globalEmailEnabled !== undefined) updateData.global_email_enabled = preferences.globalEmailEnabled;
  if (preferences.globalPushEnabled !== undefined) updateData.global_push_enabled = preferences.globalPushEnabled;
  if (preferences.globalSmsEnabled !== undefined) updateData.global_sms_enabled = preferences.globalSmsEnabled;
  if (preferences.quietHoursEnabled !== undefined) updateData.quiet_hours_enabled = preferences.quietHoursEnabled;
  if (preferences.quietHoursStart !== undefined) updateData.quiet_hours_start = preferences.quietHoursStart;
  if (preferences.quietHoursEnd !== undefined) updateData.quiet_hours_end = preferences.quietHoursEnd;
  if (preferences.quietHoursTimezone !== undefined) updateData.quiet_hours_timezone = preferences.quietHoursTimezone;
  if (preferences.digestMode !== undefined) updateData.digest_mode = preferences.digestMode;
  if (preferences.digestDeliveryTime !== undefined) updateData.digest_delivery_time = preferences.digestDeliveryTime;
  if (preferences.typeSettings !== undefined) updateData.type_settings = preferences.typeSettings;

  const { error } = await supabase
    .from('notification_preferences')
    .upsert(updateData);

  return !error;
}

export function isChannelEnabled(
  preferences: NotificationPreferences,
  type: NotificationType,
  channel: NotificationChannel
): boolean {
  const typeConfig = preferences.typeSettings[type];
  if (!typeConfig?.[channel]) return false;

  if (channel === 'email' && !preferences.globalEmailEnabled) return false;
  if (channel === 'push' && !preferences.globalPushEnabled) return false;
  if (channel === 'sms' && !preferences.globalSmsEnabled) return false;

  return true;
}

// ═══════════════════════════════════════════════════════════════
// QUIET HOURS (UX-NOT-006)
// ═══════════════════════════════════════════════════════════════

export function isDuringQuietHours(
  preferences: NotificationPreferences,
  date: Date = new Date()
): boolean {
  if (!preferences.quietHoursEnabled) return false;

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

export function getNextQuietHoursEnd(
  preferences: NotificationPreferences,
  date: Date = new Date()
): Date {
  const result = new Date(date);
  const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);

  if (isDuringQuietHours(preferences, date)) {
    result.setHours(endHour, endMin, 0, 0);
    if (result.getTime() <= date.getTime()) {
      result.setDate(result.getDate() + 1);
    }
  }

  return result;
}

export function shouldBypassQuietHours(
  type: NotificationType
): boolean {
  const config = NOTIFICATION_TYPES.find(t => t.type === type);
  return config?.critical || false;
}

export function getDeliveryTimeWithQuietHours(
  preferences: NotificationPreferences,
  type: NotificationType,
  now: Date = new Date()
): Date {
  if (!isDuringQuietHours(preferences, now)) return now;
  if (shouldBypassQuietHours(type)) return now;

  return getNextQuietHoursEnd(preferences, now);
}

// ═══════════════════════════════════════════════════════════════
// DIGEST MODE (UX-NOT-007)
// ═══════════════════════════════════════════════════════════════

export function shouldSendInstant(
  preferences: NotificationPreferences,
  type: NotificationType
): boolean {
  if (preferences.digestMode === 'instant') return true;
  if (shouldBypassQuietHours(type)) return true;
  return false;
}

export function compileDailyDigest(notifications: Notification[]): {
  summary: string;
  byCategory: Record<string, Notification[]>;
  totalCount: number;
  criticalCount: number;
} {
  const byCategory: Record<string, Notification[]> = {};
  let criticalCount = 0;

  notifications.forEach(n => {
    const config = getNotificationTypeConfig(n.type);
    const category = config?.category || 'other';
    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push(n);
    if (config?.critical) criticalCount++;
  });

  const totalCount = notifications.length;
  const summary = `You have ${totalCount} new notification${totalCount !== 1 ? 's' : ''}${
    criticalCount > 0 ? `, including ${criticalCount} critical` : ''
  }.`;

  return { summary, byCategory, totalCount, criticalCount };
}

export function getDigestDeliveryDate(
  preferences: NotificationPreferences,
  now: Date = new Date()
): Date {
  const delivery = new Date(now);
  const [hour, min] = preferences.digestDeliveryTime.split(':').map(Number);

  if (preferences.digestMode === 'digest_daily') {
    delivery.setHours(hour, min, 0, 0);
    if (delivery.getTime() <= now.getTime()) {
      delivery.setDate(delivery.getDate() + 1);
    }
  } else if (preferences.digestMode === 'digest_weekly') {
    const daysUntilMonday = (1 + 7 - delivery.getDay()) % 7 || 7;
    delivery.setDate(delivery.getDate() + daysUntilMonday);
    delivery.setHours(hour, min, 0, 0);
  }

  return delivery;
}

// ═══════════════════════════════════════════════════════════════
// CRUD OPERATIONS (UX-NOT-008)
// ═══════════════════════════════════════════════════════════════

export async function createNotification(
  supabase: SupabaseClient,
  params: {
    userId: string;
    type: NotificationType;
    title: string;
    message?: string;
    entityType?: string;
    entityId?: string;
    actionUrl?: string;
    channels?: string[];
    isDigest?: boolean;
    metadata?: Record<string, any>;
  }
): Promise<Notification | null> {
  const config = getNotificationTypeConfig(params.type);

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message || null,
      entity_type: params.entityType || null,
      entity_id: params.entityId || null,
      action_url: params.actionUrl || null,
      channels: params.channels || config?.defaultChannels || ['in_app'],
      is_digest: params.isDigest || false,
      metadata: params.metadata || null,
    })
    .select()
    .single();

  if (error || !data) return null;

  return mapNotification(data);
}

export async function getUserNotifications(
  supabase: SupabaseClient,
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    filter?: 'all' | 'unread' | NotificationType;
    category?: string;
  } = {}
): Promise<Notification[]> {
  const { limit = 50, offset = 0, filter = 'all', category } = options;

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter === 'unread') {
    query = query.eq('read', false);
  } else if (filter !== 'all') {
    query = query.eq('type', filter);
  }

  if (category) {
    const typesInCategory = NOTIFICATION_TYPES
      .filter(t => t.category === category)
      .map(t => t.type);
    if (typesInCategory.length > 0) {
      query = query.in('type', typesInCategory);
    }
  }

  const { data, error } = await query;

  if (error || !data) return [];
  return data.map(mapNotification);
}

export async function getUnreadCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) return 0;
  return count || 0;
}

export async function markNotificationAsRead(
  supabase: SupabaseClient,
  notificationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);

  return !error;
}

export async function markAllAsRead(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('read', false);

  return !error;
}

export async function markManyAsRead(
  supabase: SupabaseClient,
  notificationIds: string[]
): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .in('id', notificationIds);

  return !error;
}

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

export async function clearAllNotifications(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId);

  return !error;
}

function mapNotification(data: any): Notification {
  return {
    id: data.id,
    userId: data.user_id,
    type: data.type as NotificationType,
    title: data.title,
    message: data.message,
    entityType: data.entity_type,
    entityId: data.entity_id,
    actionUrl: data.action_url || data.link,
    read: data.read,
    readAt: data.read_at,
    channels: data.channels || [],
    emailSent: data.email_sent || false,
    pushSent: data.push_sent || false,
    smsSent: data.sms_sent || false,
    isDigest: data.is_digest || false,
    createdAt: data.created_at,
    metadata: data.metadata,
  };
}

// ═══════════════════════════════════════════════════════════════
// SEND / DISPATCH (UX-NOT-001)
// ═══════════════════════════════════════════════════════════════

export async function sendNotification(
  supabase: SupabaseClient,
  params: {
    userId: string;
    type: NotificationType;
    title: string;
    message?: string;
    entityType?: string;
    entityId?: string;
    actionUrl?: string;
  }
): Promise<Notification | null> {
  const preferences = await getUserPreferences(supabase, params.userId);
  const config = getNotificationTypeConfig(params.type);

  const enabledChannels: NotificationChannel[] = [];

  (['in_app', 'email', 'push', 'sms'] as NotificationChannel[]).forEach(channel => {
    if (isChannelEnabled(preferences, params.type, channel)) {
      enabledChannels.push(channel);
    }
  });

  if (enabledChannels.length === 0) return null;

  if (!shouldSendInstant(preferences, params.type)) {
    return createNotification(supabase, {
      ...params,
      channels: enabledChannels,
      isDigest: true,
    });
  }

  const deliveryTime = getDeliveryTimeWithQuietHours(preferences, params.type);
  const now = new Date();

  if (deliveryTime.getTime() > now.getTime() + 60000) {
    return createNotification(supabase, {
      ...params,
      channels: enabledChannels,
      metadata: { scheduled_for: deliveryTime.toISOString() },
    });
  }

  const notification = await createNotification(supabase, {
    ...params,
    channels: enabledChannels,
  });

  if (notification) {
    if (enabledChannels.includes('email')) {
      // fire-and-forget email — resolve recipient address and render template
      void (async () => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', params.userId)
            .maybeSingle();
          if (!profile?.email) return;
          const html = renderEmailTemplate({
            title: params.title,
            message: params.message || '',
            actionUrl: params.actionUrl,
            notificationType: params.type,
          });
          await sendNotificationEmail(profile.email, { subject: params.title, html });
        } catch (err) {
          console.error('[Notification Email] dispatch failed:', err);
        }
      })();
    }
    if (enabledChannels.includes('push')) {
      sendPushNotification(params.userId, params.title, params.message || '', params.actionUrl || '');
    }
    if (enabledChannels.includes('sms')) {
      sendSmsNotification(params.userId, params.title, params.message || '');
    }
  }

  return notification;
}

export async function bulkSendNotification(
  supabase: SupabaseClient,
  userIds: string[],
  params: Omit<Parameters<typeof sendNotification>[1], 'userId'>
): Promise<string[]> {
  const results: string[] = [];
  for (const userId of userIds) {
    const n = await sendNotification(supabase, { userId, ...params });
    if (n) results.push(n.id);
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════
// EMAIL NOTIFICATIONS (UX-NOT-003)
// ═══════════════════════════════════════════════════════════════

export async function sendNotificationEmail(
  email: string,
  rendered: { subject: string; html: string }
): Promise<void> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
      console.warn('[Notification Email] Supabase env vars not configured');
      return;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/email-sender`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: rendered.subject,
        html: rendered.html,
      }),
    });

    if (!response.ok) {
      console.error(
        '[Notification Email] email-sender responded with',
        response.status,
        await response.text()
      );
    }
  } catch (err) {
    console.error('[Notification Email] Failed to send:', err);
  }
}

export function renderEmailTemplate(props: {
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  userName?: string;
  notificationType?: string;
}): string {
  const { title, message, actionUrl, actionLabel = 'View Details', userName = 'there', notificationType } = props;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: Inter, -apple-system, sans-serif; margin: 0; padding: 0; background: #f9fafb; color: #111827; }
        .container { max-width: 560px; margin: 0 auto; padding: 24px; }
        .card { background: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        h1 { font-size: 20px; margin: 0 0 16px; color: #111827; }
        p { font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 24px; }
        .btn { display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500; }
        .footer { margin-top: 24px; text-align: center; font-size: 12px; color: #9ca3af; }
        .badge { display: inline-block; padding: 2px 8px; background: #e0e7ff; color: #4338ca; border-radius: 4px; font-size: 12px; margin-bottom: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          ${notificationType ? `<span class="badge">${notificationType}</span>` : ''}
          <h1>${title}</h1>
          <p>Hi ${userName},</p>
          <p>${message}</p>
          ${actionUrl ? `<a href="${actionUrl}" class="btn">${actionLabel}</a>` : ''}
        </div>
        <div class="footer">
          <p>LYC Intelligence &middot; <a href="#" style="color: #6b7280;">Manage notifications</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ═══════════════════════════════════════════════════════════════
// WEB PUSH NOTIFICATIONS (UX-NOT-004)
// ═══════════════════════════════════════════════════════════════

/**
 * Convert a VAPID public key (URL-safe base64) into a Uint8Array suitable
 * for `pushManager.subscribe({ applicationServerKey })`.
 *
 * The return type is pinned to `Uint8Array<ArrayBuffer>` so the result is
 * assignable to the Push API's `BufferSource` (TS 5.7+ makes `Uint8Array`
 * generic over its backing buffer).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  url: string
): Promise<void> {
  try {
    if (
      typeof window === 'undefined' ||
      !('PushManager' in window) ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }

    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      console.warn('[Push Notification] Permission not granted');
      return;
    }

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.warn('[Push Notification] VITE_VAPID_PUBLIC_KEY not configured');
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    // Ensure a push subscription exists, subscribing with the VAPID key if
    // needed. The subscription is held by the browser; we only ensure it
    // exists so future server-initiated push delivery is possible.
    if (!(await registration.pushManager.getSubscription())) {
      try {
        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      } catch (subscribeErr) {
        console.warn('[Push Notification] Could not subscribe:', subscribeErr);
      }
    }

    await registration.showNotification(title, {
      body,
      data: { url, userId },
      tag: `notif:${userId}`,
    });
  } catch (err) {
    console.error('[Push Notification] Failed to send:', err);
  }
}

export async function subscribePushNotifications(
  subscription: PushSubscription
): Promise<boolean> {
  // Save subscription to database
  console.log('[Push Subscribe]', subscription.endpoint);
  return true;
}

export async function unsubscribePushNotifications(
  userId: string
): Promise<boolean> {
  console.log('[Push Unsubscribe]', { userId });
  return true;
}

export async function checkPushSupport(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined') return 'denied';
  return Notification.requestPermission();
}

// ═══════════════════════════════════════════════════════════════
// SMS NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

export async function sendSmsNotification(
  userId: string,
  title: string,
  message: string
): Promise<void> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
      console.warn('[SMS Notification] Supabase env vars not configured');
      return;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/sms-sender`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        title,
        message,
      }),
    });

    if (!response.ok) {
      console.error(
        '[SMS Notification] sms-sender responded with',
        response.status,
        await response.text()
      );
    }
  } catch (err) {
    console.error('[SMS Notification] Failed to send:', err);
  }
}

// ═══════════════════════════════════════════════════════════════
// REALTIME (UX-NOT-009)
// ═══════════════════════════════════════════════════════════════

export function subscribeToNotificationsRealtime(
  supabase: SupabaseClient,
  userId: string,
  callback: (notification: Notification) => void
): () => void {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(mapNotification(payload.new));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToUnreadCountRealtime(
  supabase: SupabaseClient,
  userId: string,
  callback: (count: number) => void
): () => void {
  let currentCount = 0;

  getUnreadCount(supabase, userId).then(count => {
    currentCount = count;
    callback(count);
  });

  const channel = supabase
    .channel(`notifications_unread:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId} AND read=eq.false`,
      },
      () => {
        currentCount++;
        callback(currentCount);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const oldRead = (payload.old as any)?.read;
        const newRead = (payload.new as any)?.read;
        if (!oldRead && newRead) {
          currentCount = Math.max(0, currentCount - 1);
          callback(currentCount);
        } else if (oldRead && !newRead) {
          currentCount++;
          callback(currentCount);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

export function formatRelativeTime(dateString: string, locale: string = 'en'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (seconds < 60) return locale === 'zh' ? '刚刚' : 'Just now';
  if (minutes < 60) return locale === 'zh' ? `${minutes}分钟前` : `${minutes}m ago`;
  if (hours < 24) return locale === 'zh' ? `${hours}小时前` : `${hours}h ago`;
  if (days < 7) return locale === 'zh' ? `${days}天前` : `${days}d ago`;
  if (weeks < 4) return locale === 'zh' ? `${weeks}周前` : `${weeks}w ago`;

  return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function groupNotificationsByDate(notifications: Notification[]): Array<{
  date: string;
  items: Notification[];
}> {
  const groups: Record<string, Notification[]> = {};

  notifications.forEach(n => {
    const date = new Date(n.createdAt).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(n);
  });

  return Object.entries(groups).map(([date, items]) => ({
    date,
    items,
  }));
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  sendNotification,
  bulkSendNotification,
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead,
  markManyAsRead,
  deleteNotification,
  clearAllNotifications,
  getUserPreferences,
  saveUserPreferences,
  isChannelEnabled,
  isDuringQuietHours,
  shouldSendInstant,
  compileDailyDigest,
  sendNotificationEmail,
  sendPushNotification,
  subscribePushNotifications,
  unsubscribePushNotifications,
  requestPushPermission,
  subscribeToNotificationsRealtime,
  subscribeToUnreadCountRealtime,
  getNotificationTypeLabel,
  getNotificationTypeConfig,
  formatRelativeTime,
  groupNotificationsByDate,
};
