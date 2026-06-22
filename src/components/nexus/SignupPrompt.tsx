import React, { useState } from 'react';
import { UserPlus, Mail, Lock, ArrowRight, Loader2, X, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface SignupPromptProps {
  messageCount: number;
  onSignUp: () => void;
  onContinueAsGuest: () => void;
}

export function SignupPrompt({ messageCount, onSignUp, onContinueAsGuest }: SignupPromptProps) {
  const { signUp, profile } = useAuthStore();
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(profile?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password || !name) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      setLoading(false);
      return;
    }

    const result = await signUp(email, password, '', name);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        setShowSignupForm(false);
        setSuccess(false);
        setEmail('');
        setPassword('');
        setName('');
        onSignUp();
      }, 2000);
    } else {
      setError(result.error || null);
    }

    setLoading(false);
  };

  if (showSignupForm) {
    return (
      <div className="bg-gradient-to-r from-accent to-purple-600 rounded-xl p-6 mb-4">
        <button
          onClick={() => setShowSignupForm(false)}
          className="float-right text-white/70 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center text-white py-4">
            <CheckCircle className="w-12 h-12 mx-auto mb-3" />
            <p className="font-semibold">Check your email!</p>
            <p className="text-sm text-white/80 mt-1">A verification link has been sent.</p>
          </div>
        ) : (
          <>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Create Your Account
            </h3>
            
            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              {error && (
                <p className="text-red-300 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-white text-accent rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Sign Up
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-white/60 text-xs mt-3 text-center">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-amber-800 font-semibold">
            {messageCount >= 7 ? 'Limit reached!' : 'Continue with an account'}
          </p>
          <p className="text-amber-600 text-sm mt-1">
            {messageCount >= 7 
              ? 'Please sign up to continue chatting with Nexus.'
              : `You've used ${messageCount} free messages. Create an account for 2 credits/day!`
            }
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSignupForm(true)}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Sign Up
          </button>
          {messageCount < 7 && (
            <button
              onClick={onContinueAsGuest}
              className="px-4 py-2 bg-white text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors border border-amber-300"
            >
              Continue as Guest
            </button>
          )}
        </div>
      </div>
    </div>
  );
}