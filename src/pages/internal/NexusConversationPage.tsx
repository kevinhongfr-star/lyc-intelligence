import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Brain,
  Workflow,
  Shield,
  Sparkles,
  Zap,
  Cpu,
  GitBranch,
  MessageCircle,
  Target,
  Search,
  CreditCard,
  User,
} from 'lucide-react';

interface IntentRoute {
  id: string;
  intent: string;
  pattern: string;
  handler: string;
  confidence: number;
  examples: string[];
  tier: 'free' | 'core' | 'premium';
}

const INTENTS: IntentRoute[] = [
  {
    id: 'i1',
    intent: 'mandate_search',
    pattern: 'mandate.*(search|find|list)',
    handler: 'matchService.searchMandates',
    confidence: 0.96,
    examples: ['Find mandates for CFO in APAC', 'Show open mandates'],
    tier: 'core',
  },
  {
    id: 'i2',
    intent: 'candidate_lookup',
    pattern: 'candidate.*(find|search|profile)',
    handler: 'matchService.searchCandidates',
    confidence: 0.94,
    examples: ['Find Priya Sharma profile', 'Candidates with supply chain'],
    tier: 'core',
  },
  {
    id: 'i3',
    intent: 'document_generate',
    pattern: '(generate|draft|create).*(proposal|report|email)',
    handler: 'ai.generateDocument',
    confidence: 0.91,
    examples: ['Draft D01 proposal for #482'],
    tier: 'premium',
  },
  {
    id: 'i4',
    intent: 'score_compare',
    pattern: '(compare|score|shortlist)',
    handler: 'matchService.compareCandidates',
    confidence: 0.93,
    examples: ['Compare candidates 4, 8, 15'],
    tier: 'core',
  },
  {
    id: 'i5',
    intent: 'schedule_interview',
    pattern: '(schedule|book|interview).*(time|slot)',
    handler: 'scheduler.suggestTimes',
    confidence: 0.88,
    examples: ['Schedule round 2 for Priya'],
    tier: 'core',
  },
  {
    id: 'i6',
    intent: 'career_advice',
    pattern: '(advice|help|should|career)',
    handler: 'nexus.coachAdvice',
    confidence: 0.89,
    examples: ['Should I take this offer?'],
    tier: 'free',
  },
  {
    id: 'i7',
    intent: 'comp_negotiate',
    pattern: '(salary|compensation|negotiate|offer)',
    handler: 'ai.compBenchmark',
    confidence: 0.87,
    examples: ['Is 180k SGD fair for CFO?'],
    tier: 'premium',
  },
  {
    id: 'i8',
    intent: 'market_intel',
    pattern: '(market|trend|competition|benchmark)',
    handler: 'intelligence.getMarketIntel',
    confidence: 0.86,
    examples: ['APAC CFO compensation 2026 trend'],
    tier: 'premium',
  },
  {
    id: 'i9',
    intent: 'onboarding_wizard',
    pattern: '(onboard|setup|first.*time|get.*started)',
    handler: 'onboarding.advance',
    confidence: 0.97,
    examples: ['Help me get started'],
    tier: 'free',
  },
  {
    id: 'i10',
    intent: 'escalate_kevin',
    pattern: '(kevin|escalate|human)',
    handler: 'handoff.toKevin',
    confidence: 0.95,
    examples: ['Talk to Kevin'],
    tier: 'premium',
  },
];

