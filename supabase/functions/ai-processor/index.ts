// Supabase Edge Function: ai-processor
// Routes AI requests to DeepSeek or OpenAI based on task type

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRequest {
  prompt: string;
  system_prompt?: string;
  model?: 'deepseek' | 'gpt-4' | 'gpt-3.5-turbo';
  max_tokens?: number;
  temperature?: number;
  task_type?: 'chat' | 'analysis' | 'extraction' | 'summary';
  context?: Record<string, any>;
}

const MODEL_CONFIGS = {
  deepseek: {
    url: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    header: (key: string) => ({ 'Authorization': `Bearer ${key}` }),
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4-turbo-preview',
    header: (key: string) => ({ 'Authorization': `Bearer ${key}` }),
  },
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: AIRequest = await req.json();
    console.log('[ai-processor] Task:', body.task_type || 'chat', 'Model:', body.model || 'auto');

    // Determine provider based on task type
    let provider: 'deepseek' | 'openai' = body.model === 'gpt-4' ? 'openai' : 'deepseek';
    
    // Use OpenAI for complex analysis tasks
    if (body.task_type === 'analysis' && !body.model) {
      provider = 'openai';
    }

    const apiKey = provider === 'deepseek'
      ? Deno.env.get('DEEPSEEK_API_KEY')
      : Deno.env.get('OPENAI_API_KEY');

    if (!apiKey) {
      throw new Error(`${provider.toUpperCase()}_API_KEY not configured`);
    }

    const config = MODEL_CONFIGS[provider];

    // Build messages
    const messages: Array<{ role: string; content: string }> = [];
    
    if (body.system_prompt) {
      messages.push({ role: 'system', content: body.system_prompt });
    }

    // Add context if provided
    let fullPrompt = body.prompt;
    if (body.context) {
      fullPrompt = `Context:\n${JSON.stringify(body.context, null, 2)}\n\n${body.prompt}`;
    }
    messages.push({ role: 'user', content: fullPrompt });

    // Make API request
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.header(apiKey),
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: body.max_tokens || 2000,
        temperature: body.temperature ?? 0.7,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[ai-processor] API error:', result);
      throw new Error(result.error?.message || 'AI request failed');
    }

    const content = result.choices?.[0]?.message?.content || '';

    return new Response(
      JSON.stringify({
        success: true,
        content,
        provider,
        model: result.model,
        usage: result.usage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ai-processor] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});