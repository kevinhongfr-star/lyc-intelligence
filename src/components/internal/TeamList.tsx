import React, { useState } from 'react';
import { Users, ChevronDown, ChevronRight, Briefcase, UserCheck, DollarSign } from 'lucide-react';
import { MOCK_TEAM } from '@/mocks/internalPortal';

export default function TeamList() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const statusColor = (status: string) => {
    if (status === 'active') return 'bg-tier-1';
    if (status === 'on_leave') return 'bg-amber-500';
    return 'bg-gray-400';
  };

  const roleBadgeColor = (role: string) => {
    if (role === 'admin') return 'bg-accent-10 text-accent';
    if (role === 'team_lead') return 'bg-tier-2Bg text-tier-2';
    return 'bg-bg-tertiary text-text-secondary';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-accent" />
        <h2 className="font-serif font-semibold text-lg text-text-primary">Team Members</h2>
      </div>

      <div className="space-y-3">
        {MOCK_TEAM.map(member => {
          const isExpanded = expandedId === member.id;
          return (
            <div
              key={member.id}
              className="bg-bg-primary border border-bg-tertiary"
              style={{ borderRadius: 0 }}
            >
              <button
                onClick={() => toggleExpand(member.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
                  )}
                  <div
                    className="w-3 h-3 flex-shrink-0"
                    style={{ borderRadius: 0, backgroundColor: member.avatarColor }}
                  />
                  <span className="font-medium text-text-primary">{member.name}</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${roleBadgeColor(member.role)}`}
                    style={{ borderRadius: 0 }}
                  >
                    {member.role}
                  </span>
                  <div className="flex items-center gap-1 ml-2">
                    <div className={`w-2 h-2 ${statusColor(member.status)}`} style={{ borderRadius: 0 }} />
                    <span className="text-xs text-text-muted">{member.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-text-muted">
                  <span>{member.mandates} mandates</span>
                  <span>{member.candidates} candidates</span>
                  <span className="font-medium text-text-primary">{member.revenue}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-bg-tertiary">
                  <div className="mt-3 grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-text-muted" />
                      <div>
                        <p className="text-xs text-text-muted">Mandates</p>
                        <p className="text-sm font-medium text-text-primary">{member.mandates}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-text-muted" />
                      <div>
                        <p className="text-xs text-text-muted">Candidates</p>
                        <p className="text-sm font-medium text-text-primary">{member.candidates}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-text-muted" />
                      <div>
                        <p className="text-xs text-text-muted">Revenue</p>
                        <p className="text-sm font-medium text-text-primary">{member.revenue}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
