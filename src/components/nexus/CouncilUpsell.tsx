import React from 'react';
import { Crown, Zap, Award, Shield, ArrowRight } from 'lucide-react';

interface CouncilUpsellProps {
  trigger: 'trial' | 'insight' | 'usage';
  messageCount: number;
  onUpgrade: () => void;
}

export function CouncilUpsell({ trigger, messageCount, onUpgrade }: CouncilUpsellProps) {
  const getContent = () => {
    switch (trigger) {
      case 'trial':
        return {
          title: 'You\'re on the Free Trial',
          description: `You've sent ${messageCount} messages. Upgrade to Council for 5 credits/day + premium insights.`,
          highlight: 'Start your 14-day free trial',
        };
      case 'insight':
        return {
          title: 'Want Deeper Analysis?',
          description: 'Council members get SHIFT assessments + personalized coaching sessions.',
          highlight: 'Unlock premium features',
        };
      case 'usage':
        return {
          title: 'You\'re Getting Great Value!',
          description: `You've used ${messageCount} credits. Council subscription = $29/mo for 5 credits/day + unlimited insights.`,
          highlight: 'Subscribe now',
        };
    }
  };

  const content = getContent();

  return (
    <div className="bg-gradient-to-r from-accent/5 to-purple-50 border border-accent/20 rounded-xl p-5 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-accent" />
            <h4 className="font-semibold text-text-primary">{content.title}</h4>
          </div>
          <p className="text-sm text-text-muted mb-3">{content.description}</p>
          <button
            onClick={onUpgrade}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            {content.highlight}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="ml-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Zap className="w-4 h-4 text-accent" />
            <span>5 credits/day</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Award className="w-4 h-4 text-accent" />
            <span>SHIFT assessments</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Shield className="w-4 h-4 text-accent" />
            <span>Priority support</span>
          </div>
        </div>
      </div>
    </div>
  );
}