export const NexusConversationPage: React.FC = () => {
  const [tab, setTab] = useState('intent');
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<{
    intent: string;
    confidence: number;
    handler: string;
    tier: string;
  } | null>(null);
  const model = useMemo(
    () => ({ name: 'IntentRouter v2.4', latency: '42ms', routes: INTENTS.length }),
    []
  );

  function runTest() {
    if (!testInput.trim()) return;
    const q = testInput.toLowerCase();
    const scored = INTENTS.map((i) => {
      const regex = new RegExp(i.pattern, 'i');
      const match = regex.test(q);
      const keywords = i.examples.some((ex) =>
        q.split(' ').some((w) => ex.toLowerCase().includes(w))
      );
      const conf = i.confidence * (match ? 1.0 : keywords ? 0.75 : 0.1);
      return { ...i, _s: conf };
    }).sort((a, b) => b._s - a._s);
    const best = scored[0];
    setTestResult({
      intent: best.intent,
      confidence: Math.round(best._s * 100) / 100,
      handler: best.handler,
      tier: best.tier,
    });
  }

  const tierBadgeClass = (t: string) => {
    switch (t) {
      case 'premium':
        return 'bg-fuchsia-100 text-fuchsia-700';
      case 'core':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-fuchsia-100 text-fuchsia-700">
            N1 · Nexus Conversation Engine
          </span>
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-fuchsia-100 text-fuchsia-700">
            Intent Router (this page)
          </span>
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
            N10 Intent Zones
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          N1: Nexus Conversation Engine + Intent Router
        </h1>
        <p className="text-gray-600 text-lg">
          10 intent zones + fallback. Pattern + keyword routing, confidence-gated tiers. Wired
          into chat session endpoint <code className="bg-gray-100 px-1 rounded">/api/chat.ts + dispatch.ts</code>.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Intent Zones', value: model.routes.toString(), icon: <Target className="w-5 h-5" />, trend: model.name, tone: 'fuchsia' },
          { label: 'Avg Confidence', value: '91%', icon: <Cpu className="w-5 h-5" />, trend: 'Last 1k turns', tone: 'emerald' },
          { label: 'Avg Latency', value: model.latency, icon: <Zap className="w-5 h-5" />, trend: 'P95: 98ms', tone: 'emerald' },
          { label: 'Tier Gates', value: '3', icon: <Shield className="w-5 h-5" />, trend: 'free / core / premium', tone: 'amber' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${s.tone === 'fuchsia' ? 'bg-fuchsia-50 text-fuchsia-600' : s.tone === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {s.icon}
              </div>
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
            { value: 'intent', label: 'Intent Router Registry', icon: <Workflow className="w-4 h-4" /> },
            { value: 'playground', label: 'Intent Playground', icon: <MessageCircle className="w-4 h-4" /> },
            { value: 'engine', label: 'Conversation Engine', icon: <MessageSquare className="w-4 h-4" /> },
            { value: 'gating', label: 'Tier Gating', icon: <CreditCard className="w-4 h-4" /> },
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

      {tab === 'intent' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">N1 Intent Router — 10 Zones</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 text-gray-500">
                  <th className="py-3 px-3 font-medium">Intent</th>
                  <th className="py-3 px-3 font-medium">Pattern</th>
                  <th className="py-3 px-3 font-medium">Handler</th>
                  <th className="py-3 px-3 font-medium text-right">Confidence</th>
                  <th className="py-3 px-3 font-medium">Tier</th>
                  <th className="py-3 px-3 font-medium">Examples</th>
                </tr>
              </thead>
              <tbody>
                {INTENTS.map((i) => (
                  <tr key={i.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 font-mono text-xs font-semibold text-fuchsia-700">
                      {i.intent}
                    </td>
                    <td className="py-3 px-3">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {i.pattern.slice(0, 40)}
                      </code>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-gray-700">{i.handler}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {Math.round(i.confidence * 100)}%
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tierBadgeClass(i.tier)}`}>
                        {i.tier}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-500">{i.examples[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'playground' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test a natural language query</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. Find CFO candidates in Singapore earning 200k SGD"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runTest()}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex gap-2 mt-3 mb-6 flex-wrap">
              {INTENTS.slice(0, 4).map((i) => (
                <button
                  key={i.id}
                  onClick={() => setTestInput(i.examples[0])}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:border-fuchsia-300 hover:bg-fuchsia-50 transition-colors"
                >
                  {i.examples[0]}
                </button>
              ))}
            </div>
            <button
              onClick={runTest}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-fuchsia-600 text-white rounded-lg font-medium hover:bg-fuchsia-700 transition-colors"
            >
              <GitBranch className="w-4 h-4" />
              Run Intent Router
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Router Output</h3>
            {testResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-fuchsia-50 border-l-4 border-fuchsia-500">
                  <div className="text-xs uppercase font-semibold text-fuchsia-700">Matched Intent</div>
                  <div className="font-mono font-bold text-lg text-gray-900">{testResult.intent}</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 mb-1">Confidence</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(testResult.confidence * 100)}%
                  </div>
                </div>
                <div className="p-3 rounded bg-gray-50">
                  <div className="text-xs mb-1 text-gray-500">Handler</div>
                  <div className="font-mono text-sm text-gray-800">{testResult.handler}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tierBadgeClass(testResult.tier)}`}>
                    Tier: {testResult.tier}
                  </span>
                  {testResult.tier !== 'free' && (
                    <span className="text-xs text-gray-600 inline-flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      Credit cost: {testResult.tier === 'premium' ? '5' : '2'}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Brain className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm text-center">
                  Enter a query on the left to see routing result.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'engine' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversation Engine Architecture</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { t: 'Session Management', d: 'chat_sessions + chat_messages tables. Session-id JWT auth via nexusAuth.ts.', i: <MessageSquare className="w-5 h-5" /> },
              { t: 'Stream Rendering', d: 'NexusChat.tsx streaming component with typing + streaming from /api/chat.ts.', i: <Sparkles className="w-5 h-5" /> },
              { t: 'Tool Calling', d: 'Handler dispatch via /api/dispatch.ts + tool-use loop.', i: <Workflow className="w-5 h-5" /> },
              { t: 'Memory Injection', d: 'NexusMemory.ts working/episodic + semantic from RAG.', i: <Brain className="w-5 h-5" /> },
              { t: 'Persona Switching', d: 'nexusPersona.ts consultant / candidate / client voices.', i: <User className="w-5 h-5" /> },
              { t: 'Event Emitter', d: 'nexusEventEmitter.ts for analytics.', i: <Zap className="w-5 h-5" /> },
            ].map((b, bi) => (
              <div key={bi} className="p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                <div className="p-2 w-fit rounded-lg mb-3 bg-fuchsia-50 text-fuchsia-600">
                  {b.i}
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{b.t}</h4>
                <p className="text-sm text-gray-600 m-0">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'gating' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">N1 Tier Gating — Credit &amp; Permission Routing</h3>
          <p className="text-gray-600 mb-6">
            Intents are gated before execution time: if user tier insufficient → upgrade prompt.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 text-gray-500">
                  <th className="py-3 px-3 font-medium">Tier</th>
                  <th className="py-3 px-3 font-medium">Intents Allowed</th>
                  <th className="py-3 px-3 font-medium">Credit Cost</th>
                  <th className="py-3 px-3 font-medium">Rate Limit</th>
                  <th className="py-3 px-3 font-medium">Fallback</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Free (guest/member)', 'onboarding, career_advice, escalate_human', '0', '20/day', 'Signup prompt'],
                  ['Core (paid core)', 'All free + 6 core intents', '2 per turn', '200/day', 'Buy more credits'],
                  ['Premium (enterprise)', 'All 10 intents', '5 per turn', 'unlimited', '—'],
                  ['Admin / LYC Staff', 'All intents + Kevin bypass', '—', '—', '—'],
                ].map((r, ri) => (
                  <tr key={ri} className="border-b border-gray-100">
                    {r.map((c, ci) => (
                      <td key={ci} className="py-3 px-3 text-gray-700">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default NexusConversationPage;
