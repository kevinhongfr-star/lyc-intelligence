/**
 * DataContractsPage.tsx — Issue #97
 * Data Contracts registry — versioned schemas that enforce the shape of
 * data exchanged between frontend, API, edge functions, and external
 * integrations. Prevents silent breakage when one side evolves.
 */
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  FileJson,
  Search,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  Clock,
  Shield,
  ArrowRight,
} from 'lucide-react';

interface DataContract {
  id: string;
  name: string;
  version: string;
  producer: string;
  consumers: string[];
  schemaType: 'typescript' | 'zod' | 'json-schema' | 'sql';
  status: 'active' | 'deprecated' | 'draft';
  breakingChanges: number;
  lastValidated: string;
  compatibility: 'backward' | 'forward' | 'full' | 'none';
  fields: number;
}

const SEED_CONTRACTS: DataContract[] = [
  { id: 'dc-1', name: 'CandidateProfile', version: 'v3.2.0', producer: 'api/candidates', consumers: ['frontend', 'edge-functions', 'analytics'], schemaType: 'zod', status: 'active', breakingChanges: 0, lastValidated: '2026-07-20T08:00:00Z', compatibility: 'backward', fields: 42 },
  { id: 'dc-2', name: 'MandateDTO', version: 'v2.1.0', producer: 'api/mandates', consumers: ['frontend', 'client-portal', 'stripe-webhook'], schemaType: 'typescript', status: 'active', breakingChanges: 0, lastValidated: '2026-07-19T12:00:00Z', compatibility: 'full', fields: 28 },
  { id: 'dc-3', name: 'ShiftAssessmentResult', version: 'v1.4.0', producer: 'edge/shift-scorer', consumers: ['frontend', 'reports-engine', 'cohort-analytics'], schemaType: 'json-schema', status: 'active', breakingChanges: 1, lastValidated: '2026-07-18T16:00:00Z', compatibility: 'forward', fields: 67 },
  { id: 'dc-4', name: 'CreditTransaction', version: 'v2.0.0', producer: 'api/credits', consumers: ['frontend', 'stripe-webhook', 'billing'], schemaType: 'zod', status: 'active', breakingChanges: 0, lastValidated: '2026-07-20T10:00:00Z', compatibility: 'full', fields: 18 },
  { id: 'dc-5', name: 'NexusMessage', version: 'v4.0.0', producer: 'edge/nexus-chat', consumers: ['frontend', 'memory-service', 'rag-library'], schemaType: 'typescript', status: 'active', breakingChanges: 2, lastValidated: '2026-07-20T09:00:00Z', compatibility: 'backward', fields: 24 },
  { id: 'dc-6', name: 'UserActivationPayload', version: 'v0.9.0', producer: 'api/auth', consumers: ['frontend', 'onboarding-flow'], schemaType: 'zod', status: 'draft', breakingChanges: 0, lastValidated: '2026-07-15T14:00:00Z', compatibility: 'none', fields: 12 },
  { id: 'dc-7', name: 'EmailRequest', version: 'v1.0.0', producer: 'api/email-engine', consumers: ['nexus', 'crm-sync', 'delivery-tracker'], schemaType: 'json-schema', status: 'active', breakingChanges: 0, lastValidated: '2026-07-20T11:00:00Z', compatibility: 'backward', fields: 16 },
  { id: 'dc-8', name: 'CouncilMembership', version: 'v1.3.0', producer: 'api/council', consumers: ['frontend', 'billing', 'admin'], schemaType: 'zod', status: 'deprecated', breakingChanges: 0, lastValidated: '2026-06-28T10:00:00Z', compatibility: 'backward', fields: 22 },
];

const statusConfig: Record<string, { color: string; bg: string }> = {
  active: { color: 'text-green-600', bg: 'bg-green-50' },
  draft: { color: 'text-blue-600', bg: 'bg-blue-50' },
  deprecated: { color: 'text-gray-500', bg: 'bg-gray-100' },
};

const schemaConfig: Record<string, string> = {
  typescript: 'text-blue-600',
  zod: 'text-purple-600',
  'json-schema': 'text-amber-600',
  sql: 'text-emerald-600',
};

export function DataContractsPage() {
  const [contracts, setContracts] = useState<DataContract[]>(SEED_CONTRACTS);
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      contracts.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.producer.toLowerCase().includes(search.toLowerCase()) ||
          c.consumers.some((x) => x.toLowerCase().includes(search.toLowerCase())),
      ),
    [contracts, search],
  );

  const active = contracts.filter((c) => c.status === 'active').length;
  const breaking = contracts.reduce((s, c) => s + c.breakingChanges, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <FileJson className="w-6 h-6 text-blue-600" />
            Data Contracts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Versioned schemas enforcing data shape across frontend, API, edge functions, and integrations
          </p>
        </div>
        <Button className="gap-2">
          <GitBranch className="w-4 h-4" />
          Register Contract
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{contracts.length}</div>
          <div className="text-xs text-gray-500">Total Contracts</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{active}</div>
          <div className="text-xs text-gray-500">Active</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-amber-600">{breaking}</div>
          <div className="text-xs text-gray-500">Breaking Changes</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {new Set(contracts.map((c) => c.producer.split('/')[0])).size}
          </div>
          <div className="text-xs text-gray-500">Producer Services</div>
        </Card>
      </div>

      <Card className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by contract name, producer, or consumer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.map((c) => {
          const sc = statusConfig[c.status];
          return (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{c.name}</span>
                    <Badge variant="outline" className="text-[10px]">{c.version}</Badge>
                    <Badge className={`text-[10px] border-0 ${sc.bg} ${sc.color}`}>{c.status}</Badge>
                    <span className={`text-[10px] font-mono ${schemaConfig[c.schemaType]}`}>
                      {c.schemaType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    <span className="font-mono">{c.producer}</span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <div className="flex flex-wrap gap-1">
                      {c.consumers.map((con) => (
                        <span key={con} className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">
                          {con}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {c.compatibility} compatible
                    </span>
                    <span>{c.fields} fields</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      validated {new Date(c.lastValidated).toLocaleDateString()}
                    </span>
                    {c.breakingChanges > 0 && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <AlertTriangle className="w-3 h-3" />
                        {c.breakingChanges} breaking
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Validate
                  </Button>
                  <Button variant="outline" size="sm">
                    View Schema
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
