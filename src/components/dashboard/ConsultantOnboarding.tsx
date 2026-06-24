import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Briefcase, Sparkles, Check, ArrowRight, ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

const STEPS = [
  { id: 1, title: 'Welcome', icon: User, description: "Let's get you set up" },
  { id: 2, title: 'Your First Mandate', icon: Briefcase, description: 'Start with a search engagement' },
  { id: 3, title: 'Nexus AI', icon: Sparkles, description: 'Meet your AI assistant' },
  { id: 4, title: 'Done', icon: Check, description: "You're ready to go" },
];

export function ConsultantOnboarding({ onComplete }: { onComplete?: () => void }) {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [title, setTitle] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [mandateTitle, setMandateTitle] = useState('');
  const [mandateCompany, setMandateCompany] = useState('');

  const specializations = [
    'Technology & Engineering',
    'Finance & Investment',
    'Consumer & Retail',
    'Healthcare & Life Sciences',
    'Industrial & Manufacturing',
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      updateProfile?.({ onboarding_completed: true });
      onComplete?.();
      navigate('/platform');
    }
  };

  const handleSkip = () => {
    updateProfile?.({ onboarding_completed: true });
    onComplete?.();
    navigate('/platform');
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-text-primary">Welcome to LYC Intelligence</h2>
              <p className="text-text-muted mt-2">Let's personalize your experience</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">First Name</label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Last Name</label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Your Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Consultant" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Specialization</label>
              <div className="grid grid-cols-2 gap-2">
                {specializations.map((spec) => (
                  <button
                    key={spec}
                    onClick={() => setSpecialization(spec)}
                    className={`p-3 rounded-lg text-sm text-left transition-colors border ${
                      specialization === spec
                        ? 'border-accent bg-accent/5 text-accent'
                        : 'border-border text-text-secondary hover:border-accent/50'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-text-primary">Create Your First Mandate</h2>
              <p className="text-text-muted mt-2">Start a new search engagement or skip for now</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Role Title</label>
                <Input
                  value={mandateTitle}
                  onChange={(e) => setMandateTitle(e.target.value)}
                  placeholder="e.g. VP of Engineering"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Client Company</label>
                <Input
                  value={mandateCompany}
                  onChange={(e) => setMandateCompany(e.target.value)}
                  placeholder="e.g. TechCorp"
                />
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/platform/mandates/new')}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Open Mandate Creator
            </Button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-text-primary">Meet Nexus AI</h2>
              <p className="text-text-muted mt-2">Your AI-powered search intelligence partner</p>
            </div>
            <div className="space-y-3">
              {[
                'Market insights & compensation benchmarks',
                'Candidate positioning & messaging',
                'Interview strategy & preparation',
                'Pipeline analysis & recommendations',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
                  <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <p className="text-sm text-text-secondary">{item}</p>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/platform/chat')}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Try Nexus Now
            </Button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-text-primary">You're All Set!</h2>
              <p className="text-text-muted mt-2">
                Your dashboard is ready. Start by exploring your mandates or diving into Nexus AI.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Briefcase, label: 'My Mandates' },
                { icon: Sparkles, label: 'Nexus AI' },
                { icon: User, label: 'Settings' },
              ].map((item, i) => (
                <div key={i} className="p-4 bg-bg-tertiary rounded-lg">
                  <item.icon className="w-6 h-6 text-accent mx-auto mb-2" />
                  <p className="text-xs text-text-secondary">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      currentStep >= step.id
                        ? 'bg-accent text-white'
                        : 'bg-bg-tertiary text-text-muted'
                    }`}
                  >
                    {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                </div>
              ))}
            </div>
            <div className="h-1 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />
            </div>
            <div className="text-center mt-4">
              <p className="text-sm font-medium text-text-primary">
                Step {currentStep} of 4
              </p>
              <p className="text-xs text-text-muted">{STEPS[currentStep - 1].description}</p>
            </div>
          </div>

          {renderStepContent()}

          <div className="flex gap-3 mt-8">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <Button onClick={handleNext} className="flex-1">
              {currentStep === 4 ? 'Go to Dashboard' : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {currentStep < 4 && (
            <button
              onClick={handleSkip}
              className="w-full text-center text-sm text-text-muted hover:text-text-secondary mt-4"
            >
              Skip setup
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
