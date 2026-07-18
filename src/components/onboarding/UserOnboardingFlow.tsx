/**
 * UserOnboardingFlow — Guided first-time user onboarding
 * Issue #32: User Onboarding
 *
 * Multi-step onboarding wizard that collects user information,
 * sets preferences, and guides new users through key features.
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  User,
  Building2,
  Target,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Briefcase,
  Users,
  BookOpen,
  Settings,
  SkipForward,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface OnboardingData {
  fullName: string;
  jobTitle: string;
  company: string;
  industry: string;
  location: string;
  role: string;
  goals: string[];
  interests: string[];
  experienceLevel: string;
  teamSize: string;
  communicationPreference: string;
}

const TOTAL_STEPS = 5;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function UserOnboardingFlow({
  onComplete,
  onSkip,
}: {
  onComplete: (data: OnboardingData) => void;
  onSkip?: () => void;
}) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    jobTitle: '',
    company: '',
    industry: '',
    location: '',
    role: '',
    goals: [],
    interests: [],
    experienceLevel: '',
    teamSize: '',
    communicationPreference: 'email',
  });

  const update = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const toggleGoal = (goal: string) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }));
  };

  const toggleInterest = (interest: string) => {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const nextStep = useCallback(() => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      onComplete(data);
    }
  }, [step, data, onComplete]);

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] text-[#6B6B6B]">
              Step {step} of {TOTAL_STEPS}
            </span>
            {onSkip && (
              <button
                onClick={onSkip}
                className="text-[12px] text-[#9B9B9B] hover:text-[#6B6B6B] flex items-center gap-1"
              >
                Skip for now
                <SkipForward className="h-3 w-3" />
              </button>
            )}
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-[#E5E5E5] shadow-sm overflow-hidden">
          <div className="p-8">
            {step === 1 && <StepWelcome />}
            {step === 2 && <StepProfile data={data} update={update} />}
            {step === 3 && <StepRole data={data} update={update} />}
            {step === 4 && <StepGoals data={data} toggleGoal={toggleGoal} />}
            {step === 5 && <StepInterests data={data} toggleInterest={toggleInterest} />}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-8 py-4 border-t border-[#F0F0F0] bg-[#FAFAFA]">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={step === 1}
              className="text-[#6B6B6B]"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button onClick={nextStep}>
              {step === TOTAL_STEPS ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Get Started
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i + 1 < step
                  ? 'bg-[#1A1A1A]'
                  : i + 1 === step
                  ? 'bg-[#1A1A1A] w-4'
                  : 'bg-[#D0D0D0]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1: Welcome                                                      */
/* ------------------------------------------------------------------ */

