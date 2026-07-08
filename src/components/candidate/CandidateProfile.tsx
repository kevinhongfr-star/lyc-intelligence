import React, { useState, useRef } from 'react';
import {
  User, Briefcase, FileText, Settings, Save, Upload, X, Plus,
  Linkedin, MapPin, Mail, Phone, Calendar, Trash2, Loader2,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { Badge, Button, Input } from '@/components/ui';
import type { CandidateProfile } from '@/services/supabaseApi';

interface CandidateProfileProps {
  profile: CandidateProfile | null;
  onUpdate: (profile: CandidateProfile) => void;
}

type ProfileTab = 'personal' | 'professional' | 'cv' | 'preferences';

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Consumer',
  'Energy', 'Real Estate', 'Education', 'Media', 'Consulting', 'Other',
];

const GEOGRAPHIES = [
  'North America', 'Europe', 'APAC', 'Latin America', 'Middle East', 'Africa', 'Global',
];

const COMPANY_SIZES = [
  'Startup (1-50)', 'SMB (51-200)', 'Mid-Market (201-1000)', 
  'Enterprise (1001-10000)', 'Large Enterprise (10000+)',
];

const JOB_STATUS = [
  { value: 'actively_looking', label: 'Actively Looking' },
  { value: 'open_to_opportunities', label: 'Open to Opportunities' },
  { value: 'not_looking', label: 'Not Looking' },
];

