const API_BASE = '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface SystemStatus {
  status: {
    overall: string;
    last_updated: string;
    incidents: Array<{ id: string; title: string; severity: string; status: string }>;
    systems: Array<{ name: string; status: string; description: string }>;
  };
}

export interface ServiceHealth {
  name: string;
  status: string;
  latency_ms: number;
  uptime_percentage: number;
  last_checked: string;
}

export interface MetricsData {
  metrics: {
    requests_total_30d: number;
    errors_total_30d: number;
    avg_latency_30d: number;
    daily: Array<{ date: string; requests: number; errors: number; avg_latency_ms: number }>;
    current: { cpu_percent: number; memory_percent: number; disk_percent: number };
  };
}

export const monitoringService = {
  getHealth: () => request<{ status: string; services: ServiceHealth[] }>('/api/monitoring/health'),
  getServices: () => request<{ services: ServiceHealth[] }>('/api/monitoring/services'),
  getMetrics: () => request<MetricsData>('/api/monitoring/metrics'),
  getAlerts: () => request<{ alerts: unknown[] }>('/api/monitoring/alerts'),
  createAlert: (alert: object) => request<{ alert: unknown }>('/api/monitoring/alerts', {
    method: 'POST',
    body: JSON.stringify(alert),
  }),
  deleteAlert: (id: string) => request<{ id: string }>(`/api/monitoring/alerts/${id}`, { method: 'DELETE' }),
  getStatusPage: () => request<SystemStatus>('/api/incidents/status'),
};