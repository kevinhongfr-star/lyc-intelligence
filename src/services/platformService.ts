import { authFetch, authFetchJSON } from '@/utils/authFetch';

const API_BASE = '/api';

export interface UploadedDocument {
  id: string;
  user_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  parsed_content: string | null;
  extracted_text: string | null;
  metadata: Record<string, unknown>;
  status: string;
  created_at: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  published_at?: string;
  rank_score?: number;
}

export interface CustomPromptRecord {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  content: string;
  variables: string[];
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface PluginRecord {
  id: string;
  user_id: string;
  name: string;
  description: string;
  version: string;
  source: string;
  status: string;
  config: Record<string, unknown>;
  hooks: string[];
  permissions: string[];
  installed_at: string;
}

export interface ApiKeyRecord {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export async function uploadDocument(file: File, metadata?: Record<string, unknown>): Promise<{ success: boolean; document?: UploadedDocument; error?: string; extracted_length?: number }> {
  try {
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await authFetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileBase64: base64,
        metadata,
      }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function listDocuments(): Promise<{ success: boolean; documents?: UploadedDocument[]; error?: string }> {
  try {
    const res = await authFetchJSON(`${API_BASE}/documents`);
    return res;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getDocument(id: string): Promise<{ success: boolean; document?: UploadedDocument; error?: string }> {
  try {
    return await authFetchJSON(`${API_BASE}/documents/${id}`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getDocumentPreview(id: string): Promise<{ success: boolean; preview?: { content: string; metadata: Record<string, unknown> }; error?: string }> {
  try {
    return await authFetchJSON(`${API_BASE}/documents/${id}/preview`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteDocument(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function webSearch(query: string): Promise<{ success: boolean; results?: SearchResult[]; total?: number; error?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/web-search/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getSearchHistory(): Promise<{ success: boolean; history?: Array<{ id: string; query: string; results_count: number; created_at: string }>; error?: string }> {
  try {
    return await authFetchJSON(`${API_BASE}/web-search/history`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function listPrompts(): Promise<{ success: boolean; prompts?: CustomPromptRecord[]; error?: string }> {
  try {
    return await authFetchJSON(`${API_BASE}/prompts`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createPrompt(prompt: { name: string; content: string; description?: string; category?: string }): Promise<{ success: boolean; prompt?: CustomPromptRecord; error?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updatePrompt(id: string, prompt: Partial<CustomPromptRecord>): Promise<{ success: boolean; prompt?: CustomPromptRecord; error?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/prompts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deletePrompt(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/prompts/${id}`, { method: 'DELETE' });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function listPlugins(): Promise<{ success: boolean; plugins?: PluginRecord[]; error?: string }> {
  try {
    return await authFetchJSON(`${API_BASE}/plugins`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getPluginCatalog(): Promise<{ success: boolean; catalog?: PluginRecord[]; error?: string }> {
  try {
    return await authFetchJSON(`${API_BASE}/plugins/catalog`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function installPlugin(plugin: { name: string; description: string; version: string; source?: string; config?: Record<string, unknown>; hooks?: string[]; permissions?: string[] }): Promise<{ success: boolean; plugin?: PluginRecord; error?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/plugins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plugin),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function togglePlugin(id: string, enable: boolean): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/plugins/${id}/${enable ? 'enable' : 'disable'}`, { method: 'POST' });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function listApiKeys(): Promise<{ success: boolean; keys?: ApiKeyRecord[]; error?: string }> {
  try {
    return await authFetchJSON(`${API_BASE}/api-keys`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createApiKey(name: string, scopes: string[]): Promise<{ success: boolean; key?: ApiKeyRecord & { raw_key: string }; error?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/api-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, scopes }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function revokeApiKey(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/api-keys/${id}`, { method: 'DELETE' });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}