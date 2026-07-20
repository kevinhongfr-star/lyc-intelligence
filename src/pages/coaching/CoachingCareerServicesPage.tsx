/**
 * CoachingCareerServicesPage — B2C Coaching Portal career services
 * Renders inside AppShell → Outlet. Shows resume review, interview prep,
 * salary negotiation, and other career services.
 */
import React, { useState, useEffect } from 'react';
import { FileText, Briefcase, DollarSign, Users, Target, Award, CheckCircle2, Clock, ArrowRight, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import {
  careerServicesService,
  type CareerService,
  type ServicePackage,
  PACKAGE_CATALOG,
} from '@/services/careerServicesService';

const STATUS_COLORS: Record<string, string> = {
  Available: 'bg-blue/10 text-blue',
  'In Progress': 'bg-amber/10 text-amber',
  Completed: 'bg-green/10 text-green',
};

const ICON_MAP: Record<string, React.ReactNode> = {
  FileText: <FileText className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  Briefcase: <Briefcase className="w-5 h-5" />,
  DollarSign: <DollarSign className="w-5 h-5" />,
  Award: <Award className="w-5 h-5" />,
  Target: <Target className="w-5 h-5" />,
};

export function CoachingCareerServicesPage() {
  const [services, setServices] = useState<CareerService[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>(PACKAGE_CATALOG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { profile, user } = useTenantContext();

  const displayName = profile?.name || 'Coachee';
  const tier = profile?.tier || 'Professional';

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [svcs, pkgs] = await Promise.all([
          careerServicesService.getServices(user.id),
          Promise.resolve(careerServicesService.getPackages()),
        ]);
        if (cancelled) return;
        setServices(svcs);
        setPackages(pkgs);
      } catch (e) {
        console.error('[CoachingCareerServicesPage] Load error:', e);
        if (!cancelled) setError('Failed to load services');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const completedCount = services.filter(s => s.status === 'Completed').length;
  const inProgressCount = services.filter(s => s.status === 'In Progress').length;

  const handleServiceAction = async (serviceId: string, currentStatus: string) => {
    if (!user?.id) return;
    // Cycle: Available -> In Progress -> Completed -> Available
    const nextStatus: CareerService['status'] =
      currentStatus === 'Available' ? 'In Progress' :
      currentStatus === 'In Progress' ? 'Completed' : 'Available';

    // Optimistic update
    setServices(prev => prev.map(s => s.id === serviceId ? { ...s, status: nextStatus } : s));

    await careerServicesService.updateServiceStatus(user.id, serviceId, nextStatus);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Career Services</h1>
            <p className="text-text-secondary text-sm mt-1">Professional services to accelerate your career growth.</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted">{tier}</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <Card key={i} className="p-4">
              <div className="animate-pulse h-12 bg-bg-tertiary rounded" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="py-8 text-center text-red text-sm">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
                  <Target className="w-5 h-5 text-fuchsia" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-text-primary">{services.length}</div>
                  <div className="text-xs text-text-muted">Available Services</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-text-primary">{inProgressCount}</div>
                  <div className="text-xs text-text-muted">In Progress</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-text-primary">{completedCount}</div>
                  <div className="text-xs text-text-muted">Completed</div>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Service Packages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      pkg.popular
                        ? 'border-fuchsia bg-fuchsia-light/30 relative'
                        : 'border-border bg-bg-warm hover:border-fuchsia/50'
                    }`}
                  >
                    {pkg.popular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-fuchsia text-white">
                        Most Popular
                      </Badge>
                    )}
                    <div className="text-center mb-4">
                      <h3 className="font-serif font-bold text-xl text-text-primary mb-2">{pkg.name}</h3>
                      <div className="text-3xl font-bold text-fuchsia">{pkg.price}</div>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {pkg.services.map((service, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                          <CheckCircle2 className="w-4 h-4 text-fuchsia flex-shrink-0 mt-0.5" />
                          {service}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" variant={pkg.popular ? 'default' : 'outline'}>
                      Get Started <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Individual Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 bg-bg-warm rounded-lg">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center text-fuchsia flex-shrink-0">
                        {ICON_MAP[service.icon] || <Target className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-medium text-text-primary text-sm">{service.title}</div>
                        <div className="text-xs text-text-muted mt-1">{service.description}</div>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge className={STATUS_COLORS[service.status]}>{service.status}</Badge>
                          <span className="text-xs text-text-muted">⏱ {service.estimatedTime}</span>
                          <span className="text-xs text-fuchsia font-medium">{service.credits} credits</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={service.status === 'Completed'}
                      onClick={() => handleServiceAction(service.id, service.status)}
                    >
                      {service.status === 'Completed' ? 'Done' : service.status === 'In Progress' ? 'Continue' : 'Start'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default CoachingCareerServicesPage;