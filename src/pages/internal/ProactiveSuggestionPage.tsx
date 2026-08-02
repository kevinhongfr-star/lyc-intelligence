import React, { useState } from 'react';
import {
  Sparkles,
  Target,
  Lightbulb,
  TrendingUp,
  Calendar,
  MessageCircle,
  Wand2,
  Cpu,
  Bell,
  ChevronRight,
} from 'lucide-react';

interface Suggestion {
  id: string;
  title: string;
  reason: string;
  category: 'next_action' | 'recommendation' | 'proactive_alert' | 'upsell';
  confidence: number;
  surface: string;
  tier: 'free' | 'core' | 'premium';
  creditCost: number;
}

const SUGGESTIONS: Suggestion[] = [
  {
    id: 's1',
    title: 'Follow up with Priya S. — Round 2 feedback overdue',
    reason: 'Interview was 48h ago; no debrief filed yet. 72h SLA expires in 24h.',
    category: 'next_action',
    confidence: 0.96,
    surface: 'consultant',
    tier: 'core',
    creditCost: 0,
  },
  {
    id: 's2',
    title: 'Benchmark CFO compensation for ACME mandate #482',
    reason: 'Similar mandates closed in APAC Industrials show +12% higher comp band vs your JD.',
    category: 'recommendation',
    confidence: 0.91,
    surface: 'consultant',
    tier: 'premium',
    creditCost: 5,
  },
  {
    id: 's3',
    title: '3 new candidates match Mandate #501 (CHRO)',
    reason: 'Auto-matcher scored ≥85 on 3 passive candidates uploaded yesterday.',
    category: 'proactive_alert',
    confidence: 0.89,
    surface: 'consultant',
    tier: 'core',
    creditCost: 2,
  },
  {
    id: 's4',
    title: 'Upgrade to premium: Run SHIFT composite for Rajiv M.',
    reason: '3 of 5 instruments already complete. Unlock full report.',
    category: 'upsell',
    confidence: 0.84,
    surface: 'candidate',
    tier: 'premium',
    creditCost: 15,
  },
  {
    id: 's5',
    title: 'Weekly digest ready — 5 new insights',
    reason: 'Your Council briefing compiled: 3 signals + 2 market moves relevant to your tier.',
    category: 'proactive_alert',
    confidence: 0.88,
    surface: 'council',
    tier: 'core',
    creditCost: 0,
  },
  {
    id: 's6',
    title: 'Client ACME: QBR prep — 3 talking points',
    reason: 'Mandate velocity +2wks; compiled 3 talking points (2 achievements + 1 risk highlight) for QBR.',
    category: 'next_action',
    confidence: 0.93,
    surface: 'bd_manager',
    tier: 'premium',
    creditCost: 5,
  },
  {
    id: 's7',
    title: 'Reference check auto-send for Offer stage',
    reason: 'Priya moved to offer stage. Referee panel ready.',
    category: 'next_action',
    confidence: 0.9,
    surface: 'consultant',
    tier: 'core',
    creditCost: 0,
  },
  {
    id: 's8',
    title: 'Referral network: 2 connections could be receptive',
    reason: 'Warm path to your target CFO role via 2nd-degree.',
    category: 'recommendation',
    confidence: 0.82,
    surface: 'candidate',
    tier: 'premium',
    creditCost: 8,
  },
];

const RECO_ENGINE = [
  { id: 'r1', name: 'SLA Proximity Engine', trig: 't-24h SLA breach', output: 'Next-action reminders', weight: 1.2 },
  { id: 'r2', name: 'Collab Filtering', trig: 'Peer behavior', output: 'Doc template suggestion', weight: 0.9 },
  { id: 'r3', name: 'Mandate Velocity', trig: 'Stage > 2w silence', output: 'Follow-up drafts', weight: 1.1 },
  { id: 'r4', name: 'Signal Matcher v3', trig: 'New candidates ≥85 score', output: 'Proactive match', weight: 1.3 },
  { id: 'r5', name: 'Assessment', trig: 'Partial', output: 'Upsell prompt', weight: 0.8 },
  { id: 'r6', name: 'Career Path Infer', trig: 'Pattern in nexus chats', output: 'Content rec', weight: 0.85 },
];

