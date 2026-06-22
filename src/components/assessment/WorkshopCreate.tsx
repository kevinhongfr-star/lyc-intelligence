import React, { useState } from 'react';
import { 
  ArrowRight, ArrowLeft, Calendar, Clock, Users, MapPin, 
  Send, CheckCircle2, Loader2, AlertCircle, Briefcase
} from 'lucide-react';
import { Badge, Button, Input } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';
import { 
  createWorkshop, 
  addWorkshopParticipants, 
  sendInviteEmails, 
  getMandatesForOrg,
  deductOrgCredits
} from '@/services/supabaseApi';
import type { Mandate } from '@/services/supabaseApi';

type Step = 'details' | 'participants' | 'review';

interface WorkshopDetails {
  title: string;
  assessment_type: 'PRISM' | 'FORGE' | 'SPARK' | 'BRIDGE' | 'MOSAIC';
  mandate_id?: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  location: string;
  max_participants: number;
}

interface Participant {
  id: string;
  email: string;
  name: string;
}

export function WorkshopCreate() {
  const { profile } = useAuthStore();
  const [step, setStep] = useState<Step>('details');
  const [workshopDetails, setWorkshopDetails] = useState<WorkshopDetails>({
    title: '',
    assessment_type: 'PRISM',
    duration_minutes: 60,
    scheduled_date: '',
    scheduled_time: '',
    location: '',
    max_participants: 15,
  });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [emailsText, setEmailsText] = useState('');
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

const ASSESSMENT_TYPES: Array<{ id: 'PRISM' | 'FORGE' | 'SPARK' | 'BRIDGE' | 'MOSAIC'; name: string; description: string; participants: string }> = [
    { id: 'PRISM', name: 'PRISM', description: 'Brand Strategy Workshop', participants: '5-15' },
    { id: 'FORGE', name: 'FORGE', description: 'Sales Leadership Alignment', participants: '5-20' },
    { id: 'SPARK', name: 'SPARK', description: 'AI Literacy Workshop', participants: '10-30' },
    { id: 'BRIDGE', name: 'BRIDGE', description: 'HQ Alignment', participants: '5-15' },
    { id: 'MOSAIC', name: 'MOSAIC', description: 'Cross-Cultural Simulation', participants: '5-20' },
  ];

  const handleAddParticipants = () => {
    const emails = emailsText.split(/[,\n]+/).map(e => e.trim()).filter(e => e);
    const newParticipants: Participant[] = emails.map(email => ({
      id: Math.random().toString(36).substr(2, 9),
      email,
      name: '',
    }));
    setParticipants(prev => [...prev, ...newParticipants]);
    setEmailsText('');
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const handleLaunch = async () => {
    if (!profile?.organization_id || !profile?.id) return;

    setLoading(true);
    setError(null);

    try {
      const orgId = profile.organization_id;
      
      const scheduledDateTime = new Date(`${workshopDetails.scheduled_date}T${workshopDetails.scheduled_time}`).toISOString();

      const workshop = await createWorkshop({
        organization_id: orgId,
        title: workshopDetails.title,
        assessment_type: workshopDetails.assessment_type,
        mandate_id: workshopDetails.mandate_id || null,
        scheduled_date: scheduledDateTime,
        duration_minutes: workshopDetails.duration_minutes,
        location: workshopDetails.location || null,
        max_participants: workshopDetails.max_participants,
        created_by: profile.id,
      });

      if (!workshop) {
        throw new Error('Failed to create workshop');
      }

      const participantData = participants.map(p => ({
        email: p.email,
        name: p.name || '',
      }));

      await addWorkshopParticipants(workshop.id, participantData);

      await sendInviteEmails(workshop.id);

      const creditSuccess = await deductOrgCredits(orgId, 5, `Advisory assessment: ${workshopDetails.assessment_type}`);
      if (!creditSuccess) {
        throw new Error('Failed to deduct credits');
      }

      setSuccess(true);
    } catch (err) {
      console.error('Launch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to launch workshop');
    } finally {
      setLoading(false);
    }
  };

  const currentAssessment = ASSESSMENT_TYPES.find(a => a.id === workshopDetails.assessment_type);
  const creditsRequired = 5;

  if (success) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Workshop Launched!</h2>
        <p className="text-text-muted mb-6">
          Invitations have been sent to {participants.length} participants.
        </p>
        <button
          onClick={() => {
            setStep('details');
            setSuccess(false);
            setWorkshopDetails({
              title: '',
              assessment_type: 'PRISM',
              duration_minutes: 60,
              scheduled_date: '',
              scheduled_time: '',
              location: '',
              max_participants: 15,
            });
            setParticipants([]);
          }}
          className="px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90"
        >
          Create Another Workshop
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-text-primary mb-2">Create Workshop</h1>
        <p className="text-text-muted">Set up an advisory assessment session for your team</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[
          { id: 'details', label: 'Details' },
          { id: 'participants', label: 'Participants' },
          { id: 'review', label: 'Review' },
        ].map((s, index) => (
          <div key={s.id} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
              step === s.id 
                ? 'bg-accent text-white' 
                : step > s.id 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-bg-tertiary text-text-muted'
            }`}>
              {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              step === s.id ? 'text-text-primary' : 'text-text-muted'
            }`}>
              {s.label}
            </span>
            {index < 2 && (
              <div className={`w-12 h-0.5 mx-4 ${
                step > s.id ? 'bg-green-500' : 'bg-bg-tertiary'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="bg-bg-secondary rounded-xl p-6">
        {/* Step 1: Details */}
        {step === 'details' && (
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Workshop Title *</label>
              <Input
                value={workshopDetails.title}
                onChange={(e) => setWorkshopDetails(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Q3 Leadership Development Workshop"
                className="w-full"
              />
            </div>

            {/* Assessment Type */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Assessment Type *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ASSESSMENT_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setWorkshopDetails(prev => ({ ...prev, assessment_type: type.id }))}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      workshopDetails.assessment_type === type.id
                        ? 'border-accent bg-accent/5'
                        : 'border-bg-tertiary hover:border-accent/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-text-primary">{type.name}</span>
                      <Badge variant="default" className="text-xs">{type.participants} participants</Badge>
                    </div>
                    <p className="text-sm text-text-muted">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Linked Mandate */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <Briefcase className="w-4 h-4 inline mr-1" />
                Linked Mandate (optional)
              </label>
              <select
                value={workshopDetails.mandate_id || ''}
                onChange={(e) => setWorkshopDetails(prev => ({ ...prev, mandate_id: e.target.value || undefined }))}
                className="w-full px-4 py-2 bg-white border border-bg-tertiary rounded-lg focus:outline-none focus:border-accent"
              >
                <option value="">Select a mandate...</option>
                {mandates.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date *
                </label>
                <Input
                  type="date"
                  value={workshopDetails.scheduled_date}
                  onChange={(e) => setWorkshopDetails(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Time *
                </label>
                <Input
                  type="time"
                  value={workshopDetails.scheduled_time}
                  onChange={(e) => setWorkshopDetails(prev => ({ ...prev, scheduled_time: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Duration (minutes)
              </label>
              <Input
                type="number"
                value={workshopDetails.duration_minutes}
                onChange={(e) => setWorkshopDetails(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
                className="w-full max-w-xs"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location / Virtual Link
              </label>
              <Input
                value={workshopDetails.location}
                onChange={(e) => setWorkshopDetails(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Zoom link, office address, etc."
                className="w-full"
              />
            </div>

            {/* Max Participants */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Maximum Participants
              </label>
              <Input
                type="number"
                value={workshopDetails.max_participants}
                onChange={(e) => setWorkshopDetails(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 15 }))}
                className="w-full max-w-xs"
              />
            </div>
          </div>
        )}

        {/* Step 2: Participants */}
        {step === 'participants' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Invite Participants
              </label>
              <p className="text-sm text-text-muted mb-3">
                Enter email addresses (one per line or comma-separated)
              </p>
              <textarea
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
                placeholder="john@example.com, jane@company.org&#10;bob@workplace.com"
                className="w-full px-4 py-3 border border-bg-tertiary rounded-lg focus:outline-none focus:border-accent resize-none"
                rows={4}
              />
              <Button
                onClick={handleAddParticipants}
                className="mt-3"
                disabled={!emailsText.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                Add Participants
              </Button>
            </div>

            {/* Participants List */}
            {participants.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-3">
                  {participants.length} Participant{participants.length !== 1 ? 's' : ''}
                </h3>
                <div className="space-y-2">
                  {participants.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-bg-tertiary">
                      <div>
                        <p className="font-medium text-text-primary">{p.email}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveParticipant(p.id)}
                        className="text-text-muted hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-bg-tertiary">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Workshop Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-muted">Title</span>
                  <span className="font-medium text-text-primary">{workshopDetails.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Assessment Type</span>
                  <span className="font-medium text-text-primary">{currentAssessment?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Date & Time</span>
                  <span className="font-medium text-text-primary">
                    {new Date(`${workshopDetails.scheduled_date}T${workshopDetails.scheduled_time}`).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Duration</span>
                  <span className="font-medium text-text-primary">{workshopDetails.duration_minutes} minutes</span>
                </div>
                {workshopDetails.location && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Location</span>
                    <span className="font-medium text-text-primary">{workshopDetails.location}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-muted">Max Participants</span>
                  <span className="font-medium text-text-primary">{workshopDetails.max_participants}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-bg-tertiary">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Participants</h3>
              <div className="flex flex-wrap gap-2">
                {participants.map(p => (
                  <Badge key={p.id} variant="default" className="text-sm">{p.email}</Badge>
                ))}
              </div>
              <p className="text-sm text-text-muted mt-3">{participants.length} participant{participants.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Credit Charge</p>
                  <p className="text-sm text-amber-700">
                    Launching this workshop will deduct {creditsRequired} credits from your organization's balance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setStep(step === 'details' ? 'details' : step === 'participants' ? 'details' : 'participants')}
          disabled={step === 'details'}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {step !== 'review' ? (
          <Button
            onClick={() => setStep(step === 'details' ? 'participants' : 'review')}
            disabled={
              step === 'details' && (!workshopDetails.title || !workshopDetails.scheduled_date || !workshopDetails.scheduled_time) ||
              step === 'participants' && participants.length === 0
            }
            className="flex items-center gap-2"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleLaunch}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Launch Workshop
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default WorkshopCreate;