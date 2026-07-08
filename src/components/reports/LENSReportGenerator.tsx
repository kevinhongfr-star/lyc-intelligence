import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Download, Mail, Share2, ChevronRight, ChevronDown,
  Loader2, AlertCircle, CheckCircle2, Users, Award, BarChart3,
  Filter, X, Settings, Eye, Clock
} from 'lucide-react';
import { Badge, Button, Input } from '@/components/ui';
import { generateLENSReport, sendReportEmail, createReportShareLink } from '@/services/supabaseApi';
import type { CandidatePipeline, Mandate, LENSReportData } from '@/services/supabaseApi';

type ReportType = 'T1' | 'T2' | 'T3';

interface LENSReportGeneratorProps {
  mandateId: string;
  mandate: Mandate;
  candidates: CandidatePipeline[];
  onClose?: () => void;
}

const REPORT_TYPE_CONFIG = {
  T1: {
    name: 'T1: Talent Mapping Shortlist',
    description: 'Executive summary with top candidates, match scores, and recommendations',
    minCandidates: 1,
    maxCandidates: 10,
    icon: Users,
  },
  T2: {
    name: 'T2: Candidate Profile',
    description: 'Deep-dive profile for a single candidate with full assessment results',
    minCandidates: 1,
    maxCandidates: 1,
    icon: Award,
  },
  T3: {
    name: 'T3: Match Scorecard',
    description: 'Side-by-side comparison of 2-4 candidates with dimension scores',
    minCandidates: 2,
    maxCandidates: 4,
    icon: BarChart3,
  },
};

