import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Clock, Users, FileText, Download, AlertCircle,
  CheckCircle, ChevronRight, Building2, Star, Award, TrendingUp,
  Calendar, Bell, LogOut
} from 'lucide-react';
import { Badge, Button, Card, Progress } from '@/components/ui';
import { ClientFeedbackModal } from './ClientFeedbackModal';

interface ClientMandateDashboardProps {
  mandateId: string;
  onBack?: () => void;
}

export function ClientMandateDashboard({ mandateId, onBack }: ClientMandateDashboardProps) {
  const [mandate, setMandate] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  useEffect(() => {
    loadMandate();
  }, [mandateId]);

  async function loadMandate() {
    try {
      const res = await fetch(`/api/client/mandate/${mandateId}`);
      const data = await res.json();
      if (data.success) {
        setMandate(data.mandate);
        setCandidates(data.candidates);
      }
    } catch (err) {
      console.error('Load mandate error:', err);
    } finally {
      setLoading(false);
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'S1_Sourced': return 'bg-blue-500';
      case 'S2_Screened': return 'bg-green-500';
      case 'S12_Presented_to_Client': return 'bg-amber-500';
      case 'S13_Client_Int_Scheduled': return 'bg-purple-500';
      case 'S16_Offer_Extended': return 'bg-indigo-500';
      case 'S19_Closed': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Exceptional Primary':
      case 'Strong': return 'bg-green-100 text-green-700';
      case 'Solid': return 'bg-blue-100 text-blue-700';
      case 'Conditional': return 'bg-yellow-100 text-yellow-700';
      case 'Not Recommended': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A': return 'bg-green-500';
      case 'B': return 'bg-amber-500';
      case 'C': return 'bg-orange-500';
      case 'F': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getFeedbackStatus = (status: string) => {
    switch (status) {
      case 'interested': return { label: 'Interested', color: 'bg-green-100 text-green-700' };
      case 'not_interested': return { label: 'Not Interested', color: 'bg-red-100 text-red-700' };
      case 'need_more_info': return { label: 'Need More Info', color: 'bg-yellow-100 text-yellow-700' };
      case 'hold': return { label: 'On Hold', color: 'bg-gray-100 text-gray-700' };
      default: return null;
    }
  };

  const handleFeedbackClick = (candidate: any) => {
    setSelectedCandidate(candidate);
    setFeedbackModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!mandate) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Mandate not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">LYC Intelligence</h1>
              <p className="text-sm text-gray-500">Client Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <LogOut className="w-4 h-4 mr-1" />
              Log Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Mandates
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{mandate.title}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${mandate.status === 'Active' ? 'bg-green-500' : mandate.status === 'On Hold' ? 'bg-yellow-500' : 'bg-gray-400'}`}></span>
                {mandate.status}
              </span>
              <span><Users className="w-4 h-4 inline mr-1" />{mandate.lead_consultant_name}</span>
              <span><Award className="w-4 h-4 inline mr-1" />Kevin (Executive Sponsor)</span>
              <span><Clock className="w-4 h-4 inline mr-1" />Day {mandate.days_since_kickoff}</span>
            </div>
          </div>
        </div>

        {mandate.client_summary && (
          <Card className="p-4 mb-6 bg-blue-50 border-blue-100">
            <p className="text-gray-700">{mandate.client_summary}</p>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Pipeline Progress
              </h3>
              <div className="flex items-center justify-between gap-4">
                {mandate.pipeline?.stages.map((stage: any) => (
                  <div key={stage.stage} className="flex-1 text-center">
                    <div className="relative mb-2">
                      <div className={`w-full h-16 rounded-none ${getStageColor(stage.stage)} bg-opacity-20 flex items-center justify-center`}>
                        <span className="text-xl font-bold text-gray-800">{stage.count}</span>
                      </div>
                      <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${getStageColor(stage.stage)}`}></div>
                    </div>
                    <div className="text-xs text-gray-600">{stage.label}</div>
                  </div>
                ))}
              </div>
              <div className="text-center text-sm text-gray-500 mt-4">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Candidates Presented
              </h3>
              {candidates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No candidates presented yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {candidates.map((candidate) => {
                    const fbStatus = getFeedbackStatus(candidate.feedback_status);
                    return (
                      <div
                        key={candidate.contact_id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-none hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            {candidate.photo_url ? (
                              <img src={candidate.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <Users className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{candidate.full_name}</div>
                            <div className="text-sm text-gray-500">
                              {candidate.title} at {candidate.company_name}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-sm text-gray-500">Score</div>
                            <div className="font-bold text-gray-800">
                              {candidate.composite_score} <Badge className={getVerdictColor(candidate.verdict_label)}>{candidate.verdict_label}</Badge>
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-sm text-gray-500">Grade</div>
                            <Badge className={`text-lg px-3 ${getGradeColor(candidate.canvas_grade)} text-white font-bold`}>
                              {candidate.canvas_grade}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            {candidate.canvas_pdf_url ? (
                              <Button variant="outline" size="sm" onClick={() => window.open(candidate.canvas_pdf_url, '_blank')}>
                                <Download className="w-4 h-4 mr-1" />
                                View Profile
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" disabled>
                                <FileText className="w-4 h-4 mr-1" />
                                Pending
                              </Button>
                            )}
                          </div>

                          {fbStatus ? (
                            <Badge className={fbStatus.color}>
                              {fbStatus.label}
                            </Badge>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => handleFeedbackClick(candidate)}>
                              <AlertCircle className="w-4 h-4 mr-1" />
                              Give Feedback
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Timeline
              </h3>
              <div className="space-y-4">
                {mandate.timeline?.map((event: any, index: number) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {event.status === 'completed' ? (
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      ) : event.status === 'upcoming' ? (
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white text-xs">!</span>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{event.event}</div>
                      <div className="text-sm text-gray-500">{event.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5" />
                Market Intelligence
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                {mandate.market_intelligence?.summary || 'Market intelligence data will be available here as we build our understanding of your talent landscape.'}
              </p>
              {mandate.market_intelligence?.grid_report_url ? (
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-1" />
                  Download GRID Report
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  <FileText className="w-4 h-4 mr-1" />
                  Report Coming Soon
                </Button>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Search Overview Document
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Interview Calendar
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Meet the Team
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {feedbackModalOpen && selectedCandidate && (
        <ClientFeedbackModal
          candidate={selectedCandidate}
          mandateId={mandateId}
          onClose={() => setFeedbackModalOpen(false)}
          onSubmit={() => {
            setFeedbackModalOpen(false);
            loadMandate();
          }}
        />
      )}
    </div>
  );
}
