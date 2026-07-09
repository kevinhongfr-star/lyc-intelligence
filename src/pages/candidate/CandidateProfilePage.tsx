/**
 * CandidateProfilePage — Candidate Portal profile management
 * Renders inside AppShell → Outlet. Shows profile completeness,
 * resume, experience, and visibility settings.
 */
import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, FileText, Globe, Star, CheckCircle2, Edit2, Save, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, Progress, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { getSupabase } from '@/services/supabaseApi';
import { useAuthStore } from '@/stores/authStore';

interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  year: string;
}

// Static content — experience history (could be sourced from contacts.career_history JSON, kept static for now)
const STATIC_EXPERIENCE: Experience[] = [
  { id: 'e1', company: 'TechCorp Inc.', role: 'Senior Engineering Manager', startDate: '2021', endDate: 'Present', current: true, description: 'Leading team of 12 engineers across platform and infrastructure.' },
  { id: 'e2', company: 'CloudScale', role: 'Engineering Manager', startDate: '2018', endDate: '2021', current: false, description: 'Grew team from 3 to 8, led cloud migration project.' },
  { id: 'e3', company: 'DataSystems', role: 'Senior Software Engineer', startDate: '2015', endDate: '2018', current: false, description: 'Built distributed data processing pipeline.' },
];

// Static content — education history (could be sourced from contacts.education JSON, kept static for now)
const STATIC_EDUCATION: Education[] = [
  { id: 'ed1', school: 'Stanford University', degree: 'MS', field: 'Computer Science', year: '2015' },
  { id: 'ed2', school: 'UC Berkeley', degree: 'BS', field: 'Computer Science', year: '2013' },
];

interface ExtendedProfileFields {
  phone?: string | null;
  bio?: string | null;
  company_name?: string | null;
}

