import React, { useState } from 'react';
import {
  Users,
  UserCircle,
  Building2,
  Briefcase,
  Target,
  CreditCard,
  Shield,
  Cpu,
  Layers,
  ChevronRight,
  Sparkles,
  Workflow,
} from 'lucide-react';

export const NexusUserContextPage: React.FC = () => {
  const [tab, setTab] = useState('assembly');
  const [sampleRole, setSampleRole] = useState('consultant');
  const [sampleIcp, setSampleIcp] = useState('');

  const CONTEXT_FETCHERS = [
    { id: 'cf1', name: 'User Profile', source: 'profiles + auth.users', fields: ['role', 'icp', 'org_id', 'tier', 'credits_balance', 'full_name', 'avatar_url'], tier: 'all' },
    { id: 'cf2', name: 'Organization', source: 'organizations', fields: ['name', 'industry', 'headcount', 'tier', 'branding', 'custom_domain'], tier: 'all' },
    { id: 'cf3', name: 'Active Mandates', source: 'mandates (open)', fields: ['id', 'title', 'stage', 'client_id'], tier: 'staff' },
    { id: 'cf4', name: 'Recent Activity', source: 'activity_logs (7d)', fields: ['actions', 'entity', 'timestamps'], tier: 'all' },
    { id: 'cf5', name: 'Candidate Rel.', source: 'candidate assignments', fields: ['my_candidates', 'last touch'], tier: 'consultant' },
    { id: 'cf6', name: 'Assessment History', source: 'assessment_runs', fields: ['instruments taken', 'scores', 'reports'], tier: 'all' },
    { id: 'cf7', name: 'Credit & Billing', source: 'credits ledger', fields: ['balance', 'burn rate', 'plan'], tier: 'all' },
    { id: 'cf8', name: 'RAG Scope', source: 'knowledge_chunks (org-scoped)', fields: ['approved libraries', 'last index'], tier: 'premium' },
  ];

  const tierBadge = (t: string) => {
    switch (t) {
      case 'premium':
        return 'bg-fuchsia-100 text-fuchsia-700';
      case 'core':
        return 'bg-amber-100 text-amber-700';
      case 'success':
        return 'bg-emerald-100 text-emerald-700';
      case 'brand':
        return 'bg-fuchsia-100 text-fuchsia-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-fuchsia-100 text-fuchsia-700">N3 · User Context Assembly</span>
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-fuchsia-100 text-fuchsia-700">Tier Gating</span>
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">8 Fetchers · Scoped</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">N3: User Context Assembly + Tier Gating</h1>
        <p className="text-gray-600 text-lg">
          lib/nexus/contextFetchers.ts aggregates 8 context fetchers → system_prompt prefix.
          Gates before intent dispatch → credit consumed post-response.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Context Fetchers', value: '8', icon: <Layers className="w-5 h-5" />, trend: 'All wired', tone: 'emerald' },
          { label: 'Avg Prompt Window', value: '~18K tokens', icon: <Cpu className="w-5 h-5" />, trend: '4k / 128k window', tone: 'emerald' },
          { label: 'Gates Enforced', value: '6', icon: <Shield className="w-5 h-5" />, trend: 'RLS + Tier + Credits', tone: 'amber' },
          { label: 'Cold Start', value: '< 320 ms', icon: <Sparkles className="w-5 h-5" />, trend: 'P95', tone: 'emerald' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className={`p-2 w-fit rounded-lg mb-3 ${s.tone === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {s.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{s.value}</div>
            <div className="text-sm text-gray-500 mb-2">{s.label}</div>
            <div className="text-xs text-gray-400">{s.trend}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto">
          {[
            { value: 'assembly', label: 'Context Assembly Pipeline', icon: <Workflow className="w-4 h-4" /> },
            { value: 'fetchers', label: 'Fetcher Registry', icon: <Users className="w-4 h-4" /> },
            { value: 'gating', label: 'Tier Gating Rules', icon: <CreditCard className="w-4 h-4" /> },
            { value: 'playground', label: 'Context Playground', icon: <UserCircle className="w-4 h-4" /> },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.value
                  ? 'border-fuchsia-600 text-fuchsia-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'assembly' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">N3 Assembly Pipeline (8 fetchers → prompt prefix)</h3>
          <div className="flex flex-col md:flex-row items-stretch gap-2 mb-6">
            {[
              { t: '1. Auth + session JWT', c: '#C108AB', label: 'Nexus Request' },
              { t: '2. 8 parallel via Promise.all', c: '#8B5CF6', label: 'Profile fetchers parallel' },
              { t: '3. RLS scope filters', c: '#3B82F6', label: 'Tier / Org-scoped' },
              { t: '4. Token trim to budget', c: '#22C55E', label: 'Context window trim' },
              { t: '5. Inject into prompt', c: '#C108AB', label: '→ system prefix' },
              { t: '6. Intent exec + gate', c: '#F59E0B', label: 'LLM Turn' },
            ].map((st, i) => (
              <React.Fragment key={i}>
                <div className="flex-1 p-3 rounded-lg text-center text-xs font-medium" style={{ backgroundColor: `${st.c}15`, color: st.c }}>
                  <div>{st.t}</div>
                </div>
                {i < 5 && (
                  <ChevronRight className="w-5 h-5 hidden md:block self-center text-gray-400" />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <h4 className="font-semibold text-gray-900 mb-2">Assembled Context Prefix (sample consultant)</h4>
            <pre className="text-xs bg-white p-4 rounded-lg overflow-x-auto border border-gray-100" style={{ maxHeight: 320 }}>
{`User: Sarah Chen (sarah@lycpartners.com)
Role: consultant · Org: LYC Partners · Tier: premium · Credits: 482 / 1000
Open mandates (3): #482 CFO Search APAC, #501 CHRO Industrials, #513 CEO Tech
Recent activity (7d): 14 actions · 2 generated docs
Last candidates touched: Priya S. (2h), Rajiv M. (yesterday)
Assessment runs this month: 12
RAG libraries: LYC Playbook, APAC Compensation 2026, Mandate Handbook`}
            </pre>
          </div>
        </div>
      )}

      {tab === 'fetchers' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">N3 Context Fetcher Registry (8)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CONTEXT_FETCHERS.map((cf) => (
              <div key={cf.id} className="p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-fuchsia-50 text-fuchsia-600">
                      {cf.name.includes('Org') ? (
                        <Building2 className="w-4 h-4" />
                      ) : cf.name.includes('Mandate') ? (
                        <Briefcase className="w-4 h-4" />
                      ) : cf.name.includes('Credit') ? (
                        <CreditCard className="w-4 h-4" />
                      ) : cf.name.includes('Assessment') ? (
                        <Target className="w-4 h-4" />
                      ) : (
                        <Users className="w-4 h-4" />
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 m-0">{cf.name}</h4>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tierBadge(cf.tier)}`}>
                    {cf.tier}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-2 font-mono">{cf.source}</div>
                <div className="flex flex-wrap gap-1">
                  {cf.fields.map((f) => (
                    <span key={f} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'gating' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">N3 Tier Gating — 6 Gates Applied</h3>
          <div className="space-y-3">
            {[
              { g: 'Authentication Gate', d: 'Valid JWT + session. Reject unauthenticated requests with 401.', p: '100% coverage' },
              { g: 'RLS Scope Gate', d: 'Supabase RLS policies filter all context fetches per org_id + user_id.', p: '57 tables' },
              { g: 'Role Gate', d: 'Role in allowed_roles check for consultant/admin access / candidate / client.', p: 'Consultant: ADMIN_ROLES' },
              { g: 'ICP Gate', d: 'icp column restricts B2C surfaces (council vs candidate vs client).', p: '5 ICP types' },
              { g: 'Credit Gate', d: 'credit_balance ≥ turn cost before intent handler; prompt upsell.', p: '0 balance → upgrade' },
              { g: 'Feature Flag Gate', d: 'feature_flags table for alpha / org override before dispatch tool call.', p: '12 flags' },
            ].map((g, gi) => (
              <div key={gi} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1 m-0">{g.g}</h4>
                  <p className="text-sm text-gray-600 m-0">{g.d}</p>
                </div>
                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 shrink-0">
                  {g.p}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'playground' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pick a user persona</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={sampleRole}
                  onChange={(e) => setSampleRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent text-sm"
                >
                  <option value="consultant">Consultant (Sarah · LYC)</option>
                  <option value="bd_manager">BD Manager · LYC</option>
                  <option value="client_admin">Client Admin · ACME Pte</option>
                  <option value="candidate">Candidate · Priya S.</option>
                  <option value="council_member">Council Member · B2C</option>
                  <option value="lyc_admin">LYC Admin · Kevin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ICP</label>
                <select
                  value={sampleIcp}
                  onChange={(e) => setSampleIcp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent text-sm"
                >
                  <option value="">(none / staff)</option>
                  <option value="client">client</option>
                  <option value="candidate">candidate</option>
                  <option value="council">council / B2C</option>
                </select>
              </div>
            </div>
            <button className="w-full mt-6 inline-flex items-center justify-center gap-2 px-4 py-3 bg-fuchsia-600 text-white rounded-lg font-medium hover:bg-fuchsia-700 transition-colors">
              <Sparkles className="w-4 h-4" />
              Assemble Context
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assembled Output</h3>
            <div className="space-y-2 text-sm">
              <div className="p-3 rounded-lg bg-fuchsia-50">
                <div className="text-xs text-fuchsia-700 font-medium mb-1">identity</div>
                <div className="font-mono text-xs text-gray-800">
                  {sampleRole} {sampleIcp ? `· icp=${sampleIcp}` : ''}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50">
                <div className="text-xs text-emerald-700 font-medium mb-1">org context</div>
                <div className="font-mono text-xs text-gray-800">
                  {sampleRole.includes('client') ? 'ACME Pte Ltd' : 'LYC Partners HQ'} · tier: premium
                </div>
              </div>
              <div className="p-3 rounded-lg bg-sky-50">
                <div className="text-xs text-sky-700 font-medium mb-1">recent</div>
                <div className="font-mono text-xs text-gray-800">mandates=3 · actions=14 (7d) · assessments=12 (mo)</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50">
                <div className="text-xs text-amber-700 font-medium mb-1">credits + gates</div>
                <div className="font-mono text-xs text-gray-800">
                  balance: 482 / 1000 · rate=198/day · all 6 gates pass ✅
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NexusUserContextPage;
