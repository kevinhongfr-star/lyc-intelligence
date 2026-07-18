/**
 * CookiePolicyPage — Cookie Policy
 * Issue #30: Legal Pages
 */
import React, { useState } from 'react';
import { Cookie, Shield, Eye, Settings, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';

interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  examples: string[];
  enabled: boolean;
}

export function CookiePolicyPage() {
  const [categories, setCategories] = useState<CookieCategory[]>([
    {
      id: 'essential',
      name: 'Essential Cookies',
      description: 'Required for the website to function properly. Cannot be disabled.',
      required: true,
      enabled: true,
      examples: ['Session tokens, authentication state, security tokens'],
    },
    {
      id: 'analytics',
      name: 'Analytical Cookies',
      description: 'Help us understand how visitors interact with our website to improve performance.',
      required: false,
      enabled: true,
      examples: ['Page views, session duration, traffic sources'],
    },
    {
      id: 'functional',
      name: 'Functional Cookies',
      description: 'Enable enhanced functionality and personalization.',
      required: false,
      enabled: true,
      examples: ['Theme preferences, language settings, saved filters'],
    },
    {
      id: 'marketing',
      name: 'Marketing Cookies',
      description: 'Used to deliver relevant advertisements and track campaign performance.',
      required: false,
      enabled: false,
      examples: ['Ad targeting, conversion tracking, remarketing'],
    },
  ]);

  const toggleCategory = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id && !c.required ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const acceptAll = () => {
    setCategories((prev) => prev.map((c) => ({ ...c, enabled: true })));
  };

  const rejectAll = () => {
    setCategories((prev) => prev.map((c) => (c.required ? c : { ...c, enabled: false })));
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[#E5E5E5]">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="flex items-center gap-2 text-[13px] text-[#6B6B6B] mb-2">
            <Cookie className="h-4 w-4" />
            Legal
          </div>
          <h1 className="text-[36px] font-serif text-[#1A1A1A]">Cookie Policy</h1>
          <p className="text-[14px] text-[#6B6B6B] mt-2">
            Last updated: July 2026
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-5 mb-8">
          <h2 className="text-[18px] font-serif text-[#1A1A1A] mb-2">Manage Cookie Preferences</h2>
          <p className="text-[14px] text-[#4A4A4A] mb-4">
            We use cookies to enhance your browsing experience, analyze site traffic, and serve relevant content.
            You can choose which categories of cookies to allow.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={acceptAll}>Accept All</Button>
            <Button size="sm" variant="outline" onClick={rejectAll}>Reject Non-Essential</Button>
            <Button size="sm" variant="ghost">Save Preferences</Button>
          </div>
        </div>

        <div className="space-y-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="border border-[#E5E5E5] rounded-lg p-4 bg-white"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-medium text-[#1A1A1A]">{cat.name}</h3>
                    {cat.required && (
                      <span className="text-[11px] text-[#6B6B6B] bg-[#F0F0F0] px-2 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-[#6B6B6B] mt-1">{cat.description}</p>
                  <div className="mt-2">
                    <p className="text-[12px] text-[#9B9B9B] mb-1">Examples:</p>
                    <p className="text-[12px] text-[#4A4A4A]">{cat.examples.join(', ')}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 pt-1">
                  <Switch
                    checked={cat.enabled}
                    onCheckedChange={() => toggleCategory(cat.id)}
                    disabled={cat.required}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="text-[22px] font-serif text-[#1A1A1A] mb-4">What are cookies?</h2>
          <p className="text-[14px] text-[#4A4A4A] leading-relaxed mb-4">
            Cookies are small text files that are placed on your computer or mobile device when you visit a website.
            They are widely used to make websites work more efficiently, as well as to provide information to
            the website owners. Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your
            device when you go offline, while session cookies are deleted as soon as you close your browser.
          </p>

          <h2 className="text-[22px] font-serif text-[#1A1A1A] mb-4 mt-8">How we use cookies</h2>
          <p className="text-[14px] text-[#4A4A4A] leading-relaxed mb-4">
            We use cookies for purposes described in each category above. Essential cookies are necessary for the website
            to function and cannot be switched off in our systems. They are usually only set in response to actions
            made by you which amount to a request for services, such as setting your privacy preferences,
            logging in, or filling in forms.
          </p>

          <h2 className="text-[22px] font-serif text-[#1A1A1A] mb-4 mt-8">Third-party cookies</h2>
          <p className="text-[14px] text-[#4A4A4A] leading-relaxed mb-4">
            Some cookies are placed by third-party services that appear on our pages, such as analytics providers
            and advertising partners. We do not have direct control over these cookies. You can check the
            respective third-party privacy policies for more information.
          </p>

          <h2 className="text-[22px] font-serif text-[#1A1A1A] mb-4 mt-8">How to manage cookies</h2>
          <p className="text-[14px] text-[#4A4A4A] leading-relaxed mb-4">
            Most web browsers allow you to control cookies through their settings. You can set your browser
            to refuse cookies or to delete cookies. However, if you disable cookies, some parts of our service
            may not function properly. For more information about how to manage cookies, visit your browser's
            help pages.
          </p>
        </section>
      </main>
    </div>
  );
}
