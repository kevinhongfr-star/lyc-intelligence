/**
 * adminService.ts — Admin API client for the frontend.
 *
 * Typed API client that wraps fetch() for all admin endpoints.
 * Handles authentication headers, error parsing, and response typing.
 */

const API_BASE = '/api/admin';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('supabase.auth.token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export const adminService = {
  users: {
    list: (params?: Record<string, string | number | boolean>) =>
      request<{ users: any[]; total: number }>(
        `/users${params ? '?' + new URLSearchParams(params as any).toString() : ''}`
      ),
    get: (id: string) => request<{ user: any }>(`/users/${id}`),
    create: (data: any) => request<{ user: any }>('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<{ user: any }>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deactivate: (id: string) => request<{ user: any }>(`/users/${id}/deactivate`, { method: 'POST' }),
    reactivate: (id: string) => request<{ user: any }>(`/users/${id}/reactivate`, { method: 'POST' }),
    resetPassword: (id: string) => request<{ success: boolean; message: string }>(`/users/${id}/reset-password`, { method: 'POST' }),
    delete: (id: string) => request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),
  },

  organizations: {
    list: (params?: Record<string, string | number | boolean>) =>
      request<{ orgs: any[]; total: number }>(
        `/organizations${params ? '?' + new URLSearchParams(params as any).toString() : ''}`
      ),
    get: (id: string) => request<{ org: any }>(`/organizations/${id}`),
    create: (data: any) => request<{ org: any }>('/organizations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<{ org: any }>(`/organizations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    suspend: (id: string) => request<{ org: any }>(`/organizations/${id}/suspend`, { method: 'POST' }),
    reactivate: (id: string) => request<{ org: any }>(`/organizations/${id}/reactivate`, { method: 'POST' }),
    changePlan: (id: string, data: any) => request<{ org: any }>(`/organizations/${id}/plan`, { method: 'PUT', body: JSON.stringify(data) }),
    stats: (id: string) => request<{ stats: any }>(`/organizations/${id}/stats`),
  },

  moderation: {
    queue: (params?: Record<string, string | number | boolean>) =>
      request<{ items: any[]; total: number }>(
        `/moderation${params ? '?' + new URLSearchParams(params as any).toString() : ''}`
      ),
    get: (id: string) => request<{ item: any }>(`/moderation/${id}`),
    flag: (data: any) => request<{ item: any }>('/moderation/flag', { method: 'POST', body: JSON.stringify(data) }),
    review: (id: string, data: any) => request<{ item: any }>(`/moderation/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
    remove: (id: string, reason: string) => request<{ item: any }>(`/moderation/${id}/remove`, { method: 'POST', body: JSON.stringify({ reason }) }),
    restore: (id: string, reason: string) => request<{ item: any }>(`/moderation/${id}/restore`, { method: 'POST', body: JSON.stringify({ reason }) }),
    stats: () => request<{ stats: any }>('/moderation/stats'),
  },

  analytics: {
    platform: () => request<{ stats: any }>('/analytics/platform'),
    usage: (days?: number) => request<{ metrics: any }>(`/analytics/usage${days ? `?days=${days}` : ''}`),
    health: () => request<{ health: any }>('/analytics/health'),
    mandateHealth: () => request<{ items: any[] }>('/analytics/mandate-health'),
    timeline: (days?: number) => request<{ timeline: any[] }>(`/analytics/timeline${days ? `?days=${days}` : ''}`),
  },

  audit: {
    list: (params?: Record<string, string | number | boolean>) =>
      request<{ entries: any[]; total: number }>(
        `/audit${params ? '?' + new URLSearchParams(params as any).toString() : ''}`
      ),
    get: (id: string) => request<{ entry: any }>(`/audit/${id}`),
    stats: () => request<{ stats: any }>('/audit/stats'),
    export: (params?: Record<string, string | boolean>) =>
      request<{ csv: string }>(
        `/audit/export${params ? '?' + new URLSearchParams(params as any).toString() : ''}`
      ),
  },

  config: {
    list: (scope?: string) =>
      request<{ configs: any[] }>(`/config${scope ? `?scope=${scope}` : ''}`),
    create: (data: any) => request<{ config: any }>('/config', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<{ config: any }>(`/config/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  featureFlags: {
    list: () => request<{ flags: any[] }>('/feature-flags'),
    create: (data: any) => request<{ flag: any }>('/feature-flags', { method: 'POST', body: JSON.stringify(data) }),
    update: (key: string, data: any) => request<{ flag: any }>(`/feature-flags/${encodeURIComponent(key)}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  billing: {
    invoices: (params?: Record<string, string | number | boolean>) =>
      request<{ invoices: any[]; total: number }>(
        `/billing/invoices${params ? '?' + new URLSearchParams(params as any).toString() : ''}`
      ),
    createInvoice: (data: any) => request<{ invoice: any }>('/billing/invoices', { method: 'POST', body: JSON.stringify(data) }),
    updateInvoiceStatus: (id: string, status: string) => request<{ invoice: any }>(`/billing/invoices/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    payments: (params?: Record<string, string | number | boolean>) =>
      request<{ payments: any[]; total: number }>(
        `/billing/payments${params ? '?' + new URLSearchParams(params as any).toString() : ''}`
      ),
    recordPayment: (data: any) => request<{ payment: any }>('/billing/payments', { method: 'POST', body: JSON.stringify(data) }),
    taxRates: () => request<{ rates: any[] }>('/billing/tax-rates'),
    calculateTax: (amount: number, region?: string) =>
      request<{ tax: number; rate: number; total: number }>(`/billing/tax?amount=${amount}${region ? `&region=${region}` : ''}`),
    summary: (orgId: string) => request<{ summary: any }>(`/billing/${orgId}/summary`),
  },

  rbac: {
    rolePermissions: () => request<{ permissions: any[] }>('/rbac/permissions'),
    updatePermission: (role: string, resource: string, action: string, allowed: boolean) =>
      request<{ permission: any }>('/rbac/permissions', {
        method: 'PUT',
        body: JSON.stringify({ role, resource, action, allowed }),
      }),
    userRole: (userId: string, role: string) =>
      request<{ user: any }>(`/rbac/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    overrides: () => request<{ overrides: any[] }>('/rbac/overrides'),
    createOverride: (data: any) => request<{ override: any }>('/rbac/overrides', { method: 'POST', body: JSON.stringify(data) }),
    deleteOverride: (id: string) => request<{ success: boolean }>(`/rbac/overrides/${id}`, { method: 'DELETE' }),
  },
};

export default adminService;
