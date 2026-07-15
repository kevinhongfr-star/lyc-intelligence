// Supabase Edge Function: sync-handler
// Handles data synchronization between systems (Notion, external CRMs, etc.)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  source: 'notion' | 'hubspot' | 'salesforce' | 'csv' | 'manual';
  action: 'import' | 'export' | 'sync' | 'status';
  entity?: 'candidates' | 'mandates' | 'companies' | 'contacts';
  data?: any[];
  options?: {
    organization_id?: string;
    batch_size?: number;
    dry_run?: boolean;
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: SyncRequest = await req.json();
    console.log('[sync-handler] Source:', body.source, 'Action:', body.action, 'Entity:', body.entity);

    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    switch (body.action) {
      case 'import': {
        if (!body.data || body.data.length === 0) {
          throw new Error('No data provided for import');
        }

        const batchSize = body.options?.batch_size || 100;
        const batches = chunkArray(body.data, batchSize);

        for (const batch of batches) {
          try {
            const records = batch.map(transformRecord(body.entity || 'candidates', body.options));

            const { data, error } = await supabase
              .from(getTableName(body.entity))
              .upsert(records, {
                onConflict: 'id',
                ignoreDuplicates: false,
              });

            if (error) {
              results.failed += batch.length;
              results.errors.push(error.message);
            } else {
              results.processed += batch.length;
              results.created += (data || []).length;
            }
          } catch (e) {
            results.failed += batch.length;
            results.errors.push(e.message);
          }
        }
        break;
      }

      case 'export': {
        const { data, error } = await supabase
          .from(getTableName(body.entity))
          .select('*')
          .limit(body.options?.batch_size || 1000);

        if (error) throw error;

        return new Response(
          JSON.stringify({
            success: true,
            action: 'export',
            entity: body.entity,
            count: data?.length || 0,
            data,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync': {
        // Sync specific external system
        if (body.source === 'notion') {
          const notionApiKey = Deno.env.get('NOTION_API_KEY');
          if (notionApiKey) {
            // Perform Notion sync
            console.log('[sync-handler] Notion sync triggered');
            // TODO: Implement Notion API sync
          }
        }

        results.processed = body.data?.length || 0;
        break;
      }

      case 'status': {
        // Get sync status
        const { data: syncLog } = await supabase
          .from('sync_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        return new Response(
          JSON.stringify({
            success: true,
            action: 'status',
            recent_syncs: syncLog || [],
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Unknown action');
    }

    // Log sync
    await supabase.from('sync_logs').insert({
      source: body.source,
      action: body.action,
      entity: body.entity,
      processed: results.processed,
      created: results.created,
      updated: results.updated,
      failed: results.failed,
      errors: results.errors,
      created_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        action: body.action,
        ...results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[sync-handler] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function getTableName(entity?: string): string {
  const tables: Record<string, string> = {
    candidates: 'v2_candidates',
    mandates: 'mandates',
    companies: 'v2_companies',
    contacts: 'contacts',
  };
  return tables[entity || 'candidates'] || 'v2_candidates';
}

function transformRecord(entity: string, options?: any) {
  return (record: any) => {
    const base = {
      ...record,
      organization_id: options?.organization_id || record.organization_id,
      updated_at: new Date().toISOString(),
    };

    // Entity-specific transformations
    switch (entity) {
      case 'candidates':
        return {
          ...base,
          name: record.name || record.full_name || record.Name,
          email: record.email || record.Email,
          current_company: record.current_company || record.company || record.Company,
          current_title: record.current_title || record.title || record.Title,
        };
      case 'companies':
        return {
          ...base,
          name: record.name || record.Name || record.company_name,
          domain: record.domain || record.website || record.Website,
        };
      default:
        return base;
    }
  };
}