export function CandidateProfilePage() {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editHeadline, setEditHeadline] = useState('');
  const [experience] = useState(STATIC_EXPERIENCE);
  const [education] = useState(STATIC_EDUCATION);
  const [extended, setExtended] = useState<ExtendedProfileFields>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { candidateProfile, profile } = useTenantContext();
  const updateProfile = useAuthStore(s => s.updateProfile);

  useEffect(() => {
    let cancelled = false;
    const fetchExtended = async () => {
      if (!candidateProfile?.id) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        setError(null);
        const sb = getSupabase();
        const { data, error: sbError } = await sb
          .from('contacts')
          .select('phone, summary, company:companies(name)')
          .eq('id', candidateProfile.id)
          .maybeSingle();
        if (cancelled) return;
        if (sbError) {
          console.error('[CandidateProfilePage] Error:', sbError);
          setError('Failed to load profile');
        } else if (data) {
          const company = (data as any).company;
          setExtended({
            phone: (data as any).phone ?? null,
            bio: (data as any).summary ?? null,
            company_name: company?.name ?? null,
          });
        }
      } catch (e) {
        console.error('[CandidateProfilePage] Error:', e);
        if (!cancelled) setError('Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchExtended();
    return () => { cancelled = true; };
  }, [candidateProfile?.id]);

  const displayName = candidateProfile?.name || profile?.name || 'Candidate';
  const currentTitle = candidateProfile?.current_title || 'Professional';
  const email = candidateProfile?.email || profile?.email || 'candidate@example.com';
  const location = candidateProfile?.location || 'San Francisco, CA';
  const headline = candidateProfile?.headline || 'Senior Engineering Leader | Cloud Architecture | Team Building';
  const phone = extended.phone || '+1 (555) 123-4567';

  // Compute profile strength from available fields
  const profileStrength = (() => {
    let score = 0;
    if (candidateProfile?.name) score += 12;
    if (candidateProfile?.email) score += 12;
    if (candidateProfile?.current_title) score += 12;
    if (candidateProfile?.location) score += 10;
    if (candidateProfile?.headline) score += 12;
    if (extended.phone) score += 10;
    if (extended.bio) score += 10;
    if (extended.company_name) score += 10;
    if (STATIC_EXPERIENCE.length > 0) score += 6;
    if (STATIC_EDUCATION.length > 0) score += 6;
    return Math.min(100, score);
  })();

  if (loading) {
    return (
      <div className="py-12 text-center text-text-muted text-sm">Loading profile...</div>
    );
  }

  if (error && !candidateProfile) {
    return <EmptyState title="Failed to load profile" description={error} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">My Profile</h1>
            <p className="text-text-secondary text-sm mt-1">Your professional profile visible to executive search firms.</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted">{currentTitle}</div>
            </div>
          </div>
        </div>
      </div>

      <Card className="bg-fuchsia-light/30 border-fuchsia/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Star className="w-6 h-6 text-fuchsia" />
                <span className="font-serif font-bold text-xl text-text-primary">Profile Strength</span>
              </div>
              <p className="text-text-secondary text-sm">
                Complete your profile to 90%+ to appear in top search results.
              </p>
            </div>
            <div className="text-center md:text-right">
              <div className="text-4xl font-bold text-fuchsia">{profileStrength}%</div>
              <div className="text-xs text-text-muted mt-1">Complete</div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={profileStrength} className="h-2" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
            <CheckCircle2 className="w-3 h-3 text-green" />
            <span>Add 2 more endorsements to reach 90%</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-fuchsia" />
                <CardTitle>Personal Information</CardTitle>
              </div>
              {editing ? (
                <Button size="sm" onClick={async () => {
                  setSaving(true);
                  setSaveError(null);
                  try {
                    // Save name to profiles table
                    if (editName && editName !== (candidateProfile?.name || profile?.name)) {
                      const result = await updateProfile({ name: editName });
                      if (!result.success) {
                        setSaveError(result.error || 'Failed to save');
                        setSaving(false);
                        return;
                      }
                    }
                    // Save headline to contacts table
                    if (candidateProfile?.id && editHeadline) {
                      const sb = getSupabase();
                      await sb.from('contacts').update({ headline: editHeadline }).eq('id', candidateProfile.id);
                    }
                    setEditing(false);
                  } catch (e) {
                    console.error('[CandidateProfilePage] Save error:', e);
                    setSaveError('Failed to save changes');
                  } finally {
                    setSaving(false);
                  }
                }} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => {
                  setEditName(candidateProfile?.name || profile?.name || '');
                  setEditHeadline(candidateProfile?.headline || '');
                  setEditing(true);
                }}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {saveError && (
              <div className="mb-3 p-3 bg-red/10 text-red text-sm rounded-md">{saveError}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Full Name</label>
                <Input
                  value={editing ? editName : displayName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Current Title</label>
                <Input value={currentTitle} disabled={true} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Email</label>
                <Input value={email} disabled={true} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Phone</label>
                <Input value={phone} disabled={true} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Location</label>
                <Input value={location} disabled={true} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Years of Experience</label>
                <Input value="10+" disabled={true} />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs text-text-muted mb-1 block">Headline</label>
              <Input
                value={editing ? editHeadline : headline}
                onChange={(e) => setEditHeadline(e.target.value)}
                disabled={!editing}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-fuchsia" />
                <CardTitle>Visibility</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-bg-warm rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-text-primary">Searchable</div>
                    <div className="text-xs text-text-muted">Visible to recruiters</div>
                  </div>
                  <Badge className="bg-green/10 text-green">On</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-bg-warm rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-text-primary">Anonymous Mode</div>
                    <div className="text-xs text-text-muted">Hide identity</div>
                  </div>
                  <Badge variant="outline">Off</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-bg-warm rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-text-primary">Open to Offers</div>
                    <div className="text-xs text-text-muted">Show availability</div>
                  </div>
                  <Badge className="bg-green/10 text-green">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 hover:bg-bg-warm rounded-lg cursor-pointer">
                  <FileText className="w-4 h-4 text-blue" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">Resume_2025.pdf</div>
                    <div className="text-xs text-text-muted">Updated 5d ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 hover:bg-bg-warm rounded-lg cursor-pointer">
                  <FileText className="w-4 h-4 text-blue" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">Cover_Letter.docx</div>
                    <div className="text-xs text-text-muted">Updated 2w ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 hover:bg-bg-warm rounded-lg cursor-pointer">
                  <FileText className="w-4 h-4 text-blue" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">Portfolio.pdf</div>
                    <div className="text-xs text-text-muted">Updated 1mo ago</div>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-3" size="sm">
                Upload Document
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-fuchsia" />
            <CardTitle>Experience</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="flex gap-4 pb-4 border-b border-border last:border-b-0">
                <div className="w-12 h-12 rounded-lg bg-fuchsia-light flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-6 h-6 text-fuchsia" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-text-primary">{exp.role}</h3>
                    {exp.current && <Badge className="bg-green/10 text-green">Current</Badge>}
                  </div>
                  <p className="text-sm text-text-secondary">{exp.company}</p>
                  <p className="text-xs text-text-muted mt-1">{exp.startDate} - {exp.endDate}</p>
                  <p className="text-sm text-text-secondary mt-2">{exp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-fuchsia" />
            <CardTitle>Education</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id} className="flex items-center justify-between p-3 bg-bg-warm rounded-lg">
                <div>
                  <div className="font-medium text-text-primary">{edu.school}</div>
                  <div className="text-sm text-text-muted">{edu.degree} in {edu.field}</div>
                </div>
                <div className="text-sm text-text-muted">{edu.year}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CandidateProfilePage;
