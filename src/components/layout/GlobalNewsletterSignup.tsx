/**
 * Global Newsletter Signup (T-604)
 * Persistent newsletter signup component for site-wide use.
 */
import React, { useState } from 'react';

export const GlobalNewsletterSignup: React.FC<{ variant?: 'banner' | 'popup' | 'inline' }> = ({ variant = 'banner' }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit to Resend API
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-lg bg-green-50 p-4 text-center text-sm text-green-700">
        ✓ You're subscribed! Check your inbox for confirmation.
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="bg-slate-900 py-4 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6">
          <p className="text-sm">Get weekly leadership intelligence →</p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-white placeholder-slate-400" />
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium hover:bg-blue-700">Subscribe</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm" />
      <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Subscribe</button>
    </form>
  );
};

export default GlobalNewsletterSignup;
