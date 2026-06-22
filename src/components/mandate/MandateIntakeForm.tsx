import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import type { Mandate } from '@/services/supabaseApi';
import { generateIntakeQuestions, saveMandateIntake } from '@/services/supabaseApi';
import type {
  IntakeData,
  PainPoint,
  FrictionIssue,
  LeadershipQuality,
  SkillGap,
  TalentDensityIssue,
  PainSeverity,
  FrictionArea,
  LeadershipPriority,
} from '@/types';
import { DEFAULT_INTAKE } from '@/types';

const rowStyle = 'grid grid-cols-12 gap-2 items-start p-2 border-b last:border-b-0';
const addBtnStyle = 'mt-2 px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100';
const delBtnStyle = 'text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded';

interface Props {
  mandate: Mandate;
  onSaved?: (data: IntakeData) => void;
}

export function MandateIntakeForm({ mandate, onSaved }: Props) {
  const [intake, setIntake] = useState<IntakeData>(() => normalize(mandate.intake_data));
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [validation, setValidation] = useState<string | null>(null);

  useEffect(() => {
    setIntake(normalize(mandate.intake_data));
  }, [mandate.id, mandate.updated_at]);

  const intakeComplete = intake.intake_complete === true;

  const completion = useMemo(() => {
    let filled = 0;
    const total = 5;
    if (intake.pain_points.length > 0) filled++;
    if (intake.org_friction.length > 0) filled++;
    if (intake.leadership_needs.length > 0) filled++;
    if (intake.skills_gaps.length > 0) filled++;
    if (intake.talent_density_issues.length > 0) filled++;
    return { filled, total, pct: Math.round((filled / total) * 100) };
  }, [intake]);

  async function doSave(next?: IntakeData): Promise<boolean> {
    const data = next ?? intake;
    const minRequired = data.pain_points.every((p) => p.pain.trim().length > 0);
    if (data.intake_complete && data.pain_points.length === 0) {
      setValidation('At least one pain point required to mark intake complete.');
      return false;
    }
    if (data.intake_complete && !minRequired) {
      setValidation('Pain point descriptions cannot be empty.');
      return false;
    }
    setValidation(null);
    setSaving(true);
    const ok = await saveMandateIntake(mandate.id, data);
    setSaving(false);
    if (ok) {
      setLastSavedAt(new Date().toLocaleTimeString());
      onSaved?.(data);
    }
    return ok;
  }

  async function toggleComplete() {
    const next: IntakeData = { ...intake, intake_complete: !intake.intake_complete };
    setIntake(next);
    // Only save when marking complete. Unchecking needs explicit save too.
    await doSave(next);
  }

  async function generateQuestions() {
    setLoadingAI(true);
    const qs = await generateIntakeQuestions({
      title: mandate.title,
      keywords: mandate.keywords ?? null,
      location: (mandate as any).location ?? null,
      intake_data: intake as any,
    });
    setAiQuestions(qs);
    setLoadingAI(false);
  }

  // ========== Field updaters ==========
  function updatePain(i: number, patch: Partial<PainPoint>) {
    setIntake({
      ...intake,
      pain_points: intake.pain_points.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    });
  }
  function updateFriction(i: number, patch: Partial<FrictionIssue>) {
    setIntake({
      ...intake,
      org_friction: intake.org_friction.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    });
  }
  function updateLeadership(i: number, patch: Partial<LeadershipQuality>) {
    setIntake({
      ...intake,
      leadership_needs: intake.leadership_needs.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    });
  }
  function updateSkillGap(i: number, patch: Partial<SkillGap>) {
    setIntake({
      ...intake,
      skills_gaps: intake.skills_gaps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    });
  }
  function updateDensity(i: number, patch: Partial<TalentDensityIssue>) {
    setIntake({
      ...intake,
      talent_density_issues: intake.talent_density_issues.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    });
  }

  return (
    <div className="space-y-5">
      {/* AI suggested questions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>AI Discovery Questions</CardTitle>
            <Button size="sm" onClick={generateQuestions} disabled={loadingAI}>
              {loadingAI ? 'Generating…' : aiQuestions.length > 0 ? 'Regenerate' : 'Suggest Questions'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aiQuestions.length === 0 ? (
            <p className="text-sm text-slate-500">
              Click <span className="font-semibold">Suggest Questions</span> to generate relevant discovery questions for this mandate.
            </p>
          ) : (
            <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-700">
              {aiQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Section 1: Pain points */}
      <SectionCard title="1. Business Pain Points" count={intake.pain_points.length}>
        <div className="text-xs text-slate-500 mb-2">Minimum 1 pain point required.</div>
        {intake.pain_points.map((p, i) => (
          <div key={i} className={rowStyle}>
            <Input
              className="col-span-4"
              placeholder="Pain description"
              value={p.pain}
              onChange={(e) => updatePain(i, { pain: e.target.value })}
            />
            <select
              className="col-span-3 border border-slate-200 rounded px-2 py-1.5 text-sm bg-white"
              value={p.severity}
              onChange={(e) => updatePain(i, { severity: e.target.value as PainSeverity })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <Input
              className="col-span-4"
              placeholder="Business impact"
              value={p.impact}
              onChange={(e) => updatePain(i, { impact: e.target.value })}
            />
            <button type="button" className={delBtnStyle} onClick={() => setIntake({ ...intake, pain_points: intake.pain_points.filter((_, idx) => idx !== i) })}>
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className={addBtnStyle}
          onClick={() => setIntake({ ...intake, pain_points: [...intake.pain_points, { pain: '', severity: 'medium', impact: '' }] })}
        >
          + Add pain point
        </button>
      </SectionCard>

      {/* Section 2: Org friction */}
      <SectionCard title="2. Organizational Friction" count={intake.org_friction.length}>
        {intake.org_friction.map((p, i) => (
          <div key={i} className={rowStyle}>
            <Input
              className="col-span-4"
              placeholder="Issue"
              value={p.issue}
              onChange={(e) => updateFriction(i, { issue: e.target.value })}
            />
            <select
              className="col-span-3 border border-slate-200 rounded px-2 py-1.5 text-sm bg-white"
              value={p.area}
              onChange={(e) => updateFriction(i, { area: e.target.value as FrictionArea })}
            >
              <option value="org structure">Org structure</option>
              <option value="talent gaps">Talent gaps</option>
              <option value="leadership">Leadership</option>
              <option value="culture">Culture</option>
            </select>
            <Input
              className="col-span-4"
              placeholder="Detail"
              value={p.detail}
              onChange={(e) => updateFriction(i, { detail: e.target.value })}
            />
            <button type="button" className={delBtnStyle} onClick={() => setIntake({ ...intake, org_friction: intake.org_friction.filter((_, idx) => idx !== i) })}>
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className={addBtnStyle}
          onClick={() => setIntake({ ...intake, org_friction: [...intake.org_friction, { issue: '', area: 'talent gaps', detail: '' }] })}
        >
          + Add friction issue
        </button>
      </SectionCard>

      {/* Section 3: Leadership needs */}
      <SectionCard title="3. Leadership Needs" count={intake.leadership_needs.length}>
        {intake.leadership_needs.map((p, i) => (
          <div key={i} className={rowStyle}>
            <Input
              className="col-span-4"
              placeholder="Quality / trait"
              value={p.quality}
              onChange={(e) => updateLeadership(i, { quality: e.target.value })}
            />
            <Input
              className="col-span-4"
              placeholder="Why it matters"
              value={p.why}
              onChange={(e) => updateLeadership(i, { why: e.target.value })}
            />
            <select
              className="col-span-3 border border-slate-200 rounded px-2 py-1.5 text-sm bg-white"
              value={p.priority}
              onChange={(e) => updateLeadership(i, { priority: e.target.value as LeadershipPriority })}
            >
              <option value="must-have">Must-have</option>
              <option value="nice-to-have">Nice-to-have</option>
            </select>
            <button type="button" className={delBtnStyle} onClick={() => setIntake({ ...intake, leadership_needs: intake.leadership_needs.filter((_, idx) => idx !== i) })}>
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className={addBtnStyle}
          onClick={() => setIntake({ ...intake, leadership_needs: [...intake.leadership_needs, { quality: '', why: '', priority: 'must-have' }] })}
        >
          + Add leadership quality
        </button>
      </SectionCard>

      {/* Section 4: Skills gaps */}
      <SectionCard title="4. Skills Gaps" count={intake.skills_gaps.length}>
        {intake.skills_gaps.map((p, i) => (
          <div key={i} className={rowStyle}>
            <Input className="col-span-4" placeholder="Skill" value={p.skill} onChange={(e) => updateSkillGap(i, { skill: e.target.value })} />
            <Input className="col-span-3" placeholder="Current level" value={p.current_level} onChange={(e) => updateSkillGap(i, { current_level: e.target.value })} />
            <Input className="col-span-3" placeholder="Required level" value={p.required_level} onChange={(e) => updateSkillGap(i, { required_level: e.target.value })} />
            <button type="button" className={delBtnStyle} onClick={() => setIntake({ ...intake, skills_gaps: intake.skills_gaps.filter((_, idx) => idx !== i) })}>
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className={addBtnStyle}
          onClick={() => setIntake({ ...intake, skills_gaps: [...intake.skills_gaps, { skill: '', current_level: '', required_level: '' }] })}
        >
          + Add skill gap
        </button>
      </SectionCard>

      {/* Section 5: Talent density */}
      <SectionCard title="5. Talent Density Issues" count={intake.talent_density_issues.length}>
        {intake.talent_density_issues.map((p, i) => (
          <div key={i} className={rowStyle}>
            <Input className="col-span-4" placeholder="Area" value={p.area} onChange={(e) => updateDensity(i, { area: e.target.value })} />
            <Input className="col-span-3" placeholder="Current density" value={p.current_density} onChange={(e) => updateDensity(i, { current_density: e.target.value })} />
            <Input className="col-span-3" placeholder="Target density" value={p.target_density} onChange={(e) => updateDensity(i, { target_density: e.target.value })} />
            <button type="button" className={delBtnStyle} onClick={() => setIntake({ ...intake, talent_density_issues: intake.talent_density_issues.filter((_, idx) => idx !== i) })}>
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className={addBtnStyle}
          onClick={() => setIntake({ ...intake, talent_density_issues: [...intake.talent_density_issues, { area: '', current_density: '', target_density: '' }] })}
        >
          + Add density issue
        </button>
      </SectionCard>

      {/* Section 6: Discovery metadata */}
      <Card>
        <CardHeader>
          <CardTitle>6. Discovery Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600">Discovered by</label>
              <Input
                className="mt-1"
                value={intake.discovered_by ?? ''}
                placeholder="User ID auto-filled"
                onChange={(e) => setIntake({ ...intake, discovered_by: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Discovery date</label>
              <Input
                className="mt-1"
                type="date"
                value={intake.discovery_date ?? ''}
                onChange={(e) => setIntake({ ...intake, discovery_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Client interview notes</label>
            <textarea
              className="mt-1 w-full border border-slate-200 rounded px-2 py-1.5 text-sm min-h-[100px] bg-white"
              placeholder="Summary of the client intake conversation"
              value={intake.client_interview_notes ?? ''}
              onChange={(e) => setIntake({ ...intake, client_interview_notes: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 7: Completion */}
      <Card className={intakeComplete ? 'border-emerald-200 bg-emerald-50/60' : ''}>
        <CardHeader>
          <CardTitle>7. Completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-700">
              Sections filled: <span className="font-semibold">{completion.filled}/{completion.total}</span> ({completion.pct}%)
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={intake.intake_complete}
                onChange={toggleComplete}
              />
              <span className="font-medium text-slate-800">Intake complete</span>
            </label>
          </div>

          {validation && <div className="text-sm text-red-600">{validation}</div>}

          <div className="flex items-center gap-3 pt-2">
            <Button size="sm" onClick={() => doSave()} disabled={saving}>
              {saving ? 'Saving…' : 'Save intake'}
            </Button>
            {lastSavedAt && <span className="text-xs text-slate-500">Last saved {lastSavedAt}</span>}
            {intakeComplete && <span className="text-xs text-emerald-700 ml-auto">✓ Intake complete — sourcing can proceed</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SectionCard({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <span className="text-xs text-slate-500">{count} item{count === 1 ? '' : 's'}</span>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function normalize(raw: unknown): IntakeData {
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    return {
      pain_points: Array.isArray(r.pain_points) ? (r.pain_points as PainPoint[]) : [],
      org_friction: Array.isArray(r.org_friction) ? (r.org_friction as FrictionIssue[]) : [],
      leadership_needs: Array.isArray(r.leadership_needs) ? (r.leadership_needs as LeadershipQuality[]) : [],
      skills_gaps: Array.isArray(r.skills_gaps) ? (r.skills_gaps as SkillGap[]) : [],
      talent_density_issues: Array.isArray(r.talent_density_issues) ? (r.talent_density_issues as TalentDensityIssue[]) : [],
      discovered_by: typeof r.discovered_by === 'string' ? r.discovered_by : null,
      discovery_date: typeof r.discovery_date === 'string' ? r.discovery_date : new Date().toISOString().slice(0, 10),
      client_interview_notes: typeof r.client_interview_notes === 'string' ? r.client_interview_notes : null,
      intake_complete: r.intake_complete === true,
    };
  }
  return { ...DEFAULT_INTAKE };
}
