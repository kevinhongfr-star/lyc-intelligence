// Phase 3.10: Rule List Component
'use client';

import React, { useState, useEffect } from 'react';
import {
  Workflow,
  Plus,
  Zap,
  Edit2,
  Trash2,
  Clock,
  BarChart3,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  TRIGGER_TYPE_LABELS,
} from '@/types/automation';
import type { AutomationRule } from '@/types/automation';

interface RuleListProps {
  orgId: string;
  onEdit: (rule: AutomationRule) => void;
  onCreate: () => void;
}

export function RuleList({ orgId, onEdit, onCreate }: RuleListProps) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRules();
  }, [orgId]);

  const fetchRules = async () => {
    try {
      const response = await fetch(`/api/automation/rules?org_id=${orgId}`);
      const result = await response.json();
      if (result.success) {
        setRules(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (rule: AutomationRule) => {
    try {
      const response = await fetch(`/api/automation/rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      });
      const result = await response.json();
      if (result.success) {
        setRules(rules.map(r => r.id === rule.id ? result.data : r));
      }
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      await fetch(`/api/automation/rules/${ruleId}`, {
        method: 'DELETE',
      });
      setRules(rules.filter(r => r.id !== ruleId));
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  const filteredRules = rules.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = rules.filter(r => r.is_active).length;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-text-muted">Loading rules...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Workflow className="w-6 h-6 text-accent" />
          <div>
            <h2 className="font-serif font-semibold text-lg text-text-primary">Automation Rules</h2>
            <p className="text-sm text-text-muted">
              {activeCount} active / {rules.length} total
            </p>
          </div>
        </div>
        <Button onClick={onCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Rule
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rules..."
          className="max-w-md"
        />
      </div>

      {/* Rules List */}
      {filteredRules.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <Workflow className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="mb-4">No automation rules yet</p>
          <Button variant="outline" onClick={onCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Rule
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              className="p-4 bg-bg-secondary rounded-none hover:bg-bg-hover transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-text-primary">{rule.name}</h3>
                    <Badge variant={rule.is_active ? 'success' : 'default'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {rule.description && (
                    <p className="text-sm text-text-muted mb-2">{rule.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {TRIGGER_TYPE_LABELS[rule.trigger_type] || rule.trigger_type}
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {rule.conditions?.length || 0} conditions
                    </span>
                    <span className="flex items-center gap-1">
                      <Plus className="w-3 h-3" />
                      {rule.actions?.length || 0} actions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {rule.execution_count || 0} runs
                    </span>
                  </div>

                  {rule.last_executed_at && (
                    <p className="text-xs text-text-muted mt-1">
                      Last ran: {new Date(rule.last_executed_at).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleRule(rule)}
                    className="p-2 hover:bg-bg-tertiary rounded-none transition-colors"
                    title={rule.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {rule.is_active ? (
                      <div className="w-5 h-5 flex items-center justify-center text-tier-1">
                        <div className="w-8 h-4 bg-tier-1 rounded-full relative">
                          <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-5 h-5 flex items-center justify-center text-text-muted">
                        <div className="w-8 h-4 bg-bg-hover rounded-full relative">
                          <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
                        </div>
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => onEdit(rule)}
                    className="p-2 hover:bg-bg-tertiary rounded-none transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 text-text-muted" />
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-2 hover:bg-bg-tertiary rounded-none transition-colors text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default RuleList;