const categoryBadge = (c: Suggestion['category']) => {
  switch (c) {
    case 'next_action':
      return 'bg-amber-100 text-amber-700';
    case 'recommendation':
      return 'bg-fuchsia-100 text-fuchsia-700';
    case 'proactive_alert':
      return 'bg-sky-100 text-sky-700';
    case 'upsell':
      return 'bg-emerald-100 text-emerald-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const tierBadge = (t: string) => {
  switch (t) {
    case 'premium':
      return 'bg-fuchsia-100 text-fuchsia-700';
    case 'core':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export const ProactiveSuggestionPage: React.FC = () => {
  const [tab, setTab] = useState('suggestions');
  const [surfFilter, setSurfFilter] = useState('all');

  const filt = SUGGESTIONS.filter((s) => surfFilter === 'all' || s.surface === surfFilter);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-fuchsia-100 text-fuchsia-700">
            N5 · Proactive Suggestion
          </span>
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-fuchsia-100 text-fuchsia-700">
            Recommendation Engine
          </span>
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
            6 Models
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          N5: Proactive Suggestion + Recommendation Engine
        </h1>
        <p className="text-gray-600 text-lg">
          6 signal models inject recommendations to power proactive chips in-session, bell
          notifications, + daily digests. Scored, tier-gated, credits consumed on-click.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Live Suggestions', value: SUGGESTIONS.length.toString(), icon: <Lightbulb className="w-5 h-5" />, trend: '4 categories', tone: 'fuchsia' },
          { label: 'Models', value: RECO_ENGINE.length.toString(), icon: <Cpu className="w-5 h-5" />, trend: 'All deployed', tone: 'emerald' },
          { label: 'Avg CTR (7d)', value: '34.2%', icon: <TrendingUp className="w-5 h-5" />, trend: '+11% WoW', tone: 'emerald' },
          { label: 'Surfaces', value: '4', icon: <Target className="w-5 h-5" />, trend: 'consultant/BD/candidate/council', tone: 'amber' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div
              className={`p-2 w-fit rounded-lg mb-3 ${
                s.tone === 'fuchsia'
                  ? 'bg-fuchsia-50 text-fuchsia-600'
                  : s.tone === 'emerald'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-amber-50 text-amber-600'
              }`}
            >
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
            { value: 'suggestions', label: 'Live Suggestions', icon: <Sparkles className="w-4 h-4" /> },
            { value: 'engine', label: 'Models', icon: <Wand2 className="w-4 h-4" /> },
            { value: 'delivery', label: 'Delivery', icon: <Bell className="w-4 h-4" /> },
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

      {tab === 'suggestions' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 m-0">Live Suggestion Feed</h3>
            <div className="flex gap-2 flex-wrap">
              {['all', 'consultant', 'bd_manager', 'candidate', 'council'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSurfFilter(s)}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    surfFilter === s
                      ? 'bg-fuchsia-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filt.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-lg border border-gray-200 hover:border-fuchsia-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${categoryBadge(s.category)}`}>
                        {s.category.replace('_', ' ')}
                      </span>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                        {s.surface}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tierBadge(s.tier)}`}>
                        {s.tier}
                      </span>
                      {s.creditCost > 0 && (
                        <span className="text-xs text-gray-600 inline-flex items-center gap-1">
                          <Bell className="w-3 h-3 text-fuchsia-600" />
                          {s.creditCost} credits
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1 m-0">{s.title}</h4>
                    <p className="text-sm text-gray-600 m-0">{s.reason}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-gray-500 mb-1">confidence</div>
                    <div className="text-xl font-bold tabular-nums text-fuchsia-700">
                      {Math.round(s.confidence * 100)}%
                    </div>
                    <div className="h-1.5 w-16 bg-gray-100 rounded ml-auto mt-1 overflow-hidden">
                      <div
                        className="h-full rounded bg-fuchsia-600"
                        style={{ width: `${s.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-fuchsia-600 text-white rounded hover:bg-fuchsia-700 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    Apply
                  </button>
                  <button className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 rounded hover:bg-gray-100 transition-colors">
                    Dismiss
                  </button>
                  <button className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 rounded hover:bg-gray-100 transition-colors">
                    Snooze
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'engine' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">N5 Recommendation Engine — 6 Models</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {RECO_ENGINE.map((r) => (
              <div key={r.id} className="p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-fuchsia-50 text-fuchsia-600">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <h4 className="font-semibold text-gray-900 m-0">{r.name}</h4>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-fuchsia-700">
                    ×{r.weight.toFixed(1)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-1 font-medium">Trigger</div>
                <p className="text-sm text-gray-700 mb-2 m-0">{r.trig}</p>
                <div className="text-xs text-gray-500 mb-1 font-medium">Output</div>
                <p className="text-sm text-gray-600 m-0">{r.output}</p>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2 m-0">Scoring Formula</h4>
            <pre className="text-xs bg-white p-3 rounded font-mono overflow-x-auto border border-gray-100">
{`suggestion_score = Σ model_i(raw_signal_i × weight_i) × tier_bonus
IF score ≥ 0.80 → in-session chip
IF score ≥ 0.90 → push notification + bell
IF score ≥ 0.70 → included in daily digest (D46)`}
            </pre>
          </div>
        </div>
      )}

      {tab === 'delivery' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-fuchsia-600" />
              <h3 className="text-lg font-semibold text-gray-900 m-0">In-Session Chips</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Nexus chat SuggestedPrompts component shows ≥ 0.80. Clicks auto-execute intent.
            </p>
            <ul className="text-sm space-y-1.5 text-gray-700 m-0 p-0 list-none">
              <li className="flex items-start gap-2">
                <span className="text-fuchsia-600">•</span>
                Score ≥ 0.95 → 1st position
              </li>
              <li className="flex items-start gap-2">
                <span className="text-fuchsia-600">•</span>
                Score ≥ 0.85 → 2nd/3rd
              </li>
              <li className="flex items-start gap-2">
                <span className="text-fuchsia-600">•</span>
                Max 4 chips per turn
              </li>
              <li className="flex items-start gap-2">
                <span className="text-fuchsia-600">•</span>
                Deduplicated across 7 days
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-900 m-0">Push + Bell</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Bell notif + web-push score ≥ 0.90. Dismissible, action.
            </p>
            <ul className="text-sm space-y-1.5 text-gray-700 m-0 p-0 list-none">
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                Max 3 push/day cap
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                Quiet hours 22:00–07:00 local
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                Click routes to surface
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                Tracks open → activity log
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-sky-600" />
              <h3 className="text-lg font-semibold text-gray-900 m-0">Daily Digest (D46)</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Score ≥ 0.70 → D46 Weekly Digest email (T26/T30).
            </p>
            <ul className="text-sm space-y-1.5 text-gray-700 m-0 p-0 list-none">
              <li className="flex items-start gap-2">
                <span className="text-sky-600">•</span>
                06:00 Monday weekly
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-600">•</span>
                Ranked by score desc
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-600">•</span>
                CTA → 1-click apply
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-600">•</span>
                Unsubscribe 1-click
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProactiveSuggestionPage;
