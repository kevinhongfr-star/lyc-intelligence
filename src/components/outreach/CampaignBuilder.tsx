import React, { useState } from 'react';
import { Plus, Trash2, Eye, ChevronRight, Users, Calendar, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface CampaignStep {
  id: string;
  type: 'send' | 'wait' | 'condition' | 'branch';
  config: Record<string, unknown>;
}

interface CampaignBuilderProps {
  onSave?: (campaign: { name: string; channel: string; steps: CampaignStep[] }) => void;
}

const CHANNELS = ['email', 'sms', 'linkedin'];
const SEGMENTS = ['all', 'tech_leads', 'finance_leads', 'executives', 'diverse_leads', 'warm_leads'];

const INITIAL_STEPS: CampaignStep[] = [
  { id: 's1', type: 'send', config: { channel: 'email', template: 'Welcome Email', delay_hours: 0 } },
  { id: 's2', type: 'wait', config: { duration: 48, unit: 'hours' } },
  { id: 's3', type: 'condition', config: { field: 'opens', operator: 'gte', value: 1 } },
  { id: 's4', type: 'branch', config: { on_match: 'Send follow-up', no_match: 'Try alternative channel' } },
];

export function CampaignBuilder({ onSave }: CampaignBuilderProps) {
  const [campaignName, setCampaignName] = useState('Untitled Campaign');
  const [channel, setChannel] = useState('email');
  const [segment, setSegment] = useState('all');
  const [steps, setSteps] = useState<CampaignStep[]>(INITIAL_STEPS);

  const addStep = (type: CampaignStep['type']) => {
    const newStep: CampaignStep = {
      id: `s_${Date.now()}`,
      type,
      config: type === 'send' ? { channel, template: 'New Template', delay_hours: 0 } :
              type === 'wait' ? { duration: 24, unit: 'hours' } :
              type === 'condition' ? { field: 'opens', operator: 'gte', value: 1 } :
              { on_match: 'Continue', no_match: 'Stop' },
    };
    setSteps(prev => [...prev, newStep]);
  };

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= steps.length) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    setSteps(newSteps);
  };

  const handleSave = () => {
    onSave?.({ name: campaignName, channel, steps });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-accent" />
          Campaign Builder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs text-text-muted mb-1">Campaign Name</label>
            <input
              type="text"
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-bg text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Primary Channel</label>
            <select
              value={channel}
              onChange={e => setChannel(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-bg text-sm focus:outline-none focus:border-accent"
            >
              {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Audience Segment</label>
            <select
              value={segment}
              onChange={e => setSegment(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-bg text-sm focus:outline-none focus:border-accent"
            >
              {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-text-muted mb-2">Campaign Flow</p>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-accent/10 text-accent text-xs font-medium shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 border border-border p-3 bg-bg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-text-primary uppercase">{step.type}</span>
                      {step.type === 'send' && <span className="ml-2 text-xs text-text-muted">→ {step.config.channel} ({step.config.template})</span>}
                      {step.type === 'wait' && <span className="ml-2 text-xs text-text-muted">→ Wait {step.config.duration} {step.config.unit}</span>}
                      {step.type === 'condition' && <span className="ml-2 text-xs text-text-muted">→ If {step.config.field} {step.config.operator} {step.config.value}</span>}
                      {step.type === 'branch' && <span className="ml-2 text-xs text-text-muted">→ Branch: matched / not matched</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveStep(index, -1)} disabled={index === 0} className="text-text-muted hover:text-text-primary disabled:opacity-30">
                        ↑
                      </button>
                      <button onClick={() => moveStep(index, 1)} disabled={index === steps.length - 1} className="text-text-muted hover:text-text-primary disabled:opacity-30">
                        ↓
                      </button>
                      <button onClick={() => removeStep(step.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="text-xs text-text-muted">Add step:</span>
          <Button variant="outline" size="sm" onClick={() => addStep('send')}>
            <MessageSquare className="w-3 h-3" /> Send Message
          </Button>
          <Button variant="outline" size="sm" onClick={() => addStep('wait')}>
            <Calendar className="w-3 h-3" /> Wait
          </Button>
          <Button variant="outline" size="sm" onClick={() => addStep('condition')}>
            <Eye className="w-3 h-3" /> Condition
          </Button>
          <Button variant="outline" size="sm" onClick={() => addStep('branch')}>
            <Users className="w-3 h-3" /> Branch
          </Button>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost">Preview</Button>
          <Button onClick={handleSave}>
            <Plus className="w-4 h-4" /> Save Campaign
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}