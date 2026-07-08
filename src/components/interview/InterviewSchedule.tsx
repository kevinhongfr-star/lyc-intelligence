import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, MapPin, Link2, Users, Mail, Send, ChevronDown, Check, X } from 'lucide-react';
import { scheduleInterview, getPanelists, getMandateCandidates } from '@/services/supabaseApi';
import { ScheduleInterviewParams, InterviewPanelist } from '@/services/supabaseApi';

const DS = {
  accent: '#C108AB',
  bg: '#FFFFFF',
  bgAlt: '#F5F5F5',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
};

export interface InterviewScheduleProps {
  mandateId: string;
  onSchedule?: () => void;
  onCancel?: () => void;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  stage: string;
}

export function InterviewSchedule({ mandateId, onSchedule, onCancel }: InterviewScheduleProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [panelists, setPanelists] = useState<InterviewPanelist[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [round, setRound] = useState<number>(1);
  const [interviewDate, setInterviewDate] = useState<string>('');
  const [interviewTime, setInterviewTime] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [location, setLocation] = useState<string>('');
  const [meetingLink, setMeetingLink] = useState<string>('');
  const [selectedPanelists, setSelectedPanelists] = useState<InterviewPanelist[]>([]);
  const [sendInvite, setSendInvite] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  const [showCandidateDropdown, setShowCandidateDropdown] = useState(false);
  const [showPanelDropdown, setShowPanelDropdown] = useState(false);
  const [showRoundDropdown, setShowRoundDropdown] = useState(false);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [candidatesRes, panelistsRes] = await Promise.all([
          getMandateCandidates(mandateId),
          getPanelists(),
        ]);
        setCandidates(candidatesRes);
        setPanelists(panelistsRes);
      } catch (e) {
        console.error('[InterviewSchedule] fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mandateId]);

  useEffect(() => {
    const candidate = candidates.find(c => c.id === selectedCandidate);
    if (candidate) {
      const stageRoundMap: Record<string, number> = {
        interview_1: 1,
        interview_2: 2,
        interview_3: 3,
        final_interview: 4,
      };
      const suggestedRound = stageRoundMap[candidate.stage] || 1;
      if (suggestedRound > round) {
        setRound(suggestedRound);
      }
    }
  }, [selectedCandidate, candidates]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!selectedCandidate) newErrors.candidate = 'Please select a candidate';
    if (!interviewDate) newErrors.date = 'Please select a date';
    if (!interviewTime) newErrors.time = 'Please select a time';
    if (selectedPanelists.length === 0) newErrors.panel = 'Please select at least one panel member';
    if (round < 1 || round > 5) newErrors.round = 'Round must be between 1-5';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedCandidate, interviewDate, interviewTime, selectedPanelists, round]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const params: ScheduleInterviewParams = {
        candidate_id: selectedCandidate,
        mandate_id: mandateId,
        round,
        interview_date: `${interviewDate}T${interviewTime}:00`,
        duration_minutes: durationMinutes,
        location,
        meeting_link: meetingLink,
        panel_members: selectedPanelists,
        send_invite: sendInvite,
        notes,
      };

      const result = await scheduleInterview(params);
      if (result.success && onSchedule) {
        onSchedule();
      }
    } catch (e) {
      console.error('[InterviewSchedule] submit error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const togglePanelist = (panelist: InterviewPanelist) => {
    setSelectedPanelists(prev => {
      const exists = prev.find(p => p.id === panelist.id);
      if (exists) {
        return prev.filter(p => p.id !== panelist.id);
      }
      return [...prev, panelist];
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  const selectedCandidateData = candidates.find(c => c.id === selectedCandidate);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: DS.accent, fontSize: '16px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px' }}>
      <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: DS.text }}>
        Schedule Interview
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Candidate Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: DS.text }}>
            Candidate
          </label>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowCandidateDropdown(!showCandidateDropdown)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: DS.bgAlt,
                border: `1px solid ${errors.candidate ? '#EF4444' : DS.cardBorder}`,
                borderRadius: '0px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '14px',
              }}
            >
              <span style={{ color: selectedCandidateData ? DS.text : DS.muted }}>
                {selectedCandidateData ? selectedCandidateData.name : 'Select a candidate'}
              </span>
              <ChevronDown style={{ width: 16, height: 16, color: DS.muted }} />
            </button>
            {showCandidateDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                background: DS.card,
                border: `1px solid ${DS.cardBorder}`,
                borderRadius: '0px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                zIndex: 10,
                maxHeight: '240px',
                overflowY: 'auto',
              }}>
                {candidates.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCandidate(c.id);
                      setShowCandidateDropdown(false);
                    }}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${DS.cardBorder}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = `${DS.accent}05`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: DS.text }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: DS.muted }}>{c.email}</div>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: '#E5E7EB',
                      color: DS.textSecondary,
                    }}>
                      {c.stage.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {errors.candidate && (
              <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.candidate}</div>
            )}
          </div>
        </div>

        {/* Round Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: DS.text }}>
            Interview Round
          </label>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowRoundDropdown(!showRoundDropdown)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: DS.bgAlt,
                border: `1px solid ${errors.round ? '#EF4444' : DS.cardBorder}`,
                borderRadius: '0px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '14px',
              }}
            >
              <span style={{ color: DS.text }}>Round {round}</span>
              <ChevronDown style={{ width: 16, height: 16, color: DS.muted }} />
            </button>
            {showRoundDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                background: DS.card,
                border: `1px solid ${DS.cardBorder}`,
                borderRadius: '0px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                zIndex: 10,
              }}>
                {[1, 2, 3, 4, 5].map(r => (
                  <div
                    key={r}
                    onClick={() => {
                      setRound(r);
                      setShowRoundDropdown(false);
                    }}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: r < 5 ? `1px solid ${DS.cardBorder}` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = `${DS.accent}05`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <span style={{ fontWeight: round === r ? 600 : 400, fontSize: '14px', color: DS.text }}>
                      Round {r}
                    </span>
                    {round === r && <Check style={{ width: 16, height: 16, color: DS.accent }} />}
                  </div>
                ))}
              </div>
            )}
            {errors.round && (
              <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.round}</div>
            )}
          </div>
        </div>

        {/* Date and Time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: DS.text }}>
              Date <Calendar style={{ width: 14, height: 14, display: 'inline-block', marginLeft: '4px' }} />
            </label>
            <input
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: DS.bgAlt,
                border: `1px solid ${errors.date ? '#EF4444' : DS.cardBorder}`,
                borderRadius: '0px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
            {errors.date && (
              <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.date}</div>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: DS.text }}>
              Time <Clock style={{ width: 14, height: 14, display: 'inline-block', marginLeft: '4px' }} />
            </label>
            <input
              type="time"
              value={interviewTime}
              onChange={(e) => setInterviewTime(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: DS.bgAlt,
                border: `1px solid ${errors.time ? '#EF4444' : DS.cardBorder}`,
                borderRadius: '0px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
            {errors.time && (
              <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.time}</div>
            )}
          </div>
        </div>

        {/* Duration */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: DS.text }}>
            Duration (minutes)
          </label>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowDurationDropdown(!showDurationDropdown)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: DS.bgAlt,
                border: `1px solid ${DS.cardBorder}`,
                borderRadius: '0px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '14px',
              }}
            >
              <span style={{ color: DS.text }}>{durationMinutes} minutes</span>
              <ChevronDown style={{ width: 16, height: 16, color: DS.muted }} />
            </button>
            {showDurationDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                background: DS.card,
                border: `1px solid ${DS.cardBorder}`,
                borderRadius: '0px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                zIndex: 10,
              }}>
                {[30, 45, 60, 90, 120].map(d => (
                  <div
                    key={d}
                    onClick={() => {
                      setDurationMinutes(d);
                      setShowDurationDropdown(false);
                    }}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: d < 120 ? `1px solid ${DS.cardBorder}` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = `${DS.accent}05`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <span style={{ fontWeight: durationMinutes === d ? 600 : 400, fontSize: '14px', color: DS.text }}>
                      {d} minutes
                    </span>
                    {durationMinutes === d && <Check style={{ width: 16, height: 16, color: DS.accent }} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: DS.text }}>
            Location <MapPin style={{ width: 14, height: 14, display: 'inline-block', marginLeft: '4px' }} />
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Physical address or location description"
            style={{
              width: '100%',
              padding: '12px 16px',
              background: DS.bgAlt,
              border: `1px solid ${DS.cardBorder}`,
              borderRadius: '0px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Meeting Link */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: DS.text }}>
            Meeting Link <Link2 style={{ width: 14, height: 14, display: 'inline-block', marginLeft: '4px' }} />
          </label>
          <input
            type="url"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            placeholder="Zoom/Teams/Meet URL"
            style={{
              width: '100%',
              padding: '12px 16px',
              background: DS.bgAlt,
              border: `1px solid ${DS.cardBorder}`,
              borderRadius: '0px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Panel Members */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: DS.text }}>
            Panel Members <Users style={{ width: 14, height: 14, display: 'inline-block', marginLeft: '4px' }} />
          </label>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowPanelDropdown(!showPanelDropdown)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: DS.bgAlt,
                border: `1px solid ${errors.panel ? '#EF4444' : DS.cardBorder}`,
                borderRadius: '0px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '14px',
              }}
            >
              <span style={{ color: selectedPanelists.length > 0 ? DS.text : DS.muted }}>
                {selectedPanelists.length > 0
                  ? `${selectedPanelists.length} panel member${selectedPanelists.length > 1 ? 's' : ''} selected`
                  : 'Select panel members'}
              </span>
              <ChevronDown style={{ width: 16, height: 16, color: DS.muted }} />
            </button>
            {showPanelDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                background: DS.card,
                border: `1px solid ${DS.cardBorder}`,
                borderRadius: '0px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                zIndex: 10,
                maxHeight: '240px',
                overflowY: 'auto',
              }}>
                {panelists.map(p => {
                  const isSelected = selectedPanelists.find(sp => sp.id === p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => togglePanelist(p)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: `1px solid ${DS.cardBorder}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = `${DS.accent}05`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: DS.text }}>{p.name}</div>
                        <div style={{ fontSize: '12px', color: DS.muted }}>{p.email}</div>
                      </div>
                      {isSelected && <Check style={{ width: 16, height: 16, color: DS.accent }} />}
                    </div>
                  );
                })}
              </div>
            )}
            {errors.panel && (
              <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.panel}</div>
            )}
            {selectedPanelists.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                {selectedPanelists.map(p => (
                  <span
                    key={p.id}
                    style={{
                      padding: '4px 12px',
                      background: `${DS.accent}10`,
                      color: DS.accent,
                      borderRadius: '20px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {p.name}
                    <button
                      type="button"
                      onClick={() => togglePanelist(p)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Send Invite Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          background: DS.bgAlt,
          borderRadius: '0px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Mail style={{ width: 20, height: 20, color: DS.accent }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: DS.text }}>Send Email Invite</div>
              <div style={{ fontSize: '12px', color: DS.muted }}>Send invitation to candidate</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSendInvite(!sendInvite)}
            style={{
              width: '48px',
              height: '28px',
              borderRadius: '14px',
              background: sendInvite ? DS.accent : DS.cardBorder,
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                background: 'white',
                borderRadius: '50%',
                position: 'absolute',
                top: '2px',
                left: sendInvite ? '22px' : '2px',
                transition: 'left 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            />
          </button>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: DS.text }}>
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes (optional)"
            rows={3}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: DS.bgAlt,
              border: `1px solid ${DS.cardBorder}`,
              borderRadius: '0px',
              fontSize: '14px',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Preview */}
        {sendInvite && selectedCandidateData && interviewDate && interviewTime && (
          <div style={{
            background: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: '0px',
            padding: '16px',
            marginBottom: '24px',
          }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#92400E', marginBottom: '12px' }}>
              Email Invite Preview
            </div>
            <div style={{ fontSize: '13px', color: '#78350F', lineHeight: '1.6' }}>
              <div><strong>Subject:</strong> Interview Invitation</div>
              <div style={{ marginTop: '8px' }}>
                Hi {selectedCandidateData.name},
              </div>
              <div style={{ marginTop: '8px' }}>
                You're invited to interview for the position.
              </div>
              <div style={{ marginTop: '8px' }}>
                <strong>Date:</strong> {formatDate(interviewDate)}<br />
                <strong>Time:</strong> {formatTime(interviewTime)}<br />
                <strong>Duration:</strong> {durationMinutes} minutes<br />
                {location && <><strong>Location:</strong> {location}<br /></>}
                {meetingLink && <><strong>Link:</strong> {meetingLink}</>}
              </div>
              <div style={{ marginTop: '8px' }}>
                Panel: {selectedPanelists.map(p => p.name).join(', ')}
              </div>
              <div style={{ marginTop: '12px' }}>
                Please confirm your availability by replying to this email.
              </div>
              <div style={{ marginTop: '12px' }}>
                Best,<br />
                Your DEX AI Team
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px 24px',
              background: DS.bgAlt,
              border: `1px solid ${DS.cardBorder}`,
              borderRadius: '0px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              color: DS.textSecondary,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              flex: 2,
              padding: '12px 24px',
              background: DS.accent,
              border: 'none',
              borderRadius: '0px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {submitting ? 'Scheduling...' : <><Send style={{ width: 16, height: 16 }} /> Schedule Interview</>}
          </button>
        </div>
      </form>
    </div>
  );
}