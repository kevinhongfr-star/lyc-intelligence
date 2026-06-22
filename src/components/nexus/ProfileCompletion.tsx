import React, { useState } from 'react';
import { User, Briefcase, Building2, Linkedin, ArrowRight, SkipForward, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface ProfileCompletionProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function ProfileCompletion({ onComplete, onSkip }: ProfileCompletionProps) {
  const { updateProfile, profile } = useAuthStore();
  const [name, setName] = useState(profile?.name || '');
  const [role, setRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const industries = [
    'Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 
    'Energy', 'Consulting', 'Education', 'Nonprofit', 'Other'
  ];

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const updates: any = {};
      if (name.trim()) updates.name = name.trim();
      if (role.trim()) updates.role = role.trim();
      if (industry) updates.industry = industry;
      if (linkedinUrl.trim()) updates.linkedin_url = linkedinUrl.trim();

      const result = await updateProfile(updates);
      
      if (result.success) {
        setCompleted(true);
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">Profile Updated!</h3>
          <p className="text-text-muted">Your profile has been saved successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent to-purple-600 p-6 text-white">
          <h2 className="text-xl font-bold">Complete Your Profile</h2>
          <p className="text-white/80 text-sm mt-1">Tell us a bit about yourself</p>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <div>
            <label className="flex items-center gap-2 text-text-secondary text-sm mb-2">
              <User className="w-4 h-4" />
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-text-secondary text-sm mb-2">
              <Briefcase className="w-4 h-4" />
              Current Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Senior Director, Engineering"
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-text-secondary text-sm mb-2">
              <Building2 className="w-4 h-4" />
              Industry
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 bg-white"
            >
              <option value="">Select industry</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-text-secondary text-sm mb-2">
              <Linkedin className="w-4 h-4" />
              LinkedIn URL (optional)
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/your-profile"
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 py-3 px-4 border border-border rounded-lg text-text-secondary hover:bg-bg-tertiary transition-colors flex items-center justify-center gap-2"
          >
            <SkipForward className="w-4 h-4" />
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Saving...</span>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}