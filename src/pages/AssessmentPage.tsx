import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AssessmentWizard } from '../components/assessment/AssessmentWizard';
import { useAuthStore } from '../stores/authStore';
import { UpgradeModal } from '../components/credits/UpgradeModal';
import { CREDIT_COSTS } from '../components/credits/CreditGate';
import { Lock, Loader2 } from 'lucide-react';

import { DS } from '@/lib/designSystem';

export function AssessmentPage() {
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuthStore();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const prefillEmail = searchParams.get('email') || profile?.email || '';
  const prefillName = searchParams.get('name') || profile?.name || '';

  const cost = CREDIT_COSTS.assessment;
  const credits = profile?.credits?.balance ?? 0;
  const tier = profile?.tier || 'free';

  useEffect(() => {
    // Short delay to allow profile to load
    const timer = setTimeout(() => setIsChecking(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Paid tiers bypass credit check
  const hasAccess = tier !== 'free' || credits >= cost;

  if (isChecking) {
    return (
      <div style={{ minHeight: '100vh', background: DS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: 32, height: 32, color: DS.accent, animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div style={{ minHeight: '100vh', background: DS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{
          maxWidth: '440px', width: '100%', textAlign: 'center',
          padding: '48px 32px', background: DS.card,
          border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius,
          boxShadow: DS.shadow
        }}>
          <Lock style={{ width: 48, height: 48, color: DS.muted, margin: '0 auto 20px' }} />
          <h2 style={{ fontFamily: DS.headingFont, fontSize: '22px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>
            Assessment Requires Credits
          </h2>
          <p style={{ fontFamily: DS.bodyFont, fontSize: '14px', color: DS.muted, marginBottom: '8px' }}>
            The Career Positioning Diagnostic requires <strong>{cost} credit</strong>.
          </p>
          <p style={{ fontFamily: DS.bodyFont, fontSize: '14px', color: DS.muted, marginBottom: '24px' }}>
            You have <strong>{credits} credits</strong> remaining.
          </p>
          <button
            onClick={() => setShowUpgrade(true)}
            className="cta-glow"
            style={{
              padding: '14px 32px', background: DS.accent, color: '#FFFFFF',
              border: 'none', borderRadius: '8px', fontSize: '15px',
              fontWeight: 600, cursor: 'pointer', minHeight: '44px'
            }}
          >
            Upgrade to Continue
          </button>
          <p style={{ fontFamily: DS.bodyFont, fontSize: '12px', color: DS.muted, marginTop: '16px' }}>
            Or <a href="/login" style={{ color: DS.accent }}>sign in</a> to use your daily free credits
          </p>
        </div>
        {showUpgrade && (
          <UpgradeModal
            onClose={() => setShowUpgrade(false)}
            requiredCredits={cost}
            currentCredits={credits}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      <AssessmentWizard 
        prefillEmail={prefillEmail} 
        prefillName={prefillName} 
      />
    </div>
  );
}
