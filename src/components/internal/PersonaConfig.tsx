import React, { useState, useEffect } from 'react';
import { UserCog, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const DEFAULTS = {
  temperature: 0.7,
  max_tokens: 500,
  model: 'deepseek-v4-flash',
  formality: 0.7,
  directness: 0.65,
  terminology: 'professional',
  diagnostic_protocol: true,
  confidentiality_level: 'strict',
  milestone_tracking: true,
  system_prompt: '',
};

export default function PersonaConfig() {
  const [temperature, setTemperature] = useState(DEFAULTS.temperature);
  const [maxTokens, setMaxTokens] = useState(DEFAULTS.max_tokens);
  const [model, setModel] = useState(DEFAULTS.model);
  const [formality, setFormality] = useState(DEFAULTS.formality);
  const [directness, setDirectness] = useState(DEFAULTS.directness);
  const [terminology, setTerminology] = useState(DEFAULTS.terminology);
  const [diagnosticProtocol, setDiagnosticProtocol] = useState(DEFAULTS.diagnostic_protocol);
  const [confidentialityLevel, setConfidentialityLevel] = useState(DEFAULTS.confidentiality_level);
  const [milestoneTracking, setMilestoneTracking] = useState(DEFAULTS.milestone_tracking);
  const [systemPrompt, setSystemPrompt] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // Fetch current config on mount
  useEffect(() => {
    fetch('/api/nexus/config')
      .then(r => r.json())
      .then(data => {
        if (data.temperature !== undefined) setTemperature(data.temperature);
        if (data.max_tokens !== undefined) setMaxTokens(data.max_tokens);
        if (data.model !== undefined) setModel(data.model);
        if (data.formality !== undefined) setFormality(data.formality);
        if (data.directness !== undefined) setDirectness(data.directness);
        if (data.terminology !== undefined) setTerminology(data.terminology);
        if (data.diagnostic_protocol !== undefined) setDiagnosticProtocol(data.diagnostic_protocol);
        if (data.confidentiality_level !== undefined) setConfidentialityLevel(data.confidentiality_level);
        if (data.milestone_tracking !== undefined) setMilestoneTracking(data.milestone_tracking);
        if (data.system_prompt !== undefined) setSystemPrompt(data.system_prompt);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus('idle');
    try {
      const resp = await fetch('/api/nexus/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperature, max_tokens: maxTokens, model, formality, directness,
          terminology, diagnostic_protocol: diagnosticProtocol,
          confidentiality_level: confidentialityLevel,
          milestone_tracking: milestoneTracking, system_prompt: systemPrompt,
        }),
      });
      if (resp.ok) {
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center gap-2 py-8 text-[#737373]"><Loader2 className="w-5 h-5 animate-spin" />Loading config...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <UserCog className="w-5 h-5" style={{ color: '#C108AB' }} />
        <h3 className="font-serif text-lg font-bold text-text-primary">Persona Configuration</h3>
        <span className="ml-auto text-xs text-[#737373]">Stored in database · Applied in real-time</span>
      </div>

      {/* Model */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Model</label>
        <select value={model} onChange={e => setModel(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-bg-primary border border-bg-tertiary text-text-primary">
          <option value="deepseek-v4-flash">DeepSeek V4 Flash</option>
          <option value="deepseek-reasoner">DeepSeek Reasoner</option>
        </select>
      </div>

      {/* Temperature */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-text-primary">Temperature</label>
          <span className="text-sm text-text-muted">{temperature.toFixed(2)}</span>
        </div>
        <input type="range" min="0" max="2" step="0.05" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className="w-full" style={{ accentColor: '#C108AB' }} />
        <div className="flex justify-between text-xs text-text-muted mt-1"><span>Precise</span><span>Creative</span></div>
      </div>

      {/* Max Tokens */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-text-primary">Max Tokens</label>
          <span className="text-sm text-text-muted">{maxTokens}</span>
        </div>
        <input type="range" min="100" max="4000" step="100" value={maxTokens} onChange={e => setMaxTokens(parseInt(e.target.value))} className="w-full" style={{ accentColor: '#C108AB' }} />
        <div className="flex justify-between text-xs text-text-muted mt-1"><span>Concise</span><span>Detailed</span></div>
      </div>

      {/* Formality */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-text-primary">Formality</label>
          <span className="text-sm text-text-muted">{formality.toFixed(2)}</span>
        </div>
        <input type="range" min="0" max="1" step="0.05" value={formality} onChange={e => setFormality(parseFloat(e.target.value))} className="w-full" style={{ accentColor: '#C108AB' }} />
        <div className="flex justify-between text-xs text-text-muted mt-1"><span>Casual</span><span>Formal</span></div>
      </div>

      {/* Directness */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-text-primary">Directness</label>
          <span className="text-sm text-text-muted">{directness.toFixed(2)}</span>
        </div>
        <input type="range" min="0" max="1" step="0.05" value={directness} onChange={e => setDirectness(parseFloat(e.target.value))} className="w-full" style={{ accentColor: '#C108AB' }} />
        <div className="flex justify-between text-xs text-text-muted mt-1"><span>Indirect</span><span>Direct</span></div>
      </div>

      {/* Terminology */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Terminology Level</label>
        <select value={terminology} onChange={e => setTerminology(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-bg-primary border border-bg-tertiary text-text-primary">
          <option value="executive">Executive</option>
          <option value="professional">Professional</option>
          <option value="accessible">Accessible</option>
        </select>
      </div>

      {/* Diagnostic Protocol */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-text-primary">Diagnostic Protocol</div>
          <div className="text-xs text-text-muted">Ask diagnostic questions before giving advice</div>
        </div>
        <button onClick={() => setDiagnosticProtocol(!diagnosticProtocol)}
          className={`relative w-12 h-6 rounded-full transition-colors ${diagnosticProtocol ? 'bg-[#C108AB]' : 'bg-[#D4D4D4]'}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${diagnosticProtocol ? 'left-6.5 translate-x-0' : 'left-0.5'}`}
            style={{ left: diagnosticProtocol ? '26px' : '2px' }} />
        </button>
      </div>

      {/* Confidentiality Level */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Confidentiality Level</label>
        <select value={confidentialityLevel} onChange={e => setConfidentialityLevel(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-bg-primary border border-bg-tertiary text-text-primary">
          <option value="strict">Strict — No client names, proprietary data</option>
          <option value="moderate">Moderate — Internal references OK</option>
          <option value="open">Open — Full context allowed</option>
        </select>
      </div>

      {/* Milestone Tracking */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-text-primary">Milestone Tracking</div>
          <div className="text-xs text-text-muted">Track conversation milestones and progress</div>
        </div>
        <button onClick={() => setMilestoneTracking(!milestoneTracking)}
          className={`relative w-12 h-6 rounded-full transition-colors ${milestoneTracking ? 'bg-[#C108AB]' : 'bg-[#D4D4D4]'}`}>
          <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
            style={{ left: milestoneTracking ? '26px' : '2px' }} />
        </button>
      </div>

      {/* System Prompt Override */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">System Prompt Override</label>
        <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
          placeholder="Leave empty to use default system prompt. Enter custom prompt to override..."
          rows={6}
          className="w-full px-3 py-2 text-sm bg-bg-primary border border-bg-tertiary text-text-primary placeholder:text-text-muted resize-y" />
        <p className="text-xs text-text-muted mt-1">When set, this overrides the default system prompt entirely.</p>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3 pt-4 border-t border-bg-tertiary">
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2.5 bg-[#C108AB] text-white text-sm font-medium hover:bg-[#A50798] transition-all disabled:opacity-50 flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
        {status === 'saved' && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Saved successfully</span>}
        {status === 'error' && <span className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Failed to save</span>}
      </div>
    </div>
  );
}
