import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import type { Mandate } from '@/services/supabaseApi';
import { saveSuccessProfile, getSuccessProfiles } from '@/services/supabaseApi';
import { useAuthStore } from '@/stores/authStore';
import type {
  SuccessProfile,
  PersonalityIndicator,
  CharacterRequirement,
  EducationRequirement,
  LanguageRequirement,
  DiscProfile,
  CharacterLevel,
  LanguageLevel,
  ProfileStatus,
} from '@/types';
import { DEFAULT_SUCCESS_PROFILE } from '@/types';

const rowStyle = 'grid grid-cols-12 gap-2 items-start p-2 border-b last:border-b-0';
const addBtnStyle = 'mt-2 px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100';
const delBtnStyle = 'text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded';
const badgeStyle = (status: ProfileStatus) => {
  switch (status) {
    case 'approved': return 'bg-emerald-100 text-emerald-800';
    case 'pending_approval': return 'bg-amber-100 text-amber-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-slate-100 text-slate-600';
  }
};

interface Props {
  mandate: Mandate;
  onSaved?: () => void;
}

export function SuccessProfileForm({ mandate, onSaved }: Props) {
  const [profile, setProfile] = useState<SuccessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const { profile: userProfile } = useAuthStore();

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const profiles = await getSuccessProfiles(mandate.id);
    const latest = profiles.length > 0 ? profiles[0] : null;
    if (latest) {
      setProfile(normalizeProfile(latest));
    } else {
      setProfile(createEmptyProfile());
    }
    setLoading(false);
  }, [mandate.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function createEmptyProfile(): SuccessProfile {
    const now = new Date().toISOString();
    return {
      id: '',
      mandate_id: mandate.id,
      required_experience_years: DEFAULT_SUCCESS_PROFILE.required_experience_years ?? 10,
      required_industries: [],
      required_geographies: [],
      required_companies: [],
      deal_size_range: '',
      team_size_managed: DEFAULT_SUCCESS_PROFILE.team_size_managed ?? 0,
      target_disc_profile: DEFAULT_SUCCESS_PROFILE.target_disc_profile ?? 'mixed',
      personality_indicators: [],
      character_requirements: [],
      education_requirements: [],
      certifications: [],
      language_requirements: [],
      status: 'draft',
      defined_by: userProfile?.id ?? null,
      approved_by: null,
      approval_notes: null,
      rejection_reason: null,
      created_at: now,
      updated_at: now,
    };
  }

  async function doSave() {
    if (!profile) return;
    setSaving(true);
    const payload = { ...profile };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    const ok = await saveSuccessProfile(mandate.id, payload);
    setSaving(false);
    if (ok) {
      setLastSavedAt(new Date().toLocaleTimeString());
      onSaved?.();
      await loadProfile();
    }
  }

  async function submitForApproval() {
    if (!profile) return;
    setProfile({ ...profile, status: 'pending_approval' });
    await doSave();
  }

  // ─── Section updaters ───
  function updateField<K extends keyof SuccessProfile>(key: K, value: SuccessProfile[K]) {
    if (!profile) return;
    setProfile({ ...profile, [key]: value });
  }

  function updatePersonality(i: number, patch: Partial<PersonalityIndicator>) {
    if (!profile?.personality_indicators) return;
    setProfile({
      ...profile,
      personality_indicators: profile.personality_indicators.map((p, idx) => idx === i ? { ...p, ...patch } : p),
    });
  }

  function updateCharacter(i: number, patch: Partial<CharacterRequirement>) {
    if (!profile?.character_requirements) return;
    setProfile({
      ...profile,
      character_requirements: profile.character_requirements.map((p, idx) => idx === i ? { ...p, ...patch } : p),
    });
  }

  function updateEducation(i: number, patch: Partial<EducationRequirement>) {
    if (!profile?.education_requirements) return;
    setProfile({
      ...profile,
      education_requirements: profile.education_requirements.map((p, idx) => idx === i ? { ...p, ...patch } : p),
    });
  }

  function updateLanguage(i: number, patch: Partial<LanguageRequirement>) {
    if (!profile?.language_requirements) return;
    setProfile({
      ...profile,
      language_requirements: profile.language_requirements.map((p, idx) => idx === i ? { ...p, ...patch } : p),
    });
  }

  // ─── Array updaters ───
  function addIndustry(value: string) {
    if (!profile?.required_industries || !value.trim()) return;
    setProfile({ ...profile, required_industries: [...profile.required_industries, value.trim()] });
  }
  function removeIndustry(idx: number) {
    if (!profile?.required_industries) return;
    setProfile({ ...profile, required_industries: profile.required_industries.filter((_, i) => i !== idx) });
  }

  function addGeography(value: string) {
    if (!profile?.required_geographies || !value.trim()) return;
    setProfile({ ...profile, required_geographies: [...profile.required_geographies, value.trim()] });
  }
  function removeGeography(idx: number) {
    if (!profile?.required_geographies) return;
    setProfile({ ...profile, required_geographies: profile.required_geographies.filter((_, i) => i !== idx) });
  }

  function addCertification(value: string) {
    if (!profile?.certifications || !value.trim()) return;
    setProfile({ ...profile, certifications: [...profile.certifications, value.trim()] });
  }
  function removeCertification(idx: number) {
    if (!profile?.certifications) return;
    setProfile({ ...profile, certifications: profile.certifications.filter((_, i) => i !== idx) });
  }

  if (loading) return <div className="py-10 text-center">Loading...</div>;
  if (!profile) return <div className="py-10 text-center">Error loading profile</div>;

  return (
    <div className="space-y-5">
      {/* Status bar */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Badge className={badgeStyle(profile.status)}>{profile.status.replace('_', ' ')}</Badge>
            <span className="text-sm text-slate-500">
              {profile.id ? `Profile ID: ${profile.id.slice(0, 8)}` : 'New profile'}
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={doSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Draft'}
            </Button>
            {profile.status === 'draft' && (
              <Button size="sm" variant="outline" onClick={submitForApproval}>
                Submit for Approval
              </Button>
            )}
            {lastSavedAt && <span className="text-xs text-slate-500">Saved {lastSavedAt}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Section 1: Experience Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>1. Experience Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600">Required years of experience</label>
              <Input
                type="number"
                min="0"
                max="50"
                className="mt-1"
                value={profile.required_experience_years ?? ''}
                onChange={(e) => updateField('required_experience_years', parseInt(e.target.value) || null)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Team size managed</label>
              <Input
                type="number"
                min="0"
                max="1000"
                className="mt-1"
                value={profile.team_size_managed ?? ''}
                onChange={(e) => updateField('team_size_managed', parseInt(e.target.value) || null)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Deal size range</label>
              <Input
                className="mt-1"
                placeholder="$50M-$500M"
                value={profile.deal_size_range || ''}
                onChange={(e) => updateField('deal_size_range', e.target.value)}
              />
            </div>
          </div>

          {/* Industries */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">Required industries</label>
            <div className="flex gap-2 mb-2">
              <Input
                className="flex-1"
                placeholder="Add industry (e.g., Technology, Finance)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { addIndustry((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; }
                }}
              />
              <Button size="sm" onClick={() => addIndustry('Technology')}>+ Tech</Button>
            </div>
            {profile.required_industries?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.required_industries.map((ind, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-sm">
                    {ind}
                    <button onClick={() => removeIndustry(i)} className="hover:text-red-600">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Geographies */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">Required geographies</label>
            <div className="flex gap-2 mb-2">
              <Input
                className="flex-1"
                placeholder="Add geography (e.g., North America, APAC)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { addGeography((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; }
                }}
              />
              <Button size="sm" onClick={() => addGeography('APAC')}>+ APAC</Button>
            </div>
            {profile.required_geographies?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.required_geographies.map((geo, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-sm">
                    {geo}
                    <button onClick={() => removeGeography(i)} className="hover:text-red-600">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Personality & Character */}
      <Card>
        <CardHeader>
          <CardTitle>2. Personality & Character</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* DISC Profile */}
          <div>
            <label className="text-xs font-medium text-slate-600">Target DISC profile</label>
            <select
              className="mt-1 w-full border border-slate-200 rounded px-2 py-1.5 text-sm bg-white"
              value={profile.target_disc_profile || 'mixed'}
              onChange={(e) => updateField('target_disc_profile', e.target.value as DiscProfile)}
            >
              <option value="D">D — Dominance (Direct, Decisive)</option>
              <option value="i">i — Influence (Inspiring, Interactive)</option>
              <option value="S">S — Steadiness (Stable, Supportive)</option>
              <option value="C">C — Conscientiousness (Cautious, Correct)</option>
              <option value="mixed">Mixed profile preferred</option>
            </select>
          </div>

          {/* Personality Indicators */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">Personality indicators</label>
            {profile.personality_indicators?.map((p, i) => (
              <div key={i} className={rowStyle}>
                <Input
                  className="col-span-3"
                  placeholder="Trait (e.g., Strategic thinking)"
                  value={p.trait}
                  onChange={(e) => updatePersonality(i, { trait: e.target.value })}
                />
                <div className="col-span-3">
                  <label className="text-xs text-slate-500">Importance (1-5)</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={p.importance}
                    onChange={(e) => updatePersonality(i, { importance: parseInt(e.target.value) })}
                    className="w-full mt-1"
                  />
                  <div className="text-xs text-center text-slate-400">{p.importance}</div>
                </div>
                <Input
                  className="col-span-5"
                  placeholder="Evidence: Look for examples of..."
                  value={p.evidence}
                  onChange={(e) => updatePersonality(i, { evidence: e.target.value })}
                />
                <button type="button" className={delBtnStyle} onClick={() => setProfile({ ...profile, personality_indicators: profile.personality_indicators?.filter((_, idx) => idx !== i) })}>
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className={addBtnStyle}
              onClick={() => setProfile({ ...profile, personality_indicators: [...(profile.personality_indicators || []), { trait: '', importance: 3, evidence: '' }] })}
            >
              + Add personality indicator
            </button>
          </div>

          {/* Character Requirements */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">Character requirements</label>
            {profile.character_requirements?.map((p, i) => (
              <div key={i} className={rowStyle}>
                <Input
                  className="col-span-6"
                  placeholder="Trait (e.g., Integrity, Resilience)"
                  value={p.trait}
                  onChange={(e) => updateCharacter(i, { trait: e.target.value })}
                />
                <select
                  className="col-span-5 border border-slate-200 rounded px-2 py-1.5 text-sm bg-white"
                  value={p.level}
                  onChange={(e) => updateCharacter(i, { level: e.target.value as CharacterLevel })}
                >
                  <option value="essential">Essential</option>
                  <option value="preferred">Preferred</option>
                  <option value="nice-to-have">Nice-to-have</option>
                </select>
                <button type="button" className={delBtnStyle} onClick={() => setProfile({ ...profile, character_requirements: profile.character_requirements?.filter((_, idx) => idx !== i) })}>
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className={addBtnStyle}
              onClick={() => setProfile({ ...profile, character_requirements: [...(profile.character_requirements || []), { trait: '', level: 'essential' }] })}
            >
              + Add character requirement
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Background Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>3. Background Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Education Requirements */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">Education requirements</label>
            {profile.education_requirements?.map((p, i) => (
              <div key={i} className={rowStyle}>
                <Input
                  className="col-span-3"
                  placeholder="Degree (e.g., MBA)"
                  value={p.degree}
                  onChange={(e) => updateEducation(i, { degree: e.target.value })}
                />
                <Input
                  className="col-span-4"
                  placeholder="Field (e.g., Computer Science)"
                  value={p.field}
                  onChange={(e) => updateEducation(i, { field: e.target.value })}
                />
                <label className="col-span-4 flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={p.required}
                    onChange={(e) => updateEducation(i, { required: e.target.checked })}
                  />
                  <span className={p.required ? 'text-emerald-600 font-medium' : 'text-slate-500'}>
                    {p.required ? 'Required' : 'Preferred'}
                  </span>
                </label>
                <button type="button" className={delBtnStyle} onClick={() => setProfile({ ...profile, education_requirements: profile.education_requirements?.filter((_, idx) => idx !== i) })}>
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className={addBtnStyle}
              onClick={() => setProfile({ ...profile, education_requirements: [...(profile.education_requirements || []), { degree: '', field: '', required: false }] })}
            >
              + Add education requirement
            </button>
          </div>

          {/* Certifications */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">Certifications</label>
            <div className="flex gap-2 mb-2">
              <Input
                className="flex-1"
                placeholder="Add certification (e.g., CFA, PMP)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { addCertification((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; }
                }}
              />
              <Button size="sm" onClick={() => addCertification('MBA')}>+ MBA</Button>
              <Button size="sm" onClick={() => addCertification('CFA')}>+ CFA</Button>
            </div>
            {profile.certifications?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.certifications.map((cert, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-sm">
                    {cert}
                    <button onClick={() => removeCertification(i)} className="hover:text-red-600">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Language Requirements */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">Language requirements</label>
            {profile.language_requirements?.map((p, i) => (
              <div key={i} className={rowStyle}>
                <Input
                  className="col-span-5"
                  placeholder="Language (e.g., English, Mandarin)"
                  value={p.language}
                  onChange={(e) => updateLanguage(i, { language: e.target.value })}
                />
                <select
                  className="col-span-6 border border-slate-200 rounded px-2 py-1.5 text-sm bg-white"
                  value={p.level}
                  onChange={(e) => updateLanguage(i, { level: e.target.value as LanguageLevel })}
                >
                  <option value="native">Native</option>
                  <option value="fluent">Fluent</option>
                  <option value="conversational">Conversational</option>
                </select>
                <button type="button" className={delBtnStyle} onClick={() => setProfile({ ...profile, language_requirements: profile.language_requirements?.filter((_, idx) => idx !== i) })}>
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className={addBtnStyle}
              onClick={() => setProfile({ ...profile, language_requirements: [...(profile.language_requirements || []), { language: '', level: 'fluent' }] })}
            >
              + Add language requirement
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Approval Status */}
      <Card className={profile.status === 'approved' ? 'border-emerald-200 bg-emerald-50/60' : profile.status === 'rejected' ? 'border-red-200 bg-red-50/60' : ''}>
        <CardHeader>
          <CardTitle>4. Approval Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Current status:</span>
            <Badge className={badgeStyle(profile.status)}>{profile.status.replace('_', ' ')}</Badge>
          </div>
          
          {profile.approved_by && (
            <div className="text-sm text-slate-600">
              Approved by: <span className="font-medium">{profile.approved_by}</span>
            </div>
          )}
          
          {profile.approval_notes && (
            <div className="text-sm">
              <span className="text-slate-600">Approval notes:</span>
              <p className="text-slate-800 mt-1">{profile.approval_notes}</p>
            </div>
          )}
          
          {profile.rejection_reason && (
            <div className="text-sm">
              <span className="text-red-600">Rejection reason:</span>
              <p className="text-red-800 mt-1">{profile.rejection_reason}</p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200">
            <div className="flex gap-2">
              <Button size="sm" onClick={doSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
              {profile.status === 'draft' && (
                <Button size="sm" variant="outline" onClick={submitForApproval}>
                  Submit for Approval
                </Button>
              )}
              {profile.status === 'pending_approval' && (
                <span className="text-sm text-amber-600">Waiting for partner approval…</span>
              )}
              {profile.status === 'approved' && (
                <span className="text-sm text-emerald-600">✓ Success profile approved — ready for candidate evaluation</span>
              )}
              {profile.status === 'rejected' && (
                <Button size="sm" variant="outline" onClick={() => setProfile({ ...profile, status: 'draft' })}>
                  Edit and resubmit
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function normalizeProfile(raw: any): SuccessProfile {
  return {
    id: raw.id || '',
    mandate_id: raw.mandate_id || '',
    required_experience_years: raw.required_experience_years ?? null,
    required_industries: Array.isArray(raw.required_industries) ? raw.required_industries : [],
    required_geographies: Array.isArray(raw.required_geographies) ? raw.required_geographies : [],
    required_companies: Array.isArray(raw.required_companies) ? raw.required_companies : [],
    deal_size_range: raw.deal_size_range || null,
    team_size_managed: raw.team_size_managed ?? null,
    target_disc_profile: (raw.target_disc_profile as DiscProfile) || 'mixed',
    personality_indicators: Array.isArray(raw.personality_indicators) ? raw.personality_indicators : [],
    character_requirements: Array.isArray(raw.character_requirements) ? raw.character_requirements : [],
    education_requirements: Array.isArray(raw.education_requirements) ? raw.education_requirements : [],
    certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
    language_requirements: Array.isArray(raw.language_requirements) ? raw.language_requirements : [],
    status: (raw.status as ProfileStatus) || 'draft',
    defined_by: raw.defined_by || null,
    approved_by: raw.approved_by || null,
    approval_notes: raw.approval_notes || null,
    rejection_reason: raw.rejection_reason || null,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
  };
}
