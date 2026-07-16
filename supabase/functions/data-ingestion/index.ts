import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IntelligenceSource {
  id: string;
  name: string;
  source_type: string;
  url: string;
  api_endpoint: string;
  refresh_interval_minutes: number;
  is_active: boolean;
  last_fetched_at: string | null;
  metadata: Record<string, any>;
}

interface IntelligenceSignal {
  source_id: string;
  org_id: string | null;
  signal_type: string;
  title: string;
  summary: string;
  raw_content: string;
  confidence: number;
  relevance_score: number;
  impact_level: string;
  companies_related: string[];
  mandates_related: string[];
  industries: string[];
  tags: string[];
  geography: string[];
  published_at: string;
  ai_enriched: boolean;
  ai_analysis: Record<string, any>;
  metadata: Record<string, any>;
}

async function fetchFromSupabase(url: string, options?: RequestInit): Promise<any> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase URL or service key not configured');
  }

  const response = await fetch(`${supabaseUrl}${url}`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${text}`);
  }

  return response.json();
}

async function fetchRSSFeed(url: string): Promise<any[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[data-ingestion] RSS fetch failed: ${url} - ${response.status}`);
      return [];
    }
    const text = await response.text();
    return parseRSS(text);
  } catch (error) {
    console.warn(`[data-ingestion] RSS error: ${url} - ${error}`);
    return [];
  }
}

function parseRSS(xml: string): any[] {
  const items: any[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const linkMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const pubDateMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
    const descriptionMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i);

    if (titleMatch) {
      items.push({
        title: stripTags(titleMatch[1]),
        link: linkMatch ? stripTags(linkMatch[1]) : '',
        pubDate: pubDateMatch ? parseDate(stripTags(pubDateMatch[1])) : null,
        description: descriptionMatch ? stripTags(descriptionMatch[1]) : '',
      });
    }
  }

  return items;
}

function stripTags(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

function parseDate(dateStr: string): string {
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

async function fetchAPIEndpoint(endpoint: string, metadata: Record<string, any>): Promise<any[]> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (metadata.api_key) {
      headers['Authorization'] = `Bearer ${metadata.api_key}`;
    } else if (metadata.api_token) {
      headers['X-API-Token'] = metadata.api_token;
    }

    const response = await fetch(endpoint, { headers });
    if (!response.ok) {
      console.warn(`[data-ingestion] API fetch failed: ${endpoint} - ${response.status}`);
      return [];
    }
    return await response.json();
  } catch (error) {
    console.warn(`[data-ingestion] API error: ${endpoint} - ${error}`);
    return [];
  }
}

function mapRSSItemToSignal(item: any, sourceId: string): IntelligenceSignal | null {
  if (!item.title) return null;
  
  return {
    source_id: sourceId,
    org_id: null,
    signal_type: 'industry_report',
    title: item.title,
    summary: item.description || '',
    raw_content: JSON.stringify(item),
    confidence: 0.7,
    relevance_score: 0.5,
    impact_level: 'medium',
    companies_related: [],
    mandates_related: [],
    industries: [],
    tags: [],
    geography: [],
    published_at: item.pubDate || new Date().toISOString(),
    ai_enriched: false,
    ai_analysis: {},
    metadata: { source: 'rss', link: item.link },
  };
}

function mapAPIResponseToSignals(data: any[], sourceId: string, sourceType: string): IntelligenceSignal[] {
  const signals: IntelligenceSignal[] = [];
  
  if (!Array.isArray(data)) return signals;

  for (const item of data) {
    let signalType = 'industry_report';
    let impactLevel = 'medium';
    
    if (sourceType === 'hiring') signalType = 'hiring';
    if (sourceType === 'funding') signalType = 'funding';
    if (sourceType === 'news') signalType = 'market_shift';

    signals.push({
      source_id: sourceId,
      org_id: null,
      signal_type: signalType,
      title: item.title || item.name || 'Untitled',
      summary: item.summary || item.description || '',
      raw_content: JSON.stringify(item),
      confidence: 0.6,
      relevance_score: 0.5,
      impact_level: impactLevel,
      companies_related: [],
      mandates_related: [],
      industries: item.industries || [],
      tags: item.tags || [],
      geography: item.geography || item.location || [],
      published_at: item.published_at || item.date || new Date().toISOString(),
      ai_enriched: false,
      ai_analysis: {},
      metadata: item,
    });
  }

  return signals;
}

