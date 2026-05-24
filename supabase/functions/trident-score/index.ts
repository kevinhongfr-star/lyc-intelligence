import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TRIDENTInput {
  jd: string;
  cv: string;
}

interface TRIDENTScores {
  d1: number;
  d2: number;
  d3: number;
  key_match_reasons: string;
  risk_factors: string;
  approach_strategy: string;
}

interface TRIDENTResult {
  d1: number;
  d2: number;
  d3: number;
  composite: number;
  verdict: string;
  tier: string;
  clientVerdict: string;
  keyMatchReasons: string;
  riskFactors: string;
  approachStrategy: string;
}

const WEIGHTS = { d1: 0.40, d2: 0.35, d3: 0.25 };
const VERDICT_THRESHOLDS = { strong: 75, conditional: 50, weak: 30 };

function computeComposite(scores: { d1: number; d2: number; d3: number }): number {
  return Math.round((scores.d1 * WEIGHTS.d1 + scores.d2 * WEIGHTS.d2 + scores.d3 * WEIGHTS.d3) * 10);
}

function getVerdictAndTier(composite: number): { verdict: string; tier: string; clientVerdict: string } {
  if (composite >= VERDICT_THRESHOLDS.strong) {
    return { verdict: 'Strong Fit', tier: 'T1', clientVerdict: 'Strong Primary (T1)' };
  } else if (composite >= VERDICT_THRESHOLDS.conditional) {
    return { verdict: 'Conditional Fit', tier: 'T2', clientVerdict: 'Strong Secondary (T2)' };
  } else if (composite >= VERDICT_THRESHOLDS.weak) {
    return { verdict: 'Weak Fit', tier: 'T3', clientVerdict: 'Reserve (T3)' };
  }
  return { verdict: 'Reject', tier: 'T3', clientVerdict: 'Not Included' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { jd, cv }: TRIDENTInput = await req.json();

    if (!jd || !cv) {
      return new Response(JSON.stringify({ error: 'Missing JD or CV' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';

    if (!DEEPSEEK_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are an executive search analyst specializing in the TRIDENT 3D model for candidate evaluation.

Evaluate the candidate against the job description across THREE dimensions (score 0-100 each):

D1 - EXPERIENCE & ACHIEVEMENTS (Weight: Not disclosed to client)
- Career trajectory and progression
- Role relevance to the position
- Leadership scope and team size
- Quantifiable achievements and impact
- Industry experience

D2 - SKILLS / FUNCTIONAL MATCH (Weight: Not disclosed to client)
- Technical competencies required
- Functional expertise
- Cross-border capability
- Language proficiency
- Domain knowledge

D3 - ORGANIZATIONAL FIT (Weight: Not disclosed to client)
- Culture alignment potential
- Stakeholder management capability
- Transformation readiness
- Board and executive dynamics
- Values alignment

Return ONLY valid JSON with this exact structure:
{
  "d1": number (0-100),
  "d2": number (0-100),
  "d3": number (0-100),
  "key_match_reasons": "2-3 sentences about why this candidate fits",
  "risk_factors": "1-2 sentences about potential concerns",
  "approach_strategy": "1-2 sentences about how to approach this candidate"
}`;

    const aiResponse = await fetch(DEEPSEEK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `JOB DESCRIPTION:\n${jd}\n\nCANDIDATE CV:\n${cv}` }
        ],
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const scores: TRIDENTScores = JSON.parse(jsonMatch[0]);
    const composite = computeComposite(scores);
    const { verdict, tier, clientVerdict } = getVerdictAndTier(composite);

    const result: TRIDENTResult = {
      d1: scores.d1,
      d2: scores.d2,
      d3: scores.d3,
      composite,
      verdict,
      tier,
      clientVerdict,
      keyMatchReasons: scores.key_match_reasons,
      riskFactors: scores.risk_factors,
      approachStrategy: scores.approach_strategy,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('TRIDENT scoring error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
