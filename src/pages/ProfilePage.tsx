import React, { useState, useEffect } from 'react';
import { User, Briefcase, Target, History, Lightbulb, CreditCard, FileText, Save, Loader2, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { useAuthStore, UserProfile } from '@/stores/authStore';
import { getAssessmentsByEmail } from '@/services/supabaseApi';

const DS = {
  headingFont: 'Georgia, serif',
  accent: '#C108AB',
  bg: '#0A0A0A',
  card: '#111111',
  muted: '#888888',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  border: '#222222',
  radius: '12px',
  success: '#22C55E',
  error: '#EF4444',
};

type Section = 'identity' | 'goals' | 'assessments' | 'memory' | 'subscription' | 'documents';

const SECTIONS = [
  { id: 'identity' as Section, icon: User, title: 'Career Identity', description: 'Your basic professional information' },
  { id: 'goals' as Section, icon: Target, title: 'Career Goals', description: 'Your short and long-term objectives' },
  { id: 'assessments' as Section, icon: History, title: 'Assessment History', description: 'Past assessments and results' },
  { id: 'memory' as Section, icon: Lightbulb, title: 'Memory Summary', description: 'Insights Nexus has learned about you' },
  { id: 'subscription' as Section, icon: CreditCard, title: 'Subscription & Credits', description: 'Manage your plan and credits' },
  { id: 'documents' as Section, icon: FileText, title: 'Document Library', description: 'Your CV and supporting documents' },
];

export function ProfilePage() {
  const { profile, user, updateProfile } = useAuthStore();
  const [activeSection, setActiveSection] = useState<Section>('identity');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    current_title: '',
    company: '',
    country: '',
    goal_short: '',
    goal_long: '',
    target_geography: '',
    linkedin_url: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        current_title: profile.current_title || '',
        company: profile.company || '',
        country: profile.country || '',
        goal_short: profile.goal_short || '',
        goal_long: profile.goal_long || '',
        target_geography: profile.target_geography || '',
        linkedin_url: '',
      });
    }
  }, [profile]);

  useEffect(() => {
    const loadAssessments = async () => {
      if (user?.email) {
        const results = await getAssessmentsByEmail(user.email);
        setAssessments(results);
      }
      setLoadingAssessments(false);
    };
    loadAssessments();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    const result = await updateProfile(formData);
    setSaving(false);

    if (result.success) {
      setSaveMessage({ type: 'success', text: 'Profile updated successfully' });
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Failed to update profile' });
    }
  };

  const renderIdentitySection = () => (
    <div>
      <h2 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: '0 0 24px' }}>
        Career Identity
      </h2>
      <div style={{ display: 'grid', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DS.textSecondary, marginBottom: '8px' }}>
            Full name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: DS.bg,
              border: `1px solid ${DS.border}`,
              borderRadius: '8px',
              color: DS.text,
              fontSize: '15px',
              outline: 'none',
              minHeight: '44px',
            }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DS.textSecondary, marginBottom: '8px' }}>
              Current title
            </label>
            <input
              type="text"
              value={formData.current_title}
              onChange={(e) => setFormData({ ...formData, current_title: e.target.value })}
              placeholder="e.g. VP of Engineering"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: DS.bg,
                border: `1px solid ${DS.border}`,
                borderRadius: '8px',
                color: DS.text,
                fontSize: '15px',
                outline: 'none',
                minHeight: '44px',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DS.textSecondary, marginBottom: '8px' }}>
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Company name"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: DS.bg,
                border: `1px solid ${DS.border}`,
                borderRadius: '8px',
                color: DS.text,
                fontSize: '15px',
                outline: 'none',
                minHeight: '44px',
              }}
            />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DS.textSecondary, marginBottom: '8px' }}>
            Country / Region
          </label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            placeholder="e.g. China, Singapore, United States"
            style={{
              width: '100%',
              padding: '12px 16px',
              background: DS.bg,
              border: `1px solid ${DS.border}`,
              borderRadius: '8px',
              color: DS.text,
              fontSize: '15px',
              outline: 'none',
              minHeight: '44px',
            }}
          />
        </div>
      </div>
    </div>
  );

  const renderGoalsSection = () => (
    <div>
      <h2 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: '0 0 24px' }}>
        Career Goals
      </h2>
      <div style={{ display: 'grid', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DS.textSecondary, marginBottom: '8px' }}>
            Short-term goal (6 months)
          </label>
          <textarea
            value={formData.goal_short}
            onChange={(e) => setFormData({ ...formData, goal_short: e.target.value })}
            placeholder="What do you want to achieve in the next 6 months?"
            rows={3}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: DS.bg,
              border: `1px solid ${DS.border}`,
              borderRadius: '8px',
              color: DS.text,
              fontSize: '15px',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DS.textSecondary, marginBottom: '8px' }}>
            Long-term goal (3 years)
          </label>
          <textarea
            value={formData.goal_long}
            onChange={(e) => setFormData({ ...formData, goal_long: e.target.value })}
            placeholder="Where do you see yourself in 3 years?"
            rows={3}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: DS.bg,
              border: `1px solid ${DS.border}`,
              borderRadius: '8px',
              color: DS.text,
              fontSize: '15px',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DS.textSecondary, marginBottom: '8px' }}>
            Target geography
          </label>
          <input
            type="text"
            value={formData.target_geography}
            onChange={(e) => setFormData({ ...formData, target_geography: e.target.value })}
            placeholder="Where are you targeting? (e.g. Asia-Pacific, Europe, Remote)"
            style={{
              width: '100%',
              padding: '12px 16px',
              background: DS.bg,
              border: `1px solid ${DS.border}`,
              borderRadius: '8px',
              color: DS.text,
              fontSize: '15px',
              outline: 'none',
              minHeight: '44px',
            }}
          />
        </div>
      </div>
    </div>
  );

  const renderAssessmentsSection = () => (
    <div>
      <h2 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: '0 0 24px' }}>
        Assessment History
      </h2>
      {loadingAssessments ? (
        <div style={{ textAlign: 'center', padding: '40px', color: DS.muted }}>Loading assessments...</div>
      ) : assessments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: DS.card, borderRadius: DS.radius }}>
          <History style={{ width: 48, height: 48, color: DS.muted, margin: '0 auto 16px' }} />
          <p style={{ fontSize: '15px', color: DS.muted, margin: '0 0 16px' }}>No assessments yet</p>
          <a href="/assessment" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: DS.accent, fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}>
            Take your first assessment
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {assessments.map((assessment) => (
            <div key={assessment.id} style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: DS.text, margin: '0 0 4px' }}>{assessment.assessment_type}</h3>
                  <p style={{ fontSize: '13px', color: DS.muted, margin: 0 }}>
                    {new Date(assessment.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div style={{ background: `${DS.accent}20`, padding: '6px 12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: DS.accent }}>{assessment.composite_score}</span>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: DS.textSecondary, margin: 0 }}>
                Archetype: <strong style={{ color: DS.text }}>{assessment.archetype}</strong>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMemorySection = () => (
    <div>
      <h2 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: '0 0 24px' }}>
        Memory Summary
      </h2>
      <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '24px', textAlign: 'center' }}>
        <Lightbulb style={{ width: 48, height: 48, color: DS.muted, margin: '0 auto 16px' }} />
        <p style={{ fontSize: '15px', color: DS.muted, margin: '0 0 8px' }}>
          Nexus learns about you through your conversations
        </p>
        <p style={{ fontSize: '13px', color: DS.muted }}>
          Key insights from your chats will appear here as Nexus gets to know you better.
        </p>
      </div>
    </div>
  );

  const renderSubscriptionSection = () => (
    <div>
      <h2 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: '0 0 24px' }}>
        Subscription & Credits
      </h2>
      <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <p style={{ fontSize: '13px', color: DS.muted, margin: '0 0 4px' }}>Current Plan</p>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: DS.text, margin: 0, textTransform: 'capitalize' }}>{profile?.tier || 'Free'}</h3>
          </div>
          <button style={{
            padding: '10px 20px',
            background: DS.accent,
            color: '#FFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: '40px',
          }}>
            Upgrade Plan
          </button>
        </div>
        <div style={{ borderTop: `1px solid ${DS.border}`, paddingTop: '16px' }}>
          <p style={{ fontSize: '13px', color: DS.muted, margin: '0 0 8px' }}>Credits Available</p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: DS.text, margin: 0 }}>—</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'Basic', price: '$9.99/mo', features: '20 credits/month' },
          { label: 'Pro', price: '$29.99/mo', features: '50 credits/month' },
          { label: 'Enterprise', price: 'Custom', features: 'Unlimited' },
        ].map((plan) => (
          <div key={plan.label} style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '16px', textAlign: 'center' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: DS.text, margin: '0 0 4px' }}>{plan.label}</h4>
            <p style={{ fontSize: '12px', color: DS.accent, fontWeight: 600, margin: '0 0 8px' }}>{plan.price}</p>
            <p style={{ fontSize: '11px', color: DS.muted, margin: 0 }}>{plan.features}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDocumentsSection = () => (
    <div>
      <h2 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: '0 0 24px' }}>
        Document Library
      </h2>
      <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: `${DS.accent}20`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText style={{ width: 24, height: 24, color: DS.accent }} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: DS.text, margin: '0 0 4px' }}>Resume / CV</h3>
            <p style={{ fontSize: '13px', color: DS.muted, margin: 0 }}>PDF, DOC, or DOCX</p>
          </div>
        </div>
        <button style={{
          width: '100%',
          padding: '12px',
          background: DS.bg,
          color: DS.text,
          border: `1px solid ${DS.border}`,
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          minHeight: '44px',
        }}>
          Upload CV
        </button>
      </div>
      <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: `${DS.accent}20`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ExternalLink style={{ width: 24, height: 24, color: DS.accent }} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: DS.text, margin: '0 0 4px' }}>LinkedIn Profile</h3>
            <p style={{ fontSize: '13px', color: DS.muted, margin: 0 }}>Connect your LinkedIn</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="url"
            value={formData.linkedin_url}
            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
            placeholder="linkedin.com/in/yourprofile"
            style={{
              flex: 1,
              padding: '12px 16px',
              background: DS.bg,
              border: `1px solid ${DS.border}`,
              borderRadius: '8px',
              color: DS.text,
              fontSize: '14px',
              outline: 'none',
              minHeight: '44px',
            }}
          />
          <button style={{
            padding: '12px 20px',
            background: DS.accent,
            color: '#FFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: '44px',
          }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: DS.bg }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${DS.border}` }}>
        <h1 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text }}>Profile</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {saveMessage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: saveMessage.type === 'success' ? DS.success : DS.error }}>
              {saveMessage.type === 'success' ? <CheckCircle2 style={{ width: 18, height: 18 }} /> : <AlertCircle style={{ width: 18, height: 18 }} />}
              {saveMessage.text}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              background: DS.accent,
              color: '#FFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              minHeight: '40px',
            }}
          >
            {saving ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 16, height: 16 }} />}
            Save Changes
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        {/* Sidebar */}
        <div style={{ width: '280px', marginRight: '32px' }}>
          <nav style={{ display: 'grid', gap: '8px' }}>
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  background: activeSection === section.id ? DS.card : 'transparent',
                  border: `1px solid ${activeSection === section.id ? DS.accent : 'transparent'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <section.icon style={{ width: 20, height: 20, color: activeSection === section.id ? DS.accent : DS.muted }} />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: activeSection === section.id ? DS.text : DS.textSecondary, margin: 0 }}>{section.title}</p>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div style={{ flex: 1, background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '32px' }}>
          {activeSection === 'identity' && renderIdentitySection()}
          {activeSection === 'goals' && renderGoalsSection()}
          {activeSection === 'assessments' && renderAssessmentsSection()}
          {activeSection === 'memory' && renderMemorySection()}
          {activeSection === 'subscription' && renderSubscriptionSection()}
          {activeSection === 'documents' && renderDocumentsSection()}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus, textarea:focus {
          border-color: ${DS.accent} !important;
        }
        input::placeholder, textarea::placeholder {
          color: ${DS.muted};
        }
      `}</style>
    </div>
  );
}
