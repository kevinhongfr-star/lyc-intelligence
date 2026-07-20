// Career Services Service — Coaching Portal career services
// Provides service catalog (static) + user-specific service status.

import { supabase } from '@/lib/supabase/client';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface CareerService {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'Available' | 'In Progress' | 'Completed';
  estimatedTime: string;
  credits: number;
}

export interface ServicePackage {
  id: string;
  name: string;
  price: string;
  services: string[];
  popular?: boolean;
}

export type ServiceStatus = CareerService['status'];

// ═══════════════════════════════════════════════════════════════
// SERVICE CATALOG (static, curated by LYC coaching team)
// ═══════════════════════════════════════════════════════════════

export const SERVICE_CATALOG: Omit<CareerService, 'status'>[] = [
  { id: 's1', title: 'Resume Review & Optimization', description: 'Expert feedback on resume structure, content, and impact', icon: 'FileText', estimatedTime: '3-5 days', credits: 5 },
  { id: 's2', title: 'LinkedIn Profile Makeover', description: 'Complete LinkedIn optimization for visibility', icon: 'Users', estimatedTime: '2-3 days', credits: 4 },
  { id: 's3', title: 'Interview Preparation', description: 'Mock interviews with detailed feedback', icon: 'Briefcase', estimatedTime: '1-2 weeks', credits: 8 },
  { id: 's4', title: 'Salary Negotiation Coaching', description: 'Strategy and tactics for compensation discussions', icon: 'DollarSign', estimatedTime: '1 week', credits: 6 },
  { id: 's5', title: 'Executive Presence Training', description: 'Communication and leadership presence', icon: 'Award', estimatedTime: '2-4 weeks', credits: 10 },
  { id: 's6', title: 'Career Strategy Session', description: 'Personalized career path planning', icon: 'Target', estimatedTime: '1 week', credits: 7 },
];

export const PACKAGE_CATALOG: ServicePackage[] = [
  {
    id: 'p1',
    name: 'Job Seeker',
    price: '$299',
    services: ['Resume Review', 'LinkedIn Optimization', '2 Mock Interviews', '30-day Support'],
  },
  {
    id: 'p2',
    name: 'Career Advancement',
    price: '$899',
    services: ['Everything in Job Seeker', 'Salary Negotiation', 'Executive Presence', '60-day Support', 'Weekly Coaching Sessions'],
    popular: true,
  },
  {
    id: 'p3',
    name: 'Executive',
    price: '$2,499',
    services: ['Everything in Career Advancement', 'Personal Brand Strategy', 'Board Preparation', '90-day Support', 'Dedicated Coach'],
  },
];

// ═══════════════════════════════════════════════════════════════
// SERVICE CLASS
// ═══════════════════════════════════════════════════════════════

class CareerServicesService {
  /**
   * Get user's service statuses. Returns a map of serviceId -> status.
   * Stored in profile metadata (coaching_services field).
   */
  async getUserServiceStatuses(userId: string): Promise<Record<string, ServiceStatus>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('coaching_services')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data?.coaching_services) {
        return this.getDefaultStatuses();
      }

      const raw = data.coaching_services;
      if (typeof raw === 'object' && raw !== null) {
        return raw as Record<string, ServiceStatus>;
      }
      return this.getDefaultStatuses();
    } catch (err) {
      console.warn('[CareerServicesService] getUserServiceStatuses failed:', err);
      return this.getDefaultStatuses();
    }
  }

  /**
   * Get services with user-specific status applied.
   */
  async getServices(userId: string): Promise<CareerService[]> {
    const statuses = await this.getUserServiceStatuses(userId);
    return SERVICE_CATALOG.map((s) => ({
      ...s,
      status: statuses[s.id] || 'Available',
    }));
  }

  /**
   * Update a service status for the user.
   */
  async updateServiceStatus(
    userId: string,
    serviceId: string,
    status: ServiceStatus
  ): Promise<boolean> {
    try {
      // Fetch current coaching_services
      const { data: profile } = await supabase
        .from('profiles')
        .select('coaching_services')
        .eq('id', userId)
        .maybeSingle();

      const current = (profile?.coaching_services as Record<string, ServiceStatus>) || {};
      const updated = { ...current, [serviceId]: status };

      const { error } = await supabase
        .from('profiles')
        .update({ coaching_services: updated })
        .eq('id', userId);

      return !error;
    } catch (err) {
      console.error('[CareerServicesService] updateServiceStatus failed:', err);
      return false;
    }
  }

  /**
   * Get packages (static catalog).
   */
  getPackages(): ServicePackage[] {
    return PACKAGE_CATALOG;
  }

  private getDefaultStatuses(): Record<string, ServiceStatus> {
    const defaults: Record<string, ServiceStatus> = {};
    SERVICE_CATALOG.forEach((s) => {
      defaults[s.id] = 'Available';
    });
    return defaults;
  }
}

export const careerServicesService = new CareerServicesService();

export default {
  careerServicesService,
  SERVICE_CATALOG,
  PACKAGE_CATALOG,
};