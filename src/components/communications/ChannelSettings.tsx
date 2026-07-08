'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  MessageCircle,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Trash2,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui';

interface ChannelAccount {
  id: string;
  channel: 'outlook' | 'wecom' | 'wechat_manual';
  account_email?: string;
  account_name?: string;
  is_active: boolean;
  sync_status: 'idle' | 'syncing' | 'error' | 'auth_expired';
  last_sync_at?: string;
  error_message?: string;
  created_at: string;
}

export function ChannelSettings() {
  const [accounts, setAccounts] = useState<ChannelAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    loadChannelStatus();
  }, []);

  const loadChannelStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/channels/status');
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts || []);
      }
    } catch (e) {
      console.error('Failed to load channels:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectOutlook = () => {
    setIsConnecting(true);
    window.location.href = '/api/auth/microsoft/connect';
  };

  const handleSyncNow = async (accountId: string) => {
    setSyncingId(accountId);
    try {
      const res = await fetch('/api/cron/sync-emails', {
        method: 'POST',
        headers: {
          'x-cron-secret': localStorage.getItem('email_sync_cron_secret') || '',
        },
      });
      await loadChannelStatus();
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setSyncingId(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Disconnect this channel? You will need to reconnect to use it again.')) {
      return;
    }
    try {
      const res = await fetch('/api/channels/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId }),
      });
      const data = await res.json();
      if (data.success) {
        setAccounts(accounts.filter(a => a.id !== accountId));
      }
    } catch (e) {
      console.error('Disconnect failed:', e);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'syncing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'auth_expired':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'idle':
        return 'Connected';
      case 'syncing':
        return 'Syncing...';
      case 'error':
        return 'Sync Error';
      case 'auth_expired':
        return 'Auth Expired';
      default:
        return status;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'outlook':
        return <Mail className="w-5 h-5 text-blue-500" />;
      case 'wecom':
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      case 'wechat_manual':
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Settings className="w-5 h-5 text-gray-500" />;
    }
  };

  const getChannelName = (channel: string) => {
    switch (channel) {
      case 'outlook':
        return 'Outlook Email';
      case 'wecom':
        return 'WeCom (企业微信)';
      case 'wechat_manual':
        return 'WeChat Manual Logging';
      default:
        return channel;
    }
  };

  const outlookAccount = accounts.find(a => a.channel === 'outlook');

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-none p-8 text-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
        <p className="text-text-muted mt-2">Loading channels...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Channel Settings</h2>
        <p className="text-sm text-text-muted mt-1">
          Connect your email and messaging platforms to sync communications automatically.
        </p>
      </div>

      {/* Outlook Section */}
      <div className="bg-card border border-border rounded-none overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-blue-50 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Outlook Email</h3>
              <p className="text-xs text-text-muted">
                Send emails, sync replies, and auto-log outreach
              </p>
            </div>
          </div>
          {outlookAccount && outlookAccount.is_active ? (
            <div className="flex items-center gap-2">
              {getStatusIcon(outlookAccount.sync_status)}
              <span className="text-sm font-medium text-text-secondary">
                {getStatusText(outlookAccount.sync_status)}
              </span>
            </div>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-bg-alt text-text-muted">
              Not connected
            </span>
          )}
        </div>

        {outlookAccount && outlookAccount.is_active ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-text-primary">
                  {outlookAccount.account_name}
                </div>
                <div className="text-sm text-text-muted">
                  {outlookAccount.account_email}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-text-muted">Last sync</div>
                <div className="text-sm text-text-secondary">
                  {outlookAccount.last_sync_at
                    ? new Date(outlookAccount.last_sync_at).toLocaleString()
                    : 'Never'}
                </div>
              </div>
            </div>

            {outlookAccount.sync_status === 'error' && outlookAccount.error_message && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-none text-sm">
                {outlookAccount.error_message}
              </div>
            )}

            {outlookAccount.sync_status === 'auth_expired' && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-none text-sm">
                Authentication expired. Please reconnect your account.
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSyncNow(outlookAccount.id)}
                disabled={syncingId === outlookAccount.id}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncingId === outlookAccount.id ? 'animate-spin' : ''}`} />
                Sync Now
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleConnectOutlook}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Reconnect
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect(outlookAccount.id)}
                className="text-red-600 border-red-200 hover:bg-red-50 gap-2 ml-auto"
              >
                <Trash2 className="w-4 h-4" />
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h4 className="font-medium text-text-primary mb-1">
                  Connect your Outlook account
                </h4>
                <p className="text-sm text-text-muted mb-3">
                  Sync your email conversations, send emails directly from candidate profiles,
                  and automatically log replies as outreach events.
                </p>
                <ul className="text-xs text-text-muted space-y-1 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Send emails to candidates from the platform
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Auto-detect replies and update pipeline stage
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Unified timeline with all communications
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    OAuth 2.0 secure connection
                  </li>
                </ul>
              </div>
            </div>
            <Button
              onClick={handleConnectOutlook}
              disabled={isConnecting}
              className="gap-2"
            >
              {isConnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isConnecting ? 'Connecting...' : 'Connect Outlook'}
            </Button>
          </div>
        )}
      </div>

      {/* WeChat Section */}
      <div className="bg-card border border-border rounded-none overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-green-50 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">WeChat</h3>
              <p className="text-xs text-text-muted">
                Log WeChat interactions manually or via WeCom
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
            Always Available
          </span>
        </div>

        <div className="p-6">
          <p className="text-sm text-text-secondary mb-4">
            Personal WeChat accounts have no public API. Use the quick-log button on candidate
            pages to manually log interactions.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-none bg-bg-base border border-border">
              <div className="font-medium text-text-primary text-sm">Manual Logging</div>
              <p className="text-xs text-text-muted mt-1">
                Use the floating button on candidate pages to quickly log WeChat conversations,
                calls, and file shares.
              </p>
            </div>
            <div className="p-4 rounded-none bg-bg-base border border-border">
              <div className="font-medium text-text-primary text-sm">WeCom (Optional)</div>
              <p className="text-xs text-text-muted mt-1">
                For teams using 企业微信, connect via API for automated message sync
                and contact management.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-bg-alt border border-border rounded-none p-4">
        <h4 className="font-medium text-text-primary text-sm mb-2">Security & Privacy</h4>
        <p className="text-xs text-text-muted">
          All OAuth tokens are encrypted at rest using AES-256-GCM. Email content is stored
          securely and only accessible to authorized team members. You can disconnect any
          channel at any time.
        </p>
      </div>
    </div>
  );
}

export default ChannelSettings;
