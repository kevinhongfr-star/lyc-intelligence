/**
 * ScoringConfigPage — Tier & stage weight configuration (S5-T05)
 *
 * Admin-only page at `/app/scoring`. Displays the current `scoring_config`
 * values (stage weights + tier thresholds), lets an admin adjust them with a
 * confirmation step, shows a live preview of how the new weights re-tier a
 * sample candidate, and saves the changes back to `scoring_config`.
 *
 * The `scoring_config` table is treated as key/value rows
 * (columns: `config_key`, `config_value`). If the table is empty or missing,
 * the spec defaults are used so the page is always functional. Saving upserts
 * one row per config key.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Settings, Save, AlertCircle, CheckCircle2, RotateCcw, Loader2 } from 'lucide-react';
import { Card, CardContent, Button, Input, TierBadge, Badge } from '@/components/ui';
import type { Tier } from '@/components/ui';
import { getSupabase } from '@/services/supabaseApi';

// Spec defaults — used when scoring_config has no stored value for a key.
const DEFAULT_STAGE_WEIGHTS: Record<string, number> = {
  Hired: 100,
  Offer: 80,
  Interview: 50,
  Presented: 30,
  Shortlisted: 20,
  Screening: 10,
  Sourcing: 5,
  New: 2,
  Rejected: 0,
};

const DEFAULT_TIER_THRESHOLDS: Record<string, number> = {
  Gold: 200,
  Silver: 100,
  Bronze: 50,
};

const STAGE_ORDER = ['New', 'Sourcing', 'Screening', 'Shortlisted', 'Presented', 'Interview', 'Offer', 'Hired', 'Rejected'];

type ConfigRow = { config_key: string; config_value: number | string };

export function ScoringConfigPage() {
  const [stageWeights, setStageWeights] = useState<Record<string, number>>(DEFAULT_STAGE_WEIGHTS);
  const [tierThresholds, setTierThresholds] = useState<Record<string, number>>(DEFAULT_TIER_THRESHOLDS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const sb = getSupabase();
        const { data, error: sbError } = await sb
          .from('scoring_config')
          .select('config_key, config_value')
          .limit(100);
        if (cancelled) return;
        if (sbError) {
          // Table missing or RLS — fall back to defaults, note it.
          console.warn('[ScoringConfigPage] load failed:', sbError.message);
          setStageWeights(DEFAULT_STAGE_WEIGHTS);
          setTierThresholds(DEFAULT_TIER_THRESHOLDS);
        } else if (data && data.length > 0) {
          applyConfigRows(data as ConfigRow[]);
        }
      } catch (e) {
        if (!cancelled) {
          console.warn('[ScoringConfigPage] error:', e);
          setError('Unable to load scoring configuration. Showing defaults.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function applyConfigRows(rows: ConfigRow[]) {
    const sw: Record<string, number> = { ...DEFAULT_STAGE_WEIGHTS };
    const tt: Record<string, number> = { ...DEFAULT_TIER_THRESHOLDS };
    for (const row of rows) {
      const key = row.config_key;
      const value = typeof row.config_value === 'number' ? row.config_value : Number(row.config_value);
      if (Number.isNaN(value)) continue;
      if (key.startsWith('stage_')) {
        const stage = key.replace('stage_', '').replace(/_weight$/, '');
        const stageName = stage.charAt(0).toUpperCase() + stage.slice(1);
        if (stageName in sw) sw[stageName] = value;
      } else if (key.startsWith('tier_')) {
        const tier = key.replace('tier_', '').replace(/_threshold$/, '');
        const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
        if (tierName in tt) tt[tierName] = value;
      }
    }
    setStageWeights(sw);
    setTierThresholds(tt);
    setDirty(false);
  }

  const updateStageWeight = (stage: string, value: number) => {
    setStageWeights(prev => ({ ...prev, [stage]: value }));
    setDirty(true);
    setSuccess(null);
  };

  const updateTierThreshold = (tier: string, value: number) => {
    setTierThresholds(prev => ({ ...prev, [tier]: value }));
    setDirty(true);
    setSuccess(null);
  };

  const reset = () => {
    setStageWeights(DEFAULT_STAGE_WEIGHTS);
    setTierThresholds(DEFAULT_TIER_THRESHOLDS);
    setDirty(true);
    setSuccess(null);
  };

  // Live preview: a sample candidate at "Interview" stage — show old vs new tier.
  const previewScore = stageWeights['Interview'] ?? 50;
  const previewTier: Tier = useMemo(() => {
    if (previewScore >= tierThresholds.Gold) return 'Gold';
    if (previewScore >= tierThresholds.Silver) return 'Silver';
    if (previewScore >= tierThresholds.Bronze) return 'Bronze';
    return 'Unranked';
  }, [previewScore, tierThresholds]);
  const defaultPreviewTier: Tier = DEFAULT_STAGE_WEIGHTS['Interview'] >= DEFAULT_TIER_THRESHOLDS.Gold
    ? 'Gold'
    : DEFAULT_STAGE_WEIGHTS['Interview'] >= DEFAULT_TIER_THRESHOLDS.Silver
      ? 'Silver'
      : DEFAULT_STAGE_WEIGHTS['Interview'] >= DEFAULT_TIER_THRESHOLDS.Bronze
        ? 'Bronze'
        : 'Unranked';

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const sb = getSupabase();
      const rows: Array<{ config_key: string; config_value: number }> = [];
      for (const [stage, weight] of Object.entries(stageWeights)) {
        const key = `stage_${stage.toLowerCase()}_weight`;
        rows.push({ config_key: key, config_value: weight });
      }
      for (const [tier, threshold] of Object.entries(tierThresholds)) {
        const key = `tier_${tier.toLowerCase()}_threshold`;
        rows.push({ config_key: key, config_value: threshold });
      }
      // Upsert each config row.
      const { error: upsertError } = await sb
        .from('scoring_config')
        .upsert(rows, { onConflict: 'config_key' });
      if (upsertError) throw new Error(upsertError.message);
      setSuccess('Scoring configuration saved. Rankings will recalculate on the next refresh.');
      setDirty(false);
      setConfirming(false);
    } catch (err: any) {
      setError(err?.message || 'Could not save scoring configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-text-muted text-sm">Loading scoring configuration…</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif font-bold text-2xl text-text-primary flex items-center gap-2">
            <Settings className="w-6 h-6 text-fuchsia" /> Scoring Configuration
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Adjust stage weights and tier thresholds. Changes recalculate all pipeline rankings.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset} disabled={saving}>
          <RotateCcw className="w-3.5 h-3.5" /> Reset to defaults
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}

      {/* Stage weights */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold text-text-primary mb-1">Stage Weights</h2>
          <p className="text-xs text-text-muted mb-4">
            Points awarded when a candidate reaches each pipeline stage. Higher stages should carry higher weight.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STAGE_ORDER.map(stage => (
              <div key={stage} className="flex items-center justify-between gap-3">
                <label className="text-sm text-text-secondary w-32">{stage}</label>
                <Input
                  type="number"
                  value={stageWeights[stage] ?? 0}
                  onChange={e => updateStageWeight(stage, Number(e.target.value))}
                  className="w-28"
                  min={0}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tier thresholds */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold text-text-primary mb-1">Tier Thresholds</h2>
          <p className="text-xs text-text-muted mb-4">
            Minimum weighted score required for each Olympic-medal tier.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['Gold', 'Silver', 'Bronze'] as const).map(tier => (
              <div key={tier} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <TierBadge tier={tier} size="sm" />
                  <label className="text-xs text-text-muted">min score</label>
                </div>
                <Input
                  type="number"
                  value={tierThresholds[tier] ?? 0}
                  onChange={e => updateTierThreshold(tier, Number(e.target.value))}
                  min={0}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-text-muted">
            Candidates below the Bronze threshold are <Badge variant="outline" className="text-xs">Unranked</Badge>.
          </div>
        </CardContent>
      </Card>

      {/* Live preview */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold text-text-primary mb-1">Preview</h2>
          <p className="text-xs text-text-muted mb-3">
            A candidate at the <strong>Interview</strong> stage would score:
          </p>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs text-text-muted">Score</div>
              <div className="text-2xl font-bold text-text-primary">{previewScore}</div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <div className="text-xs text-text-muted">Tier with new config</div>
              <div className="mt-1"><TierBadge tier={previewTier} /></div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <div className="text-xs text-text-muted">Tier with default config</div>
              <div className="mt-1"><TierBadge tier={defaultPreviewTier} /></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save bar */}
      <div className="flex items-center justify-end gap-3">
        {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
        {!confirming ? (
          <Button onClick={() => setConfirming(true)} disabled={!dirty || saving}>
            <Save className="w-4 h-4" /> Save changes
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">This recalculates all rankings. Confirm?</span>
            <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {saving ? 'Saving…' : 'Confirm save'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScoringConfigPage;
