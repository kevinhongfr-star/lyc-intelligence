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

export interface LegalDocument {
  type: string;
  title: string;
  version: string;
  content: string;
  updated_at: string;
}

export interface ComplianceStatus {
  compliance: Record<string, { status: string; last_audit: string; next_audit: string } | { status: string }>;
}

export const legalService = {
  getTerms: () => request<{ document: LegalDocument }>('/api/legal/terms'),
  getPrivacy: () => request<{ document: LegalDocument }>('/api/legal/privacy'),
  getDPA: () => request<{ document: LegalDocument }>('/api/legal/dpa'),
  getCompliance: () => request<ComplianceStatus>('/api/legal/compliance'),
  acceptDocument: (document_type: string, version: string) => request<{ acceptance: unknown }>('/api/legal/accept', {
    method: 'POST',
    body: JSON.stringify({ document_type, version }),
  }),
  getAccepted: () => request<{ acceptances: unknown[] }>('/api/legal/accepted'),
  getVersions: (type: string) => request<{ versions: unknown[]; current_version: string }>(`/api/legal/versions/${type}`),
};