export function LENSReportGenerator({
  mandateId,
  mandate,
  candidates,
  onClose,
}: LENSReportGeneratorProps) {
  const [reportType, setReportType] = useState<ReportType>('T1');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<LENSReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'configure' | 'generate' | 'deliver'>('select');
  const [deliveryOptions, setDeliveryOptions] = useState({
    download: true,
    email: false,
    shareLink: false,
    emailRecipients: '',
    shareExpiry: '7d',
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [creatingShare, setCreatingShare] = useState(false);

  // Filter candidates with scores
  const candidatesWithScores = useMemo(() => {
    return candidates.filter(c => c.match_score != null);
  }, [candidates]);

  // Sort by match score
  const sortedCandidates = useMemo(() => {
    return [...candidatesWithScores].sort((a, b) => 
      (b.match_score ?? 0) - (a.match_score ?? 0)
    );
  }, [candidatesWithScores]);

  // Get verdict badge color
  const getVerdictColor = (verdict: string | null) => {
    if (verdict === 'proceed') return 'success';
    if (verdict === 'hold') return 'warning';
    if (verdict === 'pass') return 'danger';
    return 'default';
  };

  // Toggle candidate selection
  const toggleCandidate = (candidateId: string) => {
    const config = REPORT_TYPE_CONFIG[reportType];
    setSelectedCandidates(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      }
      if (prev.length < config.maxCandidates) {
        return [...prev, candidateId];
      }
      return prev;
    });
  };

  // Select top candidates
  const selectTopCandidates = (count: number) => {
    setSelectedCandidates(sortedCandidates.slice(0, count).map(c => c.id));
  };

  // Validate selection
  const canProceed = useMemo(() => {
    const config = REPORT_TYPE_CONFIG[reportType];
    return selectedCandidates.length >= config.minCandidates && 
           selectedCandidates.length <= config.maxCandidates;
  }, [reportType, selectedCandidates]);

  // Generate report
  const handleGenerate = async () => {
    if (!canProceed) return;

    setGenerating(true);
    setError(null);

    try {
      const report = await generateLENSReport(mandateId, selectedCandidates, reportType);
      if (report) {
        setGeneratedReport(report);
        setStep('deliver');
      } else {
        setError('Failed to generate report');
      }
    } catch (err) {
      console.error('Generate report error:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Download PDF
  const handleDownload = () => {
    if (!generatedReport?.pdf_url) return;

    const link = window.document.createElement('a');
    link.href = generatedReport.pdf_url;
    link.download = `LENS_${reportType}_${mandate.title?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  // Send email
  const handleSendEmail = async () => {
    if (!generatedReport?.id || !deliveryOptions.emailRecipients) return;

    setSendingEmail(true);
    try {
      const emails = deliveryOptions.emailRecipients.split(',').map(e => e.trim()).filter(Boolean);
      const success = await sendReportEmail(generatedReport.id, emails);
      if (success) {
        setError(null);
      } else {
        setError('Failed to send email');
      }
    } catch (err) {
      console.error('Send email error:', err);
      setError('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  // Create share link
  const handleCreateShare = async () => {
    if (!generatedReport?.id) return;

    setCreatingShare(true);
    try {
      const shareLink = await createReportShareLink(generatedReport.id, deliveryOptions.shareExpiry);
      if (shareLink) {
        setGeneratedReport(prev => prev ? { ...prev, share_url: shareLink } : null);
      } else {
        setError('Failed to create share link');
      }
    } catch (err) {
      console.error('Create share error:', err);
      setError('Failed to create share link');
    } finally {
      setCreatingShare(false);
    }
  };

  // Render candidate card
  const CandidateCard = ({ candidate }: { candidate: CandidatePipeline }) => {
    const isSelected = selectedCandidates.includes(candidate.id);
    const contact = candidate.contact as {
      id: string;
      first_name?: string;
      last_name?: string;
      current_title?: string;
      company?: { name: string; industry: string };
      location?: string;
    } | undefined;

    return (
      <div
        onClick={() => toggleCandidate(candidate.id)}
        className={`p-4 rounded-none border cursor-pointer transition-all ${
          isSelected
            ? 'border-accent bg-accent/5'
            : 'border-border hover:border-accent/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              isSelected ? 'border-accent bg-accent' : 'border-border'
            }`}>
              {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
            </div>
            
            <div>
              <div className="font-medium text-text-primary">
                {contact?.first_name || ''} {contact?.last_name || ''}
              </div>
              <div className="text-sm text-text-muted">
                {contact?.current_title || ''} at {contact?.company?.name || 'Company'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {candidate.match_score != null && (
              <Badge variant={candidate.match_score >= 80 ? 'success' : candidate.match_score >= 60 ? 'warning' : 'default'}>
                Match: {candidate.match_score}
              </Badge>
            )}
            {candidate.verdict && (
              <Badge variant={getVerdictColor(candidate.verdict)}>
                {candidate.verdict}
              </Badge>
            )}
          </div>
        </div>

        {/* Expanded details */}
        {isSelected && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-text-muted">Location:</span>
                <span className="ml-2 text-text-primary">{contact?.location || 'N/A'}</span>
              </div>
              <div>
                <span className="text-text-muted">Stage:</span>
                <span className="ml-2 text-text-primary">{candidate.stage}</span>
              </div>
              <div>
                <span className="text-text-muted">TRIDENT:</span>
                <span className="ml-2 text-text-primary">{candidate.trident_composite || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-bg rounded-none max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            Generate LENS Report
          </h2>
          <p className="text-sm text-text-muted mt-1">
            {mandate.title || 'Mandate'} • {candidatesWithScores.length} candidates with scores
          </p>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-bg-alt rounded-none">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 p-4 bg-bg-alt border-b border-border">
        {['select', 'configure', 'generate', 'deliver'].map((s, i) => (
          <React.Fragment key={s}>
            <div className={`px-3 py-1 rounded-full text-sm ${
              step === s ? 'bg-accent text-white' : 
              i < ['select', 'configure', 'generate', 'deliver'].indexOf(step) 
                ? 'bg-green-500/20 text-green-600' 
                : 'bg-bg text-text-muted'
            }`}>
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </div>
            {i < 3 && <ChevronRight className="w-4 h-4 text-text-muted" />}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 rounded-none flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-500">{error}</span>
          </div>
        )}

        {/* Step 1: Select Candidates */}
        {step === 'select' && (
          <div className="space-y-6">
            {/* Report type selection */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Report Type
              </label>
              <div className="grid grid-cols-3 gap-4">
                {(Object.entries(REPORT_TYPE_CONFIG) as [ReportType, typeof REPORT_TYPE_CONFIG.T1][]).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => {
                      setReportType(type);
                      setSelectedCandidates([]);
                    }}
                    className={`p-4 rounded-none border text-left transition-all ${
                      reportType === type
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <config.icon className="w-5 h-5 text-accent" />
                      <span className="font-medium text-text-primary">{config.name}</span>
                    </div>
                    <p className="text-sm text-text-muted">{config.description}</p>
                    <p className="text-xs text-text-muted mt-2">
                      {config.minCandidates}-{config.maxCandidates} candidates
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick select */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-muted">Quick select:</span>
              <Button variant="outline" onClick={() => selectTopCandidates(3)}>
                Top 3
              </Button>
              <Button variant="outline" onClick={() => selectTopCandidates(5)}>
                Top 5
              </Button>
              <Button variant="outline" onClick={() => setSelectedCandidates([])}>
                Clear
              </Button>
            </div>

            {/* Candidate list */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Select Candidates ({selectedCandidates.length}/{REPORT_TYPE_CONFIG[reportType].maxCandidates})
              </label>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {sortedCandidates.map(candidate => (
                  <CandidateCard key={candidate.id} candidate={candidate} />
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                onClick={() => setStep('configure')}
                disabled={!canProceed}
              >
                Next: Configure
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Configure */}
        {step === 'configure' && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-bg-alt rounded-none p-4">
              <div className="flex items-center gap-4 mb-4">
                <FileText className="w-8 h-8 text-accent" />
                <div>
                  <div className="font-medium text-text-primary">
                    {REPORT_TYPE_CONFIG[reportType].name}
                  </div>
                  <div className="text-sm text-text-muted">
                    {selectedCandidates.length} candidates selected
                  </div>
                </div>
              </div>

              {/* Selected candidates preview */}
              <div className="space-y-2">
                {selectedCandidates.map(id => {
                  const candidate = candidates.find(c => c.id === id);
                  if (!candidate) return null;
                  const c = candidate.contact as {
                    first_name?: string;
                    last_name?: string;
                  } | undefined;
                  return (
                    <div key={id} className="flex items-center justify-between text-sm">
                      <span className="text-text-primary">
                        {c?.first_name || ''} {c?.last_name || ''}
                      </span>
                      <Badge variant={(candidate.match_score ?? 0) >= 80 ? 'success' : 'default'}>
                        {candidate.match_score ?? 'N/A'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery options */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Delivery Options
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={deliveryOptions.download}
                    onChange={(e) => setDeliveryOptions(prev => ({ ...prev, download: e.target.checked }))}
                    className="w-4 h-4 rounded border-border"
                  />
                  <Download className="w-4 h-4 text-text-muted" />
                  <span className="text-text-primary">Download PDF</span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={deliveryOptions.email}
                    onChange={(e) => setDeliveryOptions(prev => ({ ...prev, email: e.target.checked }))}
                    className="w-4 h-4 rounded border-border"
                  />
                  <Mail className="w-4 h-4 text-text-muted" />
                  <span className="text-text-primary">Send via Email</span>
                </div>

                {deliveryOptions.email && (
                  <div className="ml-7">
                    <Input
                      placeholder="Enter email addresses (comma-separated)"
                      value={deliveryOptions.emailRecipients}
                      onChange={(e) => setDeliveryOptions(prev => ({ ...prev, emailRecipients: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={deliveryOptions.shareLink}
                    onChange={(e) => setDeliveryOptions(prev => ({ ...prev, shareLink: e.target.checked }))}
                    className="w-4 h-4 rounded border-border"
                  />
                  <Share2 className="w-4 h-4 text-text-muted" />
                  <span className="text-text-primary">Create Share Link</span>
                </div>

                {deliveryOptions.shareLink && (
                  <div className="ml-7 flex items-center gap-3">
                    <span className="text-sm text-text-muted">Expires:</span>
                    <select
                      value={deliveryOptions.shareExpiry}
                      onChange={(e) => setDeliveryOptions(prev => ({ ...prev, shareExpiry: e.target.value }))}
                      className="px-3 py-1 bg-bg border border-border rounded-none text-sm"
                    >
                      <option value="1d">1 day</option>
                      <option value="7d">7 days</option>
                      <option value="30d">30 days</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setStep('select')}>
                <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
                Back
              </Button>
              <Button
                onClick={() => {
                  setStep('generate');
                  handleGenerate();
                }}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-1" />
                )}
                Generate Report
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Generate (loading state) */}
        {step === 'generate' && generating && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
            <p className="text-text-primary font-medium">Generating LENS Report...</p>
            <p className="text-sm text-text-muted mt-2">
              Compiling candidate data and rendering PDF
            </p>
          </div>
        )}

        {/* Step 4: Deliver */}
        {step === 'deliver' && generatedReport && (
          <div className="space-y-6">
            {/* Success message */}
            <div className="flex items-center gap-4 bg-green-500/10 rounded-none p-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <div>
                <div className="font-medium text-green-600">Report Generated Successfully</div>
                <div className="text-sm text-text-muted">
                  {REPORT_TYPE_CONFIG[reportType].name} • {selectedCandidates.length} candidates
                </div>
              </div>
            </div>

            {/* Report preview */}
            <div className="bg-bg-alt rounded-none p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-text-primary">Report Preview</h4>
                <Badge variant="default">{reportType}</Badge>
              </div>

              {/* Preview cards */}
              <div className="grid grid-cols-2 gap-4">
                {generatedReport.candidates.slice(0, 4).map((candidate, i) => (
                  <div key={i} className="bg-bg rounded-none p-3 border border-border">
                    <div className="font-medium text-text-primary">{candidate.name}</div>
                    <div className="text-sm text-text-muted">{candidate.title}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={candidate.match_score >= 80 ? 'success' : 'default'}>
                        Match: {candidate.match_score}
                      </Badge>
                      <Badge variant={candidate.verdict === 'proceed' ? 'success' : 'warning'}>
                        {candidate.verdict}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery actions */}
            <div className="grid grid-cols-3 gap-4">
              {deliveryOptions.download && (
                <Button onClick={handleDownload} className="flex flex-col items-center py-6">
                  <Download className="w-6 h-6 mb-2" />
                  <span>Download PDF</span>
                </Button>
              )}

              {deliveryOptions.email && (
                <Button 
                  onClick={handleSendEmail} 
                  disabled={sendingEmail || !deliveryOptions.emailRecipients}
                  className="flex flex-col items-center py-6"
                >
                  {sendingEmail ? (
                    <Loader2 className="w-6 h-6 mb-2 animate-spin" />
                  ) : (
                    <Mail className="w-6 h-6 mb-2" />
                  )}
                  <span>Send Email</span>
                </Button>
              )}

              {deliveryOptions.shareLink && (
                <Button 
                  onClick={handleCreateShare} 
                  disabled={creatingShare}
                  className="flex flex-col items-center py-6"
                >
                  {creatingShare ? (
                    <Loader2 className="w-6 h-6 mb-2 animate-spin" />
                  ) : (
                    <Share2 className="w-6 h-6 mb-2" />
                  )}
                  <span>Create Share Link</span>
                </Button>
              )}
            </div>

            {/* Share link display */}
            {generatedReport.share_url && (
              <div className="bg-bg-alt rounded-none p-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Share Link
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={generatedReport.share_url}
                    readOnly
                    className="w-full"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedReport.share_url || '');
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Expires: {deliveryOptions.shareExpiry === 'never' ? 'Never' : deliveryOptions.shareExpiry}
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => {
                setStep('select');
                setGeneratedReport(null);
                setSelectedCandidates([]);
              }}>
                Generate Another
              </Button>
              {onClose && (
                <Button onClick={onClose}>
                  Done
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}