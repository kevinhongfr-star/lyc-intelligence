// Supabase Edge Function: webhook-handler
// Dispatches webhooks for mandate/candidate/placement events via pg_notify

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  record: Record<string, any>;
  old_record?: Record<string, any>;
  organization_id?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: WebhookPayload = await req.json();
    console.log('[webhook-handler] Event:', payload.table, payload.action);

    // Get webhook subscriptions for this table/event
    const { data: subscriptions } = await supabase
      .from('webhook_subscriptions')
      .select('*')
      .eq('table_name', payload.table)
      .eq('is_active', true)
      .or(`event_type.eq.${payload.action},event_type.eq.*`);

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[webhook-handler] No active subscriptions for', payload.table);
      return new Response(
        JSON.stringify({ success: true, dispatched: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Dispatch webhooks
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const webhookPayload = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          source: 'lyc-intelligence',
          event: `${payload.table}.${payload.action.toLowerCase()}`,
          data: {
            table: payload.table,
            action: payload.action,
            record: payload.record,
            old_record: payload.old_record,
            organization_id: payload.organization_id,
          },
        };

        const signature = await signWebhook(webhookPayload, sub.secret);

        const response = await fetch(sub.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Id': webhookPayload.id,
          },
          body: JSON.stringify(webhookPayload),
        });

        // Log delivery
        await supabase.from('webhook_deliveries').insert({
          subscription_id: sub.id,
          payload: webhookPayload,
          status_code: response.status,
          delivered_at: new Date().toISOString(),
          success: response.ok,
        });

        return { subscription_id: sub.id, status: response.status, ok: response.ok };
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled' && (r.value as any).ok).length;

    return new Response(
      JSON.stringify({ success: true, dispatched: successful, total: subscriptions.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[webhook-handler] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function signWebhook(payload: any, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, data);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}