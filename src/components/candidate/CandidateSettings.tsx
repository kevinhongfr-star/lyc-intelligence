import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Shield,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Check,
  Mail,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function CandidateSettings() {
  const [notifications, setNotifications] = useState({
    applicationUpdate: true,
    newOpportunity: true,
    interviewReminder: true,
    marketInsights: false,
  });

  const [profileVisibility, setProfileVisibility] = useState('lyc_network');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const handleExportData = () => {
    alert('Your data export will be sent to your email shortly.');
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      alert('Account deletion request submitted.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-text-primary">Settings</h1>
        <p className="text-text-muted">Manage your account preferences and privacy</p>
      </div>

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
              <p className="font-medium text-text-primary">Application Updates</p>
              <p className="text-sm text-text-muted">Get notified when application status changes</p>
            </div>
            <ToggleSwitch
              enabled={notifications.applicationUpdate}
              onChange={(v) => setNotifications({ ...notifications, applicationUpdate: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">New Opportunities</p>
              <p className="text-sm text-text-muted">Get notified about matching new mandates</p>
            </div>
            <ToggleSwitch
              enabled={notifications.newOpportunity}
              onChange={(v) => setNotifications({ ...notifications, newOpportunity: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">Interview Reminders</p>
              <p className="text-sm text-text-muted">Get reminders before scheduled interviews</p>
            </div>
            <ToggleSwitch
              enabled={notifications.interviewReminder}
              onChange={(v) => setNotifications({ ...notifications, interviewReminder: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">Market Insights</p>
              <p className="text-sm text-text-muted">Weekly career insights newsletter</p>
            </div>
            <ToggleSwitch
              enabled={notifications.marketInsights}
              onChange={(v) => setNotifications({ ...notifications, marketInsights: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5 text-accent" />
            Profile Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-text-primary">Who can see my profile?</label>
            <div className="space-y-2">
              {[
                { value: 'lyc_network', label: 'LYC Consultants Only', description: 'Only LYC team can view your profile' },
                { value: 'clients', label: 'LYC + Client Companies', description: 'Hiring companies can see anonymized profile' },
                { value: 'private', label: 'Private', description: 'Only visible to you' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setProfileVisibility(option.value)}
                  className={`w-full p-3 rounded-lg text-left transition-colors border ${
                    profileVisibility === option.value
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-text-primary">{option.label}</p>
                    {profileVisibility === option.value && (
                      <Check className="w-5 h-5 text-accent" />
                    )}
                  </div>
                  <p className="text-sm text-text-muted mt-1">{option.description}</p>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-accent" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Current Password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          <Button>Change Password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            Data & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Export My Data</p>
                <p className="text-sm text-text-muted">Download all your personal data</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleExportData}>
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-700">Delete Account</p>
                <p className="text-sm text-red-600">Permanently delete your account and all data</p>
              </div>
            </div>
            <Button variant="ghost" className="text-red-600 hover:text-red-700" onClick={handleDeleteAccount}>
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
