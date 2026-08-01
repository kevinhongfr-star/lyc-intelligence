/**
 * CustomDomainPage.tsx — Issue #27
 * Whitelabel / custom domain management for enterprise clients.
 * Allows admins to configure branded subdomains (e.g. talent.acme.com)
 * pointing at the LYC Intelligence platform with custom branding.
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Globe,
  ShieldCheck,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Trash2,
  Palette,
} from 'lucide-react';

interface CustomDomain {
  id: string;
  domain: string;
  clientId: string;
  clientName: string;
  status: 'verified' | 'pending' | 'failed';
  sslStatus: 'active' | 'pending' | 'expired';
  primaryColor: string;
  logoUrl: string | null;
  createdAt: string;
  lastVerifiedAt: string | null;
}

const SEED_DOMAINS: CustomDomain[] = [
  {
    id: 'dom-1',
    domain: 'talent.acmecorp.com',
    clientId: 'cli-1',
    clientName: 'ACME Corporation',
    status: 'verified',
    sslStatus: 'active',
    primaryColor: '#0066FF',
    logoUrl: 'https://cdn.lyc.ai/clients/acme/logo.svg',
    createdAt: '2026-05-12T10:00:00Z',
    lastVerifiedAt: '2026-07-20T08:00:00Z',
  },
  {
    id: 'dom-2',
    domain: 'leadership.finbank.io',
    clientId: 'cli-2',
    clientName: 'FinBank Asia',
    status: 'pending',
    sslStatus: 'pending',
    primaryColor: '#0E7490',
    logoUrl: null,
    createdAt: '2026-07-15T14:30:00Z',
    lastVerifiedAt: null,
  },
  {
    id: 'dom-3',
    domain: 'hire.techventures.cn',
    clientId: 'cli-3',
    clientName: 'TechVentures Group',
    status: 'failed',
    sslStatus: 'expired',
    primaryColor: '#7C3AED',
    logoUrl: 'https://cdn.lyc.ai/clients/tv/logo.png',
    createdAt: '2026-03-01T09:15:00Z',
    lastVerifiedAt: '2026-06-30T08:00:00Z',
  },
];

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  verified: { color: 'text-green-600', bg: 'bg-green-50', label: 'Verified' },
  pending: { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Pending DNS' },
  failed: { color: 'text-red-600', bg: 'bg-red-50', label: 'Verification Failed' },
  active: { color: 'text-green-600', bg: 'bg-green-50', label: 'Active' },
  expired: { color: 'text-red-600', bg: 'bg-red-50', label: 'Expired' },
};

export function CustomDomainPage() {
  const [domains, setDomains] = useState<CustomDomain[]>(SEED_DOMAINS);
  const [showAdd, setShowAdd] = useState(false);
  const [newDomain, setNewDomain] = useState({ domain: '', clientId: '', primaryColor: '#C108AB' });
  const [verifying, setVerifying] = useState<string | null>(null);

  async function verifyDomain(id: string) {
    setVerifying(id);
    await new Promise((r) => setTimeout(r, 1500));
    setDomains((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: 'verified',
              sslStatus: 'active',
              lastVerifiedAt: new Date().toISOString(),
            }
          : d,
      ),
    );
    setVerifying(null);
  }

  function handleAdd() {
    if (!newDomain.domain || !newDomain.clientId) return;
    const entry: CustomDomain = {
      id: `dom-${Date.now()}`,
      domain: newDomain.domain,
      clientId: newDomain.clientId,
      clientName: newDomain.clientId,
      status: 'pending',
      sslStatus: 'pending',
      primaryColor: newDomain.primaryColor,
      logoUrl: null,
      createdAt: new Date().toISOString(),
      lastVerifiedAt: null,
    };
    setDomains([entry, ...domains]);
    setNewDomain({ domain: '', clientId: '', primaryColor: '#C108AB' });
    setShowAdd(false);
  }

  function removeDomain(id: string) {
    setDomains((prev) => prev.filter((d) => d.id !== id));
  }

  const verified = domains.filter((d) => d.status === 'verified').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-purple-600" />
            Custom Domains
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Whitelabel subdomain management for enterprise clients (CNAME → lyc-intelligence.vercel.app)
          </p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Domain
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{domains.length}</div>
          <div className="text-xs text-gray-500">Total Domains</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{verified}</div>
          <div className="text-xs text-gray-500">Verified</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-amber-600">
            {domains.filter((d) => d.status === 'pending').length}
          </div>
          <div className="text-xs text-gray-500">Pending DNS</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">
            {domains.filter((d) => d.sslStatus === 'expired').length}
          </div>
          <div className="text-xs text-gray-500">SSL Expired</div>
        </Card>
      </div>

      {showAdd && (
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-semibold">Register New Custom Domain</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="talent.client.com"
              value={newDomain.domain}
              onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })}
            />
            <Input
              placeholder="Client ID"
              value={newDomain.clientId}
              onChange={(e) => setNewDomain({ ...newDomain, clientId: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newDomain.primaryColor}
                onChange={(e) => setNewDomain({ ...newDomain, primaryColor: e.target.value })}
                className="w-10 h-10 rounded border border-gray-200"
              />
              <Input
                placeholder="#C108AB"
                value={newDomain.primaryColor}
                onChange={(e) => setNewDomain({ ...newDomain, primaryColor: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd}>Register</Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {domains.map((d) => {
          const sc = statusConfig[d.status];
          const ssl = statusConfig[d.sslStatus];
          return (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${d.primaryColor}15` }}
                  >
                    <Globe className="w-5 h-5" style={{ color: d.primaryColor }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{d.domain}</span>
                      <a
                        href={`https://${d.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {d.clientName} · Created {new Date(d.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge className={`text-[10px] border-0 ${sc.bg} ${sc.color}`}>
                        {d.status === 'verified' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                        {sc.label}
                      </Badge>
                      <Badge className={`text-[10px] border-0 ${ssl.bg} ${ssl.color}`}>
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        SSL {ssl.label}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Palette className="w-3 h-3" />
                        {d.primaryColor}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {d.status !== 'verified' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => verifyDomain(d.id)}
                      disabled={verifying === d.id}
                      className="gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${verifying === d.id ? 'animate-spin' : ''}`} />
                      {verifying === d.id ? 'Verifying...' : 'Verify'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeDomain(d.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              {d.status === 'pending' && (
                <div className="mt-3 p-3 bg-amber-50 rounded text-xs text-amber-800">
                  <strong>DNS Setup Required:</strong> Add a CNAME record pointing{' '}
                  <code className="bg-amber-100 px-1 rounded">{d.domain}</code> →{' '}
                  <code className="bg-amber-100 px-1 rounded">lyc-intelligence.vercel.app</code>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
