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

export interface SecurityHeaders {
  headers: Record<string, string>;
}

export interface CSPConfig {
  csp: string;
  directives: Record<string, string[]>;
}

export interface RateLimits {
  rate_limits: Record<string, { requests_per_minute: number; burst_size: number }>;
}

export interface SecurityAudit {
  score: number;
  findings: Array<{ severity: string; category: string; message: string; recommendation: string }>;
}

export const securityService = {
  getHeaders: () => request<SecurityHeaders>('/api/security/headers'),
  getCSP: () => request<CSPConfig>('/api/security/csp'),
  updateCSP: (csp: string) => request<CSPConfig>('/api/security/csp', {
    method: 'POST',
    body: JSON.stringify({ csp }),
  })),
  getRateLimits: () => request<RateLimits>('/api/security/rate-limits'),
  updateRateLimits: (rate_limits: unknown) => request<RateLimits>('/api/security/rate-limits', {
    method: 'POST',
    body: JSON.stringify({ rate_limits }),
  })),
  runAudit: () => request<SecurityAudit>('/api/security/audit'),
};