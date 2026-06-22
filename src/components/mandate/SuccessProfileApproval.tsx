import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { SuccessProfile, ProfileStatus } from '@/types';
import { approveSuccessProfile, rejectSuccessProfile } from '@/services/supabaseApi';
import { useAuthStore } from '@/stores/authStore';

const badgeStyle = (status: ProfileStatus) => {
  switch (status) {
    case 'approved': return 'bg-emerald-100 text-emerald-800';
    case 'pending_approval': return 'bg-amber-100 text-amber-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-slate-100 text-slate-600';
  }
};

interface Props {
  profile: SuccessProfile;
  mandateTitle: string;
  onApproved?: () => void;
}

export function SuccessProfileApproval({ profile, mandateTitle, onApproved }: Props) {
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [loading, setLoading] = useState(false);
  const { profile: userProfile } = useAuthStore();

  useEffect(() => {
    setApprovalNotes('');
    setRejectionReason('');
    setAction(null);
  }, [profile.id]);

  async function handleApprove() {
    if (!userProfile?.id) return;
    setLoading(true);
    const ok = await approveSuccessProfile(profile.id, userProfile.id, approvalNotes || undefined);
    setLoading(false);
    if (ok) {
      onApproved?.();
    }
  }

  async function handleReject() {
    if (!userProfile?.id || !rejectionReason.trim()) return;
    setLoading(true);
    const ok = await rejectSuccessProfile(profile.id, userProfile.id, rejectionReason);
    setLoading(false);
    if (ok) {
      onApproved?.();
    }
  }

  return (
    <Card className="border-amber-200 bg-amber-50/60">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Success Profile Approval</span>
          <Badge className={badgeStyle(profile.status)}>{profile.status.replace('_', ' ')}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Context info */}
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Mandate:</span>
              <p className="font-medium">{mandateTitle}</p>
            </div>
            <div>
              <span className="text-slate-500">Profile ID:</span>
              <p className="font-mono text-sm">{profile.id.slice(0, 8)}</p>
            </div>
            <div>
              <span className="text-slate-500">Defined by:</span>
              <p>{profile.defined_by || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-slate-500">Created:</span>
              <p>{new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Preview of requirements */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h4 className="font-medium text-sm">Profile Summary</h4>
          </div>
          <div className="p-4 space-y-4">
            {/* Experience */}
            {(profile.required_experience_years || profile.deal_size_range || profile.team_size_managed) && (
              <div>
                <h5 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Experience</h5>
                <div className="flex flex-wrap gap-2">
                  {profile.required_experience_years && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                      {profile.required_experience_years} years exp
                    </span>
                  )}
                  {profile.team_size_managed && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                      Managed {profile.team_size_managed} people
                    </span>
                  )}
                  {profile.deal_size_range && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                      Deal size: {profile.deal_size_range}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Industries & Geographies */}
            {(profile.required_industries?.length || profile.required_geographies?.length) && (
              <div>
                <h5 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Markets</h5>
                <div className="flex flex-wrap gap-2">
                  {profile.required_industries?.map((ind, i) => (
                    <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm">
                      {ind}
                    </span>
                  ))}
                  {profile.required_geographies?.map((geo, i) => (
                    <span key={i} className="px-2 py-1 bg-green-50 text-green-700 rounded text-sm">
                      {geo}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Personality */}
            {(profile.target_disc_profile || profile.personality_indicators?.length) && (
              <div>
                <h5 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Personality</h5>
                <div className="flex flex-wrap gap-2">
                  {profile.target_disc_profile && (
                    <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-sm">
                      DISC: {profile.target_disc_profile}
                    </span>
                  )}
                  {profile.personality_indicators?.slice(0, 3).map((p, i) => (
                    <span key={i} className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-sm">
                      {p.trait} ({p.importance}/5)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Character */}
            {profile.character_requirements?.length && (
              <div>
                <h5 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Character</h5>
                <div className="flex flex-wrap gap-2">
                  {profile.character_requirements.slice(0, 3).map((c, i) => (
                    <span key={i} className={`px-2 py-1 rounded text-sm ${
                      c.level === 'essential' ? 'bg-red-50 text-red-700' : 
                      c.level === 'preferred' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'
                    }`}>
                      {c.trait} ({c.level})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education & Certifications */}
            {(profile.education_requirements?.length || profile.certifications?.length) && (
              <div>
                <h5 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Background</h5>
                <div className="flex flex-wrap gap-2">
                  {profile.education_requirements?.slice(0, 3).map((e, i) => (
                    <span key={i} className={`px-2 py-1 rounded text-sm ${
                      e.required ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'
                    }`}>
                      {e.degree} in {e.field} {e.required && '(req)'}
                    </span>
                  ))}
                  {profile.certifications?.slice(0, 3).map((cert, i) => (
                    <span key={i} className="px-2 py-1 bg-pink-50 text-pink-700 rounded text-sm">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Approval actions */}
        <div className="space-y-4">
          {action === 'approve' && (
            <div className="bg-white rounded-lg p-4 border border-emerald-200">
              <label className="text-sm font-medium text-emerald-800">Approval notes (optional)</label>
              <textarea
                className="w-full mt-2 border border-slate-200 rounded px-3 py-2 text-sm min-h-[80px]"
                placeholder="Add any notes or comments about this approval..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
              />
              <div className="flex gap-2 mt-3">
                <Button onClick={handleApprove} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                  {loading ? 'Approving…' : 'Confirm Approval'}
                </Button>
                <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
              </div>
            </div>
          )}

          {action === 'reject' && (
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <label className="text-sm font-medium text-red-800">Rejection reason (required)</label>
              <textarea
                className="w-full mt-2 border border-slate-200 rounded px-3 py-2 text-sm min-h-[80px]"
                placeholder="Explain why this profile needs revision..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="flex gap-2 mt-3">
                <Button onClick={handleReject} disabled={loading || !rejectionReason.trim()} className="bg-red-600 hover:bg-red-700">
                  {loading ? 'Rejecting…' : 'Confirm Rejection'}
                </Button>
                <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
              </div>
            </div>
          )}

          {!action && profile.status === 'pending_approval' && (
            <div className="flex gap-3">
              <Button onClick={() => setAction('approve')} className="bg-emerald-600 hover:bg-emerald-700">
                Approve Profile
              </Button>
              <Button onClick={() => setAction('reject')} variant="outline">
                Reject
              </Button>
            </div>
          )}

          {profile.status === 'approved' && (
            <div className="flex items-center gap-2 text-emerald-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Profile approved by {profile.approved_by || 'unknown'}
            </div>
          )}

          {profile.status === 'rejected' && (
            <div className="bg-red-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Profile rejected
              </div>
              {profile.rejection_reason && (
                <p className="text-sm text-red-600">{profile.rejection_reason}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
