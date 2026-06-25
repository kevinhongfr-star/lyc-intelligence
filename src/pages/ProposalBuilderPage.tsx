import React, { useState, useEffect } from 'react';
import { authFetch } from '@/utils/authFetch';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, FileText, Building, MapPin, Calendar, DollarSign, Users, Target, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { toast } from '@/stores/toastStore';

interface Company {
  id: string;
  name: string;
  industry?: string;
  city?: string;
  country?: string;
}

interface Mandate {
  id: string;
  title: string;
  description?: string;
  jd_description?: string;
  search_definition?: string;
  skills_requirements?: string[];
  status: string;
  company?: Company;
  location?: string;
  compensation_range?: string;
  timeline?: string;
  team_size?: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: '1_search', label: 'Searching', color: '#00897B' },
  { value: '2_call', label: 'Shortlist', color: '#F59E0B' },
  { value: '3_deliver', label: 'Interview', color: '#10B981' },
  { value: '4_offer', label: 'Offer', color: '#3B82F6' },
  { value: '5_placed', label: 'Placed', color: '#A855F7' },
  { value: '6_closed', label: 'Closed', color: '#6B7280' },
];

export function ProposalBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mandate, setMandate] = useState<Partial<Mandate>>({
    title: '',
    description: '',
    jd_description: '',
    search_definition: '',
    skills_requirements: [],
    status: '1_search',
    location: '',
    compensation_range: '',
    timeline: '',
    team_size: '',
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [companySearch, setCompanySearch] = useState('');

  useEffect(() => {
    loadCompanies();
    if (isEditing) {
      loadMandate(id);
    }
  }, [id]);

  const loadCompanies = async () => {
    try {
      const res = await authFetch('/api/data/company?limit=100');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.data || []);
      }
    } catch (e) {
      console.error('Failed to load companies:', e);
    }
  };

  const loadMandate = async (mandateId: string) => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/data/mandate/${mandateId}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          const m = result.data;
          setMandate({
            title: m.title || '',
            description: m.description || '',
            jd_description: m.jd_description || '',
            search_definition: m.search_definition || '',
            skills_requirements: m.skills_requirements || [],
            status: m.status || '1_search',
            location: m.location || '',
            compensation_range: m.compensation_range || '',
            timeline: m.timeline || '',
            team_size: m.team_size || '',
          });
          setSelectedCompanyId(m.client_id || m.company_id || '');
        }
      }
    } catch (e) {
      console.error('Failed to load mandate:', e);
      toast.error('Failed to load mandate');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!mandate.title?.trim()) {
      toast.warning('Please enter a mandate title');
      return;
    }
    if (!selectedCompanyId) {
      toast.warning('Please select a client company');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...mandate,
        company_id: selectedCompanyId,
      };

      let res;
      if (isEditing) {
        res = await authFetch(`/api/data/mandate/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await authFetch(`/api/data/mandate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          toast.success(isEditing ? 'Mandate updated' : 'Mandate created');
          navigate(`/platform/mandates/${result.data.id}`);
        } else {
          throw new Error(result.error || 'Save failed');
        }
      } else {
        throw new Error('Save failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to save mandate');
    } finally {
      setSaving(false);
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-accent"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-2xl font-serif font-bold text-text-primary">
            {isEditing ? 'Edit Mandate' : 'Create New Mandate'}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Mandate Title *</label>
              <Input
                value={mandate.title}
                onChange={(e) => setMandate({ ...mandate, title: e.target.value })}
                placeholder="e.g., VP of Engineering - APAC"
              />
            </div>

            <div>
              <label className="text-xs text-text-muted mb-1 block">Client Company *</label>
              <Input
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                placeholder="Search companies..."
                className="mb-2"
              />
              <div className="max-h-40 overflow-y-auto border border-border rounded-lg">
                {filteredCompanies.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCompanyId(c.id);
                      setCompanySearch(c.name);
                    }}
                    className={`px-3 py-2 cursor-pointer hover:bg-bg-tertiary ${
                      selectedCompanyId === c.id ? 'bg-accent/10 border-l-2 border-accent' : ''
                    }`}
                  >
                    <div className="text-sm font-medium text-text-primary">{c.name}</div>
                    <div className="text-xs text-text-muted">
                      {c.industry} · {c.city || c.country || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-text-muted mb-1 block">Status</label>
              <select
                value={mandate.status}
                onChange={(e) => setMandate({ ...mandate, status: e.target.value })}
                className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Role Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" />
              Role Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Short Description</label>
              <textarea
                value={mandate.description}
                onChange={(e) => setMandate({ ...mandate, description: e.target.value })}
                placeholder="Brief overview of the role..."
                className="w-full h-20 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-text-muted mb-1 block">Full Job Description</label>
              <textarea
                value={mandate.jd_description}
                onChange={(e) => setMandate({ ...mandate, jd_description: e.target.value })}
                placeholder="Complete job description, responsibilities, requirements..."
                className="w-full h-40 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-text-muted mb-1 block">Search Definition</label>
              <textarea
                value={mandate.search_definition}
                onChange={(e) => setMandate({ ...mandate, search_definition: e.target.value })}
                placeholder="Ideal candidate profile, must-haves, nice-to-haves..."
                className="w-full h-32 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Logistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              Logistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Location</label>
                <Input
                  value={mandate.location}
                  onChange={(e) => setMandate({ ...mandate, location: e.target.value })}
                  placeholder="e.g., Singapore, Hybrid"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Team Size</label>
                <Input
                  value={mandate.team_size}
                  onChange={(e) => setMandate({ ...mandate, team_size: e.target.value })}
                  placeholder="e.g., 15-20 direct reports"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Compensation Range</label>
                <Input
                  value={mandate.compensation_range}
                  onChange={(e) => setMandate({ ...mandate, compensation_range: e.target.value })}
                  placeholder="e.g., $150k-200k + equity"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Timeline</label>
                <Input
                  value={mandate.timeline}
                  onChange={(e) => setMandate({ ...mandate, timeline: e.target.value })}
                  placeholder="e.g., Q2 2026"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-accent hover:bg-accent/90 text-white"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />{isEditing ? 'Update Mandate' : 'Create Mandate'}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
