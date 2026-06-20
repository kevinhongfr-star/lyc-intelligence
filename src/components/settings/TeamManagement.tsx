import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, User, Loader2, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/toastStore';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_KEY as string) || (import.meta.env.VITE_SUPABASE_ANON_KEY as string);

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  tier: string;
  created_at: string;
}

export function TeamManagement() {
  const { profile } = useAuthStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'user' | 'admin'>('user');
  const [inviting, setInviting] = useState(false);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (isAdmin) loadTeam();
    else setLoading(false);
  }, [isAdmin]);

  const loadTeam = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,email,name,role,tier,created_at&order=created_at.desc`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
      });
      if (res.ok) {
        setMembers(await res.json());
      }
    } catch (e) {
      console.error('Failed to load team:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { toast.warning('Please enter an email'); return; }
    if (!inviteName.trim()) { toast.warning('Please enter a name'); return; }

    setInviting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          name: inviteName.trim(),
          role: inviteRole,
          tier: 'pro',
          icp: 'professional',
        }),
      });

      if (res.ok) {
        toast.success(`Invitation created for ${inviteEmail}`);
        setInviteEmail('');
        setInviteName('');
        setShowInvite(false);
        await loadTeam();
      } else {
        const err = await res.json();
        toast.error(err.code === '23505' ? 'User with this email already exists' : 'Failed to create invitation');
      }
    } catch {
      toast.error('Network error while creating invitation');
    } finally {
      setInviting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
        <Users style={{ width: 48, height: 48, margin: '0 auto 16px', opacity: 0.3 }} />
        <p>Team management is available to admins only.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Team Members</h3>
          <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0' }}>{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', background: '#C108AB', color: '#FFF',
            border: 'none', borderRadius: '8px', fontSize: '13px',
            fontWeight: 500, cursor: 'pointer',
          }}
        >
          {showInvite ? <X style={{ width: 14, height: 14 }} /> : <Plus style={{ width: 14, height: 14 }} />}
          {showInvite ? 'Cancel' : 'Invite'}
        </button>
      </div>

      {showInvite && (
        <div style={{
          padding: '16px', background: '#F9FAFB', borderRadius: '10px',
          border: '1px solid #E5E5E5', marginBottom: '16px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Name</label>
              <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Full name"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E5E5', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Email</label>
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="team@company.com"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E5E5', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>Role:</label>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'user' | 'admin')}
              style={{ padding: '6px 10px', border: '1px solid #E5E5E5', borderRadius: '6px', fontSize: '13px', outline: 'none', background: '#FFF' }}>
              <option value="user">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button onClick={handleInvite} disabled={inviting}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', background: '#C108AB', color: '#FFF',
              border: 'none', borderRadius: '8px', fontSize: '13px',
              fontWeight: 500, cursor: inviting ? 'not-allowed' : 'pointer',
              opacity: inviting ? 0.7 : 1,
            }}>
            {inviting ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />Creating...</> : 'Send Invitation'}
          </button>
          <p style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
            Note: The invited user will need to use "Forgot password" to set their password on first login.
          </p>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#999' }}>
          <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {members.map(m => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px', background: '#FFF',
              border: '1px solid #E5E5E5', borderRadius: '10px',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: m.role === 'admin' ? '#C108AB15' : '#F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {m.role === 'admin'
                  ? <Shield style={{ width: 16, height: 16, color: '#C108AB' }} />
                  : <User style={{ width: 16, height: 16, color: '#6B7280' }} />
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#111' }}>{m.name || 'Unnamed'}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{m.email}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{
                  padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                  background: m.role === 'admin' ? '#C108AB15' : '#F3F4F6',
                  color: m.role === 'admin' ? '#C108AB' : '#6B7280',
                  fontWeight: m.role === 'admin' ? 600 : 400,
                }}>
                  {m.role === 'admin' ? 'Admin' : 'Member'}
                </span>
                <span style={{
                  padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                  background: '#F3F4F6', color: '#6B7280',
                }}>
                  {m.tier}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
