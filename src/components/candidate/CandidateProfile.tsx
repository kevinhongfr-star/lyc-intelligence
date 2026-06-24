import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  User,
  MapPin,
  Briefcase,
  DollarSign,
  Globe,
  Linkedin,
  Mail,
  Save,
  Target,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function CandidateProfile() {
  const { profile, updateProfile } = useAuthStore();
  const [currentTitle, setCurrentTitle] = useState(profile?.headline || '');
  const [currentCompany, setCurrentCompany] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url || '');
  const [availability, setAvailability] = useState('exploring');
  const [preferredContact, setPreferredContact] = useState('email');
  const [openToRelocate, setOpenToRelocate] = useState(false);
  const [minCompensation, setMinCompensation] = useState('');

  const geographies = ['Shanghai', 'Beijing', 'Singapore', 'Hong Kong', 'Remote'];
  const industries = ['Technology', 'Financial Services', 'Consumer', 'Healthcare', 'Industrial'];
  const availabilities = [
    { value: 'immediately', label: 'Immediately available' },
    { value: '1month', label: 'Available in 1 month' },
    { value: '3months', label: 'Available in 3 months' },
    { value: 'exploring', label: 'Just exploring' },
  ];

  const [selectedGeographies, setSelectedGeographies] = useState<string[]>(['Shanghai']);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(['Technology']);
  const [shortTermGoal, setShortTermGoal] = useState('');
  const [longTermGoal, setLongTermGoal] = useState('');

  const toggleItem = (item: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-accent' : 'bg-gray-300'}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`}
      />
    </button>
  );

  const handleSave = () => {
    updateProfile?.({
      headline: currentTitle,
      linkedin_url: linkedinUrl,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">My Profile</h1>
          <p className="text-text-muted">Manage your professional profile and preferences</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-accent" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Current Title</label>
              <Input
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                placeholder="e.g. VP of Engineering"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Current Company</label>
              <Input
                value={currentCompany}
                onChange={(e) => setCurrentCompany(e.target.value)}
                placeholder="e.g. TechCorp"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary flex items-center gap-2">
              <Linkedin className="w-4 h-4" />
              LinkedIn URL
            </label>
            <Input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            Career Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-text-primary flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Target Geographies
            </label>
            <div className="flex flex-wrap gap-2">
              {geographies.map((geo) => (
                <button
                  key={geo}
                  onClick={() => toggleItem(geo, selectedGeographies, setSelectedGeographies)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedGeographies.includes(geo)
                      ? 'bg-accent text-white'
                      : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                  }`}
                >
                  {geo}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-text-primary flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Target Industries
            </label>
            <div className="flex flex-wrap gap-2">
              {industries.map((ind) => (
                <button
                  key={ind}
                  onClick={() => toggleItem(ind, selectedIndustries, setSelectedIndustries)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedIndustries.includes(ind)
                      ? 'bg-accent text-white'
                      : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-text-primary flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Availability
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {availabilities.map((avail) => (
                <button
                  key={avail.value}
                  onClick={() => setAvailability(avail.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    availability === avail.value
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-text-secondary hover:border-accent/50'
                  }`}
                >
                  {avail.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">Open to Relocation</p>
              <p className="text-sm text-text-muted">Willing to move for the right opportunity</p>
            </div>
            <ToggleSwitch enabled={openToRelocate} onChange={setOpenToRelocate} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Minimum Compensation (USD)
            </label>
            <Input
              type="number"
              value={minCompensation}
              onChange={(e) => setMinCompensation(e.target.value)}
              placeholder="e.g. 200000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Preferred Contact Method
            </label>
            <select
              value={preferredContact}
              onChange={(e) => setPreferredContact(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm"
            >
              <option value="email">Email</option>
              <option value="linkedin">LinkedIn</option>
              <option value="phone">Phone</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-accent" />
            Career Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Short-term Goals (next 12 months)</label>
            <textarea
              value={shortTermGoal}
              onChange={(e) => setShortTermGoal(e.target.value)}
              placeholder="What are you looking to achieve in your career in the next year?"
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm min-h-[80px] resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Long-term Vision (3-5 years)</label>
            <textarea
              value={longTermGoal}
              onChange={(e) => setLongTermGoal(e.target.value)}
              placeholder="Where do you see your career heading long-term?"
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm min-h-[80px] resize-none"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