function StepWelcome() {
  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 mx-auto mb-4 bg-[#F0F0F0] rounded-full flex items-center justify-center">
        <Sparkles className="h-7 w-7 text-[#6B6B6B]" />
      </div>
      <h1 className="text-[28px] font-serif text-[#1A1A1A] mb-3">
        Welcome to LYC Intelligence
      </h1>
      <p className="text-[14px] text-[#6B6B6B] max-w-md mx-auto mb-6">
        Let's take a minute to personalize your experience. We'll learn about your role,
        goals, and interests so we can show you what matters most.
      </p>
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-8">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-2 bg-[#FAFAFA] rounded-lg flex items-center justify-center">
            <User className="h-5 w-5 text-[#6B6B6B]" />
          </div>
          <p className="text-[12px] text-[#6B6B6B]">Personal profile</p>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-2 bg-[#FAFAFA] rounded-lg flex items-center justify-center">
            <Target className="h-5 w-5 text-[#6B6B6B]" />
          </div>
          <p className="text-[12px] text-[#6B6B6B]">Your goals</p>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-2 bg-[#FAFAFA] rounded-lg flex items-center justify-center">
            <Settings className="h-5 w-5 text-[#6B6B6B]" />
          </div>
          <p className="text-[12px] text-[#6B6B6B]">Preferences</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2: Profile                                                      */
/* ------------------------------------------------------------------ */

function StepProfile({
  data,
  update,
}: {
  data: OnboardingData;
  update: (d: Partial<OnboardingData>) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#F0F0F0] rounded-lg flex items-center justify-center">
          <User className="h-5 w-5 text-[#6B6B6B]" />
        </div>
        <div>
          <h2 className="text-[20px] font-serif text-[#1A1A1A]">Tell us about yourself</h2>
          <p className="text-[13px] text-[#6B6B6B]">This helps us personalize your experience.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] text-[#6B6B6B] mb-1.5">Full Name</label>
            <Input
              value={data.fullName}
              onChange={(e: any) => update({ fullName: e.target.value })}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-[12px] text-[#6B6B6B] mb-1.5">Job Title</label>
            <Input
              value={data.jobTitle}
              onChange={(e: any) => update({ jobTitle: e.target.value })}
              placeholder="e.g. Director of Engineering"
            />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] text-[#6B6B6B] mb-1.5">Company</label>
            <Input
              value={data.company}
              onChange={(e: any) => update({ company: e.target.value })}
              placeholder="Your organization"
            />
          </div>
          <div>
            <label className="block text-[12px] text-[#6B6B6B] mb-1.5">Location</label>
            <Input
              value={data.location}
              onChange={(e: any) => update({ location: e.target.value })}
              placeholder="City, Country"
            />
          </div>
        </div>
        <div>
          <label className="block text-[12px] text-[#6B6B6B] mb-1.5">Industry</label>
          <select
            value={data.industry}
            onChange={(e) => update({ industry: e.target.value })}
            className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
          >
            <option value="">Select industry</option>
            <option value="technology">Technology / Software</option>
            <option value="finance">Financial Services</option>
            <option value="healthcare">Healthcare / Life Sciences</option>
            <option value="consumer">Consumer / Retail</option>
            <option value="industrial">Industrial / Manufacturing</option>
            <option value="professional_services">Professional Services</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 3: Role & Context                                               */
/* ------------------------------------------------------------------ */

const ROLE_OPTIONS = [
  { id: 'consultant', icon: <Briefcase className="h-5 w-5" />, label: 'Consultant / Recruiter', desc: 'I work on search mandates' },
  { id: 'client', icon: <Building2 className="h-5 w-5" />, label: 'Hiring Manager / HR', desc: 'I hire for my organization' },
  { id: 'candidate', icon: <User className="h-5 w-5" />, label: 'Job Seeker', desc: 'I\'m exploring opportunities' },
  { id: 'coach', icon: <Users className="h-5 w-5" />, label: 'Coach / Mentor', desc: 'I provide guidance' },
];

function StepRole({
  data,
  update,
}: {
  data: OnboardingData;
  update: (d: Partial<OnboardingData>) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#F0F0F0] rounded-lg flex items-center justify-center">
          <Building2 className="h-5 w-5 text-[#6B6B6B]" />
        </div>
        <div>
          <h2 className="text-[20px] font-serif text-[#1A1A1A]">What brings you here?</h2>
          <p className="text-[13px] text-[#6B6B6B]">Choose the option that best describes you.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {ROLE_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => update({ role: option.id })}
            className={`p-4 text-left rounded-lg border-2 transition-all ${
              data.role === option.id
                ? 'border-[#1A1A1A] bg-[#FAFAFA]'
                : 'border-[#E5E5E5] hover:border-[#C0C0C0] bg-white'
            }`}
          >
            <div className={`mb-2 ${data.role === option.id ? 'text-[#1A1A1A]' : 'text-[#9B9B9B]'}`}>
              {option.icon}
            </div>
            <div className="text-[14px] font-medium text-[#1A1A1A]">{option.label}</div>
            <div className="text-[12px] text-[#6B6B6B] mt-0.5">{option.desc}</div>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div>
          <label className="block text-[12px] text-[#6B6B6B] mb-1.5">Experience Level</label>
          <select
            value={data.experienceLevel}
            onChange={(e) => update({ experienceLevel: e.target.value })}
            className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
          >
            <option value="">Select</option>
            <option value="entry">Entry (0-2 years)</option>
            <option value="mid">Mid (2-5 years)</option>
            <option value="senior">Senior (5-10 years)</option>
            <option value="director">Director / VP (10+ years)</option>
            <option value="executive">Executive (C-Suite)</option>
          </select>
        </div>
        <div>
          <label className="block text-[12px] text-[#6B6B6B] mb-1.5">Team Size</label>
          <select
            value={data.teamSize}
            onChange={(e) => update({ teamSize: e.target.value })}
            className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
          >
            <option value="">Select</option>
            <option value="1-10">1-10 people</option>
            <option value="11-50">11-50 people</option>
            <option value="51-200">51-200 people</option>
            <option value="201-1000">201-1000 people</option>
            <option value="1000+">1000+ people</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 4: Goals                                                        */
/* ------------------------------------------------------------------ */

const GOAL_OPTIONS = [
  { id: 'find_role', label: 'Find a new role', icon: <Briefcase className="h-4 w-4" /> },
  { id: 'build_team', label: 'Build my team', icon: <Users className="h-4 w-4" /> },
  { id: 'learn_skills', label: 'Learn new skills', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'advance_career', label: 'Advance my career', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'expand_network', label: 'Expand my network', icon: <Users className="h-4 w-4" /> },
  { id: 'get_coaching', label: 'Get executive coaching', icon: <Users className="h-4 w-4" /> },
];

import { TrendingUp } from 'lucide-react';

function StepGoals({
  data,
  toggleGoal,
}: {
  data: OnboardingData;
  toggleGoal: (goal: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#F0F0F0] rounded-lg flex items-center justify-center">
          <Target className="h-5 w-5 text-[#6B6B6B]" />
        </div>
        <div>
          <h2 className="text-[20px] font-serif text-[#1A1A1A]">What are your goals?</h2>
          <p className="text-[13px] text-[#6B6B6B]">Select all that apply.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {GOAL_OPTIONS.map((goal) => {
          const selected = data.goals.includes(goal.id);
          return (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`p-3 text-left rounded-lg border-2 flex items-center gap-3 transition-all ${
                selected
                  ? 'border-[#1A1A1A] bg-[#FAFAFA]'
                  : 'border-[#E5E5E5] hover:border-[#C0C0C0] bg-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                selected ? 'bg-[#1A1A1A] text-white' : 'bg-[#F0F0F0] text-[#6B6B6B]'
              }`}>
                {selected ? <CheckCircle2 className="h-4 w-4" /> : goal.icon}
              </div>
              <span className="text-[13px] font-medium text-[#1A1A1A]">{goal.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 5: Interests & Preferences                                      */
/* ------------------------------------------------------------------ */

const INTEREST_OPTIONS = [
  'Executive Search',
  'Leadership Development',
  'Coaching',
  'Market Intelligence',
  'Diversity & Inclusion',
  'Compensation Data',
  'Company Research',
  'Industry Insights',
  'Skill Assessments',
  'Mentorship',
];

function StepInterests({
  data,
  toggleInterest,
}: {
  data: OnboardingData;
  toggleInterest: (interest: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#F0F0F0] rounded-lg flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-[#6B6B6B]" />
        </div>
        <div>
          <h2 className="text-[20px] font-serif text-[#1A1A1A]">What interests you most?</h2>
          <p className="text-[13px] text-[#6B6B6B]">We'll tailor content and recommendations for you.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {INTEREST_OPTIONS.map((interest) => {
          const selected = data.interests.includes(interest);
          return (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`px-3 py-1.5 rounded-full text-[13px] border transition-all ${
                selected
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                  : 'bg-white text-[#6B6B6B] border-[#E5E5E5] hover:border-[#C0C0C0]'
              }`}
            >
              {interest}
            </button>
          );
        })}
      </div>

      <div className="border-t border-[#F0F0F0] pt-6">
        <h3 className="text-[15px] font-medium text-[#1A1A1A] mb-3">Communication preferences</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <button
            onClick={() => update({ communicationPreference: 'email' })}
            className={`p-3 text-left rounded-lg border-2 ${
              data.communicationPreference === 'email'
                ? 'border-[#1A1A1A] bg-[#FAFAFA]'
                : 'border-[#E5E5E5] hover:border-[#C0C0C0]'
            }`}
          >
            <div className="text-[14px] font-medium text-[#1A1A1A]">Email</div>
            <div className="text-[12px] text-[#6B6B6B]">Newsletters and updates via email</div>
          </button>
          <button
            onClick={() => update({ communicationPreference: 'in_app' })}
            className={`p-3 text-left rounded-lg border-2 ${
              data.communicationPreference === 'in_app'
                ? 'border-[#1A1A1A] bg-[#FAFAFA]'
                : 'border-[#E5E5E5] hover:border-[#C0C0C0]'
            }`}
          >
            <div className="text-[14px] font-medium text-[#1A1A1A]">In-app only</div>
            <div className="text-[12px] text-[#6B6B6B]">Minimize email, use in-app alerts</div>
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-[#F8F8F8] rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[14px] font-medium text-[#1A1A1A]">You're all set!</h4>
            <p className="text-[13px] text-[#6B6B6B] mt-0.5">
              Click "Get Started" to begin exploring LYC Intelligence.
              You can always update these settings later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
