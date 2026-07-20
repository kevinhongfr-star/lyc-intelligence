// Intelligence Service — Coaching Portal AI-powered recommendations
// Generates personalized growth recommendations based on user profile,
// session history, and assessment data.

import type { CoachingSession } from '@/services/supabaseApi';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'Growth' | 'Career' | 'Skills' | 'Network';
  priority: 'High' | 'Medium' | 'Low';
  score: number;
}

export interface UserContext {
  role?: string;
  tier?: string;
  completedSessions: number;
  upcomingCount: number;
  completionRate: number;
  skills?: string[];
  goals?: string[];
}

// ═══════════════════════════════════════════════════════════════
// RECOMMENDATION GENERATOR
// ═══════════════════════════════════════════════════════════════

class IntelligenceService {
  /**
   * Generate AI-driven personalized recommendations.
   * Uses deterministic rules based on user context — in production, this would
   * call an LLM to generate truly personalized suggestions.
   */
  async generateRecommendations(context: UserContext): Promise<Recommendation[]> {
    const recs: Recommendation[] = [];
    const { role, completedSessions, completionRate, tier, goals } = context;

    // Priority weights for different dimensions
    const scoreBase = Math.random() * 0.2;

    // Career recommendations based on role
    if (role && role.toLowerCase().includes('engineer')) {
      recs.push({
        id: `rec-${Date.now()}-1`,
        title: 'System Design Mastery',
        description: 'Deepen your technical architecture skills with targeted practice sessions.',
        category: 'Skills',
        priority: 'High',
        score: 0.9 + scoreBase,
      });
    }

    if (role && role.toLowerCase().includes('manager')) {
      recs.push({
        id: `rec-${Date.now()}-2`,
        title: 'Leadership Communication',
        description: 'Strengthen executive presence through presentation coaching.',
        category: 'Growth',
        priority: 'High',
        score: 0.85 + scoreBase,
      });
    }

    if (role && role.toLowerCase().includes('product')) {
      recs.push({
        id: `rec-${Date.now()}-3`,
        title: 'Strategic Thinking',
        description: 'Develop long-range product vision and stakeholder alignment skills.',
        category: 'Skills',
        priority: 'Medium',
        score: 0.8 + scoreBase,
      });
    }

    // Network recommendations based on tier
    if (tier === 'Enterprise' || tier === 'Executive') {
      recs.push({
        id: `rec-${Date.now()}-4`,
        title: 'Executive Network Expansion',
        description: 'Connect with 3 senior leaders in your target companies this month.',
        category: 'Network',
        priority: 'High',
        score: 0.88 + scoreBase,
      });
    } else {
      recs.push({
        id: `rec-${Date.now()}-5`,
        title: 'Industry Connections',
        description: 'Build relationships with peers in your domain.',
        category: 'Network',
        priority: 'Medium',
        score: 0.7 + scoreBase,
      });
    }

    // Progress-based recommendations
    if (completionRate >= 70) {
      recs.push({
        id: `rec-${Date.now()}-6`,
        title: 'Accelerate Growth',
        description: 'You\'re consistently completing sessions — challenge yourself with advanced topics.',
        category: 'Growth',
        priority: 'Medium',
        score: 0.75 + scoreBase,
      });
    } else if (completionRate < 50) {
      recs.push({
        id: `rec-${Date.now()}-7`,
        title: 'Consistency First',
        description: 'Focus on maintaining a regular session cadence to build momentum.',
        category: 'Growth',
        priority: 'High',
        score: 0.92 + scoreBase,
      });
    }

    // Session count recommendations
    if (completedSessions >= 10) {
      recs.push({
        id: `rec-${Date.now()}-8`,
        title: 'Career Reassessment',
        description: 'Schedule a review session to evaluate progress and adjust goals.',
        category: 'Career',
        priority: 'Medium',
        score: 0.72 + scoreBase,
      });
    }

    // Goal-based recommendations
    if (goals && goals.length > 0) {
      const hasPromotionGoal = goals.some(g => g.toLowerCase().includes('promotion'));
      if (hasPromotionGoal) {
        recs.push({
          id: `rec-${Date.now()}-9`,
          title: 'Promotion Readiness',
          description: 'Prepare for your next role with targeted skill development and networking.',
          category: 'Career',
          priority: 'High',
          score: 0.86 + scoreBase,
        });
      }

      const hasSwitchGoal = goals.some(g => g.toLowerCase().includes('switch') || g.toLowerCase().includes('pivot'));
      if (hasSwitchGoal) {
        recs.push({
          id: `rec-${Date.now()}-10`,
          title: 'Career Transition Plan',
          description: 'Develop a structured approach to your career pivot with your coach.',
          category: 'Career',
          priority: 'High',
          score: 0.84 + scoreBase,
        });
      }
    }

    // Always include a baseline career recommendation
    if (!recs.some(r => r.category === 'Career')) {
      recs.push({
        id: `rec-${Date.now()}-11`,
        title: 'Career Narrative Refresh',
        description: 'Refine your professional positioning to align with your aspirations.',
        category: 'Career',
        priority: 'Medium',
        score: 0.73 + scoreBase,
      });
    }

    // Sort by score (priority + quality) and return top 4
    return recs
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }

  /**
   * Extract user context from profile and session data.
   */
  extractContext(profile: any, past: CoachingSession[], upcoming: CoachingSession[]): UserContext {
    const completedSessions = past.filter(s => s.status === 'completed').length;
    const completionRate = past.length > 0 ? Math.round((completedSessions / past.length) * 100) : 0;

    return {
      role: profile?.role || profile?.current_title,
      tier: profile?.tier,
      completedSessions,
      upcomingCount: upcoming.length,
      completionRate,
      skills: profile?.skills,
      goals: profile?.career_goals,
    };
  }
}

export const intelligenceService = new IntelligenceService();

export default {
  intelligenceService,
};