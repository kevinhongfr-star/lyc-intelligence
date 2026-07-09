/**
 * ClientOnboardingPage — B2B Client Portal onboarding checklist
 * Renders inside AppShell → Outlet. Shows step-by-step onboarding
 * process, setup tasks, and quick start guide.
 */
import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ArrowRight, User, Settings, FileText, Users, Briefcase, Sparkles, Lightbulb } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { getClientOnboardingStatus } from '@/services/supabaseApi';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  estimatedTime: string;
}

interface QuickStartItem {
  id: string;
  title: string;
  description: string;
  action: string;
}

interface ResourceLink {
  id: string;
  title: string;
  category: 'Guide' | 'Video' | 'FAQ';
  description: string;
}

const STATIC_STEPS: OnboardingStep[] = [
  { id: 's1', title: 'Profile Setup', description: 'Complete your organization profile and preferences', icon: <User className="w-5 h-5" />, completed: true, estimatedTime: '5 min' },
  { id: 's2', title: 'Team Invitation', description: 'Add team members and set permissions', icon: <Users className="w-5 h-5" />, completed: true, estimatedTime: '10 min' },
  { id: 's3', title: 'First Mandate', description: 'Create your first executive search mandate', icon: <Briefcase className="w-5 h-5" />, completed: false, estimatedTime: '15 min' },
  { id: 's4', title: 'Document Upload', description: 'Upload company documents and branding', icon: <FileText className="w-5 h-5" />, completed: false, estimatedTime: '5 min' },
  { id: 's5', title: 'Integration Setup', description: 'Connect your ATS and HR systems', icon: <Settings className="w-5 h-5" />, completed: false, estimatedTime: '20 min' },
];

const STATIC_QUICKSTART: QuickStartItem[] = [
  { id: 'q1', title: 'Create a Mandate', description: 'Start your first executive search with our guided wizard', action: 'Get Started' },
  { id: 'q2', title: 'Search Talent Pool', description: 'Explore our pre-qualified executive candidates', action: 'Browse Candidates' },
  { id: 'q3', title: 'Schedule Demo', description: 'Book a 1:1 with our team to learn more', action: 'Schedule Now' },
];

const STATIC_RESOURCES: ResourceLink[] = [
  { id: 'r1', title: 'Client Portal Guide', category: 'Guide', description: 'Learn how to navigate and use all features' },
  { id: 'r2', title: 'Executive Search Best Practices', category: 'Video', description: '30-minute training video' },
  { id: 'r3', title: 'FAQ: Getting Started', category: 'FAQ', description: 'Answers to common questions' },
  { id: 'r4', title: 'API Integration Docs', category: 'Guide', description: 'Connect your systems with our API' },
];

export function ClientOnboardingPage() {
  const [steps, setSteps] = useState<OnboardingStep[]>(STATIC_STEPS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { clientAccount, profile } = useTenantContext();

  useEffect(() => {
    const clientAccountId = clientAccount?.id;
    if (!clientAccountId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const status = await getClientOnboardingStatus(clientAccountId);
        if (cancelled) return;
        setSteps(prev => prev.map(step =>
          step.id === 's3' ? { ...step, completed: status.mandateAccessCount > 0 } : step
        ));
      } catch (e) {
        console.error('[ClientOnboardingPage] Error:', e);
        if (!cancelled) setError('Failed to load onboarding status');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clientAccount?.id]);

  const completedSteps = steps.filter(s => s.completed).length;
  const progressPercent = steps.length ? Math.round((completedSteps / steps.length) * 100) : 0;

  const displayName = clientAccount?.name || profile?.name || 'Client User';
  const organization = clientAccount?.organization || 'Your Organization';

  const categoryColors: Record<string, string> = {
    Guide: 'bg-blue/10 text-blue',
    Video: 'bg-green/10 text-green',
    FAQ: 'bg-amber/10 text-amber',
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Onboarding</h1>
            <p className="text-text-secondary text-sm mt-1">Complete your setup and start finding executive talent.</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted">{organization}</div>
            </div>
          </div>
        </div>
      </div>

      <Card className="bg-fuchsia-light/30 border-fuchsia/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6 text-fuchsia" />
                <span className="font-serif font-bold text-xl text-text-primary">Welcome to DEX AI</span>
              </div>
              <p className="text-text-secondary text-sm">
                We're excited to help you find top executive talent. Complete the onboarding steps below to get started.
              </p>
            </div>
            <div className="text-center md:text-right">
              <div className="text-4xl font-bold text-fuchsia">{progressPercent}%</div>
              <div className="text-xs text-text-muted mt-1">Onboarding Complete</div>
            </div>
          </div>
          <div className="mt-4 h-2 bg-bg-tertiary rounded-full overflow-hidden">
            <div className="h-full bg-fuchsia rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Circle className="w-5 h-5 text-fuchsia" />
            <CardTitle>Onboarding Checklist</CardTitle>
            <Badge variant="outline" className="ml-auto text-xs">
              {completedSteps}/{steps.length} completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-text-muted text-sm">Loading steps...</div>
          ) : !clientAccount?.id ? (
            <EmptyState title="No client account available" description="We couldn't load your onboarding checklist because no client account is associated with your user." />
          ) : error ? (
            <EmptyState title="Failed to load onboarding status" description={error} />
          ) : (
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-4 p-4 bg-bg-warm rounded-lg">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    step.completed ? 'bg-green/10 text-green' : 'bg-bg-tertiary text-text-muted'
                  }`}>
                    {step.completed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${step.completed ? 'text-text-primary' : 'text-text-secondary'}`}>
                        {step.title}
                      </span>
                      <span className="text-xs text-text-muted">{step.estimatedTime}</span>
                    </div>
                    <div className="text-sm text-text-muted mt-1">{step.description}</div>
                  </div>
                  {!step.completed && (
                    <Button variant="outline" size="sm">
                      Start <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-fuchsia" />
              <CardTitle>Quick Start</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {STATIC_QUICKSTART.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-bg-warm rounded-lg">
                  <div>
                    <div className="font-medium text-text-primary text-sm">{item.title}</div>
                    <div className="text-xs text-text-muted mt-1">{item.description}</div>
                  </div>
                  <Button variant="outline" size="sm">
                    {item.action} <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-fuchsia" />
              <CardTitle>Resources</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {STATIC_RESOURCES.map((resource) => (
                <button key={resource.id} className="w-full text-left p-3 hover:bg-bg-warm rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge className={categoryColors[resource.category]}>{resource.category}</Badge>
                    <div className="flex-1">
                      <div className="font-medium text-text-primary text-sm">{resource.title}</div>
                      <div className="text-xs text-text-muted">{resource.description}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-muted" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-fuchsia-light flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-fuchsia" />
              </div>
              <div className="font-medium text-text-primary text-sm mb-1">Live Chat</div>
              <div className="text-xs text-text-muted">Get instant support from our team</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue/10 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue" />
              </div>
              <div className="font-medium text-text-primary text-sm mb-1">Account Manager</div>
              <div className="text-xs text-text-muted">Schedule a 1:1 with your dedicated AM</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-green" />
              </div>
              <div className="font-medium text-text-primary text-sm mb-1">Knowledge Base</div>
              <div className="text-xs text-text-muted">Explore our help documentation</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ClientOnboardingPage;