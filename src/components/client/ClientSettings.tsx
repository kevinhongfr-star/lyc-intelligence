import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  User,
  Bell,
  Shield,
  Mail,
  Globe,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function ClientSettings() {
  const { user, profile, updateProfile } = useAuthStore();
  const [companyName, setCompanyName] = useState(profile?.organization_name || '');
  const [primaryContact, setPrimaryContact] = useState(user?.email || '');
  const [notifications, setNotifications] = useState({
    newShortlist: true,
    interviewUpdate: true,
    reportReady: true,
  });

  const handleSave = () => {
    updateProfile?.({
      organization_name: companyName,
    });
  };

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-accent' : 'bg-gray-300'}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`}
      />
    </button>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-text-primary">Settings</h1>
        <p className="text-text-muted">Manage your profile and notification preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-accent" />
            Organization Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Company Name</label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter company name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Primary Contact Email</label>
            <Input
              type="email"
              value={primaryContact}
              onChange={(e) => setPrimaryContact(e.target.value)}
              placeholder="Enter email address"
              disabled
            />
          </div>
          <Button onClick={handleSave}>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-accent" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">New Shortlist</p>
              <p className="text-sm text-text-muted">Receive email when candidates are added to shortlist</p>
            </div>
            <ToggleSwitch
              enabled={notifications.newShortlist}
              onChange={(v) => setNotifications({ ...notifications, newShortlist: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">Interview Updates</p>
              <p className="text-sm text-text-muted">Receive email when interview status changes</p>
            </div>
            <ToggleSwitch
              enabled={notifications.interviewUpdate}
              onChange={(v) => setNotifications({ ...notifications, interviewUpdate: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">Report Ready</p>
              <p className="text-sm text-text-muted">Receive email when reports are available for download</p>
            </div>
            <ToggleSwitch
              enabled={notifications.reportReady}
              onChange={(v) => setNotifications({ ...notifications, reportReady: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">Two-Factor Authentication</p>
              <p className="text-sm text-text-muted">Add an extra layer of security to your account</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" />
                Enabled
              </span>
            </div>
          </div>
          <Button variant="ghost">Change Password</Button>
        </CardContent>
      </Card>
    </div>
  );
}
