import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  source: 'all' | 'launch_assets' | 'build_tracker';
  mode: 'full' | 'incremental';
}

interface NotionPage {
  id: string;
  properties: Record<string, any>;
  last_edited_time: string;
  url: string;
}

interface NotionDatabaseResponse {
  results: NotionPage[];
  next_cursor: string | null;
  has_more: boolean;
}

const LAUNCH_ASSETS_DB_ID = Deno.env.get('NOTION_LAUNCH_ASSETS_DB_ID') || 'fe8bc7179ec2408c92f71c8e05998019';
const BUILD_TRACKER_DB_ID = Deno.env.get('NOTION_BUILD_TRACKER_DB_ID') || '';

const LAUNCH_ASSET_EXCLUSION_CATEGORIES = [
  'Web Page',
  'Search Material',
  'LinkedIn Post',
  'LinkedIn',
  'Legal',
  'Internal Ops',
  'ICP',
  'Brand',
];

const BUILD_TRACKER_EXCLUSION_CATEGORIES = [
  'Website',
  'Brand & Identity',
  'Legal',
  'Internal Ops',
];

const STATUS_MAP: Record<string, string> = {
  'Not Started': 'idea',
  'In Progress': 'draft',
  'Review': 'review',
  'Done': 'approved',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const notionToken = Deno.env.get('NOTION_API_TOKEN');

    if (!notionToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'NOTION_API_TOKEN not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: SyncRequest = await req.json();
    const source = body.source || 'all';
    const mode = body.mode || 'full';

    const startTime = Date.now();
    const results: Record<string, any> = {};

    if (source === 'all' || source === 'launch_assets') {
      results.launch_assets = await syncLaunchAssets(supabase, notionToken, mode);
    }

    if (source === 'all' || source === 'build_tracker') {
      results.build_tracker = await syncBuildTracker(supabase, notionToken, mode);
    }

    const durationMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        duration_ms: durationMs,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[notion-sync] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function syncLaunchAssets(
  supabase: any,
  notionToken: string,
  mode: 'full' | 'incremental'
): Promise<any> {
  const logId = await createSyncLog(supabase, 'launch_assets', mode);
  let recordsFetched = 0;
  let recordsUpserted = 0;
  let recordsFailed = 0;
  let recordsExcluded = 0;

  try {
    const allPages = await fetchAllNotionPages(notionToken, LAUNCH_ASSETS_DB_ID, mode, supabase);
    recordsFetched = allPages.length;

    for (const page of allPages) {
      try {
        const category = getPropertyText(page, 'Category');
        
        if (LAUNCH_ASSET_EXCLUSION_CATEGORIES.includes(category)) {
          recordsExcluded++;
          continue;
        }

        const asset = mapLaunchAsset(page);
        await upsertAsset(supabase, asset);
        recordsUpserted++;
      } catch (e) {
        console.error('[notion-sync] Failed to process asset:', page.id, e);
        recordsFailed++;
      }
    }

    await completeSyncLog(supabase, logId, recordsFetched, recordsUpserted, recordsFailed, recordsExcluded);

    return { recordsFetched, recordsUpserted, recordsFailed, recordsExcluded };
  } catch (error) {
    await failSyncLog(supabase, logId, error.message, recordsFetched, recordsUpserted, recordsFailed, recordsExcluded);
    throw error;
  }
}

async function syncBuildTracker(
  supabase: any,
  notionToken: string,
  mode: 'full' | 'incremental'
): Promise<any> {
  if (!BUILD_TRACKER_DB_ID) {
    return { skipped: true, reason: 'BUILD_TRACKER_DB_ID not configured' };
  }

  const logId = await createSyncLog(supabase, 'build_tracker', mode);
  let recordsFetched = 0;
  let recordsUpserted = 0;
  let recordsFailed = 0;
  let recordsExcluded = 0;
  const seenNames = new Set<string>();

  try {
    const allPages = await fetchAllNotionPages(notionToken, BUILD_TRACKER_DB_ID, mode, supabase);
    recordsFetched = allPages.length;

    for (const page of allPages) {
      try {
        const category = getPropertySelect(page, 'Category');
        
        if (BUILD_TRACKER_EXCLUSION_CATEGORIES.includes(category || '')) {
          recordsExcluded++;
          continue;
        }

        const item = mapBuildTrackerItem(page);
        
        if (seenNames.has(item.deliverable_name)) {
          recordsExcluded++;
          continue;
        }
        seenNames.add(item.deliverable_name);

        await upsertBuildTracker(supabase, item);
        recordsUpserted++;
      } catch (e) {
        console.error('[notion-sync] Failed to process build tracker:', page.id, e);
        recordsFailed++;
      }
    }

    await completeSyncLog(supabase, logId, recordsFetched, recordsUpserted, recordsFailed, recordsExcluded);

    return { recordsFetched, recordsUpserted, recordsFailed, recordsExcluded };
  } catch (error) {
    await failSyncLog(supabase, logId, error.message, recordsFetched, recordsUpserted, recordsFailed, recordsExcluded);
    throw error;
  }
}

async function fetchAllNotionPages(
  token: string,
  databaseId: string,
  mode: 'full' | 'incremental',
  supabase: any
): Promise<NotionPage[]> {
  const allPages: NotionPage[] = [];
  let cursor: string | null = null;

  const body: any = { page_size: 100 };
  
  if (mode === 'incremental') {
    const lastSync = await getLastSyncTime(supabase, databaseId === LAUNCH_ASSETS_DB_ID ? 'launch_assets' : 'build_tracker');
    if (lastSync) {
      body.filter = {
        timestamp: 'last_edited_time',
        last_edited_time: { after: lastSync },
      };
    }
  }

  do {
    if (cursor) body.start_cursor = cursor;
    
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '30';
      await sleep(parseInt(retryAfter) * 1000);
      continue;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Notion API error: ${response.status} ${text}`);
    }

    const data: NotionDatabaseResponse = await response.json();
    allPages.push(...data.results);
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);

  return allPages;
}

function mapLaunchAsset(page: NotionPage): any {
  const name = getPropertyTitle(page, 'Asset Name') || getPropertyTitle(page, 'Name') || 'Untitled';
  const status = getPropertySelect(page, 'Status');
  const format = getPropertySelect(page, 'Format');
  const category = getPropertySelect(page, 'Category');
  const phase = getPropertySelect(page, 'Phase');
  const priority = getPropertySelect(page, 'Priority');
  const productLayer = getPropertySelect(page, 'Product Layer');
  const assignedTo = getPropertyText(page, 'Assigned To');
  const dependenciesStr = getPropertyText(page, 'Dependencies');
  const dependencies = dependenciesStr
    ? dependenciesStr.split(',').map((d: string) => d.trim()).filter(Boolean)
    : [];

  const notionPageUrl = `https://www.notion.so/${page.id.replace(/-/g, '')}`;

  return {
    name,
    status: STATUS_MAP[status || ''] || 'idea',
    notion_asset_id: page.id,
    notion_phase: phase,
    asset_priority: priority,
    asset_category: category,
    asset_format: format,
    product_layer: productLayer,
    assigned_to: assignedTo,
    dependencies,
    notion_page_url: notionPageUrl,
    last_synced_at: new Date().toISOString(),
  };
}

function mapBuildTrackerItem(page: NotionPage): any {
  const title = getPropertyTitle(page, 'Deliverable') || getPropertyTitle(page, 'Name') || 'Untitled';
  const phase = getPropertySelect(page, 'Phase') || 'Uncategorized';
  const category = getPropertySelect(page, 'Category');
  const product = getPropertySelect(page, 'Product');
  const assignedTo = getPropertyText(page, 'Assigned To');

  const match = title.match(/^#(\d+)\s*[—-]\s*(.+)$/);
  const deliverableNumber = match ? parseInt(match[1]) : null;
  const deliverableName = match ? match[2].trim() : title;

  const notionPageUrl = `https://www.notion.so/${page.id.replace(/-/g, '')}`;

  return {
    deliverable_number: deliverableNumber,
    deliverable_name: deliverableName,
    build_phase: phase,
    category,
    product,
    assigned_to: assignedTo,
    notion_page_id: page.id,
    notion_page_url: notionPageUrl,
  };
}

async function upsertAsset(supabase: any, asset: any): Promise<void> {
  const { error } = await supabase
    .from('assets')
    .upsert(asset, { onConflict: 'notion_asset_id' });
  
  if (error) throw error;
}

async function upsertBuildTracker(supabase: any, item: any): Promise<void> {
  const { error } = await supabase
    .from('build_tracker')
    .upsert(item, { onConflict: 'notion_page_id' });
  
  if (error) throw error;
}

async function createSyncLog(supabase: any, sourceDb: string, syncType: string): Promise<string> {
  const { data, error } = await supabase
    .from('notion_sync_log')
    .insert({ source_db: sourceDb, sync_type: syncType })
    .select('id')
    .single();
  
  if (error) throw error;
  return data.id;
}

async function completeSyncLog(
  supabase: any,
  logId: string,
  fetched: number,
  upserted: number,
  failed: number,
  excluded: number
): Promise<void> {
  await supabase
    .from('notion_sync_log')
    .update({
      records_fetched: fetched,
      records_upserted: upserted,
      records_failed: failed,
      records_excluded: excluded,
      completed_at: new Date().toISOString(),
    })
    .eq('id', logId);
}

async function failSyncLog(
  supabase: any,
  logId: string,
  error: string,
  fetched: number,
  upserted: number,
  failed: number,
  excluded: number
): Promise<void> {
  await supabase
    .from('notion_sync_log')
    .update({
      records_fetched: fetched,
      records_upserted: upserted,
      records_failed: failed,
      records_excluded: excluded,
      error_details: error,
      completed_at: new Date().toISOString(),
    })
    .eq('id', logId);
}

async function getLastSyncTime(supabase: any, sourceDb: string): Promise<string | null> {
  const { data } = await supabase
    .from('notion_sync_log')
    .select('completed_at')
    .eq('source_db', sourceDb)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  return data?.completed_at || null;
}

function getPropertyTitle(page: NotionPage, propName: string): string {
  const prop = page.properties[propName];
  if (!prop || prop.type !== 'title') return '';
  return prop.title?.map((t: any) => t.plain_text).join('') || '';
}

function getPropertyText(page: NotionPage, propName: string): string {
  const prop = page.properties[propName];
  if (!prop) return '';
  
  if (prop.type === 'rich_text') {
    return prop.rich_text?.map((t: any) => t.plain_text).join('') || '';
  }
  if (prop.type === 'people') {
    return prop.people?.map((p: any) => p.name || '').join(', ') || '';
  }
  return '';
}

function getPropertySelect(page: NotionPage, propName: string): string {
  const prop = page.properties[propName];
  if (!prop || prop.type !== 'select') return '';
  return prop.select?.name || '';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
