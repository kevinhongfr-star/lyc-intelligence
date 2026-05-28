import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Palette, Sun, Moon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts';

const ACCENT_COLORS = [
  { name: 'Magenta', value: '#C108AB' },
  { name: 'Indigo', value: '#00897B' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Amber', value: '#F59E0B' },
];

export function SettingsPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'profile' | 'notifications' | 'security' | 'appearance'>('appearance');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('lyc-theme') as 'dark' | 'light') || 'light';
  });
  const [accent, setAccent] = useState(() => localStorage.getItem('lyc-accent') || '#C108AB');
  const [notifications, setNotifications] = useState({
    mandateStatus: true, candidateMatches: true, phiAlerts: true, scoringComplete: true,
  });

  // Apply theme via data-theme attribute — CSS variables handle the rest
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lyc-theme', theme);
    window.dispatchEvent(new CustomEvent('theme-change', { detail: theme }));
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-light', accent);
    localStorage.setItem('lyc-accent', accent);
  }, [accent]);

  const sections = [
    { key: 'appearance' as const, icon: Palette, label: 'Appearance' },
    { key: 'profile' as const, icon: User, label: 'Profile' },
    { key: 'notifications' as const, icon: Bell, label: 'Notifications' },
    { key: 'security' as const, icon: Shield, label: 'Security' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif font-bold text-text-primary">Settings</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="space-y-1">
          {sections.map(s => (
            <button key={s.key} onClick={() => setActiveSection(s.key)}
              className={`flex items-center gap-3 w-full px-3 py-3 text-sm rounded-lg min-h-[44px] ${activeSection === s.key ? 'bg-accent/10 text-accent' : 'text-text-muted hover:bg-bg-tertiary'}`}>
              <s.icon className="w-4 h-4" />{s.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          {activeSection === 'appearance' && (
            <Card>
              <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-text-primary mb-3">Theme</p>
                  <div className="flex gap-3">
                    <button onClick={() => setTheme('dark')}
                      className={`w-20 h-24 rounded-lg bg-[#0A0A0A] border-2 flex flex-col items-center justify-center transition-colors ${theme === 'dark' ? 'border-accent' : 'border-bg-tertiary'}`}>
                      <Moon className="w-5 h-5 text-white mb-2" />
                      <span className="text-[10px] text-white">Dark</span>
                    </button>
                    <button onClick={() => setTheme('light')}
                      className={`w-20 h-24 rounded-lg bg-white border-2 flex flex-col items-center justify-center transition-colors ${theme === 'light' ? 'border-accent' : 'border-bg-tertiary'}`}>
                      <Sun className="w-5 h-5 text-gray-800 mb-2" />
                      <span className="text-[10px] text-gray-800">Light</span>
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary mb-2">Accent Color</p>
                  <div className="flex gap-3">
                    {ACCENT_COLORS.map(c => (
                      <button key={c.value} onClick={() => setAccent(c.value)}
                        className={`w-10 h-10 rounded-full border-2 transition-colors ${accent === c.value ? 'border-accent scale-110' : 'border-bg-tertiary opacity-60 hover:opacity-100'}`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'profile' && (
            <Card>
              <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><label className="text-xs text-text-muted mb-1 block">Name</label><Input value={user?.name ?? ''} readOnly /></div>
                <div><label className="text-xs text-text-muted mb-1 block">Email</label><Input value={user?.email ?? ''} readOnly /></div>
                <div><label className="text-xs text-text-muted mb-1 block">Role</label><Input value={user?.role ?? ''} readOnly /></div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card>
              <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'mandateStatus' as const, label: 'Mandate status changes', desc: 'Get notified when mandates move between stages' },
                  { key: 'candidateMatches' as const, label: 'New candidate matches', desc: 'Alert when high-match candidates are identified' },
                  { key: 'phiAlerts' as const, label: 'PHI health alerts', desc: 'Red/Amber mandate health warnings' },
                  { key: 'scoringComplete' as const, label: 'Scoring run completed', desc: 'When batch TRIDENT evaluations finish' },
                ].map(pref => (
                  <div key={pref.key} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                    <div><p className="text-sm text-text-primary">{pref.label}</p><p className="text-xs text-text-muted">{pref.desc}</p></div>
                    <button onClick={() => setNotifications(p => ({ ...p, [pref.key]: !p[pref.key] }))}
                      className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${notifications[pref.key] ? 'bg-accent' : 'bg-bg-hover'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${notifications[pref.key] ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card>
              <CardHeader><CardTitle>Security</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-bg-tertiary rounded-lg">
                  <p className="text-sm font-medium text-text-primary">Two-Factor Authentication</p>
                  <p className="text-xs text-text-muted mt-1">Add an extra layer of security to your account</p>
                  <Button variant="outline" size="sm" className="mt-3">Enable 2FA</Button>
                </div>
                <div className="p-4 bg-bg-tertiary rounded-lg">
                  <p className="text-sm font-medium text-text-primary">Active Sessions</p>
                  <p className="text-xs text-text-muted mt-1">Current session: {user?.email ?? 'Unknown'}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
