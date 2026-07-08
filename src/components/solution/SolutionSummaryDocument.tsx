import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Printer, Share2, Loader2,
  Briefcase, Users, Target, BarChart3, Building2, 
  CheckCircle, User, Calendar, Award, ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { getMandateSolutions } from '@/services/supabaseApi';
import { SolutionType, SOLUTION_TYPES } from './SolutionPicker';
import type { Mandate } from '@/services/supabaseApi';

interface SolutionSummaryDocumentProps {
  mandate: Mandate;
}

export function SolutionSummaryDocument({ mandate }: SolutionSummaryDocumentProps) {
  const [solutions, setSolutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    loadSolutions();
  }, [mandate.id]);

  const loadSolutions = async () => {
    setLoading(true);
    const data = await getMandateSolutions(mandate.id);
    setSolutions(data.filter(s => s.status === 'approved'));
    setLoading(false);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    window.print();
    setTimeout(() => setIsPrinting(false), 1000);
  };

  const handleDownload = async () => {
    // In a real implementation, this would generate a PDF
    alert('PDF download would be triggered here');
  };

  const getAssessmentLabel = (type: string) => {
    const labels: Record<string, string> = {
      prism: 'PRISM - Career & Professional Branding',
      forge: 'FORGE - Sales Excellence',
      spark: 'SPARK - AI Leadership Readiness',
      bridge: 'BRIDGE - China Leadership Readiness',
      mosaic: 'MOSAIC - CQ Leadership Development',
      shift_leap: 'SHIFT-LEAP - Competitive Positioning',
      shift_quest: 'SHIFT-QUEST - Strategic Readiness',
      shift_drive: 'SHIFT-DRIVE - Execution Capability',
      shift_coach: 'SHIFT-COACH - Leadership Coaching',
      shift_impact: 'SHIFT-IMPACT - Organizational Impact',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (solutions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">No Approved Solutions</h3>
        <p className="text-text-muted">No solutions have been approved for this mandate yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Solution Summary</h1>
          <p className="text-text-muted">Approved HR solutions for {mandate.title}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-bg-tertiary text-text-primary rounded-none text-sm font-medium hover:bg-bg-secondary flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-accent text-white rounded-none text-sm font-medium hover:bg-accent/90 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Document */}
      <div className={`bg-white rounded-none shadow-lg overflow-hidden ${isPrinting ? 'print-container' : ''}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-accent to-purple-600 text-white p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif font-bold mb-2">DEX AI</h2>
              <p className="text-white/80">HR Business Solutions</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">Solution Summary Report</p>
              <p className="text-lg font-medium">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Mandate Info */}
          <div className="mb-8 pb-6 border-b border-bg-tertiary">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Mandate Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-text-muted">Client</p>
                <p className="font-medium text-text-primary">{mandate.company?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Mandate</p>
                <p className="font-medium text-text-primary">{mandate.title}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Status</p>
                <p className="font-medium text-text-primary">{mandate.status}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Created</p>
                <p className="font-medium text-text-primary">{new Date(mandate.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Solutions */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Approved Solutions</h3>
            
            <div className="space-y-4">
              {solutions.map((solution, index) => {
                const config = SOLUTION_TYPES[solution.solution_type as SolutionType];
                
                return (
                  <div key={solution.id} className="border border-bg-tertiary rounded-none overflow-hidden">
                    <div 
                      className="px-4 py-3"
                      style={{ backgroundColor: index % 2 === 0 ? '#f8fafc' : '#ffffff' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-none bg-accent/10 flex items-center text-accent">
                          {config?.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-text-primary">{config?.label}</h4>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                          <p className="text-sm text-text-muted">{config?.description}</p>
                        </div>
                        {solution.linked_assessment_type && (
                          <Badge className="text-xs">
                            {solution.linked_assessment_type.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Details */}
                    <div className="px-4 py-4 bg-bg-secondary">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        {solution.solution_detail?.key_roles && (
                          <div>
                            <span className="text-text-muted block mb-1">Key Roles</span>
                            <span className="text-text-primary">{solution.solution_detail.key_roles.join(', ')}</span>
                          </div>
                        )}
                        {solution.solution_detail?.timeline && (
                          <div>
                            <span className="text-text-muted block mb-1">Timeline</span>
                            <span className="text-text-primary">{solution.solution_detail.timeline}</span>
                          </div>
                        )}
                        {solution.solution_detail?.candidate_count && (
                          <div>
                            <span className="text-text-muted block mb-1">Candidate Count</span>
                            <span className="text-text-primary">{solution.solution_detail.candidate_count}</span>
                          </div>
                        )}
                        {solution.solution_detail?.competencies && (
                          <div>
                            <span className="text-text-muted block mb-1">Competencies</span>
                            <span className="text-text-primary">{solution.solution_detail.competencies.join(', ')}</span>
                          </div>
                        )}
                        {solution.solution_detail?.team_name && (
                          <div>
                            <span className="text-text-muted block mb-1">Team</span>
                            <span className="text-text-primary">{solution.solution_detail.team_name}</span>
                          </div>
                        )}
                        {solution.solution_detail?.team_size && (
                          <div>
                            <span className="text-text-muted block mb-1">Team Size</span>
                            <span className="text-text-primary">{solution.solution_detail.team_size}</span>
                          </div>
                        )}
                        {solution.solution_detail?.focus_areas && (
                          <div>
                            <span className="text-text-muted block mb-1">Focus Areas</span>
                            <span className="text-text-primary">{solution.solution_detail.focus_areas.join(', ')}</span>
                          </div>
                        )}
                        {solution.solution_detail?.org_units && (
                          <div>
                            <span className="text-text-muted block mb-1">Org Units</span>
                            <span className="text-text-primary">{solution.solution_detail.org_units.join(', ')}</span>
                          </div>
                        )}
                        {solution.solution_detail?.target_density && (
                          <div>
                            <span className="text-text-muted block mb-1">Target Density</span>
                            <span className="text-text-primary">{solution.solution_detail.target_density}%</span>
                          </div>
                        )}
                        {solution.solution_detail?.roles && (
                          <div>
                            <span className="text-text-muted block mb-1">Roles</span>
                            <span className="text-text-primary">{solution.solution_detail.roles.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Linked Assessments Summary */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Linked Assessments</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {solutions.filter(s => s.linked_assessment_type).map(solution => (
                <div key={solution.id} className="bg-accent/5 rounded-none p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-accent" />
                    <span className="font-medium text-text-primary">
                      {solution.linked_assessment_type?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted">
                    {getAssessmentLabel(solution.linked_assessment_type)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Approval Info */}
          <div className="border-t border-bg-tertiary pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Approved By</p>
                <p className="font-medium text-text-primary">{solutions[0]?.approved_by_name || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-text-muted">Approval Date</p>
                <p className="font-medium text-text-primary">
                  {solutions[0]?.updated_at ? new Date(solutions[0].updated_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-bg-secondary px-8 py-4 border-t border-bg-tertiary">
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>DEX AI Solutions - HR Business Consulting</span>
            <span>Generated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .print-container {
            box-shadow: none;
            margin: 0;
            width: 100%;
          }
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default SolutionSummaryDocument;
