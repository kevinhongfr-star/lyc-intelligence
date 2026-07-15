// Supabase Edge Function: auth-handler
// Handles auth events: user creation, profile sync, organization setup

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { type, user, event } = body;

    console.log('[auth-handler] Event:', type, 'User:', user?.id);

    switch (type) {
      case 'user.created':
        // Profile is auto-created by trigger, but we can do additional setup
        if (user?.id) {
          // Create credits row
          const { error: creditsError } = await supabase.from('credits').upsert({
            user_id: user.id,
            balance: 2,
            daily_balance: 2,
            tier: 'free',
            last_daily_reset: new Date().toISOString(),
          }, { onConflict: 'user_id' });

          if (creditsError) {
            console.warn('[auth-handler] Credits creation error:', creditsError);
          }

          // Create notification preferences
          await supabase.from('notification_preferences').insert({
            user_id: user.id,
          }).catch(() => {});

          console.log('[auth-handler] User setup complete:', user.id);
        }
        break;

      case 'user.updated':
        // Sync profile with auth user metadata
        if (user?.id) {
          const { error } = await supabase
            .from('v2_user_profiles')
            .update({
              name: user.user_metadata?.name,
              avatar_url: user.user_metadata?.avatar_url,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

          if (error) {
            console.error('[auth-handler] Profile sync error:', error);
          }
        }
        break;

      case 'user.deleted':
        // Soft delete - just log, actual deletion is handled by CASCADE
        console.log('[auth-handler] User deleted:', user?.id);
        break;

      case 'password.reset':
        console.log('[auth-handler] Password reset requested:', user?.email);
        break;

      default:
        console.log('[auth-handler] Unhandled event type:', type);
    }

    return new Response(
      JSON.stringify({ success: true, type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[auth-handler] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});