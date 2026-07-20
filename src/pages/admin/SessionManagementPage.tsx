/**
 * SessionManagementPage.tsx — Active Session Management
 * View and manage user sessions, revoke sessions
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  User,
  Device,
  MapPin,
  Clock,
  LogOut,
  Shield,
  AlertCircle,
} from 'lucide-react';

interface ActiveSession {
  id: string;
  userId: string;
  userName: string;
  email: string;
  role: string;
  device: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  lastActivity: string;
  expiresAt: string;
  isCurrent: boolean;
  isVerified: boolean;
}

const MOCK_SESSIONS: ActiveSession[] = [
  { id: 's1', userId: 'u1', userName: 'Sarah Chen', email: 'sarah@example.com', role: 'candidate', device: 'Desktop', browser: 'Chrome', os: 'macOS', ipAddress: '192.168.1.100', location: 'Singapore', lastActivity: '2026-07-20T14:30:00Z', expiresAt: '2026-07-21T14:30:00Z', isCurrent: true, isVerified: true },
  { id: 's2', userId: 'u1', userName: 'Sarah Chen', email: 'sarah@example.com', role: 'candidate', device: 'Mobile', browser: 'Safari', os: 'iOS', ipAddress: '10.0.0.50', location: 'Singapore', lastActivity: '2026-07-20T12:15:00Z', expiresAt: '2026-07-21T12:15:00Z', isCurrent: false, isVerified: true },
  { id: 's3', userId: 'u2', userName: 'Kevin Hong', email: 'kevin@lyc-intelligence.com', role: 'super_admin', device: 'Desktop', browser: 'Firefox', os: 'Windows', ipAddress: '172.16.0.20', location: 'Hong Kong', lastActivity: '2026-07-20T10:00:00Z', expiresAt: '2026-07-21T10:00:00Z', isCurrent: false, isVerified: true },
  { id: 's4', userId: 'u3', userName: 'James Wilson', email: 'james@example.com', role: 'client', device: 'Desktop', browser: 'Chrome', os: 'macOS', ipAddress: '192.168.0.88', location: 'Tokyo', lastActivity: '2026-07-19T18:45:00Z', expiresAt: '2026-07-20T18:45:00Z', isCurrent: false, isVerified: true },
  { id: 's5', userId: 'u4', userName: 'Anonymous User', email: '-', role: 'public', device: 'Desktop', browser: 'Edge', os: 'Windows', ipAddress: '10.0.0.100', location: 'Sydney', lastActivity: '2026-07-20T08:30:00Z', expiresAt: '2026-07-20T09:30:00Z', isCurrent: false, isVerified: false },
];

export function SessionManagementPage() {
  const [sessions, setSessions] = useState<ActiveSession[]>(MOCK_SESSIONS);
  const [loading, setLoading] = useState(false);

  async function revokeSession(id: string) {
    if (!confirm('Revoke this session?')) return;
    setSessions(sessions.filter(s => s.id !== id));
  }

  async function revokeAll() {
    if (!confirm('Revoke all sessions?')) return;
    setSessions([]);
  }

  function formatTime(dateStr: string) {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h remaining`;
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes > 0) return `${minutes}m remaining`;
    return 'Expired';
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Session Management</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage active user sessions</p>
        </div>
        <Button variant="outline" onClick={revokeAll} className="gap-2">
          <LogOut className="w-4 h-4" />
          Revoke All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><User className="w-5 h-5 text-blue-600" /></div>
          <div>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <div className="text-xs text-gray-500">Active Sessions</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg"><Device className="w-5 h-5 text-purple-600" /></div>
          <div>
            <div className="text-2xl font-bold">{new Set(sessions.map(s => s.userId)).size}</div>
            <div className="text-xs text-gray-500">Unique Users</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg"><Shield className="w-5 h-5 text-green-600" /></div>
          <div>
            <div className="text-2xl font-bold">{sessions.filter(s => s.isVerified).length}</div>
            <div className="text-xs text-gray-500">Verified</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg"><AlertCircle className="w-5 h-5 text-amber-600" /></div>
          <div>
            <div className="text-2xl font-bold">{sessions.filter(s => !s.isVerified).length}</div>
            <div className="text-xs text-gray-500">Unverified</div>
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        {sessions.map(session => (
          <Card key={session.id} className={`p-4 ${session.isCurrent ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    {session.userName}
                    {session.isCurrent && <Badge className="text-[10px] bg-blue-50 text-blue-700">Current</Badge>}
                    <Badge variant="outline" className="text-[10px]">{session.role}</Badge>
                  </div>
                  <div className="text-xs text-gray-500">{session.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-gray-500">{formatTime(session.expiresAt)}</div>
                  <div className="text-[10px] text-gray-400">Last active {new Date(session.lastActivity).toLocaleString()}</div>
                </div>
                <button
                  onClick={() => revokeSession(session.id)}
                  className="p-1.5 hover:bg-red-50 rounded text-red-500"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Device className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600">{session.device}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-600">{session.browser}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600">{session.location}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-600">{session.ipAddress}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600">Expires: {new Date(session.expiresAt).toLocaleString()}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