async function fetchSource(source: IntelligenceSource): Promise<IntelligenceSignal[]> {
  console.log(`[data-ingestion] Fetching source: ${source.name} (${source.source_type})`);
  
  const signals: IntelligenceSignal[] = [];

  switch (source.source_type) {
    case 'rss':
      if (source.url) {
        const items = await fetchRSSFeed(source.url);
        for (const item of items) {
          const signal = mapRSSItemToSignal(item, source.id);
          if (signal) signals.push(signal);
        }
      }
      break;
    
    case 'api':
      if (source.api_endpoint) {
        const data = await fetchAPIEndpoint(source.api_endpoint, source.metadata);
        const mapped = mapAPIResponseToSignals(data, source.id, source.source_type);
        signals.push(...mapped);
      }
      break;
    
    case 'news':
    case 'job_board':
    case 'glassdoor':
    case 'regulatory':
      if (source.api_endpoint) {
        const data = await fetchAPIEndpoint(source.api_endpoint, source.metadata);
        const mapped = mapAPIResponseToSignals(data, source.id, source.source_type);
        signals.push(...mapped);
      }
      break;
    
    default:
      console.warn(`[data-ingestion] Unsupported source type: ${source.source_type}`);
  }

  return signals;
}

async function deduplicateSignals(signals: IntelligenceSignal[]): Promise<IntelligenceSignal[]> {
  if (signals.length === 0) return [];

  try {
    const existingSignals = await fetchFromSupabase(
      `/rest/v1/intelligence_signals?select=title&limit=1000`
    );
    
    const existingTitles = new Set(
      (existingSignals as any[]).map(s => s.title.toLowerCase().trim())
    );

    return signals.filter(s => !existingTitles.has(s.title.toLowerCase().trim()));
  } catch (error) {
    console.warn(`[data-ingestion] Deduplication error: ${error}`);
    return signals;
  }
}

async function saveSignals(signals: IntelligenceSignal[]): Promise<number> {
  if (signals.length === 0) return 0;

  try {
    const response = await fetchFromSupabase(
      `/rest/v1/intelligence_signals`,
      {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify(signals),
      }
    );
    
    const saved = Array.isArray(response) ? response : [];
    console.log(`[data-ingestion] Saved ${saved.length} new signals`);
    return saved.length;
  } catch (error) {
    console.error(`[data-ingestion] Failed to save signals: ${error}`);
    return 0;
  }
}

async function updateSourceLastFetched(sourceId: string): Promise<void> {
  try {
    await fetchFromSupabase(
      `/rest/v1/intelligence_sources?id=eq.${sourceId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ last_fetched_at: new Date().toISOString() }),
      }
    );
  } catch (error) {
    console.warn(`[data-ingestion] Failed to update source ${sourceId}: ${error}`);
  }
}

async function processAllSources(): Promise<{ totalFetched: number; totalSaved: number; sourcesProcessed: number }> {
  let totalFetched = 0;
  let totalSaved = 0;
  let sourcesProcessed = 0;

  try {
    const sources: IntelligenceSource[] = await fetchFromSupabase(
      `/rest/v1/intelligence_sources?is_active=eq.true&select=id,name,source_type,url,api_endpoint,refresh_interval_minutes,is_active,last_fetched_at,metadata`
    );

    console.log(`[data-ingestion] Found ${sources.length} active sources`);

    for (const source of sources) {
      sourcesProcessed++;
      
      try {
        const signals = await fetchSource(source);
        totalFetched += signals.length;

        if (signals.length > 0) {
          const uniqueSignals = await deduplicateSignals(signals);
          const saved = await saveSignals(uniqueSignals);
          totalSaved += saved;
        }

        await updateSourceLastFetched(source.id);
        
      } catch (error) {
        console.error(`[data-ingestion] Error processing source ${source.name}: ${error}`);
      }
    }

  } catch (error) {
    console.error(`[data-ingestion] Failed to fetch sources: ${error}`);
  }

  return { totalFetched, totalSaved, sourcesProcessed };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    console.log('[data-ingestion] Starting data ingestion pipeline');

    const result = await processAllSources();
    
    const duration = Date.now() - startTime;
    const message = `Data ingestion completed in ${duration}ms: ${result.sourcesProcessed} sources processed, ${result.totalFetched} signals fetched, ${result.totalSaved} new signals saved`;
    
    console.log(`[data-ingestion] ${message}`);

    return new Response(
      JSON.stringify({
        success: true,
        message,
        duration_ms: duration,
        sources_processed: result.sourcesProcessed,
        signals_fetched: result.totalFetched,
        signals_saved: result.totalSaved,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[data-ingestion] Pipeline error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
