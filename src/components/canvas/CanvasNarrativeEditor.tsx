import React, { useState } from 'react';
import { Edit2, RefreshCw, Save, FileText, Download, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge, Button, Card, Textarea, Input } from '@/components/ui';
import { authFetch } from '@/utils/authFetch';

interface CanvasNarrativeEditorProps {
  profile: any;
  onSave?: (profile: any) => void;
}

export function CanvasNarrativeEditor({ profile, onSave }: CanvasNarrativeEditorProps) {
  const [fields, setFields] = useState({
    executive_summary: profile.executive_summary || '',
    leadership_style: profile.leadership_style || '',
    key_strengths: Array.isArray(profile.key_strengths) ? profile.key_strengths : [],
    blind_spots: Array.isArray(profile.blind_spots) ? profile.blind_spots : [],
    derailment_risks: Array.isArray(profile.derailment_risks) ? profile.derailment_risks : [],
    impact_potential: profile.impact_potential || '',
    stakeholder_style: profile.stakeholder_style || '',
    development_journey: profile.development_journey || '',
    priority_focus_areas: Array.isArray(profile.priority_focus_areas) ? profile.priority_focus_areas : [],
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [regeneratingField, setRegeneratingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fieldDefinitions = [
    { key: 'executive_summary', label: 'Executive Summary', type: 'textarea', maxLength: 200, icon: FileText },
    { key: 'leadership_style', label: 'Leadership Style', type: 'textarea', maxLength: 100, icon: FileText },
    { key: 'key_strengths', label: 'Key Strengths', type: 'list', itemCount: 3, icon: CheckCircle },
    { key: 'blind_spots', label: 'Blind Spots', type: 'list', itemCount: 2, icon: AlertCircle },
    { key: 'derailment_risks', label: 'Derailment Risks', type: 'list', itemCount: 2, icon: AlertCircle },
    { key: 'impact_potential', label: 'Impact Potential', type: 'textarea', maxLength: 50, icon: FileText },
    { key: 'stakeholder_style', label: 'Stakeholder Style', type: 'textarea', maxLength: 50, icon: FileText },
    { key: 'development_journey', label: 'Development Journey', type: 'textarea', maxLength: 100, icon: FileText },
    { key: 'priority_focus_areas', label: 'Priority Focus Areas', type: 'list', itemCount: 3, icon: FileText },
  ];

  function handleTextChange(field: string, value: string) {
    setFields(prev => ({ ...prev, [field]: value }));
  }

  function handleListItemChange(field: string, index: number, value: string) {
    const currentList = fields[field] as string[];
    const newList = [...currentList];
    newList[index] = value;
    setFields(prev => ({ ...prev, [field]: newList }));
  }

  async function handleRegenerateField(fieldKey: string) {
    setRegeneratingField(fieldKey);
    try {
      const res = await authFetch(`/api/canvas/regenerate-field`, {
        method: 'POST',
        body: JSON.stringify({ profile_id: profile.id, field: fieldKey }),
      });
      const data = await res.json();
      if (data.success) {
        setFields(prev => ({ ...prev, [fieldKey]: data.value }));
      }
    } catch (err) {
      console.error('Regenerate failed:', err);
    } finally {
      setRegeneratingField(fieldKey);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await authFetch(`/api/canvas/profile/${profile.id}`, {
        method: 'PATCH',
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (data.success && onSave) {
        onSave(data.profile);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
      setEditingField(null);
    }
  }

  async function handleExportPDF(format: 'standard' | 't2_full') {
    try {
      const res = await authFetch(`/api/canvas/export-pdf`, {
        method: 'POST',
        body: JSON.stringify({ profile_id: profile.id, format }),
      });
      const data = await res.json();
      if (data.success) {
        window.open(data.pdf_url, '_blank');
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  }

  const reviewStatusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    edits_requested: 'bg-orange-100 text-orange-700',
    edited: 'bg-blue-100 text-blue-700',
  };

  const reviewStatusLabels: Record<string, string> = {
    pending: 'Pending Review',
    approved: 'Approved',
    edits_requested: 'Edits Requested',
    edited: 'Edited',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">CANVAS Narrative</h2>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Generated: {new Date(profile.created_at).toLocaleDateString()}
            </span>
            <Badge className={reviewStatusColors[profile.review_status] || 'bg-gray-100 text-gray-700'}>
              {reviewStatusLabels[profile.review_status] || profile.review_status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {fieldDefinitions.map((field) => (
          <Card key={field.key} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <field.icon className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">{field.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRegenerateField(field.key)}
                  disabled={regeneratingField === field.key}
                  className="text-gray-500 hover:text-blue-600"
                >
                  {regeneratingField === field.key ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingField(editingField === field.key ? null : field.key)}
                  className="text-gray-500 hover:text-blue-600"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {field.type === 'textarea' ? (
              <Textarea
                value={fields[field.key]}
                onChange={(e) => handleTextChange(field.key, e.target.value)}
                className="text-sm"
                maxLength={field.maxLength}
                readOnly={editingField !== field.key}
                placeholder={`Enter ${field.label.toLowerCase()}...`}
              />
            ) : (
              <div className="space-y-2">
                {(fields[field.key] as string[]).map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 font-medium mt-1">•</span>
                    <Input
                      type="text"
                      value={item || ''}
                      onChange={(e) => handleListItemChange(field.key, index, e.target.value)}
                      className="flex-1 text-sm"
                      readOnly={editingField !== field.key}
                      placeholder={`Item ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2" />
              Save Profile
            </>
          )}
        </Button>
        <Button variant="outline" onClick={() => handleExportPDF('standard')}>
          <Download className="mr-2" />
          Export Standard PDF (2pg)
        </Button>
        <Button variant="outline" onClick={() => handleExportPDF('t2_full')}>
          <Download className="mr-2" />
          Export T2 Profile (5pg)
        </Button>
      </div>
    </div>
  );
}