export function CandidateProfile({ profile, onUpdate }: CandidateProfileProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<CandidateProfile>(profile || {
    id: '',
    name: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    linkedin_url: '',
    city: '',
    country: '',
    current_title: '',
    current_company: '',
    years_experience: 0,
    industries: [],
    skills: [],
    languages: [],
    education: [],
    career_history: [],
    job_search_status: 'open_to_opportunities' as const,
    preferred_industries: [],
    preferred_geographies: [],
    preferred_company_sizes: [],
    salary_expectation_min: null,
    salary_expectation_max: null,
    cv_url: null,
    cv_extracted: null,
    notification_preferences: {
      assessment_invitation: { enabled: true, email: true, in_app: true },
      interview_reminder: { enabled: true, email: true, in_app: true },
      stage_change: { enabled: true, email: false, in_app: true },
      feedback_received: { enabled: true, email: false, in_app: true },
      career_insight: { enabled: true, email: true, in_app: true, frequency: 'weekly' as const },
    },
  });

  // Tab config
  const tabs: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { id: 'personal', label: 'Personal', icon: <User className="w-4 h-4" /> },
    { id: 'professional', label: 'Professional', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'cv', label: 'CV / Resume', icon: <FileText className="w-4 h-4" /> },
    { id: 'preferences', label: 'Preferences', icon: <Settings className="w-4 h-4" /> },
  ];

  // Handle input change
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  // Toggle array item
  const toggleArrayItem = (field: string, item: string) => {
    setFormData(prev => {
      const arr = prev[field as keyof CandidateProfile] as string[] || [];
      if (arr.includes(item)) {
        return { ...prev, [field]: arr.filter(i => i !== item) };
      }
      return { ...prev, [field]: [...arr, item] };
    });
    setSaved(false);
  };

  // Add skill
  const addSkill = (skill: string) => {
    if (skill && !formData.skills?.includes(skill)) {
      handleChange('skills', [...(formData.skills || []), skill]);
    }
  };

  // Remove skill
  const removeSkill = (skill: string) => {
    handleChange('skills', formData.skills?.filter(s => s !== skill) || []);
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      setError('Please upload a PDF or DOCX file');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // In a real app, upload to storage and extract CV data
      // For now, simulate upload
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate extracted data
      const extractedData = {
        name: `${formData.first_name} ${formData.last_name}`,
        email: formData.email,
        phone: formData.phone,
        skills: formData.skills || [],
        experience: 'Extracted from CV',
      };

      handleChange('cv_url', `/uploads/${file.name}`);
      handleChange('cv_extracted', extractedData);
    } catch (err) {
      setError('Failed to upload CV. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Save profile
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // In a real app, call API to save
      await new Promise(resolve => setTimeout(resolve, 1000));
      onUpdate(formData);
      setSaved(true);
    } catch (err) {
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Render Personal Info
  const renderPersonalTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            First Name *
          </label>
          <Input
            value={formData.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            placeholder="John"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Last Name *
          </label>
          <Input
            value={formData.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            placeholder="Doe"
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            <Mail className="w-4 h-4 inline mr-1" />
            Email *
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="john.doe@example.com"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            <Phone className="w-4 h-4 inline mr-1" />
            Phone
          </label>
          <Input
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+1 234 567 8900"
            className="w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          <Linkedin className="w-4 h-4 inline mr-1" />
          LinkedIn URL
        </label>
        <Input
          value={formData.linkedin_url}
          onChange={(e) => handleChange('linkedin_url', e.target.value)}
          placeholder="https://linkedin.com/in/johndoe"
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            City
          </label>
          <Input
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="San Francisco"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Country
          </label>
          <Input
            value={formData.country}
            onChange={(e) => handleChange('country', e.target.value)}
            placeholder="United States"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );

  // Render Professional Info
  const renderProfessionalTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Current Title *
          </label>
          <Input
            value={formData.current_title}
            onChange={(e) => handleChange('current_title', e.target.value)}
            placeholder="Senior Software Engineer"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Current Company *
          </label>
          <Input
            value={formData.current_company}
            onChange={(e) => handleChange('current_company', e.target.value)}
            placeholder="Acme Inc."
            className="w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          <Calendar className="w-4 h-4 inline mr-1" />
          Years of Experience
        </label>
        <Input
          type="number"
          min={0}
          max={50}
          value={formData.years_experience}
          onChange={(e) => handleChange('years_experience', parseInt(e.target.value) || 0)}
          placeholder="10"
          className="w-32"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Industries
        </label>
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map(industry => (
            <button
              key={industry}
              onClick={() => toggleArrayItem('industries', industry)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                formData.industries?.includes(industry)
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-text-muted hover:border-accent/50'
              }`}
            >
              {industry}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Key Skills
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {formData.skills?.map(skill => (
            <Badge key={skill} variant="default" className="gap-1 pr-1">
              {skill}
              <button
                onClick={() => removeSkill(skill)}
                className="p-0.5 hover:bg-bg-alt rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add a skill..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                addSkill(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <Button
            variant="outline"
            onClick={() => {
              const input = fileInputRef.current?.parentElement?.querySelector('input');
              if (input?.value) {
                addSkill(input.value);
                input.value = '';
              }
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Education
        </label>
        {formData.education?.map((edu, i) => (
          <div key={i} className="flex items-center gap-3 mb-2 p-3 bg-bg-alt rounded-none">
            <div className="flex-1">
              <div className="font-medium text-text-primary">{edu.degree}</div>
              <div className="text-sm text-text-muted">{edu.institution} • {edu.year}</div>
            </div>
            <button
              onClick={() => handleChange('education', formData.education?.filter((_, idx) => idx !== i))}
              className="p-2 hover:bg-bg rounded text-text-muted hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <Button
          variant="outline"
          onClick={() => {
            handleChange('education', [
              ...(formData.education || []),
              { degree: '', institution: '', year: '' },
            ]);
          }}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Education
        </Button>
      </div>
    </div>
  );

  // Render CV Tab
  const renderCVTab = () => (
    <div className="space-y-6">
      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-none p-8 text-center transition-colors ${
          formData.cv_url 
            ? 'border-green-500 bg-green-500/5' 
            : 'border-border hover:border-accent/50'
        }`}
      >
        {saving ? (
          <div>
            <Loader2 className="w-12 h-12 mx-auto text-accent animate-spin mb-3" />
            <p className="text-text-muted">Uploading and extracting CV data...</p>
          </div>
        ) : formData.cv_url ? (
          <div>
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
            <p className="font-medium text-text-primary">CV Uploaded Successfully</p>
            <p className="text-sm text-text-muted mt-1">
              {formData.cv_url.split('/').pop()}
            </p>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1" />
                Replace CV
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Upload className="w-12 h-12 mx-auto text-text-muted mb-3" />
            <p className="font-medium text-text-primary">
              Drop your CV here, or click to browse
            </p>
            <p className="text-sm text-text-muted mt-1">
              PDF or DOCX, max 10MB
            </p>
            <div className="mt-4">
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1" />
                Upload CV
              </Button>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Extracted data */}
      {formData.cv_extracted && (
        <div className="bg-card rounded-none border border-card-border p-5">
          <h4 className="font-semibold text-text-primary mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-500 inline mr-2" />
            Extracted Information
          </h4>
          <div className="space-y-3 text-sm">
            {Object.entries(formData.cv_extracted).map(([key, value]) => (
              <div key={key} className="flex items-start gap-3">
                <span className="text-text-muted capitalize w-24">{key}:</span>
                <span className="text-text-primary">
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-4">
            Review and edit the extracted information in the Personal and Professional tabs.
          </p>
        </div>
      )}

      {/* CV Preview */}
      {formData.cv_url && (
        <div className="bg-card rounded-none border border-card-border p-5">
          <h4 className="font-semibold text-text-primary mb-4">CV Preview</h4>
          <div className="bg-bg-alt rounded-none p-4 text-center">
            <FileText className="w-8 h-8 mx-auto text-text-muted mb-2" />
            <p className="text-sm text-text-muted">PDF Preview Coming Soon</p>
          </div>
        </div>
      )}
    </div>
  );

  // Render Preferences Tab
  const renderPreferencesTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Job Search Status
        </label>
        <div className="space-y-2">
          {JOB_STATUS.map(option => (
            <label
              key={option.value}
              className={`flex items-center gap-3 p-3 rounded-none border cursor-pointer transition-all ${
                formData.job_search_status === option.value
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              <input
                type="radio"
                name="job_status"
                value={option.value}
                checked={formData.job_search_status === option.value}
                onChange={(e) => handleChange('job_search_status', e.target.value)}
                className="w-4 h-4 text-accent"
              />
              <span className="text-text-primary">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Preferred Industries
        </label>
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map(industry => (
            <button
              key={industry}
              onClick={() => toggleArrayItem('preferred_industries', industry)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                formData.preferred_industries?.includes(industry)
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-text-muted hover:border-accent/50'
              }`}
            >
              {industry}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Preferred Geographies
        </label>
        <div className="flex flex-wrap gap-2">
          {GEOGRAPHIES.map(geo => (
            <button
              key={geo}
              onClick={() => toggleArrayItem('preferred_geographies', geo)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                formData.preferred_geographies?.includes(geo)
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-text-muted hover:border-accent/50'
              }`}
            >
              {geo}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Preferred Company Size
        </label>
        <div className="flex flex-wrap gap-2">
          {COMPANY_SIZES.map(size => (
            <button
              key={size}
              onClick={() => toggleArrayItem('preferred_company_sizes', size)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                formData.preferred_company_sizes?.includes(size)
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-text-muted hover:border-accent/50'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Salary Expectations (Annual)
        </label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs text-text-muted mb-1">Minimum</label>
            <Input
              type="number"
              value={formData.salary_expectation_min ?? ''}
              onChange={(e) => handleChange('salary_expectation_min', parseInt(e.target.value) || null)}
              placeholder="100000"
              className="w-full"
            />
          </div>
          <span className="text-text-muted pt-5">to</span>
          <div className="flex-1">
            <label className="block text-xs text-text-muted mb-1">Maximum</label>
            <Input
              type="number"
              value={formData.salary_expectation_max ?? ''}
              onChange={(e) => handleChange('salary_expectation_max', parseInt(e.target.value) || null)}
              placeholder="200000"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-card rounded-none border border-card-border">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-4 border-b border-border overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-none text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-accent text-white'
                : 'text-text-muted hover:bg-bg-alt hover:text-text-primary'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
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

        {activeTab === 'personal' && renderPersonalTab()}
        {activeTab === 'professional' && renderProfessionalTab()}
        {activeTab === 'cv' && renderCVTab()}
        {activeTab === 'preferences' && renderPreferencesTab()}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-border bg-bg-alt">
        <div className="text-sm text-text-muted">
          {saved && (
            <span className="flex items-center gap-1 text-green-500">
              <CheckCircle2 className="w-4 h-4" />
              All changes saved
            </span>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-1" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}