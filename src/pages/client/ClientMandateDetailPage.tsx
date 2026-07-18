/**
 * ClientMandateDetailPage — Client Portal mandate detail view
 * Issue #13: Client Portal v2
 *
 * 4 tabs: Overview, Shortlist, Interviews, Collaboration
 * Shows mandate progress, candidate shortlist with feedback,
 * interview scheduling, and consultant communication.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  Target,
  TrendingUp,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  Building2,
  MapPin,
  Briefcase,
  ChevronRight,
  Star,
  HelpCircle,
  User,
  FileText,
  Video,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import { Avatar } from '@/components/ui/Avatar';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type FeedbackType = 'interested' | 'not_interested' | 'need_more_info' | 'hold';

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
}

interface ShortlistCandidate {
  contact_id: string;
  status: string;
  stage: string;
  priority: string | null;
  notes: string | null;
  market_position: string | null;
  created_at: string;
  candidate: {
    id: string;
    name: string;
    current_title: string;
    company_id: string | null;
    city: string | null;
    country: string | null;
    linkedin_url: string | null;
    summary: string | null;
  } | null;
  feedback: {
    feedback_type: FeedbackType;
    reason: string | null;
    additional_info: string | null;
    status: string;
    created_at: string;
  } | null;
}

interface Interview {
  id: string;
  interview_type: string;
  status: string;
  scheduled_at: string;
  location: string | null;
  interviewer: string | null;
  notes: string | null;
  candidate: { id: string; name: string; current_title: string } | null;
}

interface MandateDetail {
  id: string;
  title: string;
  status: string;
  client_summary: string;
  department: string;
  seniority_level: string;
  location: string;
  target_close_date: string | null;
  created_at: string;
  updated_at: string;
  candidate_count: number;
  stage_distribution: Record<string, number>;
  timeline: TimelineEvent[];
}

const FEEDBACK_META: Record<
  FeedbackType,
  { label: string; variant: 'success' | 'danger' | 'warning' | 'default' }
> = {
  interested: { label: 'Interested', variant: 'success' },
  not_interested: { label: 'Not Interested', variant: 'danger' },
  'need_more_info': { label: 'Need More Info', variant: 'warning' },
  hold: { label: 'Hold', variant: 'default' },
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function ClientMandateDetailPage() {
  const { id: mandateId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [mandate, setMandate] = useState<MandateDetail | null>(null);
  const [shortlist, setShortlist] = useState<ShortlistCandidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const loadAll = useCallback(async () => {
    if (!mandateId) return;
    setLoading(true);
    setError(null);
    try {
      const [mRes, sRes, iRes, cRes] = await Promise.all([
        fetch(`/api/client-portal/mandates/${mandateId}`, { credentials: 'include' }),
        fetch(`/api/client-portal/mandates/${mandateId}/shortlist`, { credentials: 'include' }),
        fetch(`/api/client-portal/mandates/${mandateId}/interviews`, { credentials: 'include' }),
        fetch(`/api/client-portal/collaboration/${mandateId}`, { credentials: 'include' }),
      ]);

      if (!mRes.ok) throw new Error('Failed to load mandate');
      const mJson = await mRes.json();
      setMandate(mJson.data);

      const sJson = sRes.ok ? await sRes.json() : { data: [] };
      setShortlist(sJson.data || []);

      const iJson = iRes.ok ? await iRes.json() : { data: [] };
      setInterviews(iJson.data || []);

      const cJson = cRes.ok ? await cRes.json() : { data: [] };
      setMessages(cJson.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [mandateId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSubmitFeedback = async (contactId: string, feedbackType: FeedbackType, reason?: string) => {
    if (!mandateId) return;
    try {
      const res = await fetch(`/api/client-portal/mandates/${mandateId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          contact_id: contactId,
          feedback_type: feedbackType,
          additional_info: reason,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit feedback');
      // Refresh shortlist
      const sRes = await fetch(`/api/client-portal/mandates/${mandateId}/shortlist`, {
        credentials: 'include',
      });
      if (sRes.ok) {
        const sJson = await sRes.json();
        setShortlist(sJson.data || []);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSendMessage = async () => {
    if (!mandateId || !newMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/client-portal/collaboration/${mandateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject: 'Client message', message: newMessage }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      setNewMessage('');
      // Reload messages
      const cRes = await fetch(`/api/client-portal/collaboration/${mandateId}`, {
        credentials: 'include',
      });
      if (cRes.ok) {
        const cJson = await cRes.json();
        setMessages(cJson.data || []);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#6B6B6B]" />
      </div>
    );
  }

  if (error || !mandate) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="mt-6 text-center text-[#C0392B] flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error || 'Mandate not found'}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  const progressPct = mandate.candidate_count > 0 ? Math.min(100, Math.round((mandate.candidate_count / 10) * 100)) : 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <button
            onClick={() => navigate(-1)}
            className="text-[13px] text-[#6B6B6B] hover:text-[#1A1A1A] flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Mandates
          </button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[24px] font-serif text-[#1A1A1A]">{mandate.title}</h1>
                <Badge variant={mandate.status === 'active' ? 'success' : 'default'}>
                  {mandate.status === 'active' ? 'Active' : mandate.status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-[13px] text-[#6B6B6B]">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {mandate.department || '—'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  {mandate.seniority_level || '—'}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {mandate.location || '—'}
                </span>
                {mandate.target_close_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Target: {new Date(mandate.target_close_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <StatMini label="Candidates" value={mandate.candidate_count} />
              <StatMini label="Interviews" value={interviews.length} />
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-[12px] text-[#6B6B6B] mb-1.5">
              <span>Search Progress</span>
              <span>{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="shortlist">
              Shortlist <span className="ml-1 text-[#9B9B9B]">({shortlist.length})</span>
            </TabsTrigger>
            <TabsTrigger value="interviews">
              Interviews <span className="ml-1 text-[#9B9B9B]">({interviews.length})</span>
            </TabsTrigger>
            <TabsTrigger value="collaboration">
              Collaboration <span className="ml-1 text-[#9B9B9B]">({messages.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* ── Overview ── */}
          <TabsContent value="overview">
            <div className="grid lg:grid-cols-3 gap-6 mt-4">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About this Role</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {mandate.client_summary ? (
                      <p className="text-[14px] text-[#4A4A4A] leading-relaxed whitespace-pre-wrap">
                        {mandate.client_summary}
                      </p>
                    ) : (
                      <p className="text-[13px] text-[#9B9B9B]">
                        No summary provided yet.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {mandate.timeline.length === 0 ? (
                      <p className="text-[13px] text-[#9B9B9B]">No timeline events yet.</p>
                    ) : (
                      <div className="space-y-0">
                        {mandate.timeline.map((event, idx) => (
                          <TimelineItem key={event.id} event={event} isLast={idx === mandate.timeline.length - 1} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pipeline Stages</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {Object.entries(mandate.stage_distribution || {}).length === 0 ? (
                      <p className="text-[13px] text-[#9B9B9B]">No candidates in pipeline yet.</p>
                    ) : (
                      Object.entries(mandate.stage_distribution).map(([stage, count]) => (
                        <div key={stage} className="flex items-center justify-between text-[13px]">
                          <span className="text-[#6B6B6B] capitalize">
                            {stage.replace(/_/g, ' ').replace(/^S\d+_/, '')}
                          </span>
                          <span className="font-medium text-[#1A1A1A]">{count}</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Key Dates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-[#6B6B6B]">Engagement Started</span>
                      <span className="text-[#1A1A1A]">
                        {new Date(mandate.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {mandate.target_close_date && (
                      <div className="flex justify-between">
                        <span className="text-[#6B6B6B]">Target Close</span>
                        <span className="text-[#1A1A1A]">
                          {new Date(mandate.target_close_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#6B6B6B]">Last Update</span>
                      <span className="text-[#1A1A1A]">
                        {new Date(mandate.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ── Shortlist ── */}
          <TabsContent value="shortlist">
            <div className="mt-4 space-y-3">
              {shortlist.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="h-8 w-8 mx-auto mb-3 text-[#9B9B9B]" />
                    <p className="text-[14px] text-[#6B6B6B]">
                      No candidates shared yet. Our team is actively sourcing for this role.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                shortlist.map((item) => (
                  <ShortlistCard
                    key={item.contact_id}
                    item={item}
                    onFeedback={(type, reason) => handleSubmitFeedback(item.contact_id, type, reason)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          {/* ── Interviews ── */}
          <TabsContent value="interviews">
            <div className="mt-4 space-y-3">
              {interviews.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-3 text-[#9B9B9B]" />
                    <p className="text-[14px] text-[#6B6B6B]">
                      No interviews scheduled yet. Request an interview from the shortlist tab.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                interviews.map((interview) => (
                  <InterviewCard key={interview.id} interview={interview} />
                ))
              )}
            </div>
          </TabsContent>

          {/* ── Collaboration ── */}
          <TabsContent value="collaboration">
            <div className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Consultant Communication</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-[#9B9B9B]">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-[13px]">No messages yet. Start the conversation below.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {messages.map((msg) => (
                          <MessageBubble key={msg.id} message={msg} />
                        ))}
                      </div>
                    )}

                    <div className="flex items-end gap-2 pt-3 border-t border-[#E5E5E5]">
                      <div className="flex-1">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Message your consultant..."
                          rows={2}
                          className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                      </div>
                      <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function StatMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-[20px] font-serif text-[#1A1A1A]">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-[#9B9B9B]">{label}</div>
    </div>
  );
}

function TimelineItem({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const date = new Date(event.timestamp);
  return (
    <div className="relative pl-6 pb-4">
      {!isLast && (
        <div className="absolute left-[7px] top-4 bottom-0 w-px bg-[#E5E5E5]" />
      )}
      <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-[#1A1A1A] bg-white" />
      <div>
        <div className="flex items-center gap-2">
          <h4 className="text-[14px] font-medium text-[#1A1A1A]">{event.title}</h4>
        </div>
        <p className="text-[13px] text-[#6B6B6B] mt-0.5">{event.description}</p>
        <p className="text-[11px] text-[#9B9B9B] mt-1">
          {date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function ShortlistCard({
  item,
  onFeedback,
}: {
  item: ShortlistCandidate;
  onFeedback: (type: FeedbackType, reason?: string) => void;
}) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState('');
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);

  const handleSubmit = () => {
    if (selectedType) {
      onFeedback(selectedType, feedbackReason || undefined);
      setShowFeedback(false);
      setSelectedType(null);
      setFeedbackReason('');
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar
            id={item.candidate?.id || item.contact_id}
            name={item.candidate?.name || 'Candidate'}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[15px] font-medium text-[#1A1A1A]">
                {item.candidate?.name || 'Candidate'}
              </h3>
              {item.feedback && (
                <Badge variant={FEEDBACK_META[item.feedback.feedback_type].variant}>
                  {FEEDBACK_META[item.feedback.feedback_type].label}
                </Badge>
              )}
              {item.priority === 'high' && (
                <Badge variant="warning">High Priority</Badge>
              )}
            </div>
            <p className="text-[13px] text-[#6B6B6B] mt-0.5">
              {item.candidate?.current_title || '—'}
              {item.candidate?.city && <> · {item.candidate.city}</>}
            </p>
            {item.notes && (
              <p className="text-[12px] text-[#9B9B9B] mt-1 line-clamp-2">{item.notes}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-[#9B9B9B] uppercase tracking-wide">
                Stage: {item.stage || item.status || '—'}
              </span>
              {item.market_position && (
                <span className="text-[11px] text-[#9B9B9B]">· {item.market_position}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!showFeedback ? (
              <Button size="sm" variant="outline" onClick={() => setShowFeedback(true)}>
                {item.feedback ? 'Update Feedback' : 'Give Feedback'}
              </Button>
            ) : (
              <div className="text-right">
                <div className="flex flex-wrap gap-1 justify-end mb-2">
                  {(['interested', 'not_interested', 'need_more_info', 'hold'] as FeedbackType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedType(t)}
                      className={`px-2 py-1 text-[11px] rounded-md font-medium transition-colors ${
                        selectedType === t
                          ? 'bg-[#1A1A1A] text-white'
                          : 'bg-[#F0F0F0] text-[#6B6B6B] hover:bg-[#E5E5E5]'
                      }`}
                    >
                      {FEEDBACK_META[t].label}
                    </button>
                  ))}
                </div>
                {selectedType && (
                  <div className="flex gap-1 items-center">
                    <Input
                      value={feedbackReason}
                      onChange={(e: any) => setFeedbackReason(e.target.value)}
                      placeholder="Reason (optional)"
                      className="text-[12px] py-1 h-8"
                    />
                    <Button size="sm" onClick={handleSubmit}>Submit</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowFeedback(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InterviewCard({ interview }: { interview: Interview }) {
  const date = new Date(interview.scheduled_at);
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#F0F0F0] flex items-center justify-center flex-shrink-0">
            <Video className="h-5 w-5 text-[#6B6B6B]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-medium text-[#1A1A1A]">
                {interview.interview_type || 'Interview'}
              </h3>
              <Badge variant={interview.status === 'scheduled' ? 'success' : 'default'}>
                {interview.status}
              </Badge>
            </div>
            {interview.candidate && (
              <p className="text-[13px] text-[#6B6B6B] mt-0.5">
                with {interview.candidate.name} · {interview.candidate.current_title}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1 text-[12px] text-[#9B9B9B]">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {interview.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {interview.location}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MessageBubble({ message }: { message: any }) {
  const isClient = message.direction === 'client_to_consultant' || message.type === 'feedback';
  return (
    <div className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isClient
            ? 'bg-[#1A1A1A] text-white rounded-br-md'
            : 'bg-[#F0F0F0] text-[#1A1A1A] rounded-bl-md'
        }`}
      >
        <p className="text-[13px] leading-relaxed">{message.body || message.message || message.subject}</p>
        <p className={`text-[10px] mt-1 ${isClient ? 'text-white/50' : 'text-[#9B9B9B]'}`}>
          {new Date(message.timestamp || message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
