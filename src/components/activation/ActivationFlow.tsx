/**
 * ActivationFlow — Unified first-run experience per portal
 * Issue #35: User Activation Flows
 *
 * Adapts to portal type (b2c, council, candidate, client, student)
 * Shows progressive steps with completion tracking.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowLeft,
  User,
  Briefcase,
  Target,
  Sparkles,
  Users,
  FileText,
  Video,
  X,
} from 'lucide-react';
import { Button, Card, Badge, Progress, Avatar } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';

type PortalType = 'b2c' | 'council' | 'candidate' | 'client' | 'student';

interface ActivationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  actionLabel: string;
  actionHref: string;
  estimatedTime: string;
}

interface PortalConfig {
  welcomeTitle: string;
  welcomeMessage: string;
  steps: ActivationStep[];
  skipLabel: string;
  completeHref: string;
}

const PORTAL_CONFIGS: Record<PortalType, PortalConfig> = {
  b2c: {
    welcomeTitle: 'Welcome to LYC Intelligence',
    welcomeMessage: 'Let\'s get you set up. Complete these steps to unlock your executive intelligence features.',
    skipLabel: 'Skip for now',
    completeHref: '/app/dashboard',
    steps: [
      {
        id: 'profile',
        title: 'Complete Your Profile',
        description: 'Add your current role, industry, and career goals so we can personalize recommendations.',
        icon: <User className="w-5 h-5" />,
        actionLabel: 'Edit Profile',
        actionHref: '/app/profile',
        estimatedTime: '3 min',
      },
      {
        id: 'assessment',
        title: 'Take the SHIFT Assessment',
        description: 'Discover your leadership archetype and get personalized development recommendations.',
        icon: <Target className="w-5 h-5" />,
        actionLabel: 'Start Assessment',
        actionHref: '/assessment',
        estimatedTime: '15 min',
      },
      {
        id: 'nexus',
        title: 'Try DEX AI Chat',
        description: 'Ask DEX AI about career opportunities, market intelligence, or interview preparation.',
        icon: <Sparkles className="w-5 h-5" />,
        actionLabel: 'Open DEX AI',
        actionHref: '/dex/chat',
        estimatedTime: '2 min',
      },
    ],
  },
  council: {
    welcomeTitle: 'Welcome to the Council',
    welcomeMessage: 'You\'re now part of an exclusive executive community. Complete your setup to access all member benefits.',
    skipLabel: 'Explore on my own',
    completeHref: '/council/dashboard',
    steps: [
      {
        id: 'profile',
        title: 'Set Up Council Profile',
        description: 'Add your bio, career highlights, and areas of expertise for the member directory.',
        icon: <User className="w-5 h-5" />,
        actionLabel: 'Edit Profile',
        actionHref: '/council/profile',
        estimatedTime: '5 min',
      },
      {
        id: 'directory',
        title: 'Browse the Member Directory',
        description: 'Discover peers in your industry and connect with fellow council members.',
        icon: <Users className="w-5 h-5" />,
        actionLabel: 'View Directory',
        actionHref: '/council/directory',
        estimatedTime: '3 min',
      },
      {
        id: 'community',
        title: 'Join the Conversation',
        description: 'Introduce yourself in the community feed and join ongoing discussions.',
        icon: <Sparkles className="w-5 h-5" />,
        actionLabel: 'Open Community',
        actionHref: '/council/community',
        estimatedTime: '2 min',
      },
      {
        id: 'coaching',
        title: 'Book Your Coaching Session',
        description: 'Schedule your first 1:1 coaching session with an executive strategist.',
        icon: <Video className="w-5 h-5" />,
        actionLabel: 'View Coaching',
        actionHref: '/council/coaching',
        estimatedTime: '5 min',
      },
    ],
  },
  candidate: {
    welcomeTitle: 'Welcome to Your Career Hub',
    welcomeMessage: 'Let\'s set up your candidate profile to match you with the best executive opportunities.',
    skipLabel: 'Skip setup',
    completeHref: '/candidates/dashboard',
    steps: [
      {
        id: 'profile',
        title: 'Complete Your Candidate Profile',
        description: 'Upload your CV, add your experience, and set your career preferences.',
        icon: <User className="w-5 h-5" />,
        actionLabel: 'Edit Profile',
        actionHref: '/candidates/profile',
        estimatedTime: '10 min',
      },
      {
        id: 'assessment',
        title: 'Take the SHIFT Assessment',
        description: 'Complete your leadership assessment to stand out to recruiters.',
        icon: <Target className="w-5 h-5" />,
        actionLabel: 'Start Assessment',
        actionHref: '/assessment',
        estimatedTime: '15 min',
      },
      {
        id: 'mandates',
        title: 'Browse Open Mandates',
        description: 'Explore executive search opportunities that match your profile.',
        icon: <Briefcase className="w-5 h-5" />,
        actionLabel: 'View Mandates',
        actionHref: '/candidates/mandates',
        estimatedTime: '5 min',
      },
    ],
  },
  client: {
    welcomeTitle: 'Welcome to Your Client Portal',
    welcomeMessage: 'Set up your organization and start your first executive search mandate.',
    skipLabel: 'Explore on my own',
    completeHref: '/client/overview',
    steps: [
      {
        id: 'org',
        title: 'Complete Organization Profile',
        description: 'Add your company details, hiring preferences, and team structure.',
        icon: <Briefcase className="w-5 h-5" />,
        actionLabel: 'Edit Organization',
        actionHref: '/client/onboarding',
        estimatedTime: '10 min',
      },
      {
        id: 'team',
        title: 'Invite Team Members',
        description: 'Add colleagues who should have access to the client portal.',
        icon: <Users className="w-5 h-5" />,
        actionLabel: 'Manage Team',
        actionHref: '/client/admin',
        estimatedTime: '5 min',
      },
      {
        id: 'mandate',
        title: 'Create Your First Mandate',
        description: 'Define the executive role you\'re looking to fill.',
        icon: <Target className="w-5 h-5" />,
        actionLabel: 'New Mandate',
        actionHref: '/client/mandates',
        estimatedTime: '15 min',
      },
    ],
  },
  student: {
    welcomeTitle: 'Welcome to LYC Academy',
    welcomeMessage: 'Start your learning journey. Complete these steps to access courses and track your progress.',
    skipLabel: 'Skip for now',
    completeHref: '/academy/dashboard',
    steps: [
      {
        id: 'profile',
        title: 'Set Up Your Learner Profile',
        description: 'Tell us about your learning goals and current skill level.',
        icon: <User className="w-5 h-5" />,
        actionLabel: 'Edit Profile',
        actionHref: '/academy/profile',
        estimatedTime: '3 min',
      },
      {
        id: 'assessment',
        title: 'Take the Skills Assessment',
        description: 'Identify your strengths and areas for growth.',
        icon: <Target className="w-5 h-5" />,
        actionLabel: 'Start Assessment',
        actionHref: '/assessment',
        estimatedTime: '15 min',
      },
      {
        id: 'course',
        title: 'Enroll in Your First Course',
        description: 'Browse the course catalog and start learning.',
        icon: <FileText className="w-5 h-5" />,
        actionLabel: 'Browse Courses',
        actionHref: '/academy/catalog',
        estimatedTime: '5 min',
      },
    ],
  },
};

interface ActivationFlowProps {
  portal: PortalType;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function ActivationFlow({ portal, onComplete, onSkip }: ActivationFlowProps) {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuthStore();
  const config = PORTAL_CONFIGS[portal];
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(true);

  // Load completion state from localStorage
  useEffect(() => {
    const key = `activation_${portal}_${profile?.id || 'guest'}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedSteps(new Set(parsed.completed || []));
        setCurrentStep(parsed.currentStep || 0);
        if (parsed.dismissed) {
          setIsVisible(false);
        }
      } catch {
        // ignore
      }
    }
  }, [portal, profile?.id]);

  // Save state to localStorage
  const saveState = (completed: Set<string>, step: number, dismissed = false) => {
    const key = `activation_${portal}_${profile?.id || 'guest'}`;
    localStorage.setItem(key, JSON.stringify({
      completed: Array.from(completed),
      currentStep: step,
      dismissed,
    }));
  };

  const handleStepAction = (href: string) => {
    navigate(href);
  };

  const handleStepComplete = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepId);
    setCompletedSteps(newCompleted);

    const nextStep = currentStep + 1;
    if (nextStep >= config.steps.length) {
      // All steps complete
      saveState(newCompleted, config.steps.length);
      onComplete?.();
      setIsVisible(false);
    } else {
      setCurrentStep(nextStep);
      saveState(newCompleted, nextStep);
    }
  };

  const handleSkip = () => {
    saveState(completedSteps, currentStep, true);
    onSkip?.();
    navigate(config.completeHref);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const step = config.steps[currentStep];
  const progress = (completedSteps.size / config.steps.length) * 100;
  const isLastStep = currentStep === config.steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-[#C108AB] px-6 py-5 text-white relative">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            {profile?.id ? (
              <Avatar name={profile.name} id={profile.id} size="sm" />
            ) : (
              <div className="w-8 h-8 bg-white/20 flex items-center justify-center" style={{ borderRadius: 0 }}>
                <Sparkles className="w-4 h-4" />
              </div>
            )}
            <Badge className="bg-white/20 text-white">
              Step {currentStep + 1} of {config.steps.length}
            </Badge>
          </div>
          <h2 className="font-serif font-bold text-xl">{config.welcomeTitle}</h2>
          <p className="text-sm text-white/80 mt-1">{config.welcomeMessage}</p>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 border-b border-[#E5E5E5]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-[#737373]">
              {completedSteps.size} of {config.steps.length} completed
            </span>
            <span className="text-xs text-[#A3A3A3]">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step indicators */}
        <div className="px-6 py-4 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-2">
            {config.steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => i <= currentStep && setCurrentStep(i)}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${
                    i === currentStep
                      ? 'text-[#C108AB] font-medium'
                      : completedSteps.has(s.id)
                      ? 'text-green-600'
                      : 'text-[#A3A3A3]'
                  }`}
                  disabled={i > currentStep}
                >
                  {completedSteps.has(s.id) ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : i === currentStep ? (
                    <Circle className="w-4 h-4 fill-[#C108AB] text-[#C108AB]" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{s.title}</span>
                </button>
                {i < config.steps.length - 1 && (
                  <div className={`flex-1 h-px ${i < currentStep ? 'bg-[#C108AB]' : 'bg-[#E5E5E5]'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current step content */}
        <div className="px-6 py-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-[#C108AB]/10 flex items-center justify-center flex-shrink-0" style={{ borderRadius: 0 }}>
              <div className="text-[#C108AB]">{step.icon}</div>
            </div>
            <div>
              <h3 className="font-semibold text-[#171717] mb-1">{step.title}</h3>
              <p className="text-sm text-[#737373]">{step.description}</p>
              <p className="text-xs text-[#A3A3A3] mt-2">Estimated time: {step.estimatedTime}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-[#737373] hover:text-[#171717] transition-colors"
            >
              {config.skipLabel}
            </button>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep(currentStep - 1)}>
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => handleStepAction(step.actionHref)}>
                {step.actionLabel}
              </Button>
              <Button size="sm" onClick={() => handleStepComplete(step.id)}>
                {isLastStep ? 'Finish' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * useActivationCheck — Hook to determine if activation flow should show
 */
export function useActivationCheck(portal: PortalType): { shouldShow: boolean; dismiss: () => void } {
  const { profile } = useAuthStore();

  const shouldShow = React.useMemo(() => {
    if (!profile) return false;
    const key = `activation_${portal}_${profile.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.dismissed) return false;
        if (parsed.completed && parsed.completed.length > 0) return false;
      } catch {
        // ignore
      }
    }
    // Show if profile was created recently (within 7 days)
    if (profile.created_at) {
      const created = new Date(profile.created_at);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return created > sevenDaysAgo;
    }
    return true;
  }, [portal, profile]);

  const dismiss = React.useCallback(() => {
    if (!profile) return;
    const key = `activation_${portal}_${profile.id}`;
    localStorage.setItem(key, JSON.stringify({ dismissed: true }));
  }, [portal, profile]);

  return { shouldShow, dismiss };
}

export default ActivationFlow;