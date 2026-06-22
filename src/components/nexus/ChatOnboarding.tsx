import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { NexusChat } from './NexusChat';
import { SignupPrompt } from './SignupPrompt';
import { ProfileCompletion } from './ProfileCompletion';
import { getCreditBalance, checkAndGrantDailyCredits } from '@/services/creditService';

interface ChatOnboardingProps {
  onComplete?: () => void;
}

type OnboardingState = 'chatting' | 'signup-prompt' | 'profile' | 'completed';

export function ChatOnboarding({ onComplete }: ChatOnboardingProps) {
  const { user, profile, initialize } = useAuthStore();
  const [onboardingState, setOnboardingState] = useState<OnboardingState>('chatting');
  const [messageCount, setMessageCount] = useState(0);
  const [guestMode, setGuestMode] = useState(false);
  const [guestMessagesLeft, setGuestMessagesLeft] = useState(2);

  const FREE_TRIAL_LIMIT = 5;
  const GUEST_LIMIT = 2;

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Load anonymous message count from localStorage
    const anonymousCount = localStorage.getItem('anonymous_message_count');
    if (anonymousCount) {
      setMessageCount(parseInt(anonymousCount, 10));
    }
  }, []);

  useEffect(() => {
    // Save message count to localStorage
    localStorage.setItem('anonymous_message_count', messageCount.toString());
  }, [messageCount]);

  useEffect(() => {
    // Check if user just signed up and needs to complete profile
    if (user && !profile?.name) {
      setOnboardingState('profile');
    } else if (user) {
      setOnboardingState('completed');
      onComplete?.();
    }
  }, [user, profile]);

  const handleMessageSent = useCallback(() => {
    if (user) return;

    const newCount = messageCount + 1;
    setMessageCount(newCount);

    // Check if we need to show signup prompt
    if (newCount === FREE_TRIAL_LIMIT) {
      setOnboardingState('signup-prompt');
    } else if (guestMode && newCount >= FREE_TRIAL_LIMIT + GUEST_LIMIT) {
      setOnboardingState('signup-prompt');
    }
  }, [messageCount, user, guestMode]);

  const handleSignUp = useCallback(() => {
    setOnboardingState('profile');
    localStorage.removeItem('anonymous_message_count');
  }, []);

  const handleContinueAsGuest = useCallback(() => {
    setGuestMode(true);
    setOnboardingState('chatting');
  }, []);

  const handleProfileComplete = useCallback(() => {
    setOnboardingState('completed');
    onComplete?.();
  }, [onComplete]);

  const handleProfileSkip = useCallback(() => {
    setOnboardingState('completed');
    onComplete?.();
  }, [onComplete]);

  const shouldShowSignupPrompt = () => {
    if (user) return false;
    if (onboardingState !== 'signup-prompt') return false;
    return true;
  };

  const handleCreditBalance = async (): Promise<{ balance: number; tier: string } | null> => {
    if (!user?.id) return null;
    await checkAndGrantDailyCredits(user.id);
    const creditInfo = await getCreditBalance(user.id);
    return creditInfo || null;
  };

  return (
    <div className="min-h-screen">
      {/* Show profile completion modal if needed */}
      {onboardingState === 'profile' && (
        <ProfileCompletion
          onComplete={handleProfileComplete}
          onSkip={handleProfileSkip}
        />
      )}

      {/* Chat interface */}
      <div className="relative">
        <NexusChat
          showHeader={true}
          onMessageSent={handleMessageSent}
          onCreditCheck={handleCreditBalance}
        />

        {/* Signup prompt overlay */}
        {shouldShowSignupPrompt() && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 shadow-xl z-40">
            <div className="max-w-2xl mx-auto">
              <SignupPrompt
                messageCount={messageCount}
                onSignUp={handleSignUp}
                onContinueAsGuest={handleContinueAsGuest}
              />
            </div>
          </div>
        )}

        {/* Guest mode warning */}
        {guestMode && guestMessagesLeft > 0 && (
          <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg z-40">
            {guestMessagesLeft} message{guestMessagesLeft === 1 ? '' : 's'} remaining as guest
          </div>
        )}
      </div>
    </div>
  );
}