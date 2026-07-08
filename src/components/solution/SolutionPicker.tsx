import React, { useState } from 'react';
import { 
  Check, X, ChevronRight, ChevronDown, Save, Send, Loader2,
  Briefcase, Users, Target, BarChart3, Building2, FileText
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';
import { useAuthStore } from '@/stores/authStore';
import { createMandateSolutions, getMandateSolutions } from '@/services/supabaseApi';
import type { Mandate } from '@/services/supabaseApi';

// Solution type definitions
export type SolutionType = 'succession' | 'assessment' | 'diagnostics' | 'density' | 'org_design' | 'role_definition';

export interface SolutionDetail {
  // succession
  key_roles?: string[];
  timeline?: string;
  // assessment
  candidate_count?: number;
  competencies?: string[];
  // diagnostics
  team_name?: string;
  team_size?: number;
  focus_areas?: string[];
  // density
  org_units?: string[];
  target_density?: number;
  // org_design
  current_structure?: string;
  proposed_structure?: string;
  // role_definition
  roles?: string[];
  reporting_lines?: string;
}

export interface MandateSolution {
  id?: string;
  mandate_id: string;
  solution_type: SolutionType;
  solution_detail: SolutionDetail;
  linked_assessment_type?: string;
  linked_assessment_id?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  defined_by?: string;
  approved_by?: string;
  approval_notes?: string;
  created_at?: string;
}

export const SOLUTION_TYPES: Record<SolutionType, { label: string; description: string; icon: React.ReactNode; recommendedAssessments: string[] }> = {
  succession: {
    label: 'Succession Planning',
    description: 'Succession planning for key roles - identify and develop future leaders',
    icon: <Users className="w-5 h-5" />,
    recommendedAssessments: ['shift_leap', 'shift_impact'],
  },
  assessment: {
    label: 'Assessment Center',
    description: 'Assessment center for candidate evaluation and selection',
    icon: <Target className="w-5 h-5" />,
    recommendedAssessments: ['prism', 'forge'],
  },
  diagnostics: {
    label: 'Team Diagnostics',
    description: 'Team diagnostics including culture and performance analysis',
    icon: <BarChart3 className="w-5 h-5" />,
    recommendedAssessments: ['shift_drive', 'shift_coach'],
  },
  density: {
    label: 'Talent Density',
    description: 'Talent density analysis for organizational units',
    icon: <Building2 className="w-5 h-5" />,
    recommendedAssessments: ['mosaic'],
  },
  org_design: {
    label: 'Organizational Design',
    description: 'Organizational structure redesign and optimization',
    icon: <Briefcase className="w-5 h-5" />,
    recommendedAssessments: ['bridge'],
  },
  role_definition: {
    label: 'Role Definition',
    description: 'Role clarity and responsibility mapping',
    icon: <FileText className="w-5 h-5" />,
    recommendedAssessments: ['spark'],
  },
};

const ASSESSMENT_OPTIONS = [
  { value: 'prism', label: 'PRISM - Career & Professional Branding' },
  { value: 'forge', label: 'FORGE - Sales Excellence' },
  { value: 'spark', label: 'SPARK - AI Leadership Readiness' },
  { value: 'bridge', label: 'BRIDGE - China Leadership Readiness' },
  { value: 'mosaic', label: 'MOSAIC - CQ Leadership Development' },
  { value: 'shift_leap', label: 'SHIFT-LEAP - Competitive Positioning' },
  { value: 'shift_quest', label: 'SHIFT-QUEST - Strategic Readiness' },
  { value: 'shift_drive', label: 'SHIFT-DRIVE - Execution Capability' },
  { value: 'shift_coach', label: 'SHIFT-COACH - Leadership Coaching' },
  { value: 'shift_impact', label: 'SHIFT-IMPACT - Organizational Impact' },
];

interface SolutionPickerProps {
  mandate: Mandate;
  onComplete?: () => void;
}

export function SolutionPicker({ mandate, onComplete }: SolutionPickerProps) {
  const { profile } = useAuthStore();
  const [selectedSolutions, setSelectedSolutions] = useState<SolutionType[]>([]);
  const [configuredSolutions, setConfiguredSolutions] = useState<Record<SolutionType, SolutionDetail>>({} as Record<SolutionType, SolutionDetail>);
  const [linkedAssessments, setLinkedAssessments] = useState<Record<SolutionType, string>>({} as Record<SolutionType, string>);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toggle solution selection
  const toggleSolution = (type: SolutionType) => {
    setSelectedSolutions(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
  };

  // Update solution detail
  const updateSolutionDetail = (type: SolutionType, detail: Partial<SolutionDetail>) => {
    setConfiguredSolutions(prev => ({
      ...prev,
      [type]: { ...prev[type], ...detail },
    }));
  };

  // Update linked assessment
  const updateLinkedAssessment = (type: SolutionType, assessmentType: string) => {
    setLinkedAssessments(prev => ({
      ...prev,
      [type]: assessmentType,
    }));
  };

  // Handle submission
  const handleSubmit = async (submitForApproval: boolean) => {
    if (selectedSolutions.length === 0) {
      setError('Please select at least one solution');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const solutions: MandateSolution[] = selectedSolutions.map(type => ({
        mandate_id: mandate.id,
        solution_type: type,
        solution_detail: configuredSolutions[type] || {},
        linked_assessment_type: linkedAssessments[type] || undefined,
        status: submitForApproval ? 'pending_approval' : 'draft',
        defined_by: profile?.id,
      }));

      const success = await createMandateSolutions(solutions);
      
      if (success) {
        onComplete?.();
      } else {
        throw new Error('Failed to save solutions');
      }
    } catch (err) {
      console.error('Solution submission error:', err);
      setError('Failed to save solutions. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Get assessment label
  const getAssessmentLabel = (value: string) => {
    const option = ASSESSMENT_OPTIONS.find(o => o.value === value);
    return option?.label || value;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Define Solutions</h1>
          <p className="text-text-muted">Select and configure HR business solutions for this mandate</p>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted'
                }`}
              >
                {s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-accent' : 'bg-bg-tertiary'}`} />}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-none p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Select Solution Types */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Step 1: Select Solution Types</h2>
          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(SOLUTION_TYPES) as SolutionType[]).map(type => {
              const config = SOLUTION_TYPES[type];
              const isSelected = selectedSolutions.includes(type);
              
              return (
                <div
                  key={type}
                  onClick={() => toggleSolution(type)}
                  className={`p-4 border-2 rounded-none cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-accent bg-accent/5' 
                      : 'border-bg-tertiary hover:border-accent/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-none flex items-center ${
                      isSelected ? 'bg-accent text-white' : 'bg-bg-secondary text-text-muted'
                    }`}>
                      {config.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-text-primary">{config.label}</h3>
                        {isSelected ? (
                          <Check className="w-5 h-5 text-accent" />
                        ) : (
                          <div className="w-5 h-5 rounded border-2 border-bg-tertiary" />
                        )}
                      </div>
                      <p className="text-sm text-text-muted mt-1">{config.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {config.recommendedAssessments.map(assess => (
                          <Badge key={assess} variant="default" className="text-xs">
                            {getAssessmentLabel(assess)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={selectedSolutions.length === 0}
            className="w-full py-3 bg-accent text-white rounded-none font-medium hover:bg-accent/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            Continue to Configuration
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: Configure Solutions */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Step 2: Configure Solutions</h2>
            <button
              onClick={() => setStep(1)}
              className="text-sm text-text-muted hover:text-text-primary"
            >
              Back to Selection
            </button>
          </div>

          {selectedSolutions.map(type => {
            const config = SOLUTION_TYPES[type];
            const detail = configuredSolutions[type] || {};
            const assessment = linkedAssessments[type];
            
            return (
              <div key={type} className="bg-bg-secondary rounded-none p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-none bg-accent/10 flex items-center text-accent">
                    {config.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{config.label}</h3>
                    <p className="text-sm text-text-muted">{config.description}</p>
                  </div>
                </div>

                {/* Configuration Form */}
                <div className="space-y-4">
                  {type === 'succession' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Key Roles</label>
                        <input
                          type="text"
                          value={detail.key_roles?.join(', ') || ''}
                          onChange={(e) => updateSolutionDetail(type, { key_roles: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                          placeholder="e.g., CEO, CTO, Director of Operations"
                          className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary rounded-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Timeline</label>
                        <select
                          value={detail.timeline || ''}
                          onChange={(e) => updateSolutionDetail(type, { timeline: e.target.value })}
                          className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary rounded-none"
                        >
                          <option value="">Select timeline</option>
                          <option value="3-months">0-3 Months</option>
                          <option value="6-months">3-6 Months</option>
                          <option value="12-months">6-12 Months</option>
                          <option value="12+">12+ Months</option>
                        </select>
                      </div>
                    </>
                  )}

                  {type === 'assessment' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Candidate Count</label>
                        <input
                          type="number"
                          value={detail.candidate_count || ''}
                          onChange={(e) => updateSolutionDetail(type, { candidate_count: parseInt(e.target.value) || undefined })}
                          placeholder="Number of candidates to assess"
                          className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary rounded-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Key Competencies</label>
                        <input
                          type="text"
                          value={detail.competencies?.join(', ') || ''}
                          onChange={(e) => updateSolutionDetail(type, { competencies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                          placeholder="e.g., Leadership, Communication, Technical Skills"
                          className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary rounded-none"
                        />
                      </div>
                    </>
                  )}

                  {type === 'diagnostics' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Team Name</label>
                        <input
                          type="text"
                          value={detail.team_name || ''}
                          onChange={(e) => updateSolutionDetail(type, { team_name: e.target.value })}
                          placeholder="Name of the team to diagnose"
                          className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary rounded-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Team Size</label>
                        <input
                          type="number"
                          value={detail.team_size || ''}
                          onChange={(e) => updateSolutionDetail(type, { team_size: parseInt(e.target.value) || undefined })}
                          placeholder="Number of team members"
                          className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary rounded-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Focus Areas</label>
                        <input
                          type="text"
                          value={detail.focus_areas?.join(', ') || ''}
                          onChange={(e) => updateSolutionDetail(type, { focus_areas: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                          placeholder="e.g., Culture, Performance, Collaboration"
                          className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary rounded-none"
                        />
                      </div>
                    </>
                  )}

                  {type === 'density' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Org Units</label>
                        <input
                          type="text"
                          value={detail.org_units?.join(', ') || ''}
                          onChange={(e) => updateSolutionDetail(type, { org_units: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                          placeholder="e.g., Engineering, Product, Marketing"
                          className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary rounded-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Target Density (%)</label>
                        <input
                          type="number"
                          value={detail.target_density || ''}
                          onChange={(e) => updateSolutionDetail(type, { target_density: parseInt(e.target.value) || undefined })}
                          placeholder="Target talent density percentage"
                          className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary rounded-none"
                        />
                      </div>
                    </>
                  )}

                  {type === 'org_design' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Current Structure</label>
                        <textarea
                          value={detail.current_structure || ''}
                          onChange={(e) => updateSolutionDetail(type, { current_structure: e.target.value })}
                          placeholder="Describe the current organizational structure"
                          rows={3}
                          className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary rounded-none resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Proposed Structure</label>
                        <textarea
                          value={detail.proposed_structure || ''}
                          onChange={(e) => updateSolutionDetail(type, { proposed_structure: e.target.value })}
                          placeholder="Describe the proposed organizational structure"
                          rows={3}
                          className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary rounded-none resize-none"
                        />
                      </div>
                    </>
                  )}

                  {type === 'role_definition' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Roles</label>
                        <input
                          type="text"
                          value={detail.roles?.join(', ') || ''}
                          onChange={(e) => updateSolutionDetail(type, { roles: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                          placeholder="e.g., Engineering Manager, Product Lead, UX Designer"
                          className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary rounded-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Reporting Lines</label>
                        <textarea
                          value={detail.reporting_lines || ''}
                          onChange={(e) => updateSolutionDetail(type, { reporting_lines: e.target.value })}
                          placeholder="Describe reporting structure and hierarchy"
                          rows={2}
                          className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary rounded-none resize-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Linked Assessment */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Linked Assessment (Optional)</label>
                    <select
                      value={assessment || ''}
                      onChange={(e) => updateLinkedAssessment(type, e.target.value)}
                      className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary rounded-none"
                    >
                      <option value="">Select assessment (optional)</option>
                      {config.recommendedAssessments.map(assess => (
                        <option key={assess} value={assess}>
                          ✓ {getAssessmentLabel(assess)} (Recommended)
                        </option>
                      ))}
                      <option value="">--- Other Assessments ---</option>
                      {ASSESSMENT_OPTIONS.filter(a => !config.recommendedAssessments.includes(a.value)).map(assess => (
                        <option key={assess.value} value={assess.value}>
                          {assess.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 border border-bg-tertiary rounded-none font-medium text-text-secondary hover:bg-bg-tertiary"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-3 bg-accent text-white rounded-none font-medium hover:bg-accent/90 flex items-center justify-center gap-2"
            >
              Review & Submit
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Step 3: Review & Submit</h2>
            <button
              onClick={() => setStep(2)}
              className="text-sm text-text-muted hover:text-text-primary"
            >
              Back to Configuration
            </button>
          </div>

          <div className="bg-bg-secondary rounded-none p-6">
            <h3 className="font-semibold text-text-primary mb-4">Selected Solutions for {mandate.title}</h3>
            
            <div className="space-y-4">
              {selectedSolutions.map(type => {
                const config = SOLUTION_TYPES[type];
                const detail = configuredSolutions[type] || {};
                const assessment = linkedAssessments[type];
                
                return (
                  <div key={type} className="border border-bg-tertiary rounded-none p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-none bg-accent/10 flex items-center text-accent">
                        {config.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-text-primary">{config.label}</h4>
                        {assessment && (
                          <p className="text-sm text-accent">{getAssessmentLabel(assessment)}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Detail summary */}
                    <div className="grid grid-cols-2 gap-2 text-sm text-text-muted">
                      {type === 'succession' && (
                        <>
                          {detail.key_roles?.length && (
                            <div>Roles: {detail.key_roles.join(', ')}</div>
                          )}
                          {detail.timeline && <div>Timeline: {detail.timeline}</div>}
                        </>
                      )}
                      {type === 'assessment' && (
                        <>
                          {detail.candidate_count && <div>Candidates: {detail.candidate_count}</div>}
                          {detail.competencies?.length && (
                            <div>Competencies: {detail.competencies.join(', ')}</div>
                          )}
                        </>
                      )}
                      {type === 'diagnostics' && (
                        <>
                          {detail.team_name && <div>Team: {detail.team_name}</div>}
                          {detail.team_size && <div>Size: {detail.team_size}</div>}
                          {detail.focus_areas?.length && (
                            <div>Focus: {detail.focus_areas.join(', ')}</div>
                          )}
                        </>
                      )}
                      {type === 'density' && (
                        <>
                          {detail.org_units?.length && (
                            <div>Units: {detail.org_units.join(', ')}</div>
                          )}
                          {detail.target_density && (
                            <div>Target: {detail.target_density}%</div>
                          )}
                        </>
                      )}
                      {type === 'org_design' && (
                        <>
                          {detail.current_structure && <div>Current: Defined</div>}
                          {detail.proposed_structure && <div>Proposed: Defined</div>}
                        </>
                      )}
                      {type === 'role_definition' && (
                        <>
                          {detail.roles?.length && <div>Roles: {detail.roles.join(', ')}</div>}
                          {detail.reporting_lines && <div>Reporting: Defined</div>}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 border border-bg-tertiary rounded-none font-medium text-text-secondary hover:bg-bg-tertiary flex items-center justify-center gap-2"
            >
              <ChevronDown className="w-4 h-4" />
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={saving}
              className="flex-1 py-3 bg-accent text-white rounded-none font-medium hover:bg-accent/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit for Approval
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SolutionPicker;
