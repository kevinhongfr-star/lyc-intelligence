import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import { selectMany, selectOne, insert, update, isSupabaseConfigured } from './supabaseRest.js';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, any>;
  status: 'unread' | 'read' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  read_at?: string;
}

async function handleNotifications(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const action = path[0];
  const notificationId = path[1];

  try {
    if (req.method === 'GET') {
      if (action === 'unread') {
        const notifications = await selectMany('notifications', { user_id: user.id, status: 'unread' }, 50);
        return res.status(200).json({
          success: true,
          count: notifications.length,
          notifications,
        });
      }

      if (action === 'mark-read') {
        if (notificationId) {
          await update('notifications', notificationId, { status: 'read', read_at: new Date().toISOString() });
          return res.status(200).json({ success: true });
        } else {
          await update('notifications', { user_id: user.id, status: 'unread' }, { status: 'read', read_at: new Date().toISOString() });
          return res.status(200).json({ success: true });
        }
      }

      if (action === 'archive') {
        if (notificationId) {
          await update('notifications', notificationId, { status: 'archived' });
          return res.status(200).json({ success: true });
        }
      }

      const notifications = await selectMany('notifications', { user_id: user.id }, 50);
      return res.status(200).json({
        success: true,
        count: notifications.length,
        notifications,
      });
    }

    if (req.method === 'POST') {
      const { type, title, message, metadata, priority } = req.body;
      await insert('notifications', {
        user_id: user.id,
        type: type || 'general',
        title,
        message,
        metadata: metadata || {},
        status: 'unread',
        priority: priority || 'medium',
        created_at: new Date().toISOString(),
      });
      return res.status(201).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Notifications] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleAlerts(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const action = path[0];

  try {
    if (req.method === 'GET') {
      if (action === 'active') {
        const flags = await selectMany('auto_flags', { status: { neq: 'resolved' } });
        return res.status(200).json({
          success: true,
          count: flags.length,
          flags,
        });
      }

      if (action === 'critical') {
        const flags = await selectMany('auto_flags', { severity: 'critical', status: { neq: 'resolved' } });
        return res.status(200).json({
          success: true,
          count: flags.length,
          flags,
        });
      }

      const flags = await selectMany('auto_flags', {}, 50);
      return res.status(200).json({
        success: true,
        count: flags.length,
        flags,
      });
    }

    if (req.method === 'POST') {
      if (action === 'acknowledge') {
        const { flag_id } = req.body;
        if (!flag_id) return res.status(400).json({ error: 'Flag ID required' });

        await update('auto_flags', flag_id, {
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id,
        });

        await insert('notifications', {
          user_id: user.id,
          type: 'flag_acknowledged',
          title: 'Flag Acknowledged',
          message: `You acknowledged a flag`,
          metadata: { flag_id },
          status: 'read',
          priority: 'low',
          created_at: new Date().toISOString(),
        });

        return res.status(200).json({ success: true });
      }

      if (action === 'resolve') {
        const { flag_id } = req.body;
        if (!flag_id) return res.status(400).json({ error: 'Flag ID required' });

        await update('auto_flags', flag_id, {
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        });

        await insert('notifications', {
          user_id: user.id,
          type: 'flag_resolved',
          title: 'Flag Resolved',
          message: `You resolved a flag`,
          metadata: { flag_id },
          status: 'read',
          priority: 'low',
          created_at: new Date().toISOString(),
        });

        return res.status(200).json({ success: true });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Alerts] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleWebhook(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const path = (req.query as any).path || [];
  const channel = path[0];

  try {
    switch (channel) {
      case 'feishu':
        return handleFeishuWebhook(req, res);
      case 'email':
        return handleEmailWebhook(req, res);
      case 'slack':
        return handleSlackWebhook(req, res);
      default:
        return res.status(404).json({ error: `Unknown channel: ${channel}` });
    }
  } catch (err: any) {
    console.error('[Webhook] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleFeishuWebhook(req: VercelRequest, res: VercelResponse) {
  const event = req.body || {};
  const type = event.type;

  if (type === 'message_received') {
    const message = event.message || {};
    const text = message.content || '';
    const sender = event.sender || {};

    await insert('activity_logs', {
      entity_type: 'system',
      entity_id: 'feishu',
      action: 'message_received',
      metadata: {
        text,
        sender_id: sender.user_id,
        chat_id: message.chat_id,
      },
    });
  }

  return res.status(200).json({ success: true, event_type: type });
}

async function handleEmailWebhook(req: VercelRequest, res: VercelResponse) {
  const event = req.body || {};

  if (event.type === 'email_sent') {
    await insert('activity_logs', {
      entity_type: 'system',
      entity_id: 'email',
      action: 'email_sent',
      metadata: {
        to: event.to,
        subject: event.subject,
        template: event.template,
      },
    });
  }

  return res.status(200).json({ success: true });
}

async function handleSlackWebhook(req: VercelRequest, res: VercelResponse) {
  const event = req.body || {};

  if (event.type === 'message') {
    const text = event.text || '';

    await insert('activity_logs', {
      entity_type: 'system',
      entity_id: 'slack',
      action: 'message_received',
      metadata: {
        text,
        channel: event.channel,
        user: event.user,
      },
    });
  }

  return res.status(200).json({ success: true });
}

async function handleSettings(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const settings = await selectOne('notification_settings', { user_id: user.id });
      return res.status(200).json({
        success: true,
        settings: settings || {
          email_enabled: true,
          feishu_enabled: true,
          slack_enabled: false,
          push_enabled: true,
          daily_digest: false,
          weekly_report: true,
          alert_level: 'high',
        },
      });
    }

    if (req.method === 'POST') {
      const existing = await selectOne('notification_settings', { user_id: user.id });
      if (existing) {
        await update('notification_settings', existing.id, req.body);
      } else {
        await insert('notification_settings', {
          user_id: user.id,
          ...req.body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Settings] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDigest(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const type = path[0];

  try {
    if (req.method === 'GET') {
      if (type === 'daily') {
        return res.status(200).json(await generateDailyDigest(user.id));
      }

      if (type === 'weekly') {
        return res.status(200).json(await generateWeeklyDigest(user.id));
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Digest] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function generateDailyDigest(userId: string) {
  const [mandates, pipeline, activities, flags] = await Promise.all([
    selectMany('mandates', { consultant_id: userId, is_deleted: false }),
    selectMany('mandate_candidates', { mandate_id: { in: mandates.map((m: any) => m.id) } }),
    selectMany('activity_logs', {}, 20),
    selectMany('auto_flags', { status: { neq: 'resolved' } }),
  ]);

  const today = new Date().toISOString().split('T')[0];
  const todayActivities = activities.filter((a: any) => a.created_at?.startsWith(today));

  return {
    success: true,
    date: today,
    summary: {
      total_mandates: mandates.length,
      total_pipeline: pipeline.length,
      today_activities: todayActivities.length,
      active_flags: flags.length,
    },
    mandates: mandates.slice(0, 5),
    pipeline: pipeline.slice(0, 10),
    activities: todayActivities,
    flags: flags.filter((f: any) => f.severity === 'critical' || f.severity === 'high').slice(0, 5),
  };
}

async function generateWeeklyDigest(userId: string) {
  const [mandates, pipeline, fiveMetrics, activities, flags] = await Promise.all([
    selectMany('mandates', { consultant_id: userId, is_deleted: false }),
    selectMany('mandate_candidates', {}),
    selectMany('five_metrics', { consultant_id: userId }),
    selectMany('activity_logs', {}, 50),
    selectMany('auto_flags', { status: { neq: 'resolved' } }),
  ]);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekActivities = activities.filter((a: any) => new Date(a.created_at) >= oneWeekAgo);

  const recentMetrics = fiveMetrics.slice(-4);

  return {
    success: true,
    week_start: oneWeekAgo.toISOString().split('T')[0],
    week_end: new Date().toISOString().split('T')[0],
    summary: {
      total_mandates: mandates.length,
      total_pipeline: pipeline.length,
      week_activities: weekActivities.length,
      active_flags: flags.length,
      new_candidates: recentMetrics.reduce((sum: number, m: any) => sum + (m.new_candidates_added || 0), 0),
      cv_submitted: recentMetrics.reduce((sum: number, m: any) => sum + (m.cv_submitted || 0), 0),
      interviews: recentMetrics.reduce((sum: number, m: any) => sum + (m.interviews_scheduled || 0), 0),
      offers: recentMetrics.reduce((sum: number, m: any) => sum + (m.offers_extended || 0), 0),
      placements: recentMetrics.reduce((sum: number, m: any) => sum + (m.placements || 0), 0),
    },
    weekly_metrics: recentMetrics,
    activities: weekActivities,
    flags: flags.slice(0, 10),
  };
}

export async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const path = (req.query as any).path || [];
  const resource = path[0];

  switch (resource) {
    case 'notifications':
      return handleNotifications(req, res);
    case 'alerts':
      return handleAlerts(req, res);
    case 'webhook':
      return handleWebhook(req, res);
    case 'settings':
      return handleSettings(req, res);
    case 'digest':
      return handleDigest(req, res);
    default:
      return res.status(404).json({ error: `Unknown resource: /api/v5/${resource}` });
  }
}