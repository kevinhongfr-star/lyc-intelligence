// Supabase Edge Function: email-sender
// Sends emails via Resend API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template_id?: string;
  template_data?: Record<string, any>;
  from?: string;
  reply_to?: string;
  tags?: Array<{ name: string; value: string }>;
}

const DEFAULT_FROM = 'LYC Intelligence <noreply@lyc-partners.ai>';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const payload: EmailPayload = await req.json();
    console.log('[email-sender] Sending to:', payload.to);

    // Build email payload
    const emailData: Record<string, any> = {
      from: payload.from || DEFAULT_FROM,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
    };

    if (payload.template_id) {
      // Use Resend template
      emailData.template_id = payload.template_id;
      emailData.template_data = payload.template_data || {};
    } else {
      // Use inline content
      if (payload.html) emailData.html = payload.html;
      if (payload.text) emailData.text = payload.text;
    }

    if (payload.reply_to) emailData.reply_to = payload.reply_to;
    if (payload.tags) emailData.tags = payload.tags;

    // Send via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[email-sender] Resend error:', result);
      throw new Error(result.message || 'Failed to send email');
    }

    console.log('[email-sender] Email sent:', result.id);

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[email-sender] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});