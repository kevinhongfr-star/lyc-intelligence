import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { COLORS, SPACING } from '@/styles/tokens';
import {
  Card,
  Heading,
  Paragraph,
  Button,
  Flex,
  Grid,
  Input,
  Select,
} from '@/components/design-system';

export type OpportunityStage =
  | 'prospect'
  | 'meeting_booked'
  | 'meeting_done'
  | 'proposal_sent'
  | 'negotiation'
  | 'won'
  | 'lost';

export type FeeType = 'contingency' | 'retained' | 'exclusive';

export type OpportunitySource = 'referral' | 'outreach' | 'inbound' | 'event' | 'linkedin';

export interface Opportunity {
  id?: string;
  title: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  stage: OpportunityStage;
  estimated_fee_usd: number;
  probability: number; // 10-100
  fee_type: FeeType;
  source: OpportunitySource;
  source_detail: string;
  next_action: string;
  next_action_at: string;
}

const STAGE_OPTIONS: { value: OpportunityStage; label: string }[] = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'meeting_booked', label: 'Meeting Booked' },
  { value: 'meeting_done', label: 'Meeting Done' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const FEE_TYPE_OPTIONS: { value: FeeType; label: string }[] = [
  { value: 'contingency', label: 'Contingency' },
  { value: 'retained', label: 'Retained' },
  { value: 'exclusive', label: 'Exclusive' },
];

const SOURCE_OPTIONS: { value: OpportunitySource; label: string }[] = [
  { value: 'referral', label: 'Referral' },
  { value: 'outreach', label: 'Outreach' },
  { value: 'inbound', label: 'Inbound' },
  { value: 'event', label: 'Event' },
  { value: 'linkedin', label: 'LinkedIn' },
];

const EMPTY_OPPORTUNITY: Opportunity = {
  title: '',
  company_name: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  stage: 'prospect',
  estimated_fee_usd: 0,
  probability: 30,
  fee_type: 'contingency',
  source: 'referral',
  source_detail: '',
  next_action: '',
  next_action_at: '',
};

export const OpportunityForm: React.FC<{
  opportunity?: Partial<Opportunity>;
  onSave: (o: Opportunity) => void;
  onCancel: () => void;
}> = ({ opportunity, onSave, onCancel }) => {
  const [form, setForm] = useState<Opportunity>({
    ...EMPTY_OPPORTUNITY,
    ...opportunity,
  } as Opportunity);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof Opportunity>(key: K, value: Opportunity[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.stage) next.stage = 'Stage is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave(form);
  };

  return (
    <Grid columns={1} gap="6">
      {/* Header */}
      <Flex justify="between" align="center">
        <Grid columns={1} gap="0">
          <Heading level={3}>{opportunity?.id ? 'Edit Opportunity' : 'New Opportunity'}</Heading>
          <Paragraph color="textMuted">
            Capture the deal details, contact info and next step
          </Paragraph>
        </Grid>
        <Flex gap="2">
          <Button variant="ghost" onClick={onCancel}>
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <Save className="w-4 h-4" />
            Save
          </Button>
        </Flex>
      </Flex>

      {/* Opportunity details */}
      <Card padding="6">
        <Grid columns={1} gap="4">
          <Heading level={5}>Opportunity Details</Heading>
          <Grid columns={2} gap="4">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. VP Sales, APAC search"
              error={errors.title}
            />
            <Input
              label="Company Name"
              value={form.company_name}
              onChange={(e) => update('company_name', e.target.value)}
              placeholder="e.g. Aurora Tech"
            />
            <Select
              label="Stage"
              value={form.stage}
              onChange={(e) => update('stage', e.target.value as OpportunityStage)}
              error={errors.stage}
            >
              {STAGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Input
              label="Estimated Fee (USD)"
              type="number"
              value={String(form.estimated_fee_usd)}
              onChange={(e) => update('estimated_fee_usd', Number(e.target.value) || 0)}
            />
            <Select
              label="Fee Type"
              value={form.fee_type}
              onChange={(e) => update('fee_type', e.target.value as FeeType)}
            >
              {FEE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Select
              label="Source"
              value={form.source}
              onChange={(e) => update('source', e.target.value as OpportunitySource)}
            >
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Grid>
          <Input
            label="Source Detail"
            value={form.source_detail}
            onChange={(e) => update('source_detail', e.target.value)}
            placeholder="e.g. Referred by Jane Chen"
          />

          {/* Probability slider */}
          <div>
            <label
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: `${SPACING[3]}px`,
                fontWeight: 500,
                color: COLORS.text,
                marginBottom: `${SPACING[2]}px`,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <span>Probability</span>
              <span style={{ color: COLORS.primary }}>{form.probability}%</span>
            </label>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={form.probability}
              onChange={(e) => update('probability', Number(e.target.value))}
              style={{ width: '100%', accentColor: COLORS.primary }}
            />
          </div>
        </Grid>
      </Card>

      {/* Contact */}
      <Card padding="6">
        <Grid columns={1} gap="4">
          <Heading level={5}>Contact</Heading>
          <Grid columns={2} gap="4">
            <Input
              label="Contact Name"
              value={form.contact_name}
              onChange={(e) => update('contact_name', e.target.value)}
              placeholder="e.g. Wei Zhang"
            />
            <Input
              label="Contact Email"
              type="email"
              value={form.contact_email}
              onChange={(e) => update('contact_email', e.target.value)}
              placeholder="name@company.com"
            />
            <Input
              label="Contact Phone"
              value={form.contact_phone}
              onChange={(e) => update('contact_phone', e.target.value)}
              placeholder="+86 ..."
            />
          </Grid>
        </Grid>
      </Card>

      {/* Next action */}
      <Card padding="6">
        <Grid columns={1} gap="4">
          <Heading level={5}>Next Action</Heading>
          <Grid columns={2} gap="4">
            <Input
              label="Next Action"
              value={form.next_action}
              onChange={(e) => update('next_action', e.target.value)}
              placeholder="e.g. Send proposal"
            />
            <Input
              label="Next Action Date"
              value={form.next_action_at}
              onChange={(e) => update('next_action_at', e.target.value)}
              placeholder="YYYY-MM-DD"
            />
          </Grid>
        </Grid>
      </Card>
    </Grid>
  );
};

export default OpportunityForm;
