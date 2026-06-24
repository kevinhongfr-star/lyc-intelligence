import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Briefcase,
  Building2,
  User,
  DollarSign,
  Target,
  Calendar,
  Mail,
  Phone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const STAGES = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'meeting_booked', label: 'Meeting Booked' },
  { value: 'meeting_done', label: 'Meeting Held' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const SOURCES = [
  'Referral',
  'Cold Outreach',
  'LinkedIn',
  'Event',
  'Inbound',
  'Former Client',
  'Partner',
  'Other',
];

const FEE_TYPES = [
  { value: 'contingency', label: 'Contingency' },
  { value: 'retained', label: 'Retained' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'project', label: 'Project-Based' },
];

export function OpportunityForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    stage: 'prospect',
    estimated_fee_usd: '',
    probability: 10,
    fee_type: 'contingency',
    source: '',
    source_detail: '',
    next_action: '',
    next_action_at: '',
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = () => {
    console.log('Save opportunity:', formData);
    navigate('/bd/opportunities');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">
            {isEdit ? 'Edit Opportunity' : 'New Opportunity'}
          </h1>
          <p className="text-text-muted">
            {isEdit ? 'Update opportunity details' : 'Create a new business development opportunity'}
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Opportunity
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-accent" />
            Opportunity Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-text-muted" />
                Role Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g. VP of Engineering"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <Building2 className="w-4 h-4 text-text-muted" />
                Company Name *
              </label>
              <Input
                value={formData.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
                placeholder="e.g. TechCorp"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Stage</label>
              <select
                value={formData.stage}
                onChange={(e) => handleChange('stage', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm"
              >
                {STAGES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-text-muted" />
                Estimated Fee (USD)
              </label>
              <Input
                type="number"
                value={formData.estimated_fee_usd}
                onChange={(e) => handleChange('estimated_fee_usd', e.target.value)}
                placeholder="150000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Fee Type</label>
              <select
                value={formData.fee_type}
                onChange={(e) => handleChange('fee_type', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm"
              >
                {FEE_TYPES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <Target className="w-4 h-4 text-text-muted" />
                Win Probability: {formData.probability}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => handleChange('probability', parseInt(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-text-muted">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Source</label>
              <select
                value={formData.source}
                onChange={(e) => handleChange('source', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm"
              >
                <option value="">Select source</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-accent" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Contact Name</label>
              <Input
                value={formData.contact_name}
                onChange={(e) => handleChange('contact_name', e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <Mail className="w-4 h-4 text-text-muted" />
                Email
              </label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                placeholder="email@company.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <Phone className="w-4 h-4 text-text-muted" />
                Phone
              </label>
              <Input
                value={formData.contact_phone}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                placeholder="+86 ..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Next Action</label>
              <Input
                value={formData.next_action}
                onChange={(e) => handleChange('next_action', e.target.value)}
                placeholder="e.g. Follow up on proposal"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Due Date</label>
              <Input
                type="date"
                value={formData.next_action_at}
                onChange={(e) => handleChange('next_action_at', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Source Details / Notes</label>
            <textarea
              value={formData.source_detail}
              onChange={(e) => handleChange('source_detail', e.target.value)}
              placeholder="How did this opportunity come about? Any context..."
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm min-h-[80px] resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          {isEdit ? 'Update Opportunity' : 'Create Opportunity'}
        </Button>
      </div>
    </div>
  );
}
