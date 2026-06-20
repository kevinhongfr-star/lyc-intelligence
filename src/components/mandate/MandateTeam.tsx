import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    name: string;
    email: string;
  };
}

interface AvailableUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Props {
  mandateId: string;
  isAdmin: boolean;
}

export function MandateTeam({ mandateId, isAdmin }: Props) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTeam();
    if (isAdmin) loadAvailableUsers();
  }, [mandateId, isAdmin]);

  const loadTeam = async () => {
    try {
      const res = await fetch(`/api/data/mandate-members?mandate_id=${mandateId}`);
      const data = await res.json();
      if (data.success) {
        setMembers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load team:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const res = await fetch('/api/data/profile');
      const data = await res.json();
      if (data.success) {
        setAvailableUsers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleAdd = async () => {
    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }

    try {
      const res = await fetch('/api/data/mandate-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mandate_id: mandateId,
          user_id: selectedUserId,
          role: selectedRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddForm(false);
        setSelectedUserId('');
        setError('');
        await loadTeam();
      } else {
        setError(data.error || 'Failed to add user');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Remove this user from the mandate?')) return;

    try {
      const res = await fetch(`/api/data/mandate-members/${memberId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await loadTeam();
      }
    } catch (err) {
      console.error('Failed to remove:', err);
    }
  };

  if (loading) {
    return <div style={{ padding: '12px', color: '#999' }}>Loading team...</div>;
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Team Members</h3>
        {isAdmin && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              background: '#C108AB',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Plus size={14} /> Add Member
          </button>
        )}
      </div>

      {showAddForm && isAdmin && (
        <div style={{
          background: '#f9fafb',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '12px',
          border: '1px solid #e5e7eb',
        }}>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#666' }}>
              Select User
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '13px',
              }}
            >
              <option value="">-- Select --</option>
              {availableUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#666' }}>
              Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '13px',
              }}
            >
              <option value="member">Member</option>
              <option value="lead">Lead</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          {error && (
            <div style={{ color: '#dc2626', fontSize: '12px', marginBottom: '8px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAdd}
              style={{
                background: '#C108AB',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setSelectedUserId('');
                setError('');
              }}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <div style={{
          padding: '24px',
          textAlign: 'center',
          color: '#999',
          fontSize: '13px',
        }}>
          No team members assigned yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {members.map(m => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>
                  {m.profiles?.name || 'Unknown'}
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  {m.profiles?.email}
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: m.role === 'lead' ? '#C108AB' : m.role === 'viewer' ? '#9ca3af' : '#6b7280',
                  color: 'white',
                  textTransform: 'capitalize',
                }}>
                  {m.role}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => handleRemove(m.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    title="Remove member